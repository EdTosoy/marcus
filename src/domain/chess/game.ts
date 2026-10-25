import { Chess, SQUARES, type Color, type Square } from "chess.js";

export type Promotion = "q" | "r" | "b" | "n";
export type MoveInput = { from: Square; to: Square; promotion?: Promotion };
export const pieceNames = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
} as const;
export const isSquare = (value: string): value is Square =>
  SQUARES.includes(value as Square);
export const opposite = (color: Color): Color => (color === "w" ? "b" : "w");

export function replay(fen: string, moves: readonly MoveInput[] = []): Chess {
  const game = new Chess(fen);
  for (const move of moves) game.move(move);
  return game;
}

export function play(fen: string, move: MoveInput) {
  const game = new Chess(fen);
  try {
    const result = game.move(move);
    return { game, move: result };
  } catch {
    return null;
  }
}

export function gameStatus(game: Chess): string {
  if (game.isCheckmate())
    return `Checkmate. ${game.turn() === "w" ? "Black" : "White"} wins.`;
  if (game.isStalemate()) return "Stalemate. The game is drawn.";
  if (game.isThreefoldRepetition()) return "Draw by threefold repetition.";
  if (game.isInsufficientMaterial()) return "Draw by insufficient material.";
  if (game.isDrawByFiftyMoves()) return "Draw by the fifty-move rule.";
  return `${game.turn() === "w" ? "White" : "Black"} to move${game.inCheck() ? ", in check" : ""}.`;
}
