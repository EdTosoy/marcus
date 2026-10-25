import type { MoveInput } from "../chess/game";
import type { SkillId } from "../adaptive/skills";
import type { Decision } from "./decisions";
import { evaluateRetry } from "./decisions";
import type { FoundationExercise, LearningData } from "../adaptive/types";
import { learnerModel, prerequisitesReady } from "../adaptive/model";
import {
  predictions,
  judgePrediction,
  type Prediction,
} from "../coaching/facts";

export type ReviewRecord = {
  decisionId: string;
  observation: "threats" | "defenders" | "unsure" | null;
  hints: number;
  revealed: boolean;
  attempts: {
    move: MoveInput;
    at: number;
    hints: number;
    revealed: boolean;
    meetsGoal: boolean;
    prediction?: Prediction | null;
    coachingVersion?: 2;
  }[];
  reviewedAt: number | null;
  recommendation: { skillId: SkillId; exerciseId: string; at: number } | null;
};
export const newReview = (decisionId: string): ReviewRecord => ({
  decisionId,
  observation: null,
  hints: 0,
  revealed: false,
  attempts: [],
  reviewedAt: null,
  recommendation: null,
});
export type ReviewEvent =
  | { type: "notice"; observation: NonNullable<ReviewRecord["observation"]> }
  | { type: "hint" }
  | { type: "reveal" }
  | { type: "try"; move: MoveInput; prediction?: Prediction | null }
  | { type: "recommend"; skillId: SkillId; exerciseId: string };
export function reviewTransition(
  record: ReviewRecord,
  decision: Decision,
  event: ReviewEvent,
  at: number,
): ReviewRecord {
  if (!Number.isFinite(at) || at < 0) return record;
  if (at < (record.attempts.at(-1)?.at ?? 0)) return record;
  if (event.type === "notice")
    return record.observation
      ? record
      : { ...record, observation: event.observation };
  if (!record.observation) return record;
  if (event.type === "hint")
    return { ...record, hints: Math.min(2, record.hints + 1) };
  if (event.type === "reveal")
    return record.attempts.length
      ? { ...record, revealed: true, reviewedAt: at }
      : record;
  if (event.type === "recommend")
    return record.attempts.length && decision.skillIds.includes(event.skillId)
      ? {
          ...record,
          recommendation: {
            skillId: event.skillId,
            exerciseId: event.exerciseId,
            at,
          },
        }
      : record;
  if (record.attempts.length >= 30) return record;
  if (event.prediction != null && !predictions.includes(event.prediction))
    return record;
  const result = evaluateRetry(decision, event.move);
  if (!result.legal) return record;
  return {
    ...record,
    reviewedAt: at,
    attempts: [
      ...record.attempts,
      {
        move: event.move,
        at,
        hints: record.hints,
        revealed: record.revealed,
        meetsGoal: result.meetsGoal,
        prediction: event.prediction ?? null,
        coachingVersion: 2,
      },
    ],
  };
}
export function gameplayEvidence(decision: Decision, review: ReviewRecord) {
  const judged = review.attempts.map((attempt) => ({
    attempt,
    verdict: evaluateRetry(decision, attempt.move).judgment?.verdict,
  }));
  const succeeds = (verdict: string | undefined) =>
    ["unattacked", "checkmate", "forced-mate"].includes(verdict ?? "");
  const unassisted = judged.filter(
    ({ attempt, verdict }) =>
      succeeds(verdict) && !attempt.hints && !attempt.revealed,
  ).length;
  const outsideGoal = judged.filter(
    ({ verdict }) =>
      verdict === "capture-available" || verdict === "attacked-unresolved",
  ).length;
  return {
    coachingVersion: 2,
    source: "gameplay-review" as const,
    decisionId: decision.id,
    skillIds: decision.skillIds,
    certainty:
      decision.kind === "capture-opportunity"
        ? "observed-immediate-capture"
        : "unclassified-opportunity",
    intention: "unknown",
    originalVerdict: decision.judgment?.verdict ?? "unclassified",
    unassistedKnownPositionSuccesses: unassisted,
    outsideGoalRetries: outsideGoal,
    observation: review.observation,
    independentRetries: unassisted,
    assistedRetries: judged.filter(
      ({ attempt, verdict }) =>
        succeeds(verdict) && (attempt.hints > 0 || attempt.revealed),
    ).length,
    repeatedErrors: outsideGoal,
    legacyCounterMeaning:
      "independentRetries means unassisted familiar retries; repeatedErrors means outside-goal observations, not established chess mistakes",
    firstUnassistedSuccess: Boolean(
      judged[0] &&
      succeeds(judged[0].verdict) &&
      !judged[0].attempt.hints &&
      !judged[0].attempt.revealed,
    ),
    laterSuccesses: judged.slice(1).filter(({ verdict }) => succeeds(verdict))
      .length,
    familiarPosition: true,
    predictionCount: review.attempts.filter(
      (attempt) => attempt.prediction != null,
    ).length,
    predictions: review.attempts.flatMap((attempt, index) =>
      attempt.prediction
        ? [
            {
              attempt: index + 1,
              choice: attempt.prediction,
              supportedLegalReply:
                judgePrediction(decision.fen, attempt.move, attempt.prediction)
                  ?.supported ?? null,
            },
          ]
        : [],
    ),
    legacyAttempts: review.attempts.filter(
      (attempt) => attempt.coachingVersion !== 2,
    ).length,
    conceptualDiagnosis: "not-established",
    reviewed: review.reviewedAt !== null,
    masteryCredit: false,
    recommendation: review.recommendation,
  };
}
export function targetedPractice(
  decision: Decision,
  data: LearningData,
  bank: readonly FoundationExercise[],
  now: number,
) {
  const model = learnerModel(data, bank, now);
  for (const skillId of decision.skillIds) {
    if (!prerequisitesReady(skillId, model)) continue;
    const guided = bank
      .filter(
        (exercise) =>
          exercise.skillId === skillId && exercise.role === "guided",
      )
      .sort(
        (a, b) =>
          Number(data.runs.some((run) => run.exerciseId === a.id)) -
            Number(data.runs.some((run) => run.exerciseId === b.id)) ||
          a.difficulty - b.difficulty,
      );
    if (guided[0])
      return {
        exercise: guided[0],
        reason: `A legal immediate capture was observed after your game move. Revisit ${model.find((item) => item.skill.id === skillId)!.skill.title.toLowerCase()} in guided practice. This observation does not change your assessment state.`,
      };
  }
  return {
    exercise: null,
    reason: decision.skillIds.length
      ? "No suitable guided exercise is available with your current prerequisites. Continue the learning foundations first."
      : "No specific skill weakness was established. This analysis opportunity has no targeted practice prescription.",
  };
}
