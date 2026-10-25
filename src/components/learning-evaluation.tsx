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
    <main id="main" className="shell gameplay-main">
      <div className="lesson-heading">
        <div>
          <h1>Local learning evidence</h1>
          <p>Keep assessment, guided practice, and game review distinct.</p>
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
        <>
          <section className="game-setup">
            <h2>Measure training time deliberately</h2>
            <p>
              The timer is optional and stays on this device. It measures
              foreground time, including idle reading; it cannot measure
              attention. Hidden pages pause automatically. Reload starts paused.
              Past active training time cannot be reconstructed from old
              timestamps.
            </p>
            <button
              className="button primary"
              onClick={timing.active ? timing.pause : timing.start}
            >
              {timing.active ? "Pause training timer" : "Start training timer"}
            </button>
            <p role="status">
              Measured foreground time: {Math.floor(measuredMs / 1000)} seconds.
            </p>
            <div className="board-controls">
              <Link href="/learn">Go to learning practice</Link>
              <Link href="/play">Go to Play</Link>
            </div>
          </section>
          {sealed ? (
            <section
              className="study-boundary"
              aria-label="Assessment outcomes remain private"
            >
              <h2>Finish the check before viewing outcomes.</h2>
              <p>
                {!baselineDone
                  ? "Complete the five baseline decisions first."
                  : "Finish and leave your independent check first."}{" "}
                Results and exports stay private during independent assessment.
                You can still use the optional timer.
              </p>
              <Link className="button quiet" href="/learn">
                Return to the current check
              </Link>
            </section>
          ) : (
            <section className="evidence-view">
              <h2>What the current records contain</h2>
              <dl className="evaluation-metrics">
                <div>
                  <dt>Baseline first answers</dt>
                  <dd>
                    {report.baseline.correct} of {report.baseline.total}
                  </dd>
                </div>
                <div>
                  <dt>Eligible unfamiliar transfer first answers</dt>
                  <dd>
                    {report.independentPostTrainingProxy.correct} of{" "}
                    {report.independentPostTrainingProxy.total}
                  </dd>
                </div>
                <div>
                  <dt>Eligible delayed first answers</dt>
                  <dd>
                    {report.delayed.correct} of {report.delayed.total}
                  </dd>
                </div>
                <div>
                  <dt>Hints opened in curriculum</dt>
                  <dd>{report.hintsOpened}</dd>
                </div>
                <div>
                  <dt>Reviewed game decisions</dt>
                  <dd>
                    {report.gameplay.filter((item) => item.reviewed).length}
                  </dd>
                </div>
              </dl>
              <p>
                Transfer here is a curriculum post-training proxy, not a
                controlled study result. Familiar positions and possible earlier
                game exposures are excluded from its denominator. Missing
                history and exposure outside Marcus are unknown.
              </p>
              <p>
                Repeated game observations are grouped by distinct positions and
                games in the export. They strengthen contextual evidence, but do
                not prove conceptual misunderstanding or change mastery.
              </p>
              <button
                className="button quiet"
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
                No name, email, participant identity or external analytics. The
                export contains derived outcomes, exercise/game IDs and local
                timestamps; inspect it before sharing. No pilot or
                learning-effectiveness result has been established.
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
