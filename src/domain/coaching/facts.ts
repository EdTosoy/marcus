import { Chess, type Square } from "chess.js";
import { opposite, play, type MoveInput } from "../chess/game";

export type Prediction = "capture" | "check" | "other" | "unsure";
export const predictions: readonly Prediction[] = [
  "capture",
  "check",
  "other",
  "unsure",
];
export function capturesOf(game: Chess, square: Square) {
  return game
    .moves({ verbose: true })
    .filter(
      (move) =>
        (move.isCapture() || move.isEnPassant()) &&
        (move.to === square ||
          (move.isEnPassant() && `${move.to[0]}${move.from[1]}` === square)),
    );
}
export type CoachingJudgment = {
  policyVersion: 2;
  verdict:
    | "checkmate"
    | "forced-mate"
    | "draw"
    | "capture-available"
    | "unattacked"
    | "attacked-unresolved";
  evidence: "verified-tactical-fact" | "uncertain-assessment";
  text: string;
  lines: string[][];
};
/** A deliberately small proof: a checking move, <=3 legal replies, mate in one after every reply. */
export function judgeCandidate(
  fen: string,
  move: MoveInput,
): CoachingJudgment | null {
  const result = play(fen, move);
  if (!result) return null;
  const { game, move: played } = result;
  const base = {
    policyVersion: 2 as const,
    evidence: "verified-tactical-fact" as const,
    lines: [] as string[][],
  };
  if (game.isCheckmate())
    return {
      ...base,
      verdict: "checkmate",
      text: `${played.san} is checkmate. There is no legal reply. An attacked landing square does not make a mating move a mistake.`,
    };
  if (game.isGameOver())
    return {
      ...base,
      verdict: "draw",
      text: `${played.san} ends this reconstructed position in a draw. Whether that is desirable depends on the game situation; this is not automatically a success or a mistake.`,
    };
  if (game.inCheck()) {
    const replies = game.moves({ verbose: true });
    if (replies.length <= 3) {
      const lines: string[][] = [];
      for (const reply of replies) {
        const continuation = new Chess(game.fen());
        continuation.move(reply);
        const mate = continuation
          .moves({ verbose: true })
          .find((item) => item.san.endsWith("#"));
        if (!mate) break;
        lines.push([played.san, reply.san, mate.san]);
      }
      if (lines.length === replies.length && lines.length)
        return {
          ...base,
          verdict: "forced-mate",
          lines,
          text: `${played.san} forces checkmate on your next turn: every legal opponent reply has a mating answer. Giving up a piece here must not be classified as a mistake merely because it can be captured.`,
        };
    }
  }
  const captures = capturesOf(game, move.to);
  if (captures.length)
    return {
      ...base,
      verdict: "capture-available",
      text: `A legal reply can capture the moved piece: ${captures.map((item) => item.san).join(" or ")}. This verifies a capture opportunity, not a forced loss or a bad move. An exchange or sacrifice may be sound; deeper value is unassessed.`,
    };
  const attacked = game.isAttacked(move.to, opposite(new Chess(fen).turn()));
  return attacked
    ? {
        ...base,
        verdict: "attacked-unresolved",
        evidence: "uncertain-assessment",
        text: `An opponent’s attack pattern reaches the destination, but no legal immediate capture of the moved piece was found. A pinned piece (unable to move without exposing its king) or the king’s own safety may explain the difference. Move quality is unresolved.`,
      }
    : {
        ...base,
        verdict: "unattacked",
        text: `The destination is unattacked and the moved piece has no legal immediate capture against it. This narrow observation does not establish best play or resolve threats to other pieces.`,
      };
}
export function judgePrediction(
  fen: string,
  move: MoveInput,
  prediction: Prediction,
) {
  const result = play(fen, move);
  if (!result) return null;
  const replies = result.game.moves({ verbose: true });
  if (prediction === "unsure")
    return {
      supported: null,
      text: "Uncertainty recorded. No reasoning diagnosis follows from this response.",
    };
  const supported =
    prediction === "capture"
      ? capturesOf(result.game, move.to).length > 0
      : prediction === "check"
        ? replies.some((item) => /[+#]$/.test(item.san))
        : replies.some((item) => !item.isCapture() && !/[+#]$/.test(item.san));
  return {
    supported,
    text: supported
      ? "At least one legal reply matches your prediction. Other replies may also be possible."
      : "No legal immediate reply of that kind was found. Recheck the position; this alone does not identify a misunderstanding.",
  };
}
