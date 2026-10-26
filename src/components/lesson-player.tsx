"use client";

import { useRef, useState } from "react";
import { Chess } from "chess.js";
import { gameStatus } from "@/domain/chess/game";
import {
  emptyRecord,
  progress,
  transition,
  type LessonEvent,
} from "@/domain/learning/session";
import { validateResponse } from "@/domain/learning/validation";
import type { Lesson, StudentResponse } from "@/domain/learning/types";
import { practiceAgain } from "@/infrastructure/local-progress";
import { useLessonProgress } from "./use-lesson-progress";
import { ChessBoard, type ChessBoardHandle } from "./chess-board";
import { Icon } from "./icon";

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const { data, loaded, storageNotice, setData } = useLessonProgress(lesson);
  const [inputNotice, setInputNotice] = useState("");
  const taskHeading = useRef<HTMLHeadingElement>(null);
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const board = useRef<ChessBoardHandle>(null);

  const session = data.active;
  const exercise = lesson.exercises[session.index];
  const record = exercise
    ? (session.records[exercise.id] ?? emptyRecord())
    : emptyRecord();
  const activeAttempt =
    record.activeAttempt === null
      ? undefined
      : record.attempts[record.activeAttempt];
  const feedback =
    exercise && activeAttempt
      ? validateResponse(exercise, activeAttempt.response)
      : null;
  const metrics = progress(lesson, session);
  const intro = session.index === -1;
  const repeated = data.previous.length > 0;
  const fen = intro
    ? lesson.introduction.fen
    : (feedback?.fen ?? exercise?.fen ?? lesson.introduction.fen);
  const practiceCount = lesson.exercises.filter(
    (item) => !item.assessment,
  ).length;

  function send(event: LessonEvent) {
    setInputNotice("");
    setData((current) => ({
      ...current,
      active: transition(lesson, current.active, event),
    }));
    if (event.type === "retry")
      requestAnimationFrame(() => board.current?.focus());
    if (event.type === "next")
      requestAnimationFrame(() =>
        (taskHeading.current ?? completionHeading.current)?.focus(),
      );
  }
  function submit(response: StudentResponse) {
    if (!exercise || !loaded) return;
    const result = validateResponse(exercise, response);
    if (result.kind === "invalid") {
      setInputNotice(result.message);
      return;
    }
    send({ type: "submit", response });
  }

  if (session.completed) {
    const assessment = metrics.assessments[0];
    return (
      <main id="main" className="shell completion">
        <div className="completion-mark">
          <Icon name="check" size={32} />
        </div>
        <h1 ref={completionHeading} tabIndex={-1}>
          You’re learning to look first.
        </h1>
        <p className="lead">
          Lesson complete. Keep asking: “What is my opponent attacking?”
        </p>
        <dl className="results">
          <div>
            <dt>Exercises attempted</dt>
            <dd>
              {metrics.attempted} of {lesson.exercises.length}
            </dd>
          </div>
          <div>
            <dt>First-try, unhinted successes</dt>
            <dd>{metrics.independentSuccesses}</dd>
          </div>
          <div>
            <dt>Correct / incorrect attempts</dt>
            <dd>
              {metrics.correctAttempts} / {metrics.incorrectAttempts}
            </dd>
          </div>
          <div>
            <dt>Hints opened</dt>
            <dd>{metrics.hintsUsed}</dd>
          </div>
          <div>
            <dt>
              {repeated
                ? "Repeated-position practice"
                : "New-position assessment"}
            </dt>
            <dd>
              {repeated
                ? "Practice completed"
                : assessment?.independent
                  ? "Independent success"
                  : "Solved with practice"}
            </dd>
          </div>
        </dl>
        <section className="next-practice">
          <h2>Completion is a beginning.</h2>
          <p>
            One lesson cannot establish mastery. In your next game, pause before
            every move: find the opponent’s threats, choose a square, then check
            it again.
          </p>
          <p>
            {assessment?.independent
              ? "Next, repeat this habit in more varied positions and real games."
              : "Revisit pawn diagonals and long-range attacks, then try a fresh position in a future session."}
          </p>
        </section>
        <button
          className="button primary"
          onClick={() => {
            setData((current) => practiceAgain(current, lesson));
            requestAnimationFrame(() => taskHeading.current?.focus());
          }}
        >
          Practice this lesson again
          <Icon name="reset" />
        </button>
        <p className="small muted">
          A repeat uses the same positions. It is practice, not a fresh
          assessment. Results are stored only in this browser.
        </p>
      </main>
    );
  }

  return (
    <main id="main" className="shell lesson-main">
      <div className="lesson-heading">
        <div>
          <h1>{lesson.title}</h1>
          <p>{lesson.objective}</p>
        </div>
        <span className="lesson-level">Beginner foundations</span>
      </div>
      <div
        className="lesson-progress"
        aria-label={`${metrics.solved} of ${lesson.exercises.length} exercises solved`}
      >
        <div className="progress-track">
          {lesson.exercises.map((item, index) => (
            <span
              key={item.id}
              className={`${session.records[item.id]?.solved ? "done" : ""} ${index === session.index ? "current" : ""}`}
            />
          ))}
        </div>
        <span>
          {intro
            ? "Learn the idea"
            : exercise?.assessment
              ? repeated
                ? "Assessment practice"
                : "Transfer assessment"
              : `Practice ${session.index + 1} of ${practiceCount}`}
        </span>
      </div>
      {storageNotice && (
        <p className="storage-notice" role="status">
          {storageNotice}
        </p>
      )}
      <div className="lesson-workbench guided-workbench">
        <section
          className="teaching-column lesson-task"
          aria-labelledby="task-title"
        >
          <div className="task-label">
            <Icon
              name={intro ? "book" : exercise?.assessment ? "check" : "rook"}
              size={20}
            />
            <span>
              {intro
                ? "Before your next move"
                : exercise?.assessment
                  ? repeated
                    ? "Revisit the position"
                    : "A new position"
                  : "Your turn"}
            </span>
          </div>
          <h2 id="task-title" ref={taskHeading} tabIndex={-1}>
            {intro ? "First, notice the threat." : exercise?.title}
          </h2>
          <p className="instruction">
            {intro
              ? lesson.introduction.explanation
              : repeated && exercise?.assessment
                ? (exercise.repeatInstruction ?? exercise.instruction)
                : exercise?.instruction}
          </p>
          {!intro && !feedback && (
            <p className="task-guidance">
              {exercise?.answer.type === "attacker"
                ? "Tap the attacker. You don’t need to move a piece yet."
                : "The outlined piece is yours to move. Every safe legal destination is accepted."}
            </p>
          )}
        </section>
        <section className="board-column" aria-label="Lesson position">
          <div className="board-meta">
            <span>
              {intro
                ? "Follow the rook’s line"
                : exercise?.answer.type === "attacker"
                  ? "Find the attacking piece"
                  : "White to move"}
            </span>
            <span>
              {intro ? "A clear path is a threat" : "One decision at a time"}
            </span>
          </div>
          <ChessBoard
            ref={board}
            interactionKey={`${session.index}-${record.activeAttempt}`}
            lastMove={
              activeAttempt?.response.type === "move"
                ? activeAttempt.response.move
                : undefined
            }
            fen={fen}
            locked={intro || !loaded || Boolean(feedback)}
            focusSquare={
              intro
                ? lesson.introduction.target
                : activeAttempt?.response.type === "move"
                  ? activeAttempt.response.move.to
                  : exercise?.focusSquare
            }
            arrow={
              intro
                ? {
                    from: lesson.introduction.attacker,
                    to: lesson.introduction.target,
                  }
                : undefined
            }
            onSquare={
              exercise?.answer.type === "attacker"
                ? (square) => submit({ type: "square", square })
                : undefined
            }
            onMove={(move) => submit({ type: "move", move })}
          />
          <div className="board-toolbar">
            <div className="board-controls">
              <button
                className="text-button"
                disabled={intro || !feedback}
                onClick={() => send({ type: "retry" })}
              >
                <Icon name="undo" size={17} />
                Undo
              </button>
              <button
                className="text-button"
                disabled={intro || (!feedback && !record.hintsRevealed)}
                onClick={() => send({ type: "retry" })}
              >
                <Icon name="reset" size={17} />
                Restart position
              </button>
            </div>
            <span className="move-history" aria-label="Move history">
              {feedback?.san ? `1. ${feedback.san}` : "No moves yet"}
            </span>
          </div>
          <p className="small muted position-status">
            {new Chess(fen).inCheck()
              ? gameStatus(new Chess(fen))
              : "White’s perspective. Files a–h, ranks 1–8."}
          </p>
        </section>
        <section
          className="teaching-column lesson-response"
          aria-label="Lesson guidance and continuation"
        >
          {intro ? (
            <>
              <div className="thinking-note">
                <span className="note-rule" />
                <p>
                  Before choosing a move, ask:
                  <br />
                  <strong>“What is my opponent attacking?”</strong>
                </p>
              </div>
              <button
                className="button primary"
                disabled={!loaded}
                onClick={() => send({ type: "next" })}
              >
                {loaded ? "Let’s try it" : "Preparing lesson…"}
                <Icon name="chevron" size={18} />
              </button>
              <p className="small muted">
                Five practice positions, then a new-position check. Take your
                time.
              </p>
            </>
          ) : (
            <>
              {feedback && (
                <div className={`feedback ${feedback.kind}`} role="status">
                  <h3>
                    {feedback.kind === "correct"
                      ? "That’s the idea."
                      : "Pause and look again."}
                  </h3>
                  <p>{feedback.message}</p>
                </div>
              )}
              {inputNotice && (
                <p className="input-notice" role="status">
                  {inputNotice}
                </p>
              )}
              {record.hintsRevealed > 0 && (
                <ol className="hints" aria-label="Hints opened">
                  {exercise?.hints
                    .slice(0, record.hintsRevealed)
                    .map((hint, index) => (
                      <li key={hint}>
                        <span>Hint {index + 1}</span>
                        <p>{hint}</p>
                      </li>
                    ))}
                </ol>
              )}
              <div className="lesson-actions">
                {feedback?.kind === "correct" ? (
                  <button
                    className="button primary"
                    onClick={() => send({ type: "next" })}
                  >
                    {exercise?.assessment ? "See your reflection" : "Continue"}
                    <Icon name="chevron" size={18} />
                  </button>
                ) : feedback ? (
                  <button
                    className="button primary"
                    onClick={() => send({ type: "retry" })}
                  >
                    Try again
                    <Icon name="undo" size={18} />
                  </button>
                ) : (
                  <p className="board-prompt">
                    {exercise?.answer.type === "attacker"
                      ? "Choose a piece on the board."
                      : "Make your move on the board."}
                  </p>
                )}
                {!record.solved && (
                  <button
                    className="button quiet hint-button"
                    disabled={
                      !loaded ||
                      record.hintsRevealed >= (exercise?.hints.length ?? 0) ||
                      (exercise?.assessment && !record.attempts.length)
                    }
                    onClick={() => send({ type: "hint" })}
                  >
                    <Icon name="hint" size={18} />
                    {record.hintsRevealed
                      ? record.hintsRevealed >= (exercise?.hints.length ?? 0)
                        ? "All hints opened"
                        : "Another hint"
                      : "A little guidance"}
                  </button>
                )}
              </div>
              {exercise?.assessment && !record.attempts.length && (
                <p className="small muted">
                  Try once independently. Guidance becomes available after your
                  first attempt.
                </p>
              )}
              {feedback?.kind === "correct" && (
                <p className="small muted">
                  {record.attempts.length === 1 && !record.hintsRevealed
                    ? "Solved on your first try, without hints."
                    : "A useful correction. Keep checking before moving."}
                </p>
              )}
            </>
          )}
          <div className="lesson-footnote">
            <span>Learn to see, then learn to choose.</span>
            <span>Progress stays in your browser.</span>
          </div>
        </section>
      </div>
      <footer className="lesson-footer">
        <p>Safe in this lesson means no black piece attacks the destination.</p>
        <p>
          We’re practicing a one-move check. Real games also involve trades,
          tactics, and plans.
        </p>
      </footer>
    </main>
  );
}
