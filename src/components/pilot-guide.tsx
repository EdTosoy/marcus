"use client";
import Link from "next/link";
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
      title: "Start with what you notice",
      description:
        "Five baseline decisions establish a starting point. Answer once without coaching; “I’m not sure” is useful too. Outcomes stay private during the check.",
      href: "/learn",
      action: "Open baseline",
      status: `${baseline} of 5 baseline decisions recorded`,
    },
    {
      title: "Learn the thinking routine",
      description:
        "Work through “Is Your Piece Safe?” Notice a threat, trace the attack, and inspect a destination. Open hints when they help you reason.",
      href: "/",
      action: "Open the guided lesson",
      status: "Completion is practice evidence, not mastery",
    },
    {
      title: "Practice without help",
      description:
        "Continue the existing learning sequence. Guided examples come before its independent checks. The facilitator records which positions were used and reserves different boards for the post-test.",
      href: "/learn",
      action: "Continue learning practice",
      status: `${complete("guided")} guided positions completed`,
    },
    {
      title: "Take the idea into a game",
      description:
        "Choose a color and an approximate difficulty. Getting Started is a reasonable setting to try, but remains uncalibrated. Think independently; there is no clock or evaluation bar. Resign if you need to stop.",
      href: "/play",
      action: "Play a game",
      status: `${games.data.games.length} completed games saved locally`,
    },
    {
      title: "Look again at a decision",
      description:
        "Inspect the original board, try a candidate and predict the reply. Use hints or reveal alternatives after thinking. A familiar retry never becomes an unfamiliar assessment.",
      href: "/review",
      action: "Review a completed game",
      status: `${Object.values(games.data.reviews).filter((review) => review.reviewedAt !== null).length} decisions reviewed`,
    },
    {
      title: "Check transfer on an unfamiliar board",
      description:
        "The facilitator must confirm that a reserved check is unexposed and appropriate. Use it only when the existing learning sequence offers it. If reviewed held-out content is unavailable, pause this stage and record the gap; do not repeat a known board as a fresh test.",
      href: "/learn",
      action: "Return to the learning sequence",
      status: "Educator-approved held-out content is a pilot prerequisite",
    },
    {
      title: "Keep the evidence separate",
      description:
        "Finish and leave any independent check, then export local results with consent. Keep guided work, first answers, familiar retries, timing and gameplay observations separate. Arrange an actual delayed follow-up using unused positions.",
      href: "/evaluation",
      action: "Open local results",
      status: "No name or account is required; nothing is uploaded",
    },
  ];
  return (
    <main id="main" className="shell gameplay-main pilot-main">
      <section className="pilot-intro">
        <div>
          <span className="stage-label">Supervised beginner session</span>
          <h1>A clear path from learning to playing.</h1>
          <p>
            Learn an idea. Try it yourself. Bring it into a game, then look
            again.
          </p>
          <div className="board-controls">
            <Link href="/learn" className="button primary">
              Begin with the baseline
            </Link>
            <a href="#pilot-boundaries" className="text-button">
              Before the session
            </a>
          </div>
        </div>
        <aside
          className="pilot-note"
          id="pilot-boundaries"
          aria-label="Pilot boundaries"
        >
          <h2>Practice, not a promise.</h2>
          <p>
            A facilitator should confirm consent, a fresh profile and reviewed
            held-out content before collecting results. These steps guide a
            session; ticking them off does not demonstrate learning.
          </p>
          <p>
            Optional timing and exports are local to this browser. Educator
            review, participant testing and lasting learning benefits remain
            unvalidated.
          </p>
        </aside>
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
          {steps.map((step) => (
            <li className="pilot-step" key={step.title}>
              <div>
                <h2>{step.title}</h2>
                <p>{step.description}</p>
                <p className="pilot-status">{step.status}</p>
              </div>
              <Link className="button quiet" href={step.href}>
                {step.action}
              </Link>
            </li>
          ))}
        </ol>
      )}
      <footer className="pilot-footer">
        <p>
          Keep the same browser origin for the session. Clearing browser data or
          changing ports changes the local profile. Use a separate browser
          profile for another participant; never clear someone’s progress
          without consent.
        </p>
        <p>
          A small usability pilot does not establish effectiveness, a chess
          rating or a 10× learning improvement.
        </p>
      </footer>
    </main>
  );
}
