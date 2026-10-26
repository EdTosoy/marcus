"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useGameProgress } from "./use-game-progress";
import { useAdaptiveProgress } from "./use-adaptive-progress";
import { useEvaluationTiming } from "./evaluation-timing";
import { evaluationResults } from "@/domain/evaluation/results";
import { downloadText } from "@/infrastructure/download";
import { freshTiming } from "@/domain/evaluation/timing";
import { foundationExercises as bank } from "@/domain/curriculum/foundations";
export function LearningEvaluation() {
  const learning = useAdaptiveProgress(),
    games = useGameProgress(),
    timing = useEvaluationTiming();
  const ready = learning.ready && games.ready && timing.ready;
  const baselineDone = bank
    .filter((exercise) => exercise.role === "diagnostic")
    .every((exercise) =>
      learning.data.runs.some(
        (run) => run.exerciseId === exercise.id && run.finishedAt !== null,
      ),
    );
  const active = learning.data.runs.find(
    (run) => run.id === learning.data.activeRunId,
  );
  const activeExercise = bank.find(
    (exercise) => exercise.id === active?.exerciseId,
  );
  const sealed =
    !baselineDone ||
    Boolean(activeExercise && activeExercise.role !== "guided");
  const report = useMemo(
    () =>
      evaluationResults(learning.data, games.data, freshTiming(), learning.now),
    [learning.data, games.data, learning.now],
  );
  const measuredMs = timing.data.segments.reduce(
    (sum, item) => sum + item.activeMs,
    0,
  );
  return (
    <main
      id="main"
      className="shell gameplay-main session-page evaluation-page"
    >
      <div className="session-heading">
        <div>
          <h1>Local results</h1>
          <p>Saved on this device.</p>
        </div>
      </div>
      {[learning.notice, games.notice, timing.notice]
        .filter(Boolean)
        .map((notice, index) => (
          <p className="storage-notice" role="status" key={index}>
            {notice}
          </p>
        ))}
      {!ready ? (
        <p role="status">Restoring local evidence…</p>
      ) : (
        <div className="evaluation-layout">
          <div className="evaluation-main">
            {sealed ? (
              <section
                className="study-boundary"
                aria-label="Assessment outcomes remain private"
              >
                <h2>Finish your check first</h2>
                <p>
                  {!baselineDone
                    ? "Complete the five baseline decisions to view results."
                    : "Finish and leave your independent check first."}{" "}
                  Results and exports stay hidden during independent checks.
                </p>
                <Link className="button primary" href="/learn">
                  Return to your check
                </Link>
              </section>
            ) : (
              <section className="evidence-view">
                <h2>Recorded activity</h2>
                <dl className="evaluation-metrics">
                  <div>
                    <dt>Baseline first answers</dt>
                    <dd>
                      {report.baseline.correct} of {report.baseline.total}
                    </dd>
                  </div>
                  <div>
                    <dt>Unfamiliar-check first answers</dt>
                    <dd>
                      {report.independentPostTrainingProxy.correct} of{" "}
                      {report.independentPostTrainingProxy.total}
                    </dd>
                  </div>
                  <div>
                    <dt>Delayed-check first answers</dt>
                    <dd>
                      {report.delayed.correct} of {report.delayed.total}
                    </dd>
                  </div>
                  <div>
                    <dt>Hints opened</dt>
                    <dd>{report.hintsOpened}</dd>
                  </div>
                  <div>
                    <dt>Reviewed game decisions</dt>
                    <dd>
                      {report.gameplay.filter((item) => item.reviewed).length}
                    </dd>
                  </div>
                </dl>
                <button
                  className="button primary"
                  onClick={() =>
                    downloadText(
                      JSON.stringify(
                        {
                          ...evaluationResults(
                            learning.data,
                            games.data,
                            timing.data,
                            Date.now(),
                          ),
                          storageNotices: [
                            learning.notice,
                            games.notice,
                            timing.notice,
                          ].filter(Boolean),
                        },
                        null,
                        2,
                      ),
                      "marcus-local-evaluation.json",
                      "application/json",
                    )
                  }
                >
                  Export local evaluation (JSON)
                </button>
                <p className="small muted">
                  Downloads a file from this browser. Review it before sharing.
                </p>
                <details className="session-disclosure">
                  <summary>How to read and share these results</summary>
                  <p>
                    Transfer here is a curriculum post-training proxy, not a
                    controlled study result. Familiar positions and possible
                    earlier game exposures are excluded from its denominator.
                    Missing history and exposure outside Marcus are unknown.
                  </p>
                  <p>
                    Repeated game observations are grouped by distinct positions
                    and games in the export. They strengthen contextual
                    evidence, but do not prove conceptual misunderstanding or
                    change mastery.
                  </p>
                  <p className="small muted">
                    No name, email, participant identity or external analytics.
                    The export contains derived outcomes, exercise/game IDs and
                    local timestamps; inspect it before sharing. No pilot or
                    learning-effectiveness result has been established.
                  </p>
                </details>
              </section>
            )}
          </div>
          <aside className="session-tools" aria-label="Optional session tools">
            <details className="session-disclosure evaluation-timer">
              <summary>Training timer (optional)</summary>
              <p>
                Counts time while Marcus is visible, including idle reading. It
                cannot measure attention or reconstruct earlier sessions. Hidden
                pages pause automatically; reload starts paused.
              </p>
              <button
                className="button quiet"
                onClick={timing.active ? timing.pause : timing.start}
              >
                {timing.active
                  ? "Pause training timer"
                  : "Start training timer"}
              </button>
              <p role="status">
                Measured foreground time: {Math.floor(measuredMs / 1000)}{" "}
                seconds.
              </p>
              <div className="board-controls">
                <Link href="/learn">Go to learning practice</Link>
                <Link href="/play">Go to Play</Link>
              </div>
            </details>
          </aside>
        </div>
      )}
    </main>
  );
}
