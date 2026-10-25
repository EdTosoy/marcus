import type { ExerciseRun, FoundationExercise, LearningData } from "./types";
import { positionFingerprint } from "./content";
import { skills, type SkillId } from "./skills";

export const DAY = 86_400_000;
export type ModelConfig = {
  guidedPositions: number;
  transferSuccesses: number;
  delayedSuccesses: number;
  difficultyLevels: number;
  recentWindow: number;
  errorsForPractice: number;
  reviewIntervalsMs: readonly number[];
  errorReviewDelayMs: number;
};
export const defaultModelConfig: ModelConfig = {
  guidedPositions: 2,
  transferSuccesses: 2,
  delayedSuccesses: 1,
  difficultyLevels: 2,
  recentWindow: 3,
  errorsForPractice: 1,
  reviewIntervalsMs: [DAY, 3 * DAY, 7 * DAY],
  errorReviewDelayMs: DAY,
};
export function assertModelConfig(config: ModelConfig) {
  for (const count of [
    config.guidedPositions,
    config.transferSuccesses,
    config.delayedSuccesses,
    config.difficultyLevels,
    config.recentWindow,
    config.errorsForPractice,
  ])
    if (!Number.isInteger(count) || count < 1)
      throw new Error("Evidence thresholds must be positive integers");
  if (
    !config.reviewIntervalsMs.length ||
    [...config.reviewIntervalsMs, config.errorReviewDelayMs].some(
      (value) => !Number.isFinite(value) || value <= 0,
    )
  )
    throw new Error("Review delays must be positive finite durations");
}
export type EvidenceState =
  | "insufficient-evidence"
  | "needs-practice"
  | "developing"
  | "demonstrated"
  | "review-due";
export const stateLabels: Record<EvidenceState, string> = {
  "insufficient-evidence": "Insufficient evidence",
  "needs-practice": "Needs practice",
  developing: "Developing",
  demonstrated: "Demonstrated",
  "review-due": "Review due",
};
export type Evidence = {
  run: ExerciseRun;
  exercise: FoundationExercise;
  fresh: boolean;
  independent: boolean;
  firstCorrect: boolean;
  eventualCorrect: boolean;
  delayedEligible: boolean;
};

export function evidenceFor(
  data: LearningData,
  bank: readonly FoundationExercise[],
  config = defaultModelConfig,
): Evidence[] {
  assertModelConfig(config);
  const seen = new Set<string>();
  const acquisition = new Map<SkillId, number>();
  const reviewDue = new Map<SkillId, { at: number; successes: number }>();
  const evidence: Evidence[] = [];
  for (const run of data.runs) {
    const exercise = bank.find((item) => item.id === run.exerciseId);
    if (!exercise || run.contentVersion !== exercise.contentVersion) continue;
    const fingerprint = positionFingerprint(exercise.fen);
    const fresh = !seen.has(fingerprint);
    seen.add(fingerprint); // An exposure counts even if abandoned.
    if (run.finishedAt === null || !run.attempts.length) continue;
    const first = run.attempts[0]!;
    const independent =
      fresh &&
      first.correct &&
      first.hintsUsed === 0 &&
      first.response.type !== "unsure";
    const due = reviewDue.get(exercise.skillId);
    const delayedEligible =
      exercise.role === "delayed" &&
      due !== undefined &&
      run.startedAt >= due.at;
    evidence.push({
      run,
      exercise,
      fresh,
      independent,
      firstCorrect: first.correct,
      eventualCorrect: run.attempts.some((attempt) => attempt.correct),
      delayedEligible,
    });
    if (
      exercise.role === "transfer" &&
      independent &&
      !acquisition.has(exercise.skillId)
    ) {
      acquisition.set(exercise.skillId, run.finishedAt);
      reviewDue.set(exercise.skillId, {
        at: run.finishedAt + config.reviewIntervalsMs[0]!,
        successes: 0,
      });
    }
    if (fresh && delayedEligible && due) {
      const successes = due.successes + (independent ? 1 : 0);
      reviewDue.set(exercise.skillId, {
        at:
          run.finishedAt +
          (independent
            ? config.reviewIntervalsMs[
                Math.min(successes, config.reviewIntervalsMs.length - 1)
              ]!
            : config.errorReviewDelayMs),
        successes,
      });
    }
  }
  return evidence;
}

export function reviewSchedule(
  skill: SkillId,
  evidence: readonly Evidence[],
  config = defaultModelConfig,
) {
  const acquired = evidence.find(
    (item) =>
      item.exercise.skillId === skill &&
      item.exercise.role === "transfer" &&
      item.independent,
  );
  if (!acquired) return { dueAt: null, successfulReviews: 0 };
  let dueAt = acquired.run.finishedAt! + config.reviewIntervalsMs[0]!;
  let successfulReviews = 0;
  for (const item of evidence) {
    if (
      item.exercise.skillId !== skill ||
      item.exercise.role !== "delayed" ||
      !item.fresh ||
      item.run.startedAt < dueAt ||
      !item.delayedEligible
    )
      continue;
    if (item.independent) {
      successfulReviews++;
      dueAt =
        item.run.finishedAt! +
        config.reviewIntervalsMs[
          Math.min(successfulReviews, config.reviewIntervalsMs.length - 1)
        ]!;
    } else dueAt = item.run.finishedAt! + config.errorReviewDelayMs;
  }
  return { dueAt, successfulReviews };
}

export function learnerModel(
  data: LearningData,
  bank: readonly FoundationExercise[],
  now: number,
  config = defaultModelConfig,
) {
  const evidence = evidenceFor(data, bank, config).filter(
    (item) => item.run.startedAt <= now && item.run.finishedAt! <= now,
  );
  return skills.map((skill) => {
    const items = evidence.filter((item) => item.exercise.skillId === skill.id);
    const guided = items.filter((item) => item.exercise.role === "guided");
    const guidedSolved = new Set(
      guided
        .filter((item) => item.eventualCorrect)
        .map((item) => item.exercise.id),
    ).size;
    const transfer = items.filter(
      (item) => item.exercise.role === "transfer" && item.fresh,
    );
    const transferSuccesses = transfer.filter(
      (item) => item.independent,
    ).length;
    const schedule = reviewSchedule(skill.id, evidence, config);
    const delayed = items.filter(
      (item) =>
        item.exercise.role === "delayed" && item.fresh && item.delayedEligible,
    );
    const validDelayed = delayed.filter(
      (item) => item.independent && item.run.startedAt <= now,
    );
    const difficultyCoverage = [
      ...new Set(
        items
          .filter(
            (item) =>
              item.independent &&
              item.exercise.role !== "diagnostic" &&
              (item.exercise.role !== "delayed" || item.delayedEligible),
          )
          .map((item) => item.exercise.difficulty),
      ),
    ];
    // Only fresh checks can replace assessment evidence. Rehearsing a known
    // guided board cannot erase a failed independent check.
    const checks = items.filter(
      (item) =>
        item.fresh &&
        item.exercise.role !== "guided" &&
        (item.exercise.role !== "delayed" || item.delayedEligible),
    );
    const recent = checks.slice(-config.recentWindow);
    const latestWrong = recent.at(-1)?.firstCorrect === false;
    const needsPractice =
      latestWrong &&
      recent.filter((item) => !item.firstCorrect).length >=
        config.errorsForPractice;
    let baseState: Exclude<EvidenceState, "review-due"> =
      "insufficient-evidence";
    if (needsPractice) baseState = "needs-practice";
    else if (guidedSolved >= config.guidedPositions || transferSuccesses)
      baseState = "developing";
    if (
      !needsPractice &&
      guidedSolved >= config.guidedPositions &&
      transferSuccesses >= config.transferSuccesses &&
      schedule.successfulReviews >= config.delayedSuccesses &&
      difficultyCoverage.length >= config.difficultyLevels
    )
      baseState = "demonstrated";
    const due = schedule.dueAt !== null && schedule.dueAt <= now;
    const state: EvidenceState =
      due && baseState !== "needs-practice" ? "review-due" : baseState;
    const attempts = items.flatMap((item) => item.run.attempts);
    const firstCorrect = items.filter((item) => item.firstCorrect).length;
    const reason =
      state === "demonstrated"
        ? "Varied transfer and an eligible delayed check met the provisional evidence rule. This is not a chess ability rating."
        : state === "review-due"
          ? "A scheduled interval has elapsed. An unfamiliar review can check retention."
          : state === "needs-practice"
            ? "A recent independent check was incorrect or marked not sure. Practice this idea before claiming understanding."
            : state === "developing"
              ? "Practice or transfer evidence is present; more independent and delayed evidence is still needed."
              : "There are not enough varied observations yet. Completion alone supplies no mastery credit.";
    return {
      skill,
      state,
      baseState,
      reason,
      attemptedPositions: new Set(items.map((item) => item.exercise.id)).size,
      guidedSolved,
      firstCorrect,
      firstAttempts: items.length,
      independentSuccesses: items.filter((item) => item.independent).length,
      assistedSuccesses: items.filter(
        (item) => item.eventualCorrect && !item.independent,
      ).length,
      hintsUsed: items.reduce((sum, item) => sum + item.run.hintsOpened, 0),
      attempts: attempts.length,
      transferSuccesses,
      transferChecks: transfer.length,
      delayedSuccesses: schedule.successfulReviews,
      delayedChecks: delayed.length,
      eligibleDelayedSuccesses: validDelayed.length,
      difficultyCoverage,
      lastPracticedAt: items.at(-1)?.run.finishedAt ?? null,
      dueAt: schedule.dueAt,
    };
  });
}
export type SkillEvidence = ReturnType<typeof learnerModel>[number];
export function prerequisitesReady(
  skill: SkillId,
  model: readonly SkillEvidence[],
  config = defaultModelConfig,
) {
  return skills
    .find((item) => item.id === skill)!
    .prerequisites.every((id) => {
      const evidence = model.find((item) => item.skill.id === id);
      return (
        evidence &&
        evidence.guidedSolved >= config.guidedPositions &&
        ["developing", "demonstrated"].includes(evidence.baseState)
      );
    });
}
