import { isSquare } from "../domain/chess/game";
import { createSession } from "../domain/learning/session";
import type {
  Lesson,
  LessonSession,
  StudentResponse,
} from "../domain/learning/types";
import { validateResponse } from "../domain/learning/validation";

export const STORAGE_KEY = "quiet-chess:learning:v1";
export type LocalProgress = {
  version: 1;
  active: LessonSession;
  previous: LessonSession[];
};
export const freshProgress = (lesson: Lesson): LocalProgress => ({
  version: 1,
  active: createSession(lesson),
  previous: [],
});
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

export function isResponse(value: unknown): value is StudentResponse {
  if (!isObject(value)) return false;
  if (value.type === "unsure") return true;
  if (value.type === "choice")
    return typeof value.choice === "string" && value.choice.length <= 80;
  if (value.type === "square")
    return typeof value.square === "string" && isSquare(value.square);
  return (
    value.type === "move" &&
    isObject(value.move) &&
    typeof value.move.from === "string" &&
    isSquare(value.move.from) &&
    typeof value.move.to === "string" &&
    isSquare(value.move.to) &&
    (value.move.promotion === undefined ||
      ["q", "r", "b", "n"].includes(String(value.move.promotion)))
  );
}

function isSession(value: unknown, lesson: Lesson): value is LessonSession {
  if (
    !isObject(value) ||
    value.lessonId !== lesson.id ||
    value.lessonVersion !== lesson.version ||
    !integer(value.index, -1, lesson.exercises.length - 1) ||
    typeof value.completed !== "boolean" ||
    !isObject(value.records)
  )
    return false;
  if (
    Object.keys(value.records).some(
      (id) => !lesson.exercises.some((exercise) => exercise.id === id),
    )
  )
    return false;
  for (const exercise of lesson.exercises) {
    const record = value.records[exercise.id];
    if (record === undefined) continue;
    if (
      !isObject(record) ||
      !Array.isArray(record.attempts) ||
      record.attempts.length > 1000 ||
      !integer(record.hintsRevealed, 0, exercise.hints.length) ||
      typeof record.solved !== "boolean"
    )
      return false;
    let previousHints = 0;
    for (const attempt of record.attempts) {
      if (
        !isObject(attempt) ||
        !isResponse(attempt.response) ||
        !integer(attempt.hintsUsed, previousHints, record.hintsRevealed) ||
        typeof attempt.correct !== "boolean"
      )
        return false;
      const feedback = validateResponse(exercise, attempt.response);
      if (
        feedback.kind === "invalid" ||
        (feedback.kind === "correct") !== attempt.correct
      )
        return false;
      previousHints = attempt.hintsUsed;
    }
    if (
      record.activeAttempt !== null &&
      (!record.attempts.length ||
        !integer(
          record.activeAttempt,
          record.attempts.length - 1,
          record.attempts.length - 1,
        ))
    )
      return false;
    const last =
      record.activeAttempt === null
        ? undefined
        : record.attempts[record.activeAttempt];
    if (record.solved !== Boolean(isObject(last) && last.correct)) return false;
  }
  // A stored cursor cannot skip unsolved work, even if the JSON is well formed.
  for (let index = 0; index < value.index; index++) {
    const exercise = lesson.exercises[index]!;
    const record = value.records[exercise.id];
    if (!isObject(record) || record.solved !== true) return false;
  }
  if (value.completed) {
    if (value.index !== lesson.exercises.length - 1) return false;
    for (const exercise of lesson.exercises) {
      const record = value.records[exercise.id];
      if (!isObject(record) || record.solved !== true) return false;
    }
  }
  return true;
}

export function decodeProgress(
  raw: string | null,
  lesson: Lesson,
): LocalProgress | null {
  if (!raw || raw.length > 2_000_000) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (
      !isObject(data) ||
      data.version !== 1 ||
      !isSession(data.active, lesson) ||
      !Array.isArray(data.previous) ||
      data.previous.length > 20 ||
      !data.previous.every(
        (session) => isSession(session, lesson) && session.completed,
      )
    )
      return null;
    return { version: 1, active: data.active, previous: data.previous };
  } catch {
    return null;
  }
}

export function practiceAgain(
  data: LocalProgress,
  lesson: Lesson,
): LocalProgress {
  return {
    version: 1,
    active: createSession(lesson),
    previous: [...data.previous, data.active].slice(-20),
  };
}
