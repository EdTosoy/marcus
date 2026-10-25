import { foundationExercises as bank } from "../curriculum/foundations";
import {
  freshLearningData,
  type LearningData,
  type ExerciseRun,
} from "./types";
import { learningTransition } from "./session";
import { defaultModelConfig, type ModelConfig } from "./model";

export const START = 1_800_000_000_000;
export function finishedRun(
  id: string,
  at: number,
  correct = true,
  hints = 0,
): ExerciseRun {
  const exercise = bank.find((exercise) => exercise.id === id)!;
  return {
    id: `fixture-${id}-${at}`,
    exerciseId: id,
    contentVersion: 1,
    startedAt: at,
    finishedAt: at + 1,
    hintsOpened: hints,
    feedbackOpen: false,
    attempts: [
      {
        response: correct
          ? exercise.review.validExamples[0]!
          : exercise.review.invalidExamples[0]!,
        correct,
        hintsUsed: hints,
        at: at + 1,
        reflection: null,
      },
    ],
  };
}
export function withRuns(...runs: ExerciseRun[]): LearningData {
  return { ...freshLearningData(), runs };
}
export function baseline(correct = true): LearningData {
  return withRuns(
    ...bank
      .filter((item) => item.role === "diagnostic")
      .map((item, index) => finishedRun(item.id, START + index * 10, correct)),
  );
}
export function acquisition() {
  const data = baseline();
  data.runs.push(
    finishedRun("attack-pawn", START + 100),
    finishedRun("attack-black", START + 110),
    finishedRun("attack-transfer-lines", START + 120),
    finishedRun("attack-transfer-file", START + 130),
  );
  return data;
}
export function answerNext(
  data: LearningData,
  at: number,
  config: ModelConfig = defaultModelConfig,
) {
  let next = learningTransition(data, { type: "start" }, bank, at, config);
  const run = next.runs.at(-1)!;
  const exercise = bank.find((item) => item.id === run.exerciseId)!;
  next = learningTransition(
    next,
    { type: "submit", response: exercise.review.validExamples[0]! },
    bank,
    at + 1,
    config,
  );
  return learningTransition(next, { type: "next" }, bank, at + 2, config);
}
