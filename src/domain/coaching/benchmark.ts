import type { Square } from "chess.js";
import type { MoveInput } from "../chess/game";
export type CoachingScenario = {
  id: string;
  category: string;
  fen: string;
  focus: Square;
  candidate: MoveInput;
  verdict:
    | "capture-available"
    | "unattacked"
    | "attacked-unresolved"
    | "checkmate"
    | "forced-mate"
    | "draw";
  claim: string;
  interpretation: string;
  accepted?: MoveInput[];
  line?: string[];
  attackers?: Square[];
  defenders?: Square[];
};
export const coachingBenchmark: readonly CoachingScenario[] = [
  {
    id: "hanging-rook",
    category: "hanging pieces",
    fen: "6k1/7p/8/8/3R4/8/7P/6K1 w - - 0 1",
    focus: "d4",
    candidate: { from: "d4", to: "d7" },
    verdict: "unattacked",
    claim:
      "The rook has no friendly defender; that alone does not mean it is attacked.",
    interpretation: "Separate undefended from hanging.",
    attackers: [],
    defenders: [],
  },
  {
    id: "rook-into-bishop",
    category: "unsafe destination / hanging",
    fen: "r5k1/7p/1b6/8/3R4/8/7P/7K w - - 0 1",
    focus: "d4",
    candidate: { from: "d4", to: "a4" },
    verdict: "capture-available",
    claim: "Rxa4 is legal after Ra4.",
    interpretation: "A legal move may allow an immediate capture.",
    line: ["Ra4", "Rxa4"],
    attackers: ["b6"],
    defenders: [],
  },
  {
    id: "defended-rook",
    category: "attacked and defended",
    fen: "6k1/7p/1b6/8/3R4/8/3Q3P/7K w - - 0 1",
    focus: "d4",
    candidate: { from: "d4", to: "e4" },
    verdict: "unattacked",
    claim: "The rook on d4 is attacked by b6 and geometrically defended by d2.",
    interpretation: "A defender does not cancel the attack.",
    attackers: ["b6"],
    defenders: ["d2"],
  },
  {
    id: "immediate-rook-capture",
    category: "immediate captures",
    fen: "6k1/7p/8/8/3r4/8/3R3P/6K1 w - - 0 1",
    focus: "d2",
    candidate: { from: "d2", to: "d4" },
    verdict: "unattacked",
    claim: "Rxd4 legally captures a rook.",
    interpretation:
      "A capture can be evaluated as a fact without calling every exchange a blunder.",
    line: ["Rxd4"],
  },
  {
    id: "offered-exchange",
    category: "capture opportunity without diagnosis",
    fen: "3r2k1/7p/8/8/3R4/8/3Q3P/6K1 w - - 0 1",
    focus: "d4",
    candidate: { from: "d4", to: "d5" },
    verdict: "capture-available",
    claim: "Rxd5 and Qxd5 are a legal conditional exchange line.",
    interpretation:
      "Being capturable does not prove that moving there was bad.",
    line: ["Rd5", "Rxd5", "Qxd5"],
  },
  {
    id: "missed-capture",
    category: "missed immediate captures",
    fen: "6k1/7p/8/8/3q4/8/3R3P/7K w - - 0 1",
    focus: "d2",
    candidate: { from: "d2", to: "e2" },
    verdict: "unattacked",
    claim: "Rxd4 was also legal before Re2.",
    interpretation:
      "An available capture was not chosen; intent and overall move value remain unknown.",
    accepted: [
      { from: "d2", to: "d4" },
      { from: "d2", to: "e2" },
    ],
  },
  {
    id: "pawn-threat",
    category: "threat recognition",
    fen: "6k1/7p/8/6p1/4p3/5N2/7P/6K1 w - - 0 1",
    focus: "f3",
    candidate: { from: "f3", to: "h4" },
    verdict: "capture-available",
    claim: "The pawn on g5 can capture on h4 after Nh4.",
    interpretation:
      "Trace pawn capture diagonals before choosing a destination.",
    line: ["Nh4", "gxh4"],
  },
  {
    id: "multiple-answers",
    category: "multiple acceptable candidates",
    fen: "2r3k1/7p/8/8/8/2B5/7P/6K1 w - - 0 1",
    focus: "c3",
    candidate: { from: "c3", to: "b4" },
    verdict: "unattacked",
    claim: "Bb4 and Bd4 both reach unattacked squares.",
    interpretation:
      "Do not reduce the stated learning goal to one engine move.",
    accepted: [
      { from: "c3", to: "b4" },
      { from: "c3", to: "d4" },
    ],
  },
  {
    id: "smothered-sacrifice",
    category: "sound sacrifice / forcing tactic",
    fen: "5r1k/6pp/4Q2N/8/8/8/P7/K7 w - - 0 1",
    focus: "e6",
    candidate: { from: "e6", to: "g8" },
    verdict: "forced-mate",
    claim: "After Qg8+, Rxg8 is forced and Nf7 is checkmate.",
    interpretation:
      "A provable mating sacrifice is not an error because the queen is capturable.",
    line: ["Qg8+", "Rxg8", "Nf7#"],
  },
  {
    id: "mate-on-attacked-square",
    category: "verified tactical fact",
    fen: "7k/8/5KQ1/8/8/8/P7/8 w - - 0 1",
    focus: "g6",
    candidate: { from: "g6", to: "g7" },
    verdict: "checkmate",
    claim: "Qg7 is checkmate although the black king geometrically attacks g7.",
    interpretation:
      "Terminal chess rules take precedence over a practice heuristic.",
    line: ["Qg7#"],
  },
  {
    id: "en-passant-threat",
    category: "special capture exception",
    fen: "6k1/7p/8/8/3p4/8/4P2P/6K1 w - - 0 1",
    focus: "e2",
    candidate: { from: "e2", to: "e4" },
    verdict: "capture-available",
    claim: "dxe3 en passant legally captures the pawn that moved to e4.",
    interpretation:
      "An unattacked destination is not a guarantee against en passant.",
    line: ["e4", "dxe3"],
  },
  {
    id: "quiet-uncertainty",
    category: "insufficient diagnostic evidence",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    focus: "g1",
    candidate: { from: "g1", to: "f3" },
    verdict: "unattacked",
    claim: "Nf3 is legal and its destination is not attacked.",
    interpretation:
      "No conceptual weakness or plan follows from a quiet legal move.",
  },
  {
    id: "stalemate",
    category: "terminal outcome / uncertainty",
    fen: "7k/8/5KQ1/8/8/8/P7/8 w - - 0 1",
    focus: "g6",
    candidate: { from: "g6", to: "f7" },
    verdict: "draw",
    claim: "Qf7 creates stalemate.",
    interpretation:
      "An unattacked destination does not establish a desirable result.",
    line: ["Qf7"],
  },
  {
    id: "pinned-capture-uncertainty",
    category: "geometric attack versus legal capture",
    fen: "4kN2/4r2p/8/8/6B1/8/P7/4R2K w - - 0 1",
    focus: "f8",
    candidate: { from: "f8", to: "d7" },
    verdict: "attacked-unresolved",
    claim:
      "After Nd7, the pinned rook cannot capture, and Kxd7 is illegal because the bishop protects d7.",
    interpretation:
      "An attack path is not always a legal capture; no confident move diagnosis follows.",
    line: ["Nd7"],
  },
];
