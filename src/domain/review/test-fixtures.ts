import { moveInGame, newGame, resignGame } from "../gameplay/session";
import { START } from "../adaptive/test-fixtures";
import type { MoveInput } from "../chess/game";
export function reviewGame(id = "review-game") {
  let game = newGame(id, "w", "gentle", START);
  const moves: MoveInput[] = [
    { from: "e2", to: "e4" },
    { from: "e7", to: "e5" },
    { from: "d1", to: "h5" },
    { from: "b8", to: "c6" },
    { from: "h5", to: "e5" },
    { from: "c6", to: "e5" },
  ];
  moves.forEach((move, index) => {
    game = moveInGame(
      game,
      move,
      index % 2 === 0 ? "learner" : "engine",
      START + index,
    );
  });
  return resignGame(game, START + 10);
}
