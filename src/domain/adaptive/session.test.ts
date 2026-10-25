import { describe, expect, it } from "vitest";
import { foundationExercises as bank } from "../curriculum/foundations";
import { freshLearningData } from "./types";
import { learnerFeedback, learningTransition as transition } from "./session";
import { analyzeMistake, mistakeTypes } from "./mistakes";
import { baseline, START } from "./test-fixtures";

describe("role policies and learning session", () => {
  it("seals independent feedback, hints, retry and duplicate submissions", () => {
    let data = transition(freshLearningData(), { type: "start" }, bank, START);
    expect(transition(data, { type: "hint" }, bank, START + 1)).toBe(data);
    data = transition(
      data,
      { type: "submit", response: { type: "unsure" } },
      bank,
      START + 2,
    );
    expect(learnerFeedback(data, bank)).toEqual({
      kind: "sealed",
      message:
        "Answer recorded. No hints, retries, or solution are shown for this independent check.",
    });
    expect(transition(data, { type: "retry" }, bank, START + 3)).toBe(data);
    expect(transition(data, { type: "hint" }, bank, START + 3)).toBe(data);
    expect(
      transition(
        data,
        { type: "submit", response: bank[0]!.review.validExamples[0]! },
        bank,
        START + 3,
      ),
    ).toBe(data);
    expect(
      transition(data, { type: "next" }, bank, START + 3).activeRunId,
    ).toBeNull();
  });
  it("requires a reflection before retry and retains hints/mistakes after eventual success", () => {
    let data = transition(baseline(), { type: "start" }, bank, START + 1000);
    const exercise = bank.find(
      (item) => item.id === data.runs.at(-1)?.exerciseId,
    )!;
    data = transition(
      data,
      { type: "submit", response: exercise.review.invalidExamples[0]! },
      bank,
      START + 1001,
    );
    expect(transition(data, { type: "retry" }, bank, START + 1002)).toBe(data);
    expect(transition(data, { type: "next" }, bank, START + 1002)).toBe(data);
    data = transition(data, { type: "hint" }, bank, START + 1002);
    data = transition(
      data,
      { type: "reflect", reflection: "unsure" },
      bank,
      START + 1003,
    );
    data = transition(data, { type: "retry" }, bank, START + 1004);
    data = transition(
      data,
      { type: "submit", response: exercise.review.validExamples[0]! },
      bank,
      START + 1005,
    );
    expect(data.runs.at(-1)).toMatchObject({
      hintsOpened: 1,
      finishedAt: START + 1005,
      attempts: [
        { correct: false, hintsUsed: 0, reflection: "unsure" },
        { correct: true, hintsUsed: 1 },
      ],
    });
    expect(learnerFeedback(data, bank)?.kind).toBe("correct");
  });
  it("caps guidance and blocks invalid input, clock rollback and skipping unfinished work", () => {
    let data = transition(baseline(), { type: "start" }, bank, START + 1000);
    const same = transition(
      data,
      { type: "submit", response: { type: "choice", choice: "not-an-option" } },
      bank,
      START + 1001,
    );
    expect(same).toBe(data);
    expect(transition(data, { type: "next" }, bank, START + 1001)).toBe(data);
    expect(transition(data, { type: "start" }, bank, START + 1001)).toBe(data);
    expect(transition(data, { type: "hint" }, bank, START - 1)).toBe(data);
    for (let i = 0; i < 5; i++)
      data = transition(data, { type: "hint" }, bank, START + 1001 + i);
    expect(data.runs.at(-1)?.hintsOpened).toBe(2);
  });
});
describe("bounded mistake observations", () => {
  it("covers the taxonomy without pretending to diagnose every category", () =>
    expect(mistakeTypes).toHaveLength(7));
  it("observes a missing defender without inferring thought", () => {
    const exercise = bank.find((item) => item.id === "defense-diagnostic")!;
    const result = analyzeMistake(exercise, {
      type: "choice",
      choice: "attacked-undefended",
    });
    expect(result).toMatchObject({
      observed: "missed-defender",
      certainty: "task-evidence",
      skillId: "attack-defense",
      reportedReason: null,
    });
    expect(result?.explanation).toContain(
      "not the student’s complete thought process",
    );
  });
  it("records unsafe destinations as a task mismatch, not a universal blunder", () => {
    const exercise = bank.find((item) => item.id === "safety-diagnostic")!;
    expect(
      analyzeMistake(exercise, exercise.review.invalidExamples[0]!),
    ).toMatchObject({
      observed: "unsafe-destination",
      certainty: "task-evidence",
    });
    expect(
      analyzeMistake(exercise, exercise.review.invalidExamples[0]!)
        ?.explanation,
    ).toContain("does not prove");
  });
  it("keeps uncertainty and self-reports explicit", () => {
    const exercise = bank.find((item) => item.id === "reply-diagnostic")!;
    expect(
      analyzeMistake(
        exercise,
        exercise.review.invalidExamples[0]!,
        "opponent-reply",
      ),
    ).toMatchObject({
      observed: "missed-opponent-response",
      certainty: "ambiguous",
      reportedReason: "opponent-reply",
    });
    expect(analyzeMistake(exercise, { type: "unsure" })).toMatchObject({
      observed: "unknown",
      certainty: "ambiguous",
    });
    expect(
      analyzeMistake(exercise, exercise.review.validExamples[0]!),
    ).toBeNull();
  });
});
