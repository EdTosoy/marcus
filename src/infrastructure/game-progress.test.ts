import { describe, expect, it } from "vitest";
import {
  decodeGameData,
  freshGameData,
  saveSession,
  serializeGames,
  updateReview,
} from "./game-progress";
import { newGame, resignGame, gamePgn } from "../domain/gameplay/session";
import { reviewGame } from "../domain/review/test-fixtures";
import { selectDecisions } from "../domain/review/decisions";
import { reviewTransition } from "../domain/review/session";
import { START } from "../domain/adaptive/test-fixtures";

describe("bounded game/review storage", () => {
  it("round trips active games, completed games/PGN and review attempts", () => {
    const game = reviewGame();
    let data = saveSession(freshGameData(), game);
    const decision = selectDecisions(game)[0]!;
    data = updateReview(data, decision.id, (record) =>
      reviewTransition(
        record,
        decision,
        { type: "notice", observation: "unsure" },
        START + 20,
      ),
    );
    data = updateReview(data, decision.id, (record) =>
      reviewTransition(record, decision, { type: "hint" }, START + 21),
    );
    data = updateReview(data, decision.id, (record) =>
      reviewTransition(
        record,
        decision,
        { type: "try", move: decision.played },
        START + 22,
      ),
    );
    const raw = serializeGames(data);
    expect(JSON.parse(raw).games[0].pgn).toBe(gamePgn(game));
    expect(decodeGameData(raw)).toEqual(data);
    data = saveSession(data, newGame("active", "b", "steady", START + 30));
    expect(decodeGameData(serializeGames(data))).toEqual(data);
  });
  it("rejects corrupt/unsupported data, illegal history, forged outcomes and review correctness", () => {
    for (const raw of [null, "bad", "{}", '{"version":99}'])
      expect(decodeGameData(raw)).toBeNull();
    const data = saveSession(freshGameData(), reviewGame());
    const illegal = structuredClone(data);
    illegal.games[0]!.moves[0] = { from: "e2", to: "e5" };
    expect(decodeGameData(JSON.stringify(illegal))).toBeNull();
    const fake = structuredClone(data);
    fake.games[0]!.outcome!.result = "1-0";
    expect(decodeGameData(JSON.stringify(fake))).toBeNull();
    const decision = selectDecisions(data.games[0]!)[0]!;
    let evidence = updateReview(data, decision.id, (record) =>
      reviewTransition(
        record,
        decision,
        { type: "notice", observation: "threats" },
        START + 11,
      ),
    );
    evidence = updateReview(evidence, decision.id, (record) =>
      reviewTransition(
        record,
        decision,
        { type: "try", move: decision.played },
        START + 12,
      ),
    );
    evidence.reviews[decision.id]!.attempts[0]!.meetsGoal = true;
    expect(decodeGameData(JSON.stringify(evidence))).toBeNull();
  });
  it("retains only twenty completed games and prunes associated reviews", () => {
    const first = reviewGame("old");
    let data = saveSession(freshGameData(), first);
    const decision = selectDecisions(first)[0]!;
    data = updateReview(data, decision.id, (record) =>
      reviewTransition(
        record,
        decision,
        { type: "notice", observation: "threats" },
        START,
      ),
    );
    for (let i = 0; i < 21; i++)
      data = saveSession(
        data,
        resignGame(newGame(`g-${i}`, "w", "gentle", START + i), START + i),
      );
    expect(data.games).toHaveLength(20);
    expect(data.reviews).toEqual({});
    expect(decodeGameData(serializeGames(data))).toEqual(data);
  });
});

it("preserves Phase 2A review payloads without inventing predictions or discarding old difficulty IDs", () => {
  const game = reviewGame();
  const decision = selectDecisions(game)[0]!;
  let data = saveSession(freshGameData(), game);
  data = updateReview(data, decision.id, (record) =>
    reviewTransition(
      reviewTransition(
        record,
        decision,
        { type: "notice", observation: "unsure" },
        START + 11,
      ),
      decision,
      { type: "try", move: decision.played },
      START + 12,
    ),
  );
  const legacy = JSON.parse(serializeGames(data));
  delete legacy.reviews[decision.id].attempts[0].prediction;
  delete legacy.reviews[decision.id].attempts[0].coachingVersion;
  const loaded = decodeGameData(JSON.stringify(legacy));
  expect(loaded).not.toBeNull();
  expect(loaded!.games[0]!.difficulty).toBe("gentle");
  expect(loaded!.reviews[decision.id]!.attempts[0]).not.toHaveProperty(
    "prediction",
  );
});

it("retains previously saved decisions outside the revised selection and rejects invalid prediction metadata", () => {
  const game = reviewGame("retained");
  const data = saveSession(freshGameData(), game);
  const raw = JSON.parse(serializeGames(data));
  raw.reviews["retained:0"] = {
    decisionId: "retained:0",
    observation: "unsure",
    hints: 0,
    revealed: false,
    attempts: [
      {
        move: { from: "e2", to: "e4" },
        at: START + 11,
        hints: 0,
        revealed: false,
        meetsGoal: true,
      },
    ],
    reviewedAt: START + 11,
    recommendation: null,
  };
  const loaded = decodeGameData(JSON.stringify(raw));
  expect(loaded?.reviews["retained:0"]).toBeDefined();
  raw.reviews["retained:0"].attempts[0].prediction = "invented";
  expect(decodeGameData(JSON.stringify(raw))).toBeNull();
  delete raw.reviews["retained:0"].attempts[0].prediction;
  raw.reviews["retained:0"].attempts[0].coachingVersion = 99;
  expect(decodeGameData(JSON.stringify(raw))).toBeNull();
});
