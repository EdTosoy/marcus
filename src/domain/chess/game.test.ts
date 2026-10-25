import { describe, expect, it } from "vitest";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { gameStatus, isSquare, play, replay } from "./game";

describe("chess.js integration", () => {
  it("names the checked side after a learner gives check", () => {
    const result = play("r5k1/7p/1b6/8/3R4/8/7P/7K w - - 0 1", {
      from: "d4",
      to: "d8",
    });
    expect(result?.move.san).toBe("Rd8+");
    expect(gameStatus(result!.game)).toBe("Black to move, in check.");
    // The previous lesson UI incorrectly said “your king” at this point.
    expect(result?.game.turn()).toBe("b");
  });
  it("loads the starting position with 20 legal moves and White to move", () => {
    const game = replay(DEFAULT_POSITION);
    expect(game.moves()).toHaveLength(20);
    expect(game.turn()).toBe("w");
    expect(game.get("a1")).toEqual({ type: "r", color: "w" });
    expect(game.get("h8")).toEqual({ type: "r", color: "b" });
  });
  it("loads a FEN and preserves its side and counters", () => {
    const fen = "r5k1/5b1p/8/8/2R5/8/7P/6K1 b - - 12 22";
    expect(replay(fen).fen()).toBe(fen);
    expect(() => replay("broken FEN")).toThrow();
  });
  it("validates moves and produces standard algebraic notation", () => {
    expect(play(DEFAULT_POSITION, { from: "e2", to: "e5" })).toBeNull();
    const game = replay(DEFAULT_POSITION, [
      { from: "e2", to: "e4" },
      { from: "e7", to: "e5" },
      { from: "g1", to: "f3" },
    ]);
    expect(game.history()).toEqual(["e4", "e5", "Nf3"]);
    expect(game.undo()?.san).toBe("Nf3");
    expect(game.get("g1")?.type).toBe("n");
    game.reset();
    expect(game.fen()).toBe(DEFAULT_POSITION);
  });
  it.each(["g1", "c1"] as const)(
    "handles castling to %s and moves the rook",
    (to) => {
      const result = play("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", {
        from: "e1",
        to,
      });
      expect(result?.move.san).toBe(to === "g1" ? "O-O" : "O-O-O");
      expect(result?.game.get(to === "g1" ? "f1" : "d1")?.type).toBe("r");
    },
  );
  it("forbids castling through check", () => {
    expect(
      play("r3kr1r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", { from: "e1", to: "g1" }),
    ).toBeNull();
  });
  it("handles en passant including removing the captured pawn", () => {
    const result = play("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", {
      from: "e5",
      to: "d6",
    });
    expect(result?.move.san).toBe("exd6");
    expect(result?.game.get("d5")).toBeUndefined();
    expect(result?.game.get("d6")?.color).toBe("w");
  });
  it.each(["q", "r", "b", "n"] as const)(
    "supports explicit promotion to %s",
    (promotion) => {
      const result = play("7k/P7/8/8/8/8/8/7K w - - 0 1", {
        from: "a7",
        to: "a8",
        promotion,
      });
      expect(result?.game.get("a8")?.type).toBe(promotion);
      expect(result?.move.san).toContain(`=${promotion.toUpperCase()}`);
    },
  );
  it("requires a promotion choice", () => {
    expect(
      play("7k/P7/8/8/8/8/8/7K w - - 0 1", { from: "a7", to: "a8" }),
    ).toBeNull();
  });
  it("detects checkmate and has no legal continuation", () => {
    const game = new Chess();
    ["f3", "e5", "g4", "Qh4#"].forEach((move) => game.move(move));
    expect(game.isCheckmate()).toBe(true);
    expect(game.moves()).toEqual([]);
    expect(gameStatus(game)).toBe("Checkmate. Black wins.");
  });
  it("detects check, stalemate, insufficient material, and the fifty-move rule", () => {
    expect(
      gameStatus(new Chess("4r1k1/7p/8/8/8/8/7P/4K3 w - - 0 1")),
    ).toContain("in check");
    expect(gameStatus(new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"))).toContain(
      "Stalemate",
    );
    expect(gameStatus(new Chess("7k/8/8/8/8/8/8/K7 w - - 0 1"))).toContain(
      "insufficient material",
    );
    expect(
      gameStatus(new Chess("r5k1/8/8/8/8/8/8/R5K1 w - - 100 60")),
    ).toContain("fifty-move");
  });
  it("preserves repetition evidence by replaying full history", () => {
    const game = new Chess();
    ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"].forEach((move) =>
      game.move(move),
    );
    expect(gameStatus(game)).toContain("threefold repetition");
  });
  it("recognizes only real board squares", () => {
    expect(isSquare("a1")).toBe(true);
    expect(isSquare("i9")).toBe(false);
  });
});
