import type { MoveInput } from "../domain/chess/game";

export const ENGINE_VERSION = "stockfish.js-19.0.1-lite-single";
export const difficulties = {
  "getting-started": {
    label: "Getting Started",
    skill: 0,
    depth: 1,
    timeMs: 80,
    nodes: 500,
    description:
      "The shortest native engine search. A starting point for supervised calibration.",
  },
  gentle: {
    label: "Beginner",
    skill: 0,
    depth: 2,
    timeMs: 100,
    nodes: 2_000,
    description: "A little more search while keeping native minimum skill.",
  },
  steady: {
    label: "Developing",
    skill: 3,
    depth: 6,
    timeMs: 175,
    nodes: 8_000,
    description: "More search and a higher native skill setting.",
  },
  challenging: {
    label: "Challenging",
    skill: 10,
    depth: 12,
    timeMs: 350,
    nodes: 60_000,
    description: "The deepest playing preset and higher native skill.",
  },
} as const;
export type Difficulty = keyof typeof difficulties;
export type EngineRequest = {
  gameId?: string;
  fen: string;
  startingFen?: string;
  moves?: readonly MoveInput[];
  skill?: number;
  timeMs?: number;
  nodes?: number;
  hashMb?: number;
  multiPv?: number;
  depth?: number;
};
export type EngineLine = {
  rank: number;
  depth: number;
  score: { type: "cp" | "mate"; value: number } | null;
  moves: MoveInput[];
};
export type EngineResult = {
  version: typeof ENGINE_VERSION;
  fen: string;
  bestMove: MoveInput | null;
  lines: EngineLine[];
};
export interface ChessEngine {
  search(request: EngineRequest, signal?: AbortSignal): Promise<EngineResult>;
  cancel(): void;
  restart(): void;
  dispose(): void;
}
export const uciMove = (move: MoveInput) =>
  `${move.from}${move.to}${move.promotion ?? ""}`;
