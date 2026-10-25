import type { Exercise, StudentResponse } from "../learning/types";
import type { SkillId } from "./skills";

export const exerciseRoles = [
  "diagnostic",
  "guided",
  "transfer",
  "delayed",
] as const;
export type ExerciseRole = (typeof exerciseRoles)[number];
export type FoundationExercise = Exercise & {
  role: ExerciseRole;
  skillId: SkillId;
  difficulty: 1 | 2;
  contentVersion: 1;
  concept: string;
  review: Exercise["review"] & {
    defenders?: readonly import("chess.js").Square[];
    status?: string;
    replySources?: readonly import("chess.js").Square[];
  };
};
export type Reflection =
  "attacks-only" | "defenders" | "opponent-reply" | "unsure";
export type LearningAttempt = {
  response: StudentResponse;
  correct: boolean;
  hintsUsed: number;
  at: number;
  reflection: Reflection | null;
};
export type ExerciseRun = {
  id: string;
  exerciseId: string;
  contentVersion: number;
  startedAt: number;
  finishedAt: number | null;
  hintsOpened: number;
  attempts: LearningAttempt[];
  feedbackOpen: boolean;
};
export type LearningData = {
  schemaVersion: 2;
  curriculumVersion: 1;
  runs: ExerciseRun[];
  activeRunId: string | null;
  legacy: {
    source: "quiet-chess:learning:v1";
    attempted: number;
    completedRuns: number;
    hasReliableTimestamps: false;
  } | null;
};
export const freshLearningData = (): LearningData => ({
  schemaVersion: 2,
  curriculumVersion: 1,
  runs: [],
  activeRunId: null,
  legacy: null,
});
