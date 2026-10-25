import { describe, expect, it } from "vitest";
import {
  baseline,
  acquisition,
  finishedRun,
  START,
} from "../adaptive/test-fixtures";
import { DAY } from "../adaptive/model";
import { freshLearningData } from "../adaptive/types";
import { foundationExercises as bank } from "../curriculum/foundations";
import { evaluationResults } from "./results";
import { freshTiming, decodeTiming, measuredTick } from "./timing";
import { newGame, resignGame } from "../gameplay/session";
import { reviewGame } from "../review/test-fixtures";
import { selectDecisions } from "../review/decisions";
import { newReview, reviewTransition } from "../review/session";
const emptyGames = { games: [], active: null, reviews: {} };
describe("local learning evaluation denominators", () => {
  it("keeps baseline, unfamiliar transfer, delayed and assisted practice distinct", () => {
    const data = acquisition();
    data.runs.push(finishedRun("attack-review-black", START + DAY + 200));
    data.runs.push(finishedRun("attack-transfer-lines", START + DAY + 300));
    const report = evaluationResults(
      data,
      emptyGames,
      freshTiming(),
      START + DAY + 1000,
    );
    expect(report.baseline).toMatchObject({ correct: 5, total: 5 });
    expect(report.independentPostTrainingProxy).toMatchObject({
      correct: 2,
      total: 2,
      controlledStudyPostTest: false,
    });
    expect(report.delayed).toMatchObject({ correct: 1, total: 1 });
    expect(report.exclusions.some((item) => !item.curriculumFresh)).toBe(true);
    expect(report.trainingTime.historicalActiveTime).toBeNull();
  });
  it("excludes possible earlier game exposure instead of claiming unfamiliar transfer", () => {
    const data = acquisition();
    const item = bank.find((item) => item.id === "attack-transfer-lines")!;
    const game = resignGame(
      newGame("exposure", "w", "gentle", START - 100, item.fen),
      START - 50,
    );
    const report = evaluationResults(
      data,
      { games: [game], active: null, reviews: {} },
      freshTiming(),
      START + 1000,
    );
    expect(report.independentPostTrainingProxy.total).toBe(1);
    expect(
      report.exclusions.some((item) => item.possiblePriorGameExposure),
    ).toBe(true);
  });
  it("groups repeated game observations by positions and games without mastery credit", () => {
    const games = [reviewGame("one"), reviewGame("two")];
    const reviews = Object.fromEntries(
      games.map((game) => {
        const decision = selectDecisions(game)[0]!;
        let review = newReview(decision.id);
        review = reviewTransition(
          review,
          decision,
          { type: "notice", observation: "threats" },
          START + 20,
        );
        review = reviewTransition(
          review,
          decision,
          { type: "try", move: decision.played, prediction: "capture" },
          START + 21,
        );
        return [decision.id, review];
      }),
    );
    const before = baseline();
    const snapshot = JSON.stringify(before);
    const report = evaluationResults(
      before,
      { games, active: null, reviews },
      freshTiming(),
      START + 1000,
    );
    expect(report.gameplayPatterns[0]).toMatchObject({
      distinctGames: 2,
      distinctPositions: 1,
      evidenceClass: "repeated-position",
      masteryCredit: false,
    });
    expect(
      report.gameplay.every(
        (item) =>
          item.familiarPosition &&
          item.conceptualDiagnosis === "not-established",
      ),
    ).toBe(true);
    expect(JSON.stringify(before)).toBe(snapshot);
  });
  it("uses null accuracy for missing data rather than fabricated zeros", () => {
    const report = evaluationResults(
      freshLearningData(),
      emptyGames,
      freshTiming(),
      START,
    );
    expect(report.baseline.accuracy).toBeNull();
    expect(report.delayed.total).toBe(0);
  });
});
describe("foreground timer validity", () => {
  const segment = {
    id: "one",
    startedAt: 1000,
    endedAt: 1000,
    activeMs: 0,
    byRoute: {},
  };
  it("counts bounded same-route intervals, not background gaps or route transitions", () => {
    const tick = measuredTick(segment, 1000, 6000, "/learn", "/learn");
    expect(tick.activeMs).toBe(5000);
    expect(tick.byRoute["/learn"]).toBe(5000);
    expect(measuredTick(tick, 6000, 60_000, "/learn", "/learn")).toBe(tick);
    expect(measuredTick(tick, 6000, 7000, "/learn", "/play")).toBe(tick);
    expect(measuredTick(tick, 6000, 5000, "/learn", "/learn")).toBe(tick);
    expect(
      decodeTiming(JSON.stringify({ version: 1, segments: [tick] })),
    ).toEqual({ version: 1, segments: [tick] });
  });
  it("rejects corrupt versions and impossible durations and retains no active state on disk", () => {
    expect(decodeTiming('{"version":99}')).toBeNull();
    expect(decodeTiming("null")).toBeNull();
    expect(
      decodeTiming(
        JSON.stringify({
          version: 1,
          segments: [{ ...segment, activeMs: 100 }],
        }),
      ),
    ).toBeNull();
    expect(freshTiming()).not.toHaveProperty("active");
  });
});
