import {
  expectedStatus,
  pieceFacts,
  validateResponse,
} from "../learning/validation";
import type { StudentResponse } from "../learning/types";
import type { FoundationExercise, Reflection } from "./types";

export const mistakeTypes = [
  "missed-attack",
  "missed-defender",
  "unsafe-destination",
  "hanging-piece",
  "missed-opponent-response",
  "capture-exchange-reasoning",
  "unknown",
] as const;
export type MistakeType = (typeof mistakeTypes)[number];
export type MistakeAnalysis = {
  observed: MistakeType;
  possible: readonly MistakeType[];
  certainty: "task-evidence" | "ambiguous";
  skillId: FoundationExercise["skillId"];
  explanation: string;
  followUp: string;
  reportedReason: Reflection | null;
};

export function analyzeMistake(
  exercise: FoundationExercise,
  response: StudentResponse,
  reflection: Reflection | null = null,
): MistakeAnalysis | null {
  if (validateResponse(exercise, response).kind !== "incorrect") return null;
  let observed: MistakeType = "unknown";
  let certainty: MistakeAnalysis["certainty"] = "ambiguous";
  let explanation =
    "This response does not meet the task. It does not tell us which part of your reasoning was missing.";
  const possible: MistakeType[] = [
    "missed-attack",
    "missed-defender",
    "capture-exchange-reasoning",
    "unknown",
  ];
  if (response.type === "unsure") {
    explanation =
      "You reported uncertainty. No specific misconception can be inferred from that response.";
  } else if (exercise.answer.type === "safe-move") {
    observed = "unsafe-destination";
    certainty = "task-evidence";
    explanation =
      "The destination is attacked. That is outside this exercise’s no-attacks goal; it does not prove the move is a blunder or that a sacrifice is wrong.";
  } else if (exercise.answer.type === "reply") {
    observed = "missed-opponent-response";
    explanation =
      "The selected piece has no legal capture of the proposed destination. We cannot tell whether the difficulty was projecting the move or recognizing the reply.";
  } else if (exercise.answer.type === "status" && response.type === "choice") {
    const facts = pieceFacts(exercise.fen, exercise.answer.target);
    if (
      facts.defended &&
      ["hanging", "attacked-undefended", "unattacked-undefended"].includes(
        response.choice,
      )
    ) {
      observed = "missed-defender";
      certainty = "task-evidence";
      explanation =
        "The chosen description omits a defender. This identifies a mismatch in the answer, not the student’s complete thought process.";
    } else if (facts.attacked && response.choice.startsWith("unattacked")) {
      observed = "missed-attack";
      certainty = "task-evidence";
      explanation =
        "The answer describes an attacked piece as unattacked. Which attack was noticed remains uncertain.";
    } else if (expectedStatus(exercise) === "hanging") {
      observed = "hanging-piece";
      explanation =
        "The target is attacked and undefended in this narrow task. A missed attack, a presumed defender, or wording confusion could explain the response.";
    }
  } else if (exercise.answer.type === "attacker") {
    observed = "missed-attack";
    explanation =
      "The selected square is not an attacker of the target. Selection confusion and a missed movement pattern are both possible.";
  }
  return {
    observed,
    possible,
    certainty,
    skillId: exercise.skillId,
    explanation,
    followUp:
      exercise.skillId === "opponent-threats"
        ? "What did you check after imagining the proposed move?"
        : exercise.skillId === "attack-defense" ||
            exercise.skillId === "hanging-pieces"
          ? "Did you check attacks, defenders, or both before answering?"
          : "What did you check before choosing?",
    reportedReason: reflection,
  };
}
