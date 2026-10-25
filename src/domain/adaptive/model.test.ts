import { describe, expect, it } from "vitest";
import { foundationExercises as bank } from "../curriculum/foundations";
import { freshLearningData } from "./types";
import {
  DAY,
  learnerModel,
  evidenceFor,
  defaultModelConfig as config,
  assertModelConfig,
  prerequisitesReady,
} from "./model";
import { recommend } from "./recommend";
import {
  acquisition,
  answerNext,
  baseline,
  finishedRun,
  START,
  withRuns,
} from "./test-fixtures";

const attacks = (data = freshLearningData(), now = START + 1000) =>
  learnerModel(data, bank, now)[0]!;
describe("explainable evidence states", () => {
  it("begins with insufficient evidence, not a numeric ability score", () => {
    expect(
      learnerModel(freshLearningData(), bank, START).every(
        (item) => item.state === "insufficient-evidence",
      ),
    ).toBe(true);
    expect(attacks()).not.toHaveProperty("score");
  });
  it("marks an uncertain or incorrect baseline as a practice need without claiming a diagnosis", () => {
    expect(attacks(baseline(false))).toMatchObject({
      state: "needs-practice",
      firstCorrect: 0,
      transferSuccesses: 0,
    });
  });
  it("guided completion, including assistance, develops the skill without demonstrating it", () => {
    const data = withRuns(
      finishedRun("attack-pawn", START, true, 1),
      finishedRun("attack-black", START + 10, true, 2),
    );
    expect(attacks(data)).toMatchObject({
      state: "developing",
      guidedSolved: 2,
      assistedSuccesses: 2,
      hintsUsed: 3,
      independentSuccesses: 0,
    });
  });
  it("requires varied transfer and elapsed, scheduled delayed evidence", () => {
    const data = acquisition();
    expect(attacks(data).state).toBe("developing");
    expect(attacks(data, START + DAY + 121).state).toBe("review-due");
    data.runs.push(finishedRun("attack-review-black", START + DAY + 122));
    expect(attacks(data, START + DAY + 130)).toMatchObject({
      state: "demonstrated",
      transferSuccesses: 2,
      delayedSuccesses: 1,
      difficultyCoverage: [1, 2],
    });
    expect(attacks(data, START + 4 * DAY + 123).state).toBe("review-due");
  });
  it("never credits an early delayed attempt, repeated transfer, or future outcome as fresh mastery", () => {
    const data = acquisition();
    data.runs.push(
      finishedRun("attack-review-black", START + 140),
      finishedRun("attack-transfer-lines", START + 150),
    );
    expect(attacks(data)).toMatchObject({
      state: "developing",
      delayedSuccesses: 0,
      transferSuccesses: 2,
    });
    expect(evidenceFor(data, bank).at(-1)?.fresh).toBe(false);
    expect(attacks(data, START).transferSuccesses).toBe(0);
  });
  it("repeated or assisted practice cannot erase a failed fresh transfer", () => {
    const data = acquisition();
    data.runs[8] = finishedRun("attack-transfer-file", START + 130, false);
    data.runs.push(finishedRun("attack-pawn", START + 140, true));
    expect(attacks(data)).toMatchObject({
      state: "needs-practice",
      transferSuccesses: 1,
    });
  });
  it("counts first versus eventual success and recency separately", () => {
    const run = finishedRun("attack-pawn", START, true, 1);
    const exercise = bank.find((item) => item.id === run.exerciseId)!;
    run.attempts.unshift({
      response: exercise.review.invalidExamples[0]!,
      correct: false,
      hintsUsed: 0,
      at: START,
      reflection: "unsure",
    });
    expect(attacks(withRuns(run))).toMatchObject({
      firstCorrect: 0,
      guidedSolved: 1,
      assistedSuccesses: 1,
      attempts: 2,
      lastPracticedAt: START + 1,
    });
  });
  it("supports documented configurable thresholds and rejects nonsensical configuration", () => {
    expect(() =>
      assertModelConfig({ ...config, reviewIntervalsMs: [0] }),
    ).toThrow();
    expect(() =>
      assertModelConfig({ ...config, transferSuccesses: 0 }),
    ).toThrow();
    const data = acquisition();
    data.runs.push(finishedRun("attack-review-black", START + DAY + 122));
    expect(
      learnerModel(data, bank, START + DAY + 130, {
        ...config,
        transferSuccesses: 3,
      })[0]?.state,
    ).toBe("developing");
  });
});
describe("spaced review", () => {
  it("anchors review to the first transfer success and does not postpone it for more practice", () => {
    const data = acquisition();
    const due = attacks(data).dueAt;
    data.runs.push(finishedRun("attack-pawn", START + 1000));
    expect(attacks(data, START + 1100).dueAt).toBe(due);
    expect(due).toBe(START + 121 + DAY);
  });
  it("schedules intervals after actual reviews and shortens after a failure", () => {
    const data = acquisition();
    const review = START + DAY + 130;
    data.runs.push(finishedRun("attack-review-black", review));
    expect(attacks(data, review + 2).dueAt).toBe(review + 1 + 3 * DAY);
    data.runs.push(
      finishedRun("attack-review-distance", review + 1 + 3 * DAY, false),
    );
    expect(attacks(data, review + 3 * DAY + 10)).toMatchObject({
      state: "needs-practice",
      delayedSuccesses: 1,
      dueAt: review + 2 + 4 * DAY,
    });
  });
});
describe("deterministic, prerequisite-aware recommendations", () => {
  it("starts with a five-skill diagnostic before instruction", () => {
    let data = freshLearningData();
    for (let i = 0; i < 5; i++) {
      const next = recommend(data, bank, START + 100 * i);
      expect(next.exercise?.role).toBe("diagnostic");
      expect(next.exercise?.skillId).toBe(
        [
          "recognize-attacks",
          "attack-defense",
          "hanging-pieces",
          "destination-safety",
          "opponent-threats",
        ][i],
      );
      data = answerNext(data, START + 100 * i);
    }
    expect(recommend(data, bank, START + 1000).exercise?.id).toBe(
      "attack-pawn",
    );
  });
  it("prioritizes an eligible overdue review and explains why", () => {
    const data = acquisition();
    const next = recommend(data, bank, START + DAY + 130);
    expect(next.exercise?.role).toBe("delayed");
    expect(next.reason).toContain("retention check");
    expect(recommend(data, bank, START + DAY + 130)).toEqual(next);
  });
  it("respects prerequisites for instruction and reviews", () => {
    const model = learnerModel(baseline(), bank, START + 1000);
    expect(prerequisitesReady("recognize-attacks", model)).toBe(true);
    expect(prerequisitesReady("opponent-threats", model)).toBe(false);
    const data = acquisition();
    data.runs.push(finishedRun("attack-transfer-file", START + 140, false));
    expect(
      prerequisitesReady(
        "attack-defense",
        learnerModel(data, bank, START + 1000),
      ),
    ).toBe(true); // duplicate exposure is not a new check
    expect(
      prerequisitesReady(
        "attack-defense",
        learnerModel(baseline(false), bank, START + 1000),
      ),
    ).toBe(false);
  });
  it("offers level one before level two, never exposes reviews early, and does not repeat assessments", () => {
    let data = baseline(false);
    let at = START + 1000;
    const seen = new Set<string>();
    for (let i = 0; i < 35; i++) {
      const next = recommend(data, bank, at);
      if (!next.exercise) break;
      expect(next.exercise.role).not.toBe("delayed");
      if (next.exercise.role !== "guided") {
        expect(seen.has(next.exercise.id)).toBe(false);
        seen.add(next.exercise.id);
      }
      if (i === 0) expect(next.exercise.difficulty).toBe(1);
      data = answerNext(data, at);
      at += 100;
    }
    expect(seen.size).toBe(10); // two fresh transfers per skill
  });
  it("does not reuse exhausted independent positions as disguised practice", () => {
    const data = acquisition();
    data.runs.push(
      finishedRun("attack-review-black", START + DAY + 130),
      finishedRun("attack-review-distance", START + 4 * DAY + 140),
    );
    const next = recommend(data, bank, START + 12 * DAY);
    expect(next.exercise?.id).not.toBe("attack-review-black");
    expect(next.exercise?.id).not.toBe("attack-review-distance");
    expect(next.nextReviewAt).not.toBeNull();
  });
});
