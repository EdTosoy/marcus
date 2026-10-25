import { describe, expect, it } from "vitest";
import { selectDecisions, inspectDecision, evaluateRetry } from "./decisions";
import {
  gameplayEvidence,
  newReview,
  reviewTransition,
  targetedPractice,
} from "./session";
import { learnerModel } from "../adaptive/model";
import { learningTransition } from "../adaptive/session";
import { freshLearningData } from "../adaptive/types";
import { baseline, acquisition, START } from "../adaptive/test-fixtures";
import { foundationExercises as bank } from "../curriculum/foundations";

import { reviewGame } from "./test-fixtures";
describe("selective review and honest explanations", () => {
  it("selects at most three learner decisions and reconstructs the original position", () => {
    const game = reviewGame(),
      decisions = selectDecisions(game);
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.length).toBeLessThanOrEqual(3);
    const decision = decisions.find((item) => item.ply === 4)!;
    expect(decision).toMatchObject({
      kind: "capture-opportunity",
      san: "Qxe5+",
      attackers: ["c6"],
    });
    expect(decision.explanation).toContain("does not prove");
    expect(inspectDecision(game, 1)).toBeNull();
    expect(
      selectDecisions({ ...game, outcome: null, finishedAt: null }),
    ).toEqual([]);
  });
  it("accepts multiple alternatives for the stated rule rather than an engine best move", () => {
    const decision = inspectDecision(reviewGame(), 4)!;
    expect(evaluateRetry(decision, { from: "h5", to: "h3" }).meetsGoal).toBe(
      true,
    );
    expect(evaluateRetry(decision, { from: "b1", to: "c3" }).meetsGoal).toBe(
      true,
    );
    expect(evaluateRetry(decision, decision.played).meetsGoal).toBe(false);
    expect(evaluateRetry(decision, { from: "h5", to: "h8" }).legal).toBe(false);
  });
  it("keeps uneventful moves as unclassified opportunities rather than invented weakness", () => {
    const game = reviewGame();
    const decision = inspectDecision(game, 0)!;
    expect(decision.kind).toBe("analysis-opportunity");
    expect(decision.skillIds).toEqual([]);
    expect(
      targetedPractice(decision, freshLearningData(), bank, START).exercise,
    ).toBeNull();
    expect(gameplayEvidence(decision, newReview(decision.id))).toMatchObject({
      intention: "unknown",
      masteryCredit: false,
      certainty: "unclassified-opportunity",
    });
  });
});
describe("recovery evidence and guided practice bridge", () => {
  const decision = inspectDecision(reviewGame(), 4)!;
  it("requires reflection and an attempt before reveal, retaining assistance and repeated errors", () => {
    let record = newReview(decision.id);
    expect(reviewTransition(record, decision, { type: "reveal" }, START)).toBe(
      record,
    );
    expect(
      reviewTransition(
        record,
        decision,
        { type: "try", move: decision.played },
        START,
      ),
    ).toBe(record);
    record = reviewTransition(
      record,
      decision,
      { type: "notice", observation: "threats" },
      START,
    );
    record = reviewTransition(
      record,
      decision,
      { type: "try", move: decision.played },
      START + 1,
    );
    record = reviewTransition(
      record,
      decision,
      { type: "try", move: { from: "h5", to: "h3" } },
      START + 2,
    );
    record = reviewTransition(record, decision, { type: "hint" }, START + 3);
    record = reviewTransition(record, decision, { type: "reveal" }, START + 4);
    record = reviewTransition(
      record,
      decision,
      { type: "try", move: { from: "b1", to: "c3" } },
      START + 5,
    );
    expect(gameplayEvidence(decision, record)).toMatchObject({
      source: "gameplay-review",
      independentRetries: 1,
      assistedRetries: 1,
      repeatedErrors: 1,
      reviewed: true,
      masteryCredit: false,
    });
    expect(record.attempts[0]).toMatchObject({
      hints: 0,
      revealed: false,
      meetsGoal: false,
    });
  });
  it("recommends existing guided content with prerequisites while leaving assessment evidence untouched", () => {
    const learning = acquisition(),
      before = learnerModel(learning, bank, START + 1000);
    const recommendation = targetedPractice(
      decision,
      learning,
      bank,
      START + 1000,
    );
    expect(recommendation.exercise?.role).toBe("guided");
    expect(recommendation.exercise?.skillId).toBe("destination-safety");
    expect(learnerModel(learning, bank, START + 1000)).toEqual(before);
    expect(
      targetedPractice(decision, freshLearningData(), bank, START).exercise
        ?.skillId,
    ).toBe("recognize-attacks");
  });
  it("only launches guided practice after baseline and prerequisites, never a reserved assessment or active-run skip", () => {
    const data = baseline();
    const root = bank.find(
      (item) => item.role === "guided" && item.skillId === "recognize-attacks",
    )!;
    const event = { type: "start-guided" as const, exerciseId: root.id };
    expect(learningTransition(freshLearningData(), event, bank, START)).toEqual(
      freshLearningData(),
    );
    const started = learningTransition(data, event, bank, START + 1000);
    expect(started.runs.at(-1)?.exerciseId).toBe(root.id);
    expect(learningTransition(started, event, bank, START + 1001)).toBe(
      started,
    );
    expect(
      learningTransition(
        data,
        { type: "start-guided", exerciseId: "attack-diagnostic" },
        bank,
        START + 1000,
      ),
    ).toBe(data);
    const gated = bank.find(
      (item) => item.role === "guided" && item.skillId === "opponent-threats",
    )!;
    expect(
      learningTransition(
        data,
        { type: "start-guided", exerciseId: gated.id },
        bank,
        START + 1000,
      ),
    ).toBe(data);
  });
});

describe("Phase 2B recovery evidence", () => {
  it("retains prediction provenance and distinguishes first from repeated success", () => {
    const decision = inspectDecision(reviewGame(), 4)!;
    let record = newReview(decision.id);
    record = reviewTransition(
      record,
      decision,
      { type: "notice", observation: "threats" },
      START,
    );
    record = reviewTransition(
      record,
      decision,
      { type: "try", move: decision.played, prediction: "capture" },
      START + 1,
    );
    record = reviewTransition(
      record,
      decision,
      { type: "try", move: { from: "h5", to: "h3" } },
      START + 2,
    );
    expect(record.attempts[0]).toMatchObject({
      prediction: "capture",
      coachingVersion: 2,
    });
    expect(record.attempts[1]!.prediction).toBeNull();
    expect(gameplayEvidence(decision, record)).toMatchObject({
      firstUnassistedSuccess: false,
      laterSuccesses: 1,
      familiarPosition: true,
      masteryCredit: false,
      predictionCount: 1,
    });
    expect(
      reviewTransition(
        record,
        decision,
        { type: "try", move: decision.played },
        START - 1,
      ),
    ).toBe(record);
  });
});
