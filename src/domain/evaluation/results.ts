import { evidenceFor } from "../adaptive/model";
import { positionFingerprint } from "../adaptive/content";
import type { LearningData } from "../adaptive/types";
import { foundationExercises as bank } from "../curriculum/foundations";
import type { GameSession } from "../gameplay/session";
import { inspectDecision } from "../review/decisions";
import { gameplayEvidence, type ReviewRecord } from "../review/session";
import { Chess } from "chess.js";
import type { TimingData } from "./timing";

type Games = {
  games: readonly GameSession[];
  active: GameSession | null;
  reviews: Record<string, ReviewRecord>;
};
const ratio = (correct: number, total: number) => ({
  correct,
  total,
  accuracy: total ? correct / total : null,
});
export function evaluationResults(
  learning: LearningData,
  games: Games,
  timing: TimingData,
  at: number,
) {
  const exposure = new Map<string, number>();
  for (const game of [
    ...games.games,
    ...(games.active ? [games.active] : []),
  ]) {
    const board = new Chess(game.startingFen);
    for (const move of [...game.moves, null]) {
      const fingerprint = positionFingerprint(board.fen());
      exposure.set(
        fingerprint,
        Math.min(exposure.get(fingerprint) ?? Infinity, game.startedAt),
      );
      if (move) board.move(move);
    }
  }
  const items = evidenceFor(learning, bank).filter(
    (item) => item.run.finishedAt! <= at,
  );
  const observations = items.map((item) => {
    const possibleGameExposure =
      (exposure.get(positionFingerprint(item.exercise.fen)) ?? Infinity) <=
      item.run.startedAt;
    return {
      exerciseId: item.exercise.id,
      skillId: item.exercise.skillId,
      role: item.exercise.role,
      curriculumFresh: item.fresh,
      possiblePriorGameExposure: possibleGameExposure,
      eligibleUnfamiliarCheck:
        item.fresh &&
        !possibleGameExposure &&
        (item.exercise.role === "transfer" ||
          (item.exercise.role === "delayed" && item.delayedEligible)),
      firstCorrect: item.firstCorrect,
      firstHints: item.run.attempts[0]!.hintsUsed,
      hintsOpened: item.run.hintsOpened,
      attempts: item.run.attempts.length,
      delayedEligible: item.delayedEligible,
      wallSpanMs: item.run.finishedAt! - item.run.startedAt,
    };
  });
  const baseline = observations.filter(
    (item) => item.role === "diagnostic" && item.curriculumFresh,
  );
  const transfer = observations.filter(
    (item) => item.role === "transfer" && item.eligibleUnfamiliarCheck,
  );
  const delayed = observations.filter(
    (item) => item.role === "delayed" && item.eligibleUnfamiliarCheck,
  );
  const gameplay = Object.entries(games.reviews).flatMap(([id, review]) => {
    const game = games.games.find((item) => item.id === id.split(":")[0]);
    const decision = game
      ? inspectDecision(game, Number(id.split(":")[1]))
      : null;
    return decision
      ? [
          {
            ...gameplayEvidence(decision, review),
            gameId: game!.id,
            positionFingerprint: positionFingerprint(decision.fen),
          },
        ]
      : [];
  });
  const perSkill = [...new Set(gameplay.flatMap((item) => item.skillIds))].map(
    (skillId) => {
      const related = gameplay.filter((item) =>
        item.skillIds.includes(skillId),
      );
      const distinctPositions = new Set(
        related.map((item) => item.positionFingerprint),
      ).size;
      const distinctGames = new Set(related.map((item) => item.gameId)).size;
      return {
        skillId,
        decisions: related.length,
        distinctPositions,
        distinctGames,
        evidenceClass:
          distinctPositions > 1 && distinctGames > 1
            ? "varied-context"
            : related.length > 1
              ? "repeated-position"
              : "isolated",
        interpretation:
          related.length > 1
            ? "Repeated contextual observations; conceptual understanding remains unconfirmed."
            : "Isolated observation; no conceptual diagnosis.",
        masteryCredit: false,
      };
    },
  );
  return {
    format: "marcus-local-evaluation",
    schemaVersion: 1,
    coachingVersion: 2,
    exportedAt: at,
    identityCollected: false,
    baseline: ratio(
      baseline.filter((item) => item.firstCorrect).length,
      baseline.length,
    ),
    independentPostTrainingProxy: {
      ...ratio(
        transfer.filter((item) => item.firstCorrect && !item.firstHints).length,
        transfer.length,
      ),
      source: "eligible fresh curriculum transfer",
      controlledStudyPostTest: false,
    },
    delayed: ratio(
      delayed.filter((item) => item.firstCorrect && !item.firstHints).length,
      delayed.length,
    ),
    hintsOpened: learning.runs.reduce((sum, run) => sum + run.hintsOpened, 0),
    trainingTime: {
      measuredForegroundMs: timing.segments.reduce(
        (sum, item) => sum + item.activeMs,
        0,
      ),
      historicalActiveTime: null,
      sessions: timing.segments,
      method:
        "explicit opt-in, foreground heartbeats; idle attention is not measured",
    },
    assessments: observations,
    gameplay,
    gameplayPatterns: perSkill,
    exclusions: observations.filter(
      (item) =>
        !item.eligibleUnfamiliarCheck &&
        ["transfer", "delayed"].includes(item.role),
    ),
    limitations: [
      "Local editable data, no identity or external analytics.",
      "Missing/expired history and exposure outside Marcus are unknown.",
      "Game move timestamps are unavailable; possible earlier exposure is excluded conservatively.",
      "Familiar retries and guided success supply no unfamiliar-transfer or gameplay mastery credit.",
      "Post-training proxy is not an experimentally controlled post-test; human study pending.",
    ],
  };
}
