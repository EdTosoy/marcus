"use client";
import Link from "next/link";
import { Icon } from "./icon";
import { useAdaptiveProgress } from "./use-adaptive-progress";
import { useGameProgress } from "./use-game-progress";
import { foundationExercises as bank } from "@/domain/curriculum/foundations";
export function PilotGuide() {
  const learning = useAdaptiveProgress(),
    games = useGameProgress();
  const complete = (role: string) =>
    learning.data.runs.filter(
      (run) =>
        run.finishedAt !== null &&
        bank.some(
          (exercise) =>
            exercise.id === run.exerciseId && exercise.role === role,
        ),
    ).length;
  const baseline = Math.min(5, complete("diagnostic"));
  const ready = learning.ready && games.ready;
  const steps = [
    {
      title: "Baseline check",
      description:
        "Five baseline decisions establish a starting point. Answer once without coaching; “I’m not sure” is useful too. Outcomes stay private during the check.",
      href: "/learn",
      action: "Open baseline",
      status: `${baseline} of 5 baseline decisions recorded`,
    },
    {
      title: "Guided lesson",
      description:
        "Work through “Is Your Piece Safe?” Notice a threat, trace the attack, and inspect a destination. Open hints when they help you reason.",
      href: "/",
      action: "Open the guided lesson",
      status: "Completion is practice evidence, not mastery",
    },
    {
      title: "Practice",
      description:
        "Continue the existing learning sequence. Guided examples come before its independent checks. The facilitator records which positions were used and reserves different boards for the post-test.",
      href: "/learn",
      action: "Continue learning practice",
      status: `${complete("guided")} guided positions completed`,
    },
    {
      title: "Play a game",
      description:
        "Choose a color and an approximate difficulty. Getting Started is a reasonable setting to try, but remains uncalibrated. Think independently; there is no clock or evaluation bar. Resign if you need to stop.",
      href: "/play",
      action: "Play a game",
      status: `${games.data.games.length} completed games saved locally`,
    },
    {
      title: "Review a decision",
      description:
        "Inspect the original board, try a candidate and predict the reply. Use hints or reveal alternatives after thinking. A familiar retry never becomes an unfamiliar assessment.",
      href: "/review",
      action: "Review a completed game",
      status: `${Object.values(games.data.reviews).filter((review) => review.reviewedAt !== null).length} decisions reviewed`,
    },
    {
      title: "Unfamiliar check",
      description:
        "The facilitator must confirm that a reserved check is unexposed and appropriate. Use it only when the existing learning sequence offers it. If reviewed held-out content is unavailable, pause this stage and record the gap; do not repeat a known board as a fresh test.",
      href: "/learn",
      action: "Return to the learning sequence",
      status: "Educator-approved held-out content is a pilot prerequisite",
    },
    {
      title: "Export results",
      description:
        "Finish and leave any independent check, then export local results with consent. Keep guided work, first answers, familiar retries, timing and gameplay observations separate. Arrange an actual delayed follow-up using unused positions.",
      href: "/evaluation",
      action: "Open local results",
      status: "No name or account is required; nothing is uploaded",
    },
  ];
  return (
    <main id="main" className="shell gameplay-main session-page pilot-main">
      <section className="session-heading">
        <div>
          <h1>Session guide</h1>
          <p>Learn, play, then reflect.</p>
        </div>
        <Link href="/learn" className="button primary">
          Begin with the baseline
        </Link>
      </section>
      {[learning.notice, games.notice].filter(Boolean).map((notice, index) => (
        <p className="storage-notice" role="status" key={index}>
          {notice}
        </p>
      ))}
      {!ready ? (
        <p role="status">Restoring session context…</p>
      ) : (
        <ol className="pilot-steps" aria-label="Supervised pilot stages">
          {steps.map((step, index) => (
            <li className="pilot-step" key={step.title}>
              <div>
                <details>
                  <summary>
                    <h2>
                      {step.title}
                      <Icon name="chevron" size={20} />
                    </h2>
                  </summary>
                  <div className="pilot-step-body">
                    <p>{step.description}</p>
                    {index !== 0 && (
                      <p className="pilot-status">{step.status}</p>
                    )}
                    <Link className="button quiet" href={step.href}>
                      {step.action}
                    </Link>
                  </div>
                </details>
                {index === 0 && <p className="pilot-status">{step.status}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
