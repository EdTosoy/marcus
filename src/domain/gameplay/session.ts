import { Chess, DEFAULT_POSITION, type Color } from "chess.js";
import { gameStatus, replay, type MoveInput } from "../chess/game";
import type { Difficulty } from "../../engine/types";

export type GameResult = "1-0" | "0-1" | "1/2-1/2";
export type Outcome = { result: GameResult; reason: string };
export type GameSession = {
  id: string;
  startedAt: number;
  finishedAt: number | null;
  startingFen: string;
  player: Color;
  difficulty: Difficulty;
  moves: MoveInput[];
  outcome: Outcome | null;
};
export function newGame(
  id: string,
  player: Color,
  difficulty: Difficulty,
  at: number,
  startingFen = DEFAULT_POSITION,
): GameSession {
  const game = new Chess(startingFen);
  const outcome = terminalOutcome(game);
  return {
    id,
    player,
    difficulty,
    startedAt: at,
    finishedAt: outcome ? at : null,
    startingFen: game.fen(),
    moves: [],
    outcome,
  };
}
export function terminalOutcome(game: Chess): Outcome | null {
  if (game.isCheckmate())
    return {
      result: game.turn() === "w" ? "0-1" : "1-0",
      reason: gameStatus(game),
    };
  if (game.isGameOver()) return { result: "1/2-1/2", reason: gameStatus(game) };
  return null;
}
export function moveInGame(
  session: GameSession,
  move: MoveInput,
  actor: "learner" | "engine",
  at: number,
): GameSession {
  if (session.outcome || at < session.startedAt) return session;
  const game = replay(session.startingFen, session.moves);
  if ((game.turn() === session.player) !== (actor === "learner"))
    return session;
  try {
    game.move(move);
  } catch {
    return session;
  }
  const moves = [...session.moves, move];
  const outcome =
    terminalOutcome(game) ??
    (moves.length >= 600
      ? {
          result: "1/2-1/2" as const,
          reason: "Practice game ended at the 600-ply storage limit.",
        }
      : null);
  return { ...session, moves, outcome, finishedAt: outcome ? at : null };
}
export function resignGame(session: GameSession, at: number): GameSession {
  if (session.outcome || at < session.startedAt) return session;
  return {
    ...session,
    finishedAt: at,
    outcome: {
      result: session.player === "w" ? "0-1" : "1-0",
      reason: "You resigned.",
    },
  };
}
export function gamePgn(session: GameSession): string {
  const game = replay(session.startingFen, session.moves);
  game.setHeader("Event", "Marcus local practice");
  game.setHeader("White", session.player === "w" ? "Learner" : "Stockfish");
  game.setHeader("Black", session.player === "b" ? "Learner" : "Stockfish");
  game.setHeader("Result", session.outcome?.result ?? "*");
  if (session.outcome) game.setHeader("Termination", session.outcome.reason);
  return game.pgn();
}
export const positionAt = (session: GameSession, ply: number) =>
  replay(
    session.startingFen,
    session.moves.slice(0, Math.max(0, Math.min(session.moves.length, ply))),
  );
