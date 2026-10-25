import { describe, expect, it } from "vitest";
import { pieceSafetyLesson as lesson } from "../domain/curriculum/piece-safety";
import { transition } from "../domain/learning/session";
import { decodeProgress, freshProgress, practiceAgain } from "./local-progress";

describe("versioned local progress", () => {
  it("round trips attempts, hints, cursor, and active feedback", () => {
    const data = freshProgress(lesson);
    data.active = transition(lesson, data.active, { type: "next" });
    data.active = transition(lesson, data.active, { type: "hint" });
    data.active = transition(lesson, data.active, {
      type: "submit",
      response: lesson.exercises[0].review.validExamples[0]!,
    });
    expect(decodeProgress(JSON.stringify(data), lesson)).toEqual(data);
  });
  it.each([
    null,
    "{",
    "null",
    "[]",
    '{"version":99}',
    '{"version":1,"active":null,"previous":[]}',
  ])("rejects corrupt or unsupported data: %s", (raw) =>
    expect(decodeProgress(raw, lesson)).toBeNull(),
  );
  it("rejects unsupported content versions and skipped exercises", () => {
    const data = freshProgress(lesson);
    data.active.lessonVersion = 99;
    expect(decodeProgress(JSON.stringify(data), lesson)).toBeNull();
    data.active.lessonVersion = 1;
    data.active.index = 4;
    expect(decodeProgress(JSON.stringify(data), lesson)).toBeNull();
    data.active.index = 0;
    data.active.completed = true;
    expect(decodeProgress(JSON.stringify(data), lesson)).toBeNull();
  });
  it("does not trust stored correctness flags", () => {
    const data = freshProgress(lesson);
    data.active = transition(lesson, data.active, { type: "next" });
    data.active = transition(lesson, data.active, {
      type: "submit",
      response: { type: "square", square: "d4" },
    });
    data.active.records["spot-the-rook"]!.attempts[0]!.correct = true;
    expect(decodeProgress(JSON.stringify(data), lesson)).toBeNull();
  });
  it("retains completed runs when practicing again and restores the archive", () => {
    const data = freshProgress(lesson);
    data.active = transition(lesson, data.active, { type: "next" });
    for (const exercise of lesson.exercises) {
      data.active = transition(lesson, data.active, {
        type: "submit",
        response: exercise.review.validExamples[0]!,
      });
      data.active = transition(lesson, data.active, { type: "next" });
    }
    const next = practiceAgain(data, lesson);
    expect(next.previous[0]?.completed).toBe(true);
    expect(next.active.index).toBe(-1);
    expect(decodeProgress(JSON.stringify(next), lesson)).toEqual(next);
  });
});
