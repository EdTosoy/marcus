import { validateResponse } from "../learning/validation";
import type { StudentResponse } from "../learning/types";
import { recommend } from "./recommend";
import { defaultModelConfig, type ModelConfig } from "./model";
import type { FoundationExercise, LearningData, Reflection } from "./types";

export type LearningEvent =
  | { type: "start" }
  | { type: "hint" }
  | { type: "retry" }
  | { type: "next" }
  | { type: "submit"; response: StudentResponse }
  | { type: "reflect"; reflection: Reflection };
export function learningTransition(
  data: LearningData,
  event: LearningEvent,
  bank: readonly FoundationExercise[],
  now: number,
  config: ModelConfig = defaultModelConfig,
): LearningData {
  if (
    !Number.isFinite(now) ||
    now < 0 ||
    now <
      Math.max(
        0,
        ...data.runs.map(
          (run) => run.finishedAt ?? run.attempts.at(-1)?.at ?? run.startedAt,
        ),
      )
  )
    return data;
  if (event.type === "start") {
    if (data.activeRunId) return data;
    const { exercise } = recommend(data, bank, now, config);
    if (!exercise) return data;
    const run = {
      id: `run-${data.runs.length + 1}`,
      exerciseId: exercise.id,
      contentVersion: exercise.contentVersion,
      startedAt: now,
      finishedAt: null,
      hintsOpened: 0,
      attempts: [],
      feedbackOpen: false,
    };
    return { ...data, runs: [...data.runs, run], activeRunId: run.id };
  }
  const run = data.runs.find((item) => item.id === data.activeRunId);
  if (!run) return data;
  const exercise = bank.find((item) => item.id === run.exerciseId);
  if (!exercise) return data;
  const guided = exercise.role === "guided";
  if (event.type === "next")
    return run.finishedAt !== null
      ? {
          ...data,
          activeRunId: null,
          runs: data.runs.map((item) =>
            item.id === run.id ? { ...run, feedbackOpen: false } : item,
          ),
        }
      : data;
  if (run.finishedAt !== null) return data;
  let updated = run;
  if (event.type === "hint") {
    if (!guided || run.hintsOpened >= exercise.hints.length) return data;
    updated = { ...run, hintsOpened: run.hintsOpened + 1 };
  } else if (event.type === "retry") {
    if (!guided || !run.feedbackOpen || !run.attempts.at(-1)?.reflection)
      return data;
    updated = { ...run, feedbackOpen: false };
  } else if (event.type === "reflect") {
    if (
      !guided ||
      !run.feedbackOpen ||
      run.attempts.at(-1)?.correct ||
      run.attempts.at(-1)?.reflection ||
      !["attacks-only", "defenders", "opponent-reply", "unsure"].includes(
        event.reflection,
      )
    )
      return data;
    updated = {
      ...run,
      attempts: run.attempts.map((attempt, index) =>
        index === run.attempts.length - 1
          ? { ...attempt, reflection: event.reflection }
          : attempt,
      ),
    };
  } else if (event.type === "submit") {
    if (run.feedbackOpen) return data;
    const feedback = validateResponse(exercise, event.response);
    if (feedback.kind === "invalid") return data;
    const correct = feedback.kind === "correct";
    updated = {
      ...run,
      feedbackOpen: true,
      finishedAt: !guided || correct ? now : null,
      attempts: [
        ...run.attempts,
        {
          response: event.response,
          correct,
          hintsUsed: run.hintsOpened,
          at: now,
          reflection: null,
        },
      ],
    };
  }
  return {
    ...data,
    runs: data.runs.map((item) => (item.id === run.id ? updated : item)),
  };
}

export function learnerFeedback(
  data: LearningData,
  bank: readonly FoundationExercise[],
) {
  const run = data.runs.find((item) => item.id === data.activeRunId);
  const exercise = bank.find((item) => item.id === run?.exerciseId);
  const attempt = run?.attempts.at(-1);
  if (!run?.feedbackOpen || !exercise || !attempt) return null;
  if (exercise.role !== "guided")
    return {
      kind: "sealed" as const,
      message:
        "Answer recorded. No hints, retries, or solution are shown for this independent check.",
    };
  return validateResponse(exercise, attempt.response);
}
