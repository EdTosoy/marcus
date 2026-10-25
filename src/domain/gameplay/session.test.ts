import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import {
  gamePgn,
  moveInGame,
  newGame,
  resignGame,
  positionAt,
} from "./session";
import { replay, type MoveInput } from "../chess/game";
const at = 1_000;
describe("complete game sessions", () => {
  it("starts as either color, enforces actor/legality and seals resignations", () => {
    for (const color of ["w", "b"] as const) {
      let game = newGame("game", color, "gentle", at);
      const actor = color === "w" ? "learner" : "engine";
      expect(moveInGame(game, { from: "e2", to: "e5" }, actor, at + 1)).toBe(
        game,
      );
      expect(
        moveInGame(
          game,
          { from: "e2", to: "e4" },
          actor === "engine" ? "learner" : "engine",
          at + 1,
        ),
      ).toBe(game);
      game = moveInGame(game, { from: "e2", to: "e4" }, actor, at + 1);
      expect(game.moves).toHaveLength(1);
      game = resignGame(game, at + 2);
      expect(game.outcome?.result).toBe(color === "w" ? "0-1" : "1-0");
      expect(moveInGame(game, { from: "e7", to: "e5" }, "engine", at + 3)).toBe(
        game,
      );
      expect(resignGame(game, at + 4)).toBe(game);
      const exported = new Chess();
      exported.loadPgn(gamePgn(game));
      expect(exported.history()).toEqual(["e4"]);
      expect(exported.getHeaders().Result).toBe(game.outcome?.result);
    }
  });
  it("finishes a complete checkmate game and reconstructs every position", () => {
    let game = newGame("mate", "w", "gentle", at);
    const moves: MoveInput[] = [
      { from: "f2", to: "f3" },
      { from: "e7", to: "e5" },
      { from: "g2", to: "g4" },
      { from: "d8", to: "h4" },
    ];
    moves.forEach((move, i) => {
      game = moveInGame(game, move, i % 2 === 0 ? "learner" : "engine", at + i);
    });
    expect(game.outcome).toMatchObject({
      result: "0-1",
      reason: "Checkmate. Black wins.",
    });
    for (let i = 0; i <= moves.length; i++)
      expect(positionAt(game, i).fen()).toBe(
        replay(game.startingFen, moves.slice(0, i)).fen(),
      );
    expect(gamePgn(game)).toContain("Qh4#");
  });
  it("retains castling, en passant and all explicit promotion choices", () => {
    const castle = newGame(
      "castle",
      "w",
      "steady",
      at,
      "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
    );
    expect(
      positionAt(
        moveInGame(castle, { from: "e1", to: "g1" }, "learner", at + 1),
        1,
      ).get("f1")?.type,
    ).toBe("r");
    const ep = newGame(
      "ep",
      "w",
      "steady",
      at,
      "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
    );
    expect(
      positionAt(
        moveInGame(ep, { from: "e5", to: "d6" }, "learner", at + 1),
        1,
      ).get("d5"),
    ).toBeUndefined();
    for (const promotion of ["q", "r", "b", "n"] as const) {
      const game = newGame(
        "promote",
        "w",
        "gentle",
        at,
        "7k/P7/8/8/8/8/8/7K w - - 0 1",
      );
      expect(
        positionAt(
          moveInGame(
            game,
            { from: "a7", to: "a8", promotion },
            "learner",
            at + 1,
          ),
          1,
        ).get("a8")?.type,
      ).toBe(promotion);
    }
  });
  it("records terminal draws and repetition from full history", () => {
    expect(
      newGame("stale", "b", "gentle", at, "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1")
        .outcome?.reason,
    ).toContain("Stalemate");
    expect(
      newGame("bare", "w", "gentle", at, "7k/8/8/8/8/8/8/K7 w - - 0 1").outcome
        ?.reason,
    ).toContain("insufficient");
    let game = newGame("repeat", "w", "gentle", at);
    const cycle: MoveInput[] = [
      { from: "g1", to: "f3" },
      { from: "g8", to: "f6" },
      { from: "f3", to: "g1" },
      { from: "f6", to: "g8" },
    ];
    for (let i = 0; i < 8; i++)
      game = moveInGame(
        game,
        cycle[i % 4]!,
        i % 2 === 0 ? "learner" : "engine",
        at + i,
      );
    expect(game.outcome?.reason).toContain("threefold");
  });
});
