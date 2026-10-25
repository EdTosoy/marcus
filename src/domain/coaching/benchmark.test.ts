import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import {
  assertPosition,
  assertLesson,
  immediateCaptures,
  validateResponse,
} from "../learning/validation";
import { assertFoundationBank } from "../adaptive/content";
import { foundationExercises } from "../curriculum/foundations";
import { pieceSafetyLesson } from "../curriculum/piece-safety";
import { coachingBenchmark } from "./benchmark";
import { capturesOf, judgeCandidate, judgePrediction } from "./facts";
import { evaluateRetry, inspectDecision } from "../review/decisions";
import { newGame, moveInGame, resignGame } from "../gameplay/session";

describe("curated coaching facts and cautious interpretations", () => {
  it("revalidates all existing curriculum examples and accepted alternatives", () => {
    assertLesson(pieceSafetyLesson);
    assertFoundationBank(foundationExercises);
  });
  for (const scenario of coachingBenchmark)
    it(scenario.id, () => {
      const game = assertPosition(scenario.fen);
      expect(judgeCandidate(scenario.fen, scenario.candidate)?.verdict).toBe(
        scenario.verdict,
      );
      for (const san of scenario.line ?? [])
        expect(() => game.move(san)).not.toThrow();
      if (scenario.attackers)
        expect(
          new Chess(scenario.fen).attackers(scenario.focus, "b").sort(),
        ).toEqual([...scenario.attackers].sort());
      if (scenario.defenders)
        expect(
          new Chess(scenario.fen).attackers(scenario.focus, "w").sort(),
        ).toEqual([...scenario.defenders].sort());
      for (const move of scenario.accepted ?? [])
        expect(judgeCandidate(scenario.fen, move)?.verdict).toBe("unattacked");
    });
  it("does not prescribe a bad retry for checkmate or a proven sacrifice", () => {
    for (const id of ["smothered-sacrifice", "mate-on-attacked-square"]) {
      const item = coachingBenchmark.find((s) => s.id === id)!;
      let session = newGame(id, "w", "gentle", 0, item.fen);
      session = moveInGame(session, item.candidate, "learner", 1);
      session = resignGame(session, 2);
      const decision = inspectDecision(session, 0)!;
      const retry = evaluateRetry(decision, item.candidate);
      expect(retry.explanation).not.toContain("Recheck the opponent");
      expect(decision.skillIds).toEqual([]);
    }
  });
  it("recognizes en passant captures and allows multiple valid reply predictions", () => {
    const item = coachingBenchmark.find((s) => s.id === "en-passant-threat")!;
    const game = new Chess(item.fen);
    game.move(item.candidate);
    expect(capturesOf(game, "e4")[0]?.san).toBe("dxe3");
    const template = foundationExercises.find(
      (exercise) => exercise.answer.type === "reply",
    )!;
    const exercise = {
      ...template,
      fen: item.fen,
      answer: { type: "reply" as const, candidate: item.candidate },
    };
    expect(
      immediateCaptures(exercise).some(
        (move) => move.from === "d4" && move.to === "e3",
      ),
    ).toBe(true);
    expect(
      validateResponse(exercise, { type: "square", square: "d4" }).kind,
    ).toBe("correct");
    expect(
      judgePrediction(item.fen, item.candidate, "capture")?.supported,
    ).toBe(true);
    expect(judgePrediction(item.fen, item.candidate, "other")?.supported).toBe(
      true,
    );
    expect(
      judgePrediction(item.fen, item.candidate, "unsure")?.supported,
    ).toBeNull();
  });
});
