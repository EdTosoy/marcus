import { describe, expect, it } from "vitest";
import { Chess, SQUARES, type Square } from "chess.js";
import { foundationExercises as bank } from "../curriculum/foundations";
import { pieceSafetyLesson } from "../curriculum/piece-safety";
import {
  acceptableResponses,
  assertLesson,
  validateResponse,
  pieceFacts,
  immediateCaptures,
} from "../learning/validation";
import { opposite } from "../chess/game";
import { assertFoundationBank, positionFingerprint } from "./content";
import { skills, assertSkills } from "./skills";

describe("independent content audit and role separation", () => {
  it("validates every new FEN, authored answer, attacker, defender and opponent reply", () => {
    expect(bank).toHaveLength(35);
    assertFoundationBank(bank);
  });
  it("rechecks the original lesson and keeps it outside all reserved pools", () => {
    assertLesson(pieceSafetyLesson);
    const old = new Set(
      pieceSafetyLesson.exercises.map((exercise) =>
        positionFingerprint(exercise.fen),
      ),
    );
    bank.forEach((exercise) =>
      expect(old.has(positionFingerprint(exercise.fen))).toBe(false),
    );
  });
  it("rejects role reuse and counter-only FEN changes", () => {
    expect(() =>
      assertFoundationBank([
        ...bank,
        {
          ...bank[0]!,
          id: "leak",
          role: "guided",
          fen: bank[0]!.fen.replace("0 1", "2 7"),
        },
      ]),
    ).toThrow(/leakage/);
  });
  it("recognizes a reflected/color-reversed board as the same exposure", () => {
    const original = bank[0]!;
    const game = new Chess(original.fen);
    const mirror = new Chess();
    mirror.clear();
    for (const square of SQUARES) {
      const piece = game.get(square);
      if (!piece) continue;
      const destination =
        `${String.fromCharCode(201 - square.charCodeAt(0))}${9 - Number(square[1])}` as Square;
      mirror.put(
        { type: piece.type, color: opposite(piece.color) },
        destination,
      );
    }
    const fields = mirror.fen().split(" ");
    fields[1] = opposite(game.turn());
    expect(positionFingerprint(fields.join(" "))).toBe(
      positionFingerprint(original.fen),
    );
  });
  it("has varied position/color/difficulty coverage and method hints without square answers", () => {
    for (const skill of skills) {
      const exercises = bank.filter(
        (exercise) => exercise.skillId === skill.id,
      );
      expect(exercises).toHaveLength(7);
      expect(
        new Set(exercises.map((exercise) => new Chess(exercise.fen).turn()))
          .size,
      ).toBe(2);
      expect(
        new Set(exercises.map((exercise) => exercise.difficulty)).size,
      ).toBe(2);
      exercises.forEach((exercise) =>
        exercise.hints.forEach((hint) =>
          expect(hint).not.toMatch(/\b[a-h][1-8]\b/),
        ),
      );
    }
  });
  for (const exercise of bank)
    it(`${exercise.id}: accepts all answers allowed by chess.js and the actual goal`, () => {
      const game = new Chess(exercise.fen);
      const accepted = acceptableResponses(exercise);
      expect(accepted.length).toBeGreaterThan(0);
      if (exercise.answer.type === "safe-move") {
        for (const move of game.moves({ verbose: true })) {
          const after = new Chess(exercise.fen);
          after.move(move);
          expect(
            validateResponse(exercise, {
              type: "move",
              move: { from: move.from, to: move.to },
            }).kind === "correct",
          ).toBe(
            move.from === exercise.answer.from &&
              !after.isAttacked(move.to, opposite(game.turn())),
          );
        }
      } else if (
        exercise.answer.type === "attacker" ||
        exercise.answer.type === "reply"
      ) {
        const sources =
          exercise.answer.type === "attacker"
            ? game.attackers(exercise.answer.target, opposite(game.turn()))
            : immediateCaptures(exercise).map((move) => move.from);
        for (const square of SQUARES)
          expect(
            validateResponse(exercise, { type: "square", square }).kind ===
              "correct",
          ).toBe(sources.includes(square));
      } else if (exercise.answer.type === "status") {
        const facts = pieceFacts(exercise.fen, exercise.answer.target);
        expect(facts.attackers.sort()).toEqual(
          [...exercise.review.attackers].sort(),
        );
        expect(facts.defenders.sort()).toEqual(
          [...(exercise.review.defenders ?? [])].sort(),
        );
        expect(accepted).toEqual([
          { type: "choice", choice: exercise.review.status },
        ]);
      }
    });
});

describe("skill graph", () => {
  it("uses stable unique IDs and acyclic explicit prerequisites", () =>
    expect(() => assertSkills()).not.toThrow());
  it("rejects cycles, duplicate IDs and missing prerequisites", () => {
    expect(() =>
      assertSkills([{ ...skills[0]!, prerequisites: ["recognize-attacks"] }]),
    ).toThrow(/Cyclic/);
    expect(() => assertSkills([skills[0]!, skills[0]!])).toThrow(/Duplicate/);
    expect(() => assertSkills([skills[1]!])).toThrow(/Missing/);
  });
});
