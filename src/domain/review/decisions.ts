import { Chess, SQUARES, type Square } from "chess.js";
import { opposite, pieceNames, play, type MoveInput } from "../chess/game";
import { positionAt, type GameSession } from "../gameplay/session";
import type { SkillId } from "../adaptive/skills";
import {
  capturesOf,
  judgeCandidate,
  type CoachingJudgment,
} from "../coaching/facts";

export type Decision = {
  id: string;
  ply: number;
  fen: string;
  played: MoveInput;
  san: string;
  kind: "capture-opportunity" | "analysis-opportunity";
  skillIds: SkillId[];
  focus: Square;
  attackers: Square[];
  defenders: Square[];
  question: string;
  explanation: string;
  judgment?: CoachingJudgment;
};
export function inspectDecision(
  session: GameSession,
  ply: number,
): Decision | null {
  const before = positionAt(session, ply);
  return decisionAt(session, ply, before);
}
function decisionAt(
  session: GameSession,
  ply: number,
  before: Chess,
): Decision | null {
  const played = session.moves[ply];
  if (!played || before.turn() !== session.player) return null;
  const after = play(before.fen(), played);
  if (!after) return null;
  const replies = capturesOf(after.game, played.to);
  const judgment = judgeCandidate(before.fen(), played)!;
  const proved =
    judgment.verdict === "checkmate" ||
    judgment.verdict === "forced-mate" ||
    judgment.verdict === "draw";
  const attackers = [...new Set(replies.map((move) => move.from))];
  const defenders = after.game.attackers(played.to, session.player);
  // Immediate capture is a demonstrable observation, not a forced loss or evaluation verdict.
  const kind = attackers.length
    ? "capture-opportunity"
    : "analysis-opportunity";
  const skills: SkillId[] =
    attackers.length && !proved
      ? [
          "destination-safety",
          "opponent-threats",
          "recognize-attacks",
          "attack-defense",
          ...(!defenders.length ? ["hanging-pieces" as const] : []),
        ]
      : [];
  return {
    id: `${session.id}:${ply}`,
    ply,
    fen: before.fen(),
    played,
    san: after.move.san,
    kind,
    skillIds: skills,
    focus: played.from,
    attackers,
    defenders,
    judgment,
    question: attackers.length
      ? "Imagine your original move. Which opponent piece could capture it on the next move?"
      : "What could your opponent do after your move? Try another legal move and inspect the reply.",
    explanation: proved
      ? judgment.text
      : attackers.length
        ? `After ${after.move.san}, ${attackers.map((square) => `the ${pieceNames[after.game.get(square)!.type]} on ${square}`).join(" or ")} has a legal capture of the piece on ${played.to}${replies.some((reply) => reply.isEnPassant()) ? " by en passant (the pawn lands on a different square)" : ""}. ${defenders.length ? `Friendly defenders of that square: ${defenders.join(", ")}. A defender does not cancel an attack.` : "The destination has no geometric friendly defender."} This does not prove a forced loss or that the move is a blunder; trades, checks, and sacrifices need deeper analysis.`
        : "This position is an analysis opportunity. No immediate capture of the moved piece was established. We cannot infer your intention or diagnose a mistake from this observation.",
  };
}
export function selectDecisions(session: GameSession): Decision[] {
  if (!session.outcome) return [];
  const candidates: Decision[] = [];
  const board = new Chess(session.startingFen);
  session.moves.forEach((move, ply) => {
    const decision = decisionAt(session, ply, board);
    if (decision) candidates.push(decision);
    board.move(move);
  });
  const important = candidates
    .filter((item) => item.kind === "capture-opportunity")
    .sort((a, b) => a.defenders.length - b.defenders.length || a.ply - b.ply);
  return (
    important.length
      ? important
      : candidates.filter(
          (_, index) =>
            index % Math.max(1, Math.floor(candidates.length / 3)) === 0,
        )
  ).slice(0, 3);
}
export type RetryResult = {
  legal: boolean;
  meetsGoal: boolean;
  fen: string;
  explanation: string;
  san: string | null;
  judgment?: CoachingJudgment;
};
export function evaluateRetry(
  decision: Decision,
  move: MoveInput,
): RetryResult {
  const result = play(decision.fen, move);
  if (!result)
    return {
      legal: false,
      meetsGoal: false,
      fen: decision.fen,
      explanation: "Choose a legal move in the original position.",
      san: null,
    };
  const side = new Chess(decision.fen).turn();
  const attackers = result.game.attackers(move.to, opposite(side));
  const safe = attackers.length === 0;
  const judgment = judgeCandidate(decision.fen, move)!;
  return {
    legal: true,
    meetsGoal: safe,
    fen: result.game.fen(),
    san: result.move.san,
    judgment,
    explanation:
      judgment.verdict !== "unattacked" &&
      (judgment.verdict !== "capture-available" || safe)
        ? judgment.text
        : safe
          ? `${result.move.san} meets this review’s narrow goal: the destination is not attacked. Other legal moves may meet the same goal; this is not proof of the best move or transferable mastery.`
          : `${result.move.san} is legal, but the destination is attacked by ${attackers.join(", ")}. Recheck the opponent’s lines, pawn diagonals, and knight jumps. This goal does not evaluate trades or sacrifices.`,
  };
}
export function undefendedPieces(fen: string): Square[] {
  const game = new Chess(fen);
  return SQUARES.filter((square) => {
    const piece = game.get(square);
    return (
      piece &&
      piece.type !== "k" &&
      piece.color === game.turn() &&
      !game.attackers(square, piece.color).length
    );
  });
}
