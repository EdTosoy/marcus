import { describe, expect, it } from "vitest";
import { foundationExercises as bank } from "../domain/curriculum/foundations";
import { pieceSafetyLesson } from "../domain/curriculum/piece-safety";
import { freshLearningData } from "../domain/adaptive/types";
import { learningTransition } from "../domain/adaptive/session";
import { learnerModel } from "../domain/adaptive/model";
import { acquisition, baseline, START } from "../domain/adaptive/test-fixtures";
import { freshProgress, decodeProgress } from "./local-progress";
import { transition } from "../domain/learning/session";
import {
  decodeLearningData,
  loadLearningData,
  exportLearningResults,
} from "./adaptive-progress";

describe("versioned adaptive persistence and conservative migration", () => {
  it("round trips new and resumed sessions including sealed feedback", () => {
    let data = learningTransition(
      freshLearningData(),
      { type: "start" },
      bank,
      START,
    );
    expect(decodeLearningData(JSON.stringify(data))).toEqual(data);
    data = learningTransition(
      data,
      { type: "submit", response: { type: "unsure" } },
      bank,
      START + 1,
    );
    expect(decodeLearningData(JSON.stringify(data))).toEqual(data);
  });
  it("retains hints and a reflection across guided retry reloads", () => {
    let data = learningTransition(
      baseline(),
      { type: "start" },
      bank,
      START + 100,
    );
    data = learningTransition(
      data,
      { type: "submit", response: { type: "unsure" } },
      bank,
      START + 101,
    );
    data = learningTransition(
      data,
      { type: "reflect", reflection: "unsure" },
      bank,
      START + 102,
    );
    data = learningTransition(data, { type: "hint" }, bank, START + 103);
    expect(decodeLearningData(JSON.stringify(data))).toEqual(data);
    data = learningTransition(data, { type: "retry" }, bank, START + 104);
    expect(decodeLearningData(JSON.stringify(data))).toEqual(data);
  });
  it("preserves original progress without manufacturing dated mastery evidence", () => {
    const legacy = freshProgress(pieceSafetyLesson);
    legacy.active = transition(pieceSafetyLesson, legacy.active, {
      type: "next",
    });
    legacy.active = transition(pieceSafetyLesson, legacy.active, {
      type: "submit",
      response: pieceSafetyLesson.exercises[0].review.validExamples[0]!,
    });
    const raw = JSON.stringify(legacy);
    const loaded = loadLearningData(null, raw);
    expect(loaded.data.legacy).toMatchObject({
      attempted: 1,
      completedRuns: 0,
      hasReliableTimestamps: false,
    });
    expect(
      learnerModel(loaded.data, bank, START).every(
        (item) => item.state === "insufficient-evidence",
      ),
    ).toBe(true);
    expect(decodeProgress(raw, pieceSafetyLesson)).toEqual(legacy);
    expect(loaded.notice).toContain("preserved");
    expect(decodeLearningData(JSON.stringify(loaded.data))).toEqual(
      loaded.data,
    );
  });
  it.each([null, "{bad", "null", "{}", '{"schemaVersion":99}'])(
    "safe fallback for %s",
    (raw) => {
      expect(decodeLearningData(raw)).toBeNull();
      expect(loadLearningData(raw, null).data).toEqual(freshLearningData());
    },
  );
  it("revalidates stored correctness, curriculum versions, reflection gates, and times", () => {
    const data = acquisition();
    expect(decodeLearningData(JSON.stringify(data))).toEqual(data);
    const changed = structuredClone(data);
    changed.runs[0]!.attempts[0]!.correct = false;
    expect(decodeLearningData(JSON.stringify(changed))).toBeNull();
    const wrongVersion = { ...data, curriculumVersion: 99 };
    expect(decodeLearningData(JSON.stringify(wrongVersion))).toBeNull();
    const beforeStart = structuredClone(data);
    beforeStart.runs[0]!.attempts[0]!.at = START - 1;
    expect(decodeLearningData(JSON.stringify(beforeStart))).toBeNull();
    const cheating = structuredClone(data);
    cheating.runs[0]!.hintsOpened = 1;
    expect(decodeLearningData(JSON.stringify(cheating))).toBeNull();
  });
  it("rejects repeated independent positions and unknown responses", () => {
    const data = acquisition();
    data.runs.push({
      ...structuredClone(data.runs[0]!),
      id: "duplicate",
      startedAt: START + 200,
      finishedAt: START + 201,
      attempts: [{ ...data.runs[0]!.attempts[0]!, at: START + 201 }],
    });
    expect(decodeLearningData(JSON.stringify(data))).toBeNull();
    const raw = JSON.stringify(acquisition()).replace(
      '"type":"square"',
      '"type":"unknown"',
    );
    expect(decodeLearningData(raw)).toBeNull();
  });
  it("exports anonymous, interpretable role/difficulty/first-attempt observations", () => {
    const data = acquisition();
    const exported = JSON.parse(exportLearningResults(data, START + 1000));
    expect(exported.format).toBe("marcus-local-learning-results");
    expect(exported.observations.at(-1)).toMatchObject({
      role: "transfer",
      skillId: "recognize-attacks",
      difficulty: 2,
      independent: true,
      firstAttemptCorrect: true,
      attemptCount: 1,
    });
    expect(exported).not.toHaveProperty("name");
    expect(exported).not.toHaveProperty("email");
  });
});
