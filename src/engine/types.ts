import type { MoveInput } from "../domain/chess/game";

export const ENGINE_VERSION = "stockfish.js-19.0.1-lite-single";
export const difficulties = {
  gentle: { label: "Gentle", skill: 0, timeMs: 150, nodes: 20_000 },
  steady: { label: "Steady", skill: 5, timeMs: 250, nodes: 40_000 },
  challenging: { label: "Challenging", skill: 10, timeMs: 400, nodes: 80_000 },
} as const;
export type Difficulty = keyof typeof difficulties;
export type EngineRequest = {
  fen: string;
  startingFen?: string;
  moves?: readonly MoveInput[];
  skill?: number;
  timeMs?: number;
  nodes?: number;
  hashMb?: number;
  multiPv?: number;
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
