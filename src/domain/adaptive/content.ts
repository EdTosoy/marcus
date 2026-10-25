import { Chess, SQUARES } from "chess.js";
import {
  assertExercise,
  expectedStatus,
  immediateCaptures,
  pieceFacts,
} from "../learning/validation";
import { skills, assertSkills } from "./skills";
import { exerciseRoles, type FoundationExercise } from "./types";

// Ignore move counters. Reject exact reuse and simple mirrored/color-reversed
// boards across roles; a color swap must not turn a taught board into a holdout.
export function positionFingerprint(fen: string): string {
  const game = new Chess(fen);
  const variants: string[] = [];
  for (const mirrorFile of [false, true])
    for (const reverseColor of [false, true]) {
      const pieces: string[] = [];
      for (const square of SQUARES) {
        const piece = game.get(square);
        if (!piece) continue;
        const file = mirrorFile
          ? 201 - square.charCodeAt(0)
          : square.charCodeAt(0);
        const rank = reverseColor ? 9 - Number(square[1]) : Number(square[1]);
        pieces.push(
          `${String.fromCharCode(file)}${rank}:${reverseColor ? (piece.color === "w" ? "b" : "w") : piece.color}${piece.type}`,
        );
      }
      variants.push(
        `${reverseColor ? (game.turn() === "w" ? "b" : "w") : game.turn()}|${pieces.sort().join(",")}`,
      );
    }
  return variants.sort()[0]!;
}

export function assertFoundationBank(
  bank: readonly FoundationExercise[],
): void {
  assertSkills();
  const ids = new Set<string>();
  const fingerprints = new Set<string>();
  for (const exercise of bank) {
    if (ids.has(exercise.id)) throw new Error("Duplicate exercise ID");
    ids.add(exercise.id);
    const fingerprint = positionFingerprint(exercise.fen);
    if (fingerprints.has(fingerprint))
      throw new Error("Assessment leakage: repeated or reflected position");
    fingerprints.add(fingerprint);
    if (
      !skills.some((skill) => skill.id === exercise.skillId) ||
      !exerciseRoles.includes(exercise.role)
    )
      throw new Error("Unknown skill or role");
    if (exercise.retry !== (exercise.role === "guided" ? "unlimited" : "none"))
      throw new Error("Role/retry mismatch");
    assertExercise(exercise);
    if (exercise.answer.type === "status") {
      const facts = pieceFacts(exercise.fen, exercise.answer.target);
      if (
        JSON.stringify([...facts.defenders].sort()) !==
          JSON.stringify([...(exercise.review.defenders ?? [])].sort()) ||
        expectedStatus(exercise) !== exercise.review.status
      )
        throw new Error(`${exercise.id}: defender/status review mismatch`);
    }
    if (exercise.answer.type === "reply") {
      const sources = [
        ...new Set(immediateCaptures(exercise).map((move) => move.from)),
      ].sort();
      if (
        JSON.stringify(sources) !==
        JSON.stringify([...(exercise.review.replySources ?? [])].sort())
      )
        throw new Error(`${exercise.id}: immediate reply review mismatch`);
    }
  }
  for (const skill of skills)
    for (const role of exerciseRoles) {
      if (
        !bank.some(
          (exercise) => exercise.skillId === skill.id && exercise.role === role,
        )
      )
        throw new Error(`Missing ${role} coverage for ${skill.id}`);
    }
}
