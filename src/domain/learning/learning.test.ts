import { describe, expect, it } from "vitest";
import { Chess, SQUARES } from "chess.js";
import { pieceSafetyLesson as lesson } from "../curriculum/piece-safety";
import { createSession, progress, transition } from "./session";
import {
  acceptableResponses,
  assertLesson,
  validateResponse,
} from "./validation";
import type { Exercise, Lesson, StudentResponse } from "./types";

const start = () => transition(lesson, createSession(lesson), { type: "next" });
const correct = (index: number) =>
  lesson.exercises[index]!.review.validExamples[0]!;

describe("curated lesson and schema", () => {
  it("validates the complete lesson, every FEN and authored example", () =>
    expect(() => assertLesson(lesson)).not.toThrow());
  it("has five practice positions and a distinct transfer assessment", () => {
    expect(
      lesson.exercises.filter((exercise) => !exercise.assessment),
    ).toHaveLength(5);
    const assessment = lesson.exercises[5]!;
    expect(assessment.assessment).toBe(true);
    expect(
      lesson.exercises.slice(0, 5).map((exercise) => exercise.fen),
    ).not.toContain(assessment.fen);
  });
  it("rejects duplicate IDs, broken FENs, inaccurate attack claims, and illegal expected moves", () => {
    const mutate = (change: Partial<Exercise>): Lesson => ({
      ...lesson,
      exercises: [
        { ...lesson.exercises[1]!, ...change },
        ...lesson.exercises.slice(1),
      ],
    });
    expect(() =>
      assertLesson(mutate({ id: lesson.exercises[2]!.id })),
    ).toThrow();
    expect(() => assertLesson(mutate({ fen: "bad" }))).toThrow();
    expect(() =>
      assertLesson(
        mutate({
          id: "new",
          review: { ...lesson.exercises[1]!.review, attackers: ["a8"] },
        }),
      ),
    ).toThrow();
    expect(() =>
      assertLesson(
        mutate({
          id: "new",
          answer: { type: "moves", moves: [{ from: "c3", to: "c4" }] },
        }),
      ),
    ).toThrow();
  });
  it("rejects an already checked side not to move and reused assessment content", () => {
    expect(() =>
      assertLesson({
        ...lesson,
        introduction: {
          ...lesson.introduction,
          fen: "4k3/7p/8/8/8/8/7P/4R1K1 w - - 0 1",
        },
      }),
    ).toThrow(/not to move/);
    expect(() =>
      assertLesson({
        ...lesson,
        exercises: [
          ...lesson.exercises,
          { ...lesson.exercises[1]!, id: "reused", assessment: true },
        ],
      }),
    ).toThrow(/unseen/);
  });
  it("accepts every real attacker when a question has several", () => {
    const original: Exercise = lesson.exercises[0];
    expect(() =>
      assertLesson({
        ...lesson,
        exercises: [
          {
            ...original,
            answer: { type: "attacker", target: "d4", squares: [] },
          },
        ],
      }),
    ).toThrow(/every attacking/);
  });
});

describe("student responses", () => {
  for (const exercise of lesson.exercises) {
    it(`${exercise.id}: authored correct and incorrect examples match chess.js`, () => {
      exercise.review.validExamples.forEach((response) =>
        expect(validateResponse(exercise, response).kind).toBe("correct"),
      );
      exercise.review.invalidExamples.forEach((response) =>
        expect(validateResponse(exercise, response).kind).toBe("incorrect"),
      );
    });
    it(`${exercise.id}: all acceptable answers satisfy the actual objective`, () => {
      const answers = acceptableResponses(exercise);
      expect(answers.length).toBeGreaterThan(0);
      if (exercise.answer.type === "attacker") {
        const game = new Chess(exercise.fen);
        expect(answers).toEqual(
          game
            .attackers(exercise.answer.target, "b")
            .map((square) => ({ type: "square", square })),
        );
        for (const square of SQUARES)
          expect(
            validateResponse(exercise, { type: "square", square }).kind ===
              "correct",
          ).toBe(game.attackers(exercise.answer.target, "b").includes(square));
      } else {
        expect(answers.length).toBeGreaterThan(1);
        const game = new Chess(exercise.fen);
        for (const move of game.moves({ verbose: true })) {
          const result = new Chess(exercise.fen);
          result.move(move);
          const response: StudentResponse = {
            type: "move",
            move: { from: move.from, to: move.to },
          };
          expect(validateResponse(exercise, response).kind === "correct").toBe(
            move.from === exercise.focusSquare &&
              !result.isAttacked(move.to, "b"),
          );
        }
      }
    });
  }
  it("distinguishes illegal input from a legal but unsafe answer", () => {
    expect(
      validateResponse(lesson.exercises[1], {
        type: "move",
        move: { from: "c3", to: "c4" },
      }).kind,
    ).toBe("invalid");
    expect(
      validateResponse(lesson.exercises[1], {
        type: "move",
        move: { from: "c3", to: "g7" },
      }),
    ).toMatchObject({ kind: "incorrect", attackers: ["g8"] });
  });
  it("rejects moving another piece and the wrong response type", () => {
    expect(
      validateResponse(lesson.exercises[1], {
        type: "move",
        move: { from: "h2", to: "h3" },
      }).kind,
    ).toBe("invalid");
    expect(validateResponse(lesson.exercises[0], correct(1)).kind).toBe(
      "invalid",
    );
    expect(validateResponse(lesson.exercises[1], correct(0)).kind).toBe(
      "invalid",
    );
  });
  it("supports an explicit set of multiple acceptable moves", () => {
    const exercise: Exercise = {
      ...lesson.exercises[1],
      answer: {
        type: "moves",
        moves: [
          { from: "c3", to: "b4" },
          { from: "c3", to: "d4" },
        ],
      },
    };
    expect(acceptableResponses(exercise)).toHaveLength(2);
    expect(
      validateResponse(exercise, {
        type: "move",
        move: { from: "c3", to: "e5" },
      }).kind,
    ).toBe("incorrect");
  });
});

describe("lesson progression, retry, hints, and evidence", () => {
  it("starts with an explanation and requires a correct response before advancing", () => {
    const session = createSession(lesson);
    expect(session.index).toBe(-1);
    expect(
      transition(lesson, session, { type: "submit", response: correct(0) }),
    ).toBe(session);
    const begun = start();
    expect(transition(lesson, begun, { type: "next" })).toBe(begun);
  });
  it("retains mistakes and hints after retry; does not label later success independent", () => {
    let session = start();
    session = transition(lesson, session, { type: "hint" });
    session = transition(lesson, session, {
      type: "submit",
      response: { type: "square", square: "d4" },
    });
    expect(transition(lesson, session, { type: "next" })).toBe(session);
    session = transition(lesson, session, { type: "retry" });
    session = transition(lesson, session, {
      type: "submit",
      response: correct(0),
    });
    expect(progress(lesson, session)).toMatchObject({
      attempted: 1,
      incorrectAttempts: 1,
      correctAttempts: 1,
      hintsUsed: 1,
      independentSuccesses: 0,
      solved: 1,
    });
    session = transition(lesson, session, { type: "retry" });
    expect(progress(lesson, session)).toMatchObject({
      incorrectAttempts: 1,
      correctAttempts: 1,
      hintsUsed: 1,
      solved: 0,
    });
    expect(transition(lesson, session, { type: "next" })).toBe(session);
  });
  it("caps graduated hints, prevents duplicate submissions, and does not count illegal input", () => {
    let session = start();
    for (let i = 0; i < 4; i++)
      session = transition(lesson, session, { type: "hint" });
    expect(progress(lesson, session).hintsUsed).toBe(2);
    session = transition(lesson, session, {
      type: "submit",
      response: correct(1),
    });
    expect(progress(lesson, session).attempted).toBe(0);
    session = transition(lesson, session, {
      type: "submit",
      response: correct(0),
    });
    expect(
      transition(lesson, session, { type: "submit", response: correct(0) }),
    ).toBe(session);
    expect(transition(lesson, session, { type: "hint" })).toBe(session);
  });
  it("completes the lesson only after all exercises including assessment are solved", () => {
    let session = start();
    for (let index = 0; index < lesson.exercises.length; index++) {
      expect(session.completed).toBe(false);
      expect(session.index).toBe(index);
      if (lesson.exercises[index]!.assessment)
        expect(transition(lesson, session, { type: "hint" })).toBe(session);
      session = transition(lesson, session, {
        type: "submit",
        response: correct(index),
      });
      session = transition(lesson, session, { type: "next" });
    }
    expect(progress(lesson, session)).toMatchObject({
      completed: true,
      independentSuccesses: 6,
      mastery: "not-established",
      assessments: [
        { firstAttemptCorrect: true, independent: true, solved: true },
      ],
    });
    expect(transition(lesson, session, { type: "retry" })).toBe(session);
  });
  it("records an incorrect first assessment separately from eventual success", () => {
    let session = start();
    for (let i = 0; i < 5; i++) {
      session = transition(lesson, session, {
        type: "submit",
        response: correct(i),
      });
      session = transition(lesson, session, { type: "next" });
    }
    session = transition(lesson, session, {
      type: "submit",
      response: lesson.exercises[5].review.invalidExamples[0]!,
    });
    session = transition(lesson, session, { type: "hint" });
    session = transition(lesson, session, { type: "retry" });
    session = transition(lesson, session, {
      type: "submit",
      response: correct(5),
    });
    expect(progress(lesson, session).assessments[0]).toMatchObject({
      firstAttemptCorrect: false,
      independent: false,
      solved: true,
      attempts: 2,
      hintsUsed: 1,
    });
  });
  it("supports a lesson without an assessment", () => {
    const practiceOnly: Lesson = {
      ...lesson,
      exercises: [lesson.exercises[0]],
    };
    let session = transition(practiceOnly, createSession(practiceOnly), {
      type: "next",
    });
    session = transition(practiceOnly, session, {
      type: "submit",
      response: correct(0),
    });
    session = transition(practiceOnly, session, { type: "next" });
    expect(progress(practiceOnly, session)).toMatchObject({
      completed: true,
      assessments: [],
    });
  });
});
