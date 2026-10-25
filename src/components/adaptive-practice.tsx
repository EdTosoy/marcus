"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Chess } from "chess.js";
import { foundationExercises as bank } from "@/domain/curriculum/foundations";
import { skills } from "@/domain/adaptive/skills";
import { learnerModel, stateLabels } from "@/domain/adaptive/model";
import { recommend } from "@/domain/adaptive/recommend";
import {
  learnerFeedback,
  learningTransition,
  type LearningEvent,
} from "@/domain/adaptive/session";
import { analyzeMistake } from "@/domain/adaptive/mistakes";
import type { StudentResponse } from "@/domain/learning/types";
import type { Reflection } from "@/domain/adaptive/types";
import {
  responseOptions,
  validateResponse,
} from "@/domain/learning/validation";
import { exportLearningResults } from "@/infrastructure/adaptive-progress";
import { useAdaptiveProgress } from "./use-adaptive-progress";
import { ChessBoard } from "./chess-board";
import { Icon } from "./icon";

const roleLabels = {
  diagnostic: "Baseline check",
  guided: "Guided practice",
  transfer: "Independent transfer",
  delayed: "Delayed review",
};
const reflections: { id: Reflection; label: string }[] = [
  { id: "attacks-only", label: "I checked attacks only" },
  { id: "defenders", label: "I checked attacks and defenders" },
  { id: "opponent-reply", label: "I imagined the opponent’s reply" },
  { id: "unsure", label: "I’m not sure what I missed" },
];
const date = (at: number) =>
  new Date(at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function AdaptivePractice() {
  const { data, ready, notice, now, update } = useAdaptiveProgress();
  const [view, setView] = useState<"practice" | "progress">("practice");
  const [inputNotice, setInputNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const run = data.runs.find((item) => item.id === data.activeRunId);
  const exercise = bank.find((item) => item.id === run?.exerciseId);
  const skill = skills.find((item) => item.id === exercise?.skillId);
  const attempt = run?.attempts.at(-1);
  const feedback = learnerFeedback(data, bank);
  const guided = exercise?.role === "guided";
  const baselineDone = skills.every((skill) =>
    data.runs.some(
      (run) =>
        run.finishedAt !== null &&
        bank.find((item) => item.id === run.exerciseId)?.skillId === skill.id &&
        bank.find((item) => item.id === run.exerciseId)?.role === "diagnostic",
    ),
  );
  const assessmentOpen = Boolean(exercise && !guided);
  const sealed = !baselineDone || assessmentOpen;
  const model = learnerModel(data, bank, now);
  const recommendation = recommend({ ...data, activeRunId: null }, bank, now);
  const firstExposure =
    exercise &&
    data.runs.filter((item) => item.exerciseId === exercise.id).length === 1;
  const analysis =
    guided && exercise && attempt
      ? analyzeMistake(exercise, attempt.response, attempt.reflection)
      : null;
  const shownMove =
    guided && run?.feedbackOpen && feedback && "fen" in feedback
      ? feedback.fen
      : undefined;
  const futureClock =
    now > 0 &&
    data.runs.some(
      (run) =>
        (run.finishedAt ?? run.attempts.at(-1)?.at ?? run.startedAt) > now,
    );

  function send(event: LearningEvent) {
    setInputNotice("");
    update((current, at) => learningTransition(current, event, bank, at));
    if (
      event.type === "start" ||
      event.type === "next" ||
      event.type === "retry"
    )
      requestAnimationFrame(() => heading.current?.focus());
  }
  function submit(response: StudentResponse) {
    if (!exercise || !ready || run?.feedbackOpen) return;
    const result = validateResponse(exercise, response);
    if (result.kind === "invalid") {
      setInputNotice(result.message);
      return;
    }
    send({ type: "submit", response });
  }
  function download() {
    const blob = new Blob([exportLearningResults(data, Date.now())], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "marcus-learning-results.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main id="main" className="shell adaptive-main">
      <div className="adaptive-heading">
        <div>
          <h1>Learn to look ahead.</h1>
          <p>Small decisions. Clear evidence. Practice at your pace.</p>
        </div>
        <div className="adaptive-switch" aria-label="Learning views">
          <button
            className="text-button"
            aria-pressed={view === "practice"}
            onClick={() => setView("practice")}
          >
            Practice
          </button>
          <button
            className="text-button"
            aria-pressed={view === "progress"}
            onClick={() => setView("progress")}
          >
            Learning progress
          </button>
        </div>
      </div>
      {notice && (
        <p className="storage-notice" role="status">
          {notice}
        </p>
      )}
      {futureClock && (
        <p className="storage-notice" role="status">
          This record contains a time later than your device clock. Restore the
          correct time before continuing; review evidence uses real elapsed
          time.
        </p>
      )}
      {!ready ? (
        <p role="status">Restoring local practice…</p>
      ) : view === "progress" ? (
        <section className="evidence-view" aria-labelledby="evidence-title">
          <h2 id="evidence-title">What you’ve demonstrated</h2>
          <p>
            These are provisional evidence states for these tasks. They are not
            a chess rating or proof of lasting mastery.
          </p>
          {sealed ? (
            <p className="thinking-note">
              {!baselineDone
                ? "Finish the five baseline decisions before viewing outcomes."
                : "Finish and leave this independent check before viewing outcomes."}{" "}
              Correct answers stay private during a check.
            </p>
          ) : (
            <>
              <dl className="skill-evidence">
                {model.map((item) => (
                  <div key={item.skill.id}>
                    <dt>
                      {item.skill.title}
                      <span className="evidence-state">
                        {stateLabels[item.state]}
                      </span>
                    </dt>
                    <dd>
                      <p>{item.reason}</p>
                      <p className="small muted">
                        First answers correct: {item.firstCorrect} of{" "}
                        {item.firstAttempts}. Guided positions completed:{" "}
                        {item.guidedSolved}. Assisted or familiar successes:{" "}
                        {item.assistedSuccesses}.
                      </p>
                      <p className="small muted">
                        Fresh transfer: {item.transferSuccesses} of{" "}
                        {item.transferChecks}. Eligible delayed reviews passed:{" "}
                        {item.delayedSuccesses} of {item.delayedChecks}. Hints:{" "}
                        {item.hintsUsed}. Attempts: {item.attempts}.
                      </p>
                      <p className="small muted">
                        {item.lastPracticedAt
                          ? `Last practiced ${date(item.lastPracticedAt)}. `
                          : "No dated evidence yet. "}
                        {item.dueAt
                          ? `Review ${item.dueAt <= now ? "due since" : "scheduled for"} ${date(item.dueAt)}.`
                          : "A review will be scheduled after a first fresh transfer success."}
                      </p>
                      <p className="small muted">
                        {item.skill.prerequisites.length
                          ? `Build on: ${item.skill.prerequisites.map((id) => skills.find((skill) => skill.id === id)!.title).join(", ")}.`
                          : "A starting skill, with no prerequisites."}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
              {data.legacy && (
                <p className="small muted">
                  Original lesson history: {data.legacy.attempted} exercise
                  observations, {data.legacy.completedRuns} completed runs.
                  Dates and independent exposure cannot be reconstructed, so it
                  supplies no mastery or review credit.
                </p>
              )}
              <button className="button quiet" onClick={download}>
                Export local results (JSON)
              </button>
              <p className="small muted">
                No name or account is required. The file contains responses and
                local timestamps. Nothing is uploaded.
              </p>
            </>
          )}
        </section>
      ) : exercise && run ? (
        <>
          <div className="adaptive-role">
            <span>{roleLabels[exercise.role]}</span>
            <span>
              {guided && !firstExposure
                ? "Familiar-position rehearsal"
                : "One decision at a time"}
            </span>
          </div>
          <div className="adaptive-workbench">
            <section className="adaptive-task" aria-labelledby="learning-task">
              <h2 id="learning-task" ref={heading} tabIndex={-1}>
                {skill?.title}
              </h2>
              {guided && <p className="concept-note">{exercise.concept}</p>}
              <p className="instruction">{exercise.instruction}</p>
              <p className="small muted">
                {guided
                  ? "Think first. Open guidance only if you need it."
                  : "One answer, with no hints or retry. “I’m not sure” is a useful baseline response too."}
              </p>
              <div className="adaptive-board">
                <ChessBoard
                  key={`${run.id}-${run.feedbackOpen}-${run.attempts.length}`}
                  fen={shownMove ?? exercise.fen}
                  orientation={
                    new Chess(exercise.fen).turn() === "w" ? "white" : "black"
                  }
                  locked={
                    run.feedbackOpen ||
                    exercise.answer.type === "status" ||
                    !ready
                  }
                  focusSquare={
                    guided &&
                    run.feedbackOpen &&
                    attempt?.response.type === "move"
                      ? attempt.response.move.to
                      : exercise.focusSquare
                  }
                  onSquare={
                    exercise.answer.type === "attacker" ||
                    exercise.answer.type === "reply"
                      ? (square) => submit({ type: "square", square })
                      : undefined
                  }
                  onMove={(move) => submit({ type: "move", move })}
                />
              </div>
              {!run.feedbackOpen && (
                <>
                  {exercise.answer.type === "status" && (
                    <fieldset className="answer-options">
                      <legend>Describe the marked piece</legend>
                      {responseOptions(exercise).map((option) => (
                        <button
                          className="button quiet"
                          key={option.id}
                          onClick={() =>
                            submit({ type: "choice", choice: option.id })
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </fieldset>
                  )}
                  <button
                    className="text-button"
                    onClick={() => submit({ type: "unsure" })}
                  >
                    I’m not sure
                  </button>
                </>
              )}
              {inputNotice && (
                <p className="input-notice" role="status">
                  {inputNotice}
                </p>
              )}
            </section>
            <section
              className="adaptive-feedback"
              aria-label="Guidance and next steps"
            >
              {feedback ? (
                <div className={`feedback ${feedback.kind}`} role="status">
                  <h3>
                    {feedback.kind === "sealed"
                      ? "Answer recorded."
                      : feedback.kind === "correct"
                        ? "That meets the goal."
                        : "Reconsider the position."}
                  </h3>
                  <p>{feedback.message}</p>
                </div>
              ) : (
                <div className="thinking-note">
                  <p>
                    {guided
                      ? "Before choosing, trace the relevant attack and say why your answer should work."
                      : "Work out the answer yourself. Correctness and reasoning are held back during independent checks."}
                  </p>
                </div>
              )}
              {analysis && (
                <div className="mistake-observation">
                  <h3>What this response tells us</h3>
                  <p>{analysis.explanation}</p>
                  <p className="small muted">
                    {analysis.certainty === "task-evidence"
                      ? "Observed answer mismatch; the reason remains unconfirmed."
                      : "Several explanations remain possible."}
                  </p>
                  {!attempt?.reflection ? (
                    <fieldset className="answer-options reflection">
                      <legend>{analysis.followUp}</legend>
                      {reflections.map((option) => (
                        <button
                          className="button quiet"
                          key={option.id}
                          onClick={() =>
                            send({ type: "reflect", reflection: option.id })
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </fieldset>
                  ) : (
                    <p className="small muted">
                      Your reflection is recorded as a self-report. It is not
                      treated as a diagnosis.
                    </p>
                  )}
                </div>
              )}
              {guided && run.hintsOpened > 0 && (
                <ol className="hints" aria-label="Guidance opened">
                  {exercise.hints
                    .slice(0, run.hintsOpened)
                    .map((hint, index) => (
                      <li key={hint}>
                        <span>Hint {index + 1}</span>
                        <p>{hint}</p>
                      </li>
                    ))}
                </ol>
              )}
              {run.finishedAt !== null ? (
                <button
                  className="button primary"
                  onClick={() => send({ type: "next" })}
                >
                  {guided ? "Choose next practice" : "Leave this check"}
                  <Icon name="chevron" />
                </button>
              ) : run.feedbackOpen ? (
                <button
                  className="button primary"
                  disabled={!attempt?.reflection}
                  onClick={() => send({ type: "retry" })}
                >
                  Recheck and try again
                </button>
              ) : null}
              {guided && run.finishedAt === null && (
                <button
                  className="button quiet"
                  disabled={run.hintsOpened >= exercise.hints.length}
                  onClick={() => send({ type: "hint" })}
                >
                  <Icon name="hint" />
                  {run.hintsOpened
                    ? run.hintsOpened >= exercise.hints.length
                      ? "All guidance opened"
                      : "Another hint"
                    : "A little guidance"}
                </button>
              )}
              <p className="small muted">
                {guided
                  ? "Retries and hints stay in the record. An eventual solution is different from independent first-attempt success."
                  : "This position is reserved for checking understanding and will not be offered as guided practice."}
              </p>
            </section>
          </div>
        </>
      ) : (
        <section className="practice-intro" aria-labelledby="learning-task">
          <h2 id="learning-task" ref={heading} tabIndex={-1}>
            {!baselineDone
              ? "Start with what you notice."
              : "Your next useful decision"}
          </h2>
          <p>
            {!baselineDone
              ? "Five short decisions establish a starting point. No teaching or solutions appear during the baseline. Choose “I’m not sure” whenever that is the honest answer."
              : recommendation.reason}
          </p>
          {recommendation.exercise && (
            <div className="recommendation-preview">
              <span>{roleLabels[recommendation.exercise.role]}</span>
              <h3>
                {
                  skills.find(
                    (skill) => skill.id === recommendation.exercise?.skillId,
                  )?.title
                }
              </h3>
              <p>
                {!baselineDone
                  ? "After the baseline, guided practice will explain the ideas you need."
                  : "The next position is selected from your observed evidence and its prerequisites."}
              </p>
            </div>
          )}
          {recommendation.exercise && (
            <button
              className="button primary"
              disabled={futureClock}
              onClick={() => send({ type: "start" })}
            >
              {!baselineDone
                ? data.runs.length
                  ? "Continue baseline"
                  : "Start baseline"
                : "Start recommended exercise"}
              <Icon name="chevron" />
            </button>
          )}
          {baselineDone && recommendation.nextReviewAt && (
            <p className="small muted">
              Next scheduled review: {date(recommendation.nextReviewAt)}. The
              default first interval is one day. Guidance today is available
              while you wait.
            </p>
          )}
          <Link className="text-button" href="/">
            Revisit “Is Your Piece Safe?”
          </Link>
          <p className="small muted">
            Progress is local to this browser. Thresholds are provisional. No
            learning effectiveness or 10× improvement has been established.
          </p>
        </section>
      )}
    </main>
  );
}
