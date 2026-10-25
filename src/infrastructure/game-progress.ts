import { Chess } from "chess.js";
import { difficulties } from "../engine/types";
import {
  gamePgn,
  newGame,
  terminalOutcome,
  type GameSession,
} from "../domain/gameplay/session";
import {
  selectDecisions,
  inspectDecision,
  evaluateRetry,
} from "../domain/review/decisions";
import { predictions } from "../domain/coaching/facts";
import { skillIds } from "../domain/adaptive/skills";
import { newReview, type ReviewRecord } from "../domain/review/session";
import { foundationExercises } from "../domain/curriculum/foundations";
import { isResponse } from "./local-progress";

export const GAME_STORAGE_KEY = "marcus:games:v1";
export const MAX_GAMES = 20;
export type GameData = {
  version: 1;
  active: GameSession | null;
  games: GameSession[];
  reviews: Record<string, ReviewRecord>;
};
export const freshGameData = (): GameData => ({
  version: 1,
  active: null,
  games: [],
  reviews: {},
});
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const time = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const moveInput = (
  value: unknown,
): value is import("../domain/chess/game").MoveInput =>
  isResponse({ type: "move", move: value });
function decodeGame(value: unknown): GameSession | null {
  if (
    !object(value) ||
    typeof value.id !== "string" ||
    !/^[\w-]{1,80}$/.test(value.id) ||
    !time(value.startedAt) ||
    (value.player !== "w" && value.player !== "b") ||
    !Object.hasOwn(difficulties, String(value.difficulty)) ||
    typeof value.startingFen !== "string" ||
    !Array.isArray(value.moves) ||
    value.moves.length > 600
  )
    return null;
  try {
    const initial = newGame(
      value.id,
      value.player,
      value.difficulty as GameSession["difficulty"],
      value.startedAt,
      value.startingFen,
    );
    if (
      value.finishedAt !== null &&
      (!time(value.finishedAt) || value.finishedAt < value.startedAt)
    )
      return null;
    const endAt = value.finishedAt ?? value.startedAt;
    const chess = new Chess(value.startingFen);
    for (const move of value.moves) {
      if (!moveInput(move) || chess.isGameOver()) return null;
      chess.move(move);
    }
    const outcome =
      terminalOutcome(chess) ??
      (value.moves.length >= 600
        ? {
            result: "1/2-1/2" as const,
            reason: "Practice game ended at the 600-ply storage limit.",
          }
        : object(value.outcome) && value.outcome.reason === "You resigned."
          ? {
              result:
                value.player === "w" ? ("0-1" as const) : ("1-0" as const),
              reason: "You resigned.",
            }
          : null);
    if (
      (outcome === null
        ? value.outcome !== null
        : !object(value.outcome) ||
          value.outcome.result !== outcome.result ||
          value.outcome.reason !== outcome.reason) ||
      (outcome ? endAt : null) !== value.finishedAt
    )
      return null;
    return {
      ...initial,
      moves: value.moves as GameSession["moves"],
      outcome,
      finishedAt: outcome ? endAt : null,
    };
  } catch {
    return null;
  }
}
export function decodeGameData(raw: string | null): GameData | null {
  if (!raw || raw.length > 3_000_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !object(value) ||
      value.version !== 1 ||
      !Array.isArray(value.games) ||
      value.games.length > MAX_GAMES ||
      !object(value.reviews) ||
      Object.keys(value.reviews).length > MAX_GAMES * 6
    )
      return null;
    const games = value.games.map(decodeGame);
    if (games.some((game) => !game?.outcome)) return null;
    const active = value.active === null ? null : decodeGame(value.active);
    if (value.active !== null && (!active || active.outcome)) return null;
    const completed = games as GameSession[];
    const ids = [
      ...completed.map((game) => game.id),
      ...(active ? [active.id] : []),
    ];
    if (new Set(ids).size !== ids.length) return null;
    const reviews: Record<string, ReviewRecord> = {};
    const reviewCounts = new Map<string, number>();
    for (const [id, record] of Object.entries(value.reviews)) {
      const owner = completed.find((game) => game.id === id.split(":")[0]);
      const ply = Number(id.split(":")[1]);
      const decision =
        owner &&
        Number.isInteger(ply) &&
        ply >= 0 &&
        ply < owner.moves.length &&
        id === `${owner.id}:${ply}`
          ? inspectDecision(owner, ply)
          : null;
      if (owner) {
        const count = (reviewCounts.get(owner.id) ?? 0) + 1;
        if (count > 6) return null;
        reviewCounts.set(owner.id, count);
      }
      if (
        !decision ||
        !object(record) ||
        record.decisionId !== id ||
        ![null, "threats", "defenders", "unsure"].includes(
          record.observation as null,
        ) ||
        !Number.isInteger(record.hints) ||
        Number(record.hints) < 0 ||
        Number(record.hints) > 2 ||
        typeof record.revealed !== "boolean" ||
        !Array.isArray(record.attempts) ||
        record.attempts.length > 30 ||
        (record.reviewedAt !== null && !time(record.reviewedAt))
      )
        return null;
      if (
        !record.observation &&
        (record.hints ||
          record.revealed ||
          record.attempts.length ||
          record.recommendation)
      )
        return null;
      let hints = 0,
        revealed = false,
        lastAt = 0;
      for (const attempt of record.attempts) {
        if (
          !object(attempt) ||
          !moveInput(attempt.move) ||
          !time(attempt.at) ||
          attempt.at < lastAt ||
          !Number.isInteger(attempt.hints) ||
          Number(attempt.hints) < hints ||
          Number(attempt.hints) > Number(record.hints) ||
          typeof attempt.revealed !== "boolean" ||
          (revealed && !attempt.revealed) ||
          (attempt.revealed && !record.revealed)
        )
          return null;
        if (
          attempt.prediction != null &&
          !predictions.includes(attempt.prediction as never)
        )
          return null;
        if (
          attempt.coachingVersion !== undefined &&
          attempt.coachingVersion !== 2
        )
          return null;
        const result = evaluateRetry(decision, attempt.move);
        if (!result.legal || result.meetsGoal !== attempt.meetsGoal)
          return null;
        hints = Number(attempt.hints);
        revealed = attempt.revealed;
        lastAt = attempt.at;
      }
      if (
        record.attempts.length &&
        (!time(record.reviewedAt) || record.reviewedAt < lastAt)
      )
        return null;
      if (record.revealed && !record.attempts.length) return null;
      if (record.recommendation !== null) {
        const rec = record.recommendation;
        if (
          !record.attempts.length ||
          !object(rec) ||
          !time(rec.at) ||
          !(
            decision.skillIds.includes(rec.skillId as never) ||
            (decision.attackers.length > 0 &&
              skillIds.includes(rec.skillId as never))
          ) ||
          !foundationExercises.some(
            (exercise) =>
              exercise.id === rec.exerciseId &&
              exercise.skillId === rec.skillId &&
              exercise.role === "guided",
          )
        )
          return null;
      }
      reviews[id] = record as unknown as ReviewRecord;
    }
    return { version: 1, active, games: completed, reviews };
  } catch {
    return null;
  }
}
export function saveSession(data: GameData, session: GameSession): GameData {
  if (!session.outcome) return { ...data, active: session };
  const games = [
    session,
    ...data.games.filter((game) => game.id !== session.id),
  ].slice(0, MAX_GAMES);
  const valid = new Set(games.map((game) => game.id));
  return {
    version: 1,
    active: data.active?.id === session.id ? null : data.active,
    games,
    reviews: Object.fromEntries(
      Object.entries(data.reviews).filter(([id]) =>
        valid.has(id.split(":")[0]!),
      ),
    ),
  };
}
export function serializeGames(data: GameData) {
  return JSON.stringify({
    ...data,
    games: data.games.map((game) => ({ ...game, pgn: gamePgn(game) })),
  });
}
export function updateReview(
  data: GameData,
  id: string,
  update: (record: ReviewRecord) => ReviewRecord,
): GameData {
  const game = data.games.find((item) => item.id === id.split(":")[0]);
  if (
    !game ||
    (!selectDecisions(game).some((decision) => decision.id === id) &&
      !data.reviews[id])
  )
    return data;
  if (
    !data.reviews[id] &&
    Object.keys(data.reviews).filter((key) => key.startsWith(`${game.id}:`))
      .length >= 6
  )
    return data;
  return {
    ...data,
    reviews: {
      ...data.reviews,
      [id]: update(data.reviews[id] ?? newReview(id)),
    },
  };
}
