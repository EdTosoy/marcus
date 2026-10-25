import {
  learnerModel,
  prerequisitesReady,
  defaultModelConfig,
  type ModelConfig,
} from "./model";
import { positionFingerprint } from "./content";
import { skills } from "./skills";
import type { FoundationExercise, LearningData } from "./types";

export type Recommendation = {
  exercise: FoundationExercise | null;
  reason: string;
  nextReviewAt: number | null;
};
export function recommend(
  data: LearningData,
  bank: readonly FoundationExercise[],
  now: number,
  config: ModelConfig = defaultModelConfig,
): Recommendation {
  const model = learnerModel(data, bank, now, config);
  const nextReviewAt =
    model
      .map((item) => item.dueAt)
      .filter((at): at is number => at !== null)
      .sort((a, b) => a - b)[0] ?? null;
  const exposure = new Set(
    data.runs
      .map((run) => bank.find((exercise) => exercise.id === run.exerciseId))
      .filter((item): item is FoundationExercise => Boolean(item))
      .map((exercise) => positionFingerprint(exercise.fen)),
  );
  const fresh = (exercise: FoundationExercise) =>
    !exposure.has(positionFingerprint(exercise.fen));
  if (data.runs.length >= 1000)
    return {
      exercise: null,
      reason:
        "The local evidence log is full. Export the results before starting a new profile in a separate browser context.",
      nextReviewAt,
    };
  // A short baseline samples each skill once. It deliberately does not teach or
  // enforce instructional prerequisites and never supplies correctness mid-test.
  for (const skill of skills) {
    if (
      data.runs.some(
        (run) =>
          bank.find((item) => item.id === run.exerciseId)?.skillId ===
            skill.id &&
          bank.find((item) => item.id === run.exerciseId)?.role ===
            "diagnostic" &&
          run.finishedAt !== null,
      )
    )
      continue;
    const exercise = bank.find(
      (item) =>
        item.role === "diagnostic" && item.skillId === skill.id && fresh(item),
    );
    if (exercise)
      return {
        exercise,
        reason:
          "A short baseline checks what you can do before guided teaching. Answers stay sealed until the baseline ends.",
        nextReviewAt,
      };
  }
  const eligible = model.filter((item) =>
    prerequisitesReady(item.skill.id, model, config),
  );
  for (const item of [...eligible].sort(
    (a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity),
  )) {
    if (item.dueAt === null || item.dueAt > now) continue;
    const exercise = bank.find(
      (exercise) =>
        exercise.skillId === item.skill.id &&
        exercise.role === "delayed" &&
        fresh(exercise),
    );
    if (exercise)
      return {
        exercise,
        reason: `${item.skill.title} is due for a retention check. This reserved position has not appeared in your practice.`,
        nextReviewAt,
      };
  }
  const rank = {
    "needs-practice": 0,
    "insufficient-evidence": 1,
    developing: 2,
    "review-due": 3,
    demonstrated: 4,
  };
  eligible.sort(
    (a, b) =>
      rank[a.state] - rank[b.state] ||
      skills.findIndex((skill) => skill.id === a.skill.id) -
        skills.findIndex((skill) => skill.id === b.skill.id),
  );
  for (const item of eligible) {
    if (item.guidedSolved >= config.guidedPositions) {
      const transfer = bank.find(
        (exercise) =>
          exercise.skillId === item.skill.id &&
          exercise.role === "transfer" &&
          fresh(exercise),
      );
      if (transfer)
        return {
          exercise: transfer,
          reason: `You completed guided examples of ${item.skill.title.toLowerCase()}. An unfamiliar position now checks independent application.`,
          nextReviewAt,
        };
    }
    const guided = bank
      .filter(
        (exercise) =>
          exercise.role === "guided" &&
          exercise.skillId === item.skill.id &&
          fresh(exercise),
      )
      .sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));
    if (guided[0])
      return {
        exercise: guided[0],
        reason: `${item.skill.title}: ${item.state === "needs-practice" ? "a baseline or independent check showed a gap" : "more practice evidence is needed"}. Start with ${guided[0].difficulty === 1 ? "a simpler" : "a more varied"} example.`,
        nextReviewAt,
      };
  }
  // Rehearsal is permitted only in guided pools. It never becomes fresh evidence.
  const lastId = data.runs.at(-1)?.exerciseId;
  const repeat = eligible
    .flatMap((item) =>
      bank.filter(
        (exercise) =>
          exercise.skillId === item.skill.id &&
          exercise.role === "guided" &&
          exercise.id !== lastId,
      ),
    )
    .sort(
      (a, b) =>
        (data.runs.filter((run) => run.exerciseId === a.id).at(-1)?.startedAt ??
          0) -
        (data.runs.filter((run) => run.exerciseId === b.id).at(-1)?.startedAt ??
          0),
    )[0];
  if (repeat)
    return {
      exercise: repeat,
      reason:
        "Reserved independent positions are limited. Rehearse an older guided example; this familiar position adds no fresh transfer or retention evidence.",
      nextReviewAt,
    };
  return {
    exercise: null,
    reason:
      "No suitable unseen position is available. Keep the evidence as it stands and return for a scheduled review or new content.",
    nextReviewAt,
  };
}
