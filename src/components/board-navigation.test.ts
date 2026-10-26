import { describe, expect, it } from "vitest";
import { SQUARES } from "chess.js";
import { nextBoardSquare } from "./board-navigation";

describe("board exploration (independent of chess decisions)", () => {
  it("follows visual directions from White's perspective", () => {
    expect(nextBoardSquare("e4", "ArrowRight", "white")).toBe("f4");
    expect(nextBoardSquare("e4", "ArrowLeft", "white")).toBe("d4");
    expect(nextBoardSquare("e4", "ArrowUp", "white")).toBe("e5");
    expect(nextBoardSquare("e4", "ArrowDown", "white")).toBe("e3");
  });
  it("reverses both axes when Black is at the bottom", () => {
    expect(nextBoardSquare("e4", "ArrowRight", "black")).toBe("d4");
    expect(nextBoardSquare("e4", "ArrowLeft", "black")).toBe("f4");
    expect(nextBoardSquare("e4", "ArrowUp", "black")).toBe("e3");
    expect(nextBoardSquare("e4", "ArrowDown", "black")).toBe("e5");
  });
  it("stops at an edge rather than wrapping into another row", () => {
    expect(nextBoardSquare("a1", "ArrowLeft", "white")).toBe("a1");
    expect(nextBoardSquare("h8", "ArrowUp", "white")).toBe("h8");
    expect(nextBoardSquare("h8", "ArrowLeft", "black")).toBe("h8");
    expect(nextBoardSquare("a1", "ArrowUp", "black")).toBe("a1");
  });
  it("reaches visible row edges with Home and End", () => {
    expect(nextBoardSquare("d4", "Home", "white")).toBe("a4");
    expect(nextBoardSquare("d4", "End", "white")).toBe("h4");
    expect(nextBoardSquare("d4", "Home", "black")).toBe("h4");
    expect(nextBoardSquare("d4", "End", "black")).toBe("a4");
  });
  it("reaches board corners without 64 Tab stops", () => {
    expect(nextBoardSquare("d4", "Home", "white", true)).toBe("a8");
    expect(nextBoardSquare("d4", "End", "white", true)).toBe("h1");
    expect(nextBoardSquare("d4", "Home", "black", true)).toBe("h1");
    expect(nextBoardSquare("d4", "End", "black", true)).toBe("a8");
  });
  it("leaves activation, cancellation and Tab to their interaction handlers", () => {
    for (const key of ["Enter", " ", "Escape", "Tab", "a"])
      expect(nextBoardSquare("a1", key, "white")).toBeNull();
  });
  it("never generates an invalid square in either orientation", () => {
    for (const orientation of ["white", "black"] as const)
      for (const square of SQUARES)
        for (const key of [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
        ])
          expect(SQUARES).toContain(nextBoardSquare(square, key, orientation));
  });
});
