import type {
  ExerciseRecord,
  Lesson,
  LessonSession,
  StudentResponse,
} from "./types";
import { validateResponse } from "./validation";

export const emptyRecord = (): ExerciseRecord => ({
  attempts: [],
  hintsRevealed: 0,
  solved: false,
  activeAttempt: null,
});
export function createSession(lesson: Lesson): LessonSession {
  return {
    lessonId: lesson.id,
    lessonVersion: lesson.version,
    index: -1,
    completed: false,
    records: {},
  };
}
export type LessonEvent =
  | { type: "next" }
  | { type: "hint" }
  | { type: "retry" }
  | { type: "submit"; response: StudentResponse };

export function transition(
  lesson: Lesson,
  session: LessonSession,
  event: LessonEvent,
): LessonSession {
  if (session.completed) return session;
  if (session.index === -1)
    return event.type === "next" ? { ...session, index: 0 } : session;
  const exercise = lesson.exercises[session.index];
  if (!exercise) return session;
  const record = session.records[exercise.id] ?? emptyRecord();
  if (event.type === "next") {
    if (
      !record.solved &&
      !(
        exercise.completion === "submitted-response" &&
        record.activeAttempt !== null
      )
    )
      return session;
    return session.index === lesson.exercises.length - 1
      ? { ...session, completed: true }
      : { ...session, index: session.index + 1 };
  }
  let updated: ExerciseRecord;
  if (event.type === "hint") {
    if (
      record.solved ||
      exercise.retry === "none" ||
      (exercise.assessment && record.attempts.length === 0) ||
      record.hintsRevealed >= exercise.hints.length
    )
      return session;
    updated = { ...record, hintsRevealed: record.hintsRevealed + 1 };
  } else if (event.type === "retry") {
    if (exercise.retry === "none") return session;
    // Restoring a position never erases evidence of mistakes or hints.
    updated = { ...record, activeAttempt: null, solved: false };
  } else {
    if (record.activeAttempt !== null) return session;
    const feedback = validateResponse(exercise, event.response);
    if (feedback.kind === "invalid") return session;
    updated = {
      ...record,
      attempts: [
        ...record.attempts,
        {
          response: event.response,
          correct: feedback.kind === "correct",
          hintsUsed: record.hintsRevealed,
        },
      ],
      activeAttempt: record.attempts.length,
      solved: feedback.kind === "correct",
    };
  }
  return {
    ...session,
    records: { ...session.records, [exercise.id]: updated },
  };
}

export function progress(lesson: Lesson, session: LessonSession) {
  const entries = lesson.exercises.map((exercise) => ({
    exercise,
    record: session.records[exercise.id] ?? emptyRecord(),
  }));
  const attempts = entries.flatMap(({ record }) => record.attempts);
  return {
    attempted: entries.filter(({ record }) => record.attempts.length > 0)
      .length,
    solved: entries.filter(({ record }) => record.solved).length,
    correctAttempts: attempts.filter((attempt) => attempt.correct).length,
    incorrectAttempts: attempts.filter((attempt) => !attempt.correct).length,
    hintsUsed: entries.reduce(
      (sum, { record }) => sum + record.hintsRevealed,
      0,
    ),
    independentSuccesses: entries.filter(
      ({ record }) =>
        record.attempts[0]?.correct && record.attempts[0]?.hintsUsed === 0,
    ).length,
    completed: session.completed,
    assessments: entries
      .filter(({ exercise }) => exercise.assessment)
      .map(({ exercise, record }) => ({
        exerciseId: exercise.id,
        firstAttemptCorrect: record.attempts[0]?.correct ?? null,
        independent:
          record.attempts[0]?.correct === true &&
          record.attempts[0].hintsUsed === 0,
        solved: record.solved,
        attempts: record.attempts.length,
        hintsUsed: record.hintsRevealed,
      })),
    mastery: "not-established" as const,
  };
}
