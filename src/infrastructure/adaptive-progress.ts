import { foundationExercises } from "../domain/curriculum/foundations";
import { pieceSafetyLesson } from "../domain/curriculum/piece-safety";
import { progress } from "../domain/learning/session";
import { validateResponse } from "../domain/learning/validation";
import {
  freshLearningData,
  type FoundationExercise,
  type LearningData,
} from "../domain/adaptive/types";
import { decodeProgress, isResponse } from "./local-progress";
import { evidenceFor } from "../domain/adaptive/model";

export const LEARNING_STORAGE_KEY = "marcus:learning:v2";
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const time = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const count = (value: unknown, max: number): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= max;
const reflection = (value: unknown) =>
  value === null ||
  ["attacks-only", "defenders", "opponent-reply", "unsure"].includes(
    String(value),
  );

export function decodeLearningData(
  raw: string | null,
  bank: readonly FoundationExercise[] = foundationExercises,
): LearningData | null {
  if (!raw || raw.length > 5_000_000) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (
      !object(data) ||
      data.schemaVersion !== 2 ||
      data.curriculumVersion !== 1 ||
      !Array.isArray(data.runs) ||
      data.runs.length > 1000 ||
      !(data.activeRunId === null || typeof data.activeRunId === "string")
    )
      return null;
    if (
      data.legacy !== null &&
      (!object(data.legacy) ||
        data.legacy.source !== "quiet-chess:learning:v1" ||
        data.legacy.hasReliableTimestamps !== false ||
        !count(data.legacy.attempted, 126) ||
        !count(data.legacy.completedRuns, 21))
    )
      return null;
    const ids = new Set<string>();
    const assessmentIds = new Set<string>();
    let lastTime = 0;
    for (const rawRun of data.runs) {
      if (
        !object(rawRun) ||
        typeof rawRun.id !== "string" ||
        ids.has(rawRun.id) ||
        typeof rawRun.exerciseId !== "string" ||
        typeof rawRun.feedbackOpen !== "boolean" ||
        !time(rawRun.startedAt) ||
        rawRun.startedAt < lastTime ||
        !Array.isArray(rawRun.attempts) ||
        rawRun.attempts.length > 1000
      )
        return null;
      ids.add(rawRun.id);
      const exercise = bank.find((item) => item.id === rawRun.exerciseId);
      if (
        !exercise ||
        rawRun.contentVersion !== exercise.contentVersion ||
        !count(rawRun.hintsOpened, exercise.hints.length)
      )
        return null;
      if (exercise.role !== "guided") {
        if (
          assessmentIds.has(exercise.id) ||
          rawRun.hintsOpened !== 0 ||
          rawRun.attempts.length > 1
        )
          return null;
        assessmentIds.add(exercise.id);
      }
      let priorHints = 0;
      let at = rawRun.startedAt;
      for (let index = 0; index < rawRun.attempts.length; index++) {
        const attempt: unknown = rawRun.attempts[index];
        if (
          !object(attempt) ||
          !isResponse(attempt.response) ||
          typeof attempt.correct !== "boolean" ||
          !count(attempt.hintsUsed, rawRun.hintsOpened) ||
          attempt.hintsUsed < priorHints ||
          !time(attempt.at) ||
          attempt.at < at ||
          !reflection(attempt.reflection)
        )
          return null;
        const result = validateResponse(exercise, attempt.response);
        if (
          result.kind === "invalid" ||
          attempt.correct !== (result.kind === "correct")
        )
          return null;
        if (
          attempt.reflection !== null &&
          (exercise.role !== "guided" || attempt.correct)
        )
          return null;
        if (
          index < rawRun.attempts.length - 1 &&
          (attempt.correct || attempt.reflection === null)
        )
          return null;
        priorHints = attempt.hintsUsed;
        at = attempt.at;
      }
      const last: unknown = rawRun.attempts.at(-1);
      if (rawRun.finishedAt !== null) {
        if (
          !time(rawRun.finishedAt) ||
          rawRun.finishedAt !== at ||
          !object(last) ||
          (exercise.role === "guided" && last.correct !== true)
        )
          return null;
      } else if (object(last) && (last.correct || exercise.role !== "guided"))
        return null;
      if (rawRun.feedbackOpen && !rawRun.attempts.length) return null;
      if (
        rawRun.id !== data.activeRunId &&
        (rawRun.finishedAt === null || rawRun.feedbackOpen)
      )
        return null;
      if (rawRun.id === data.activeRunId && rawRun !== data.runs.at(-1))
        return null;
      lastTime = rawRun.finishedAt === null ? at : rawRun.finishedAt;
    }
    if (data.activeRunId !== null && !ids.has(data.activeRunId)) return null;
    return data as LearningData;
  } catch {
    return null;
  }
}

export function loadLearningData(
  raw: string | null,
  legacyRaw: string | null,
): { data: LearningData; notice: string } {
  const decoded = decodeLearningData(raw);
  if (decoded) return { data: decoded, notice: "" };
  const data = freshLearningData();
  const legacy = decodeProgress(legacyRaw, pieceSafetyLesson);
  if (legacy) {
    const runs = [...legacy.previous, legacy.active];
    data.legacy = {
      source: "quiet-chess:learning:v1",
      attempted: runs.reduce(
        (sum, run) => sum + progress(pieceSafetyLesson, run).attempted,
        0,
      ),
      completedRuns: runs.filter((run) => run.completed).length,
      hasReliableTimestamps: false,
    };
  }
  return {
    data,
    notice: raw
      ? "The adaptive record is unsupported or damaged. A fresh record is ready; your original lesson data is untouched."
      : legacy
        ? "Original lesson history is preserved. Its undated results are not counted as fresh independent or retention evidence."
        : "",
  };
}

export function exportLearningResults(data: LearningData, now: number): string {
  const observations = evidenceFor(data, foundationExercises).map((item) => ({
    exerciseId: item.exercise.id,
    skillId: item.exercise.skillId,
    role: item.exercise.role,
    difficulty: item.exercise.difficulty,
    fresh: item.fresh,
    firstAttemptCorrect: item.firstCorrect,
    independent: item.independent,
    eventualSuccess: item.eventualCorrect,
    hintsOpened: item.run.hintsOpened,
    attemptCount: item.run.attempts.length,
    delayedEligible: item.delayedEligible,
    startedAt: item.run.startedAt,
    finishedAt: item.run.finishedAt,
  }));
  return JSON.stringify(
    {
      format: "marcus-local-learning-results",
      exportedAt: now,
      ...data,
      observations,
    },
    null,
    2,
  );
}
