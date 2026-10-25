import type { Square } from "chess.js";
import type { MoveInput } from "../chess/game";

export type StudentResponse =
  | { type: "square"; square: Square }
  | { type: "move"; move: MoveInput }
  | { type: "choice"; choice: string }
  | { type: "unsure" };
export type Answer =
  | { type: "attacker"; target: Square; squares: readonly Square[] }
  | { type: "safe-move"; from: Square }
  | { type: "status"; target: Square; question: "attack-defense" | "hanging" }
  | { type: "reply"; candidate: MoveInput }
  | { type: "moves"; moves: readonly MoveInput[] };

export type Exercise = {
  id: string;
  title: string;
  objective: string;
  skillTags: readonly string[];
  fen: string;
  instruction: string;
  focusSquare: Square;
  answer: Answer;
  misconceptions: readonly string[];
  hints: readonly [string, string, ...string[]];
  correctExplanation: string;
  incorrectExplanation: string;
  retry: "unlimited" | "none";
  completion: "correct-response" | "submitted-response";
  assessment?: boolean;
  repeatInstruction?: string;
  review: {
    attackers: readonly Square[];
    validExamples: readonly StudentResponse[];
    invalidExamples: readonly StudentResponse[];
  };
};

export type Lesson = {
  id: string;
  version: number;
  title: string;
  objective: string;
  skillTags: readonly string[];
  introduction: {
    fen: string;
    target: Square;
    attacker: Square;
    explanation: string;
  };
  exercises: readonly Exercise[];
};

export type Feedback = {
  kind: "correct" | "incorrect" | "invalid";
  message: string;
  fen?: string;
  san?: string;
  attackers?: Square[];
};
export type Attempt = {
  response: StudentResponse;
  correct: boolean;
  hintsUsed: number;
};
export type ExerciseRecord = {
  attempts: Attempt[];
  hintsRevealed: number;
  solved: boolean;
  activeAttempt: number | null;
};
export type LessonSession = {
  lessonId: string;
  lessonVersion: number;
  index: number;
  completed: boolean;
  records: Record<string, ExerciseRecord>;
};
