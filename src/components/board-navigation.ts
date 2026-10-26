import { isSquare } from "../domain/chess/game";
import type { Square } from "chess.js";

// Exploration follows the displayed board, independently of move legality.
export function nextBoardSquare(
  square: Square,
  key: string,
  orientation: "white" | "black",
  wholeBoard = false,
): Square | null {
  const direction = orientation === "white" ? 1 : -1;
  const firstFile = direction === 1 ? "a" : "h";
  const lastFile = direction === 1 ? "h" : "a";
  if (key === "Home")
    return `${firstFile}${wholeBoard ? (direction === 1 ? 8 : 1) : square[1]}` as Square;
  if (key === "End")
    return `${lastFile}${wholeBoard ? (direction === 1 ? 1 : 8) : square[1]}` as Square;
  const delta: Record<string, [number, number]> = {
    ArrowRight: [direction, 0],
    ArrowLeft: [-direction, 0],
    ArrowUp: [0, direction],
    ArrowDown: [0, -direction],
  };
  const change = delta[key];
  if (!change) return null;
  const file = Math.max(97, Math.min(104, square.charCodeAt(0) + change[0]));
  const rank = Math.max(1, Math.min(8, Number(square[1]) + change[1]));
  const next = `${String.fromCharCode(file)}${rank}`;
  return isSquare(next) ? next : null;
}
