import { Chess, type PieceSymbol, type Square } from "chess.js";
import type { Answer, StudentResponse } from "../learning/types";
import { pieceNames } from "../chess/game";
import type { SkillId } from "../adaptive/skills";
import type { ExerciseRole, FoundationExercise } from "../adaptive/types";

// Authored piece maps are a readable representation of fixed positions. chess.js
// performs placement and serializes FEN; no move rules are implemented here.
function fen(pieces: string, turn: "w" | "b" = "w"): string {
  const game = new Chess();
  game.clear();
  for (const token of pieces.split(" ")) {
    const [square, symbol] = token.split(":");
    if (
      !square ||
      !symbol ||
      !game.put(
        {
          type: symbol.toLowerCase() as PieceSymbol,
          color: symbol === symbol.toUpperCase() ? "w" : "b",
        },
        square as Square,
      )
    )
      throw new Error(`Invalid authored piece: ${token}`);
  }
  const fields = game.fen().split(" ");
  fields[1] = turn;
  return new Chess(fields.join(" ")).fen();
}
const sq = (square: Square): StudentResponse => ({ type: "square", square });
const mv = (from: Square, to: Square): StudentResponse => ({
  type: "move",
  move: { from, to },
});
const ch = (choice: string): StudentResponse => ({ type: "choice", choice });

const concepts: Record<
  SkillId,
  {
    title: string;
    concept: string;
    hints: readonly [string, string];
    correct: string;
    incorrect: string;
  }
> = {
  "recognize-attacks": {
    title: "Trace an attack",
    concept:
      "An attack reaches a piece’s square. Trace lines, pawn diagonals, and knight jumps; a blocker stops a line.",
    hints: [
      "Start with the opponent’s pieces and trace their movement toward the marked piece.",
      "Check straight lines, diagonals, pawn direction, and knight jumps. More than one attacker may count.",
    ],
    correct:
      "The selected piece attacks the target. Another attacker, if present, is also accepted.",
    incorrect:
      "That square is not an attacker. Trace the opponent’s movement toward the marked piece, checking for blockers.",
  },
  "attack-defense": {
    title: "Look for both sides",
    concept:
      "A friendly piece can defend a square while an opponent attacks it. Defended does not mean unattacked, and an attacked piece is not automatically lost.",
    hints: [
      "Check the opponent’s attacks first, then trace friendly pieces toward the same square.",
      "A friendly pawn defends on its capture diagonal. A line blocked before the target does not defend it.",
    ],
    correct:
      "Attacks and defenders are separate facts. These are attack paths, not a calculation of who wins a trade.",
    incorrect:
      "Check each side separately. Having a defender does not cancel an attack. Revisit the listed paths before retrying.",
  },
  "hanging-pieces": {
    title: "Is it hanging?",
    concept:
      "Here, hanging means attacked and without a friendly defender. That observation alone does not prove a forced loss: checks, pins, and sacrifices can change a real game.",
    hints: [
      "A hanging piece must satisfy two conditions: attacked, and without a defender.",
      "Count friendly attacks on the target square. A defended piece is not hanging under this lesson’s definition.",
    ],
    correct:
      "You distinguished attacked-and-undefended from merely attacked. No material-loss claim follows from this classification.",
    incorrect:
      "Test both conditions, not just whether the opponent attacks. A sacrifice or a defended piece cannot be called a blunder from this one fact.",
  },
  "destination-safety": {
    title: "Check before landing",
    concept:
      "For this task, choose any legal destination with no opposing attack. This narrow goal does not rank sacrifices, trades, or long-term plans.",
    hints: [
      "Before moving, find the threat. Then check every opponent piece against your intended destination.",
      "Legal does not mean unattacked. Check pawn diagonals and knight jumps as well as lines.",
    ],
    correct:
      "The destination meets the no-attacks goal. Every legal move meeting that goal is accepted.",
    incorrect:
      "Restore the position and choose another destination after checking the new attack. A legal but attacked move misses this task’s goal; it is not necessarily a blunder.",
  },
  "opponent-threats": {
    title: "Imagine the reply",
    concept:
      "Before committing, imagine your proposed move and ask what the opponent can capture immediately. Only a legal opponent reply counts.",
    hints: [
      "Imagine the marked piece on the proposed destination, then look from the opponent’s side.",
      "Check capture patterns at the new square and blockers after the move. Select the opponent piece in the original board.",
    ],
    correct:
      "You considered an immediate legal reply. This does not evaluate the complete tactic or exchange.",
    incorrect:
      "That piece has no legal capture of the proposed destination. Imagine the piece after the move, then trace the opponent’s captures again.",
  },
};
type Seed = {
  id: string;
  role: ExerciseRole;
  skill: SkillId;
  board: string;
  turn?: "w" | "b";
  focus: Square;
  answer: Answer;
  attackers: Square[];
  valid: StudentResponse[];
  wrong: StudentResponse[];
  difficulty?: 1 | 2;
  defenders?: Square[];
  status?: string;
  replySources?: Square[];
};
const seeds: Seed[] = [
  {
    id: "attack-diagnostic",
    role: "diagnostic",
    skill: "recognize-attacks",
    board: "g1:K h2:P c2:P g8:k h7:p c7:p e3:R b6:b",
    focus: "e3",
    answer: { type: "attacker", target: "e3", squares: ["b6"] },
    attackers: ["b6"],
    valid: [sq("b6")],
    wrong: [sq("g8")],
  },
  {
    id: "attack-pawn",
    role: "guided",
    skill: "recognize-attacks",
    board: "a1:K a2:P h8:k h7:p b8:r e4:N f5:p",
    focus: "e4",
    answer: { type: "attacker", target: "e4", squares: ["f5"] },
    attackers: ["f5"],
    valid: [sq("f5")],
    wrong: [sq("b8")],
  },
  {
    id: "attack-black",
    role: "guided",
    skill: "recognize-attacks",
    board: "g1:K h2:P b1:N g8:k h7:p c6:b c1:R",
    turn: "b",
    focus: "c6",
    answer: { type: "attacker", target: "c6", squares: ["c1"] },
    attackers: ["c1"],
    valid: [sq("c1")],
    wrong: [sq("b1")],
    difficulty: 2,
  },
  {
    id: "attack-transfer-lines",
    role: "transfer",
    skill: "recognize-attacks",
    board: "b1:K a2:P h8:k g7:p f4:Q d5:n b8:b",
    focus: "f4",
    answer: { type: "attacker", target: "f4", squares: ["d5", "b8"] },
    attackers: ["d5", "b8"],
    valid: [sq("d5"), sq("b8")],
    wrong: [sq("g7")],
  },
  {
    id: "attack-transfer-file",
    role: "transfer",
    skill: "recognize-attacks",
    board: "h1:K h2:P b8:k a7:p g3:B g8:r f4:p",
    focus: "g3",
    answer: { type: "attacker", target: "g3", squares: ["g8", "f4"] },
    attackers: ["g8", "f4"],
    valid: [sq("g8"), sq("f4")],
    wrong: [sq("a7")],
    difficulty: 2,
  },
  {
    id: "attack-review-black",
    role: "delayed",
    skill: "recognize-attacks",
    board: "g1:K h2:P g7:B a4:R g8:k h7:p d4:n",
    turn: "b",
    focus: "d4",
    answer: { type: "attacker", target: "d4", squares: ["g7", "a4"] },
    attackers: ["g7", "a4"],
    valid: [sq("g7"), sq("a4")],
    wrong: [sq("g1")],
  },
  {
    id: "attack-review-distance",
    role: "delayed",
    skill: "recognize-attacks",
    board: "g1:K h2:P g8:k h7:p b5:R f1:b b8:r",
    focus: "b5",
    answer: { type: "attacker", target: "b5", squares: ["f1", "b8"] },
    attackers: ["f1", "b8"],
    valid: [sq("f1"), sq("b8")],
    wrong: [sq("h7")],
    difficulty: 2,
  },

  {
    id: "defense-diagnostic",
    role: "diagnostic",
    skill: "attack-defense",
    board: "g1:K h2:P g8:k h7:p d4:N g7:b d1:R",
    focus: "d4",
    answer: { type: "status", target: "d4", question: "attack-defense" },
    attackers: ["g7"],
    defenders: ["d1"],
    status: "attacked-defended",
    valid: [ch("attacked-defended")],
    wrong: [ch("attacked-undefended")],
  },
  {
    id: "defense-no-cancel",
    role: "guided",
    skill: "attack-defense",
    board: "g1:K h2:P h8:k h7:p d3:B a3:r c4:P",
    focus: "d3",
    answer: { type: "status", target: "d3", question: "attack-defense" },
    attackers: ["a3"],
    defenders: [],
    status: "attacked-undefended",
    valid: [ch("attacked-undefended")],
    wrong: [ch("attacked-defended")],
  },
  {
    id: "defense-blocker",
    role: "guided",
    skill: "attack-defense",
    board: "g1:K h2:P g8:k h7:p e5:r b2:B c3:P d6:p",
    turn: "b",
    focus: "e5",
    answer: { type: "status", target: "e5", question: "attack-defense" },
    attackers: [],
    defenders: ["d6"],
    status: "unattacked-defended",
    valid: [ch("unattacked-defended")],
    wrong: [ch("attacked-defended")],
    difficulty: 2,
  },
  {
    id: "defense-transfer-knight",
    role: "transfer",
    skill: "attack-defense",
    board: "b1:K a2:P g8:k h7:p h8:r f3:B e4:p d2:N",
    focus: "f3",
    answer: { type: "status", target: "f3", question: "attack-defense" },
    attackers: ["e4"],
    defenders: ["d2"],
    status: "attacked-defended",
    valid: [ch("attacked-defended")],
    wrong: [ch("attacked-undefended")],
  },
  {
    id: "defense-transfer-blocker",
    role: "transfer",
    skill: "attack-defense",
    board: "g1:K h2:P h8:k g7:p b4:n b1:R b3:P f7:b",
    turn: "b",
    focus: "b4",
    answer: { type: "status", target: "b4", question: "attack-defense" },
    attackers: [],
    defenders: [],
    status: "unattacked-undefended",
    valid: [ch("unattacked-undefended")],
    wrong: [ch("attacked-defended")],
    difficulty: 2,
  },
  {
    id: "defense-review-line",
    role: "delayed",
    skill: "attack-defense",
    board: "g1:K h2:P h8:k a7:p e4:R c5:n e1:R",
    focus: "e4",
    answer: { type: "status", target: "e4", question: "attack-defense" },
    attackers: ["c5"],
    defenders: ["e1"],
    status: "attacked-defended",
    valid: [ch("attacked-defended")],
    wrong: [ch("unattacked-defended")],
  },
  {
    id: "defense-review-pawn",
    role: "delayed",
    skill: "attack-defense",
    board: "g1:K h2:P b1:N a1:R g8:k h7:p f5:b e6:p",
    turn: "b",
    focus: "f5",
    answer: { type: "status", target: "f5", question: "attack-defense" },
    attackers: [],
    defenders: ["e6"],
    status: "unattacked-defended",
    valid: [ch("unattacked-defended")],
    wrong: [ch("unattacked-undefended")],
    difficulty: 2,
  },

  {
    id: "hanging-diagnostic",
    role: "diagnostic",
    skill: "hanging-pieces",
    board: "g1:K h2:P g8:k h7:p c4:R e5:n",
    focus: "c4",
    answer: { type: "status", target: "c4", question: "hanging" },
    attackers: ["e5"],
    defenders: [],
    status: "hanging",
    valid: [ch("hanging")],
    wrong: [ch("defended")],
  },
  {
    id: "hanging-defended",
    role: "guided",
    skill: "hanging-pieces",
    board: "g1:K h2:P g8:k h7:p e4:B d5:p f3:P",
    focus: "e4",
    answer: { type: "status", target: "e4", question: "hanging" },
    attackers: ["d5"],
    defenders: ["f3"],
    status: "defended",
    valid: [ch("defended")],
    wrong: [ch("hanging")],
  },
  {
    id: "hanging-black-queen",
    role: "guided",
    skill: "hanging-pieces",
    board: "a1:K a2:P h8:k h7:p b7:p d6:q d1:R",
    turn: "b",
    focus: "d6",
    answer: { type: "status", target: "d6", question: "hanging" },
    attackers: ["d1"],
    defenders: [],
    status: "hanging",
    valid: [ch("hanging")],
    wrong: [ch("unattacked")],
    difficulty: 2,
  },
  {
    id: "hanging-transfer-defense",
    role: "transfer",
    skill: "hanging-pieces",
    board: "a1:K a2:P b2:P g8:k h7:p h8:b c3:N",
    focus: "c3",
    answer: { type: "status", target: "c3", question: "hanging" },
    attackers: ["h8"],
    defenders: ["b2"],
    status: "defended",
    valid: [ch("defended")],
    wrong: [ch("hanging")],
  },
  {
    id: "hanging-transfer-black",
    role: "transfer",
    skill: "hanging-pieces",
    board: "g1:K h2:P d2:B g8:k h7:p b7:p a5:r g7:b",
    turn: "b",
    focus: "a5",
    answer: { type: "status", target: "a5", question: "hanging" },
    attackers: ["d2"],
    defenders: [],
    status: "hanging",
    valid: [ch("hanging")],
    wrong: [ch("defended")],
    difficulty: 2,
  },
  {
    id: "hanging-review-knight",
    role: "delayed",
    skill: "hanging-pieces",
    board: "g1:K h2:P a2:P d2:N h8:k h7:p b3:B b8:r",
    focus: "b3",
    answer: { type: "status", target: "b3", question: "hanging" },
    attackers: ["b8"],
    defenders: ["a2", "d2"],
    status: "defended",
    valid: [ch("defended")],
    wrong: [ch("hanging")],
  },
  {
    id: "hanging-review-quiet",
    role: "delayed",
    skill: "hanging-pieces",
    board: "h1:K h2:P a1:R c3:P g8:k h7:p f4:n e5:p",
    turn: "b",
    focus: "f4",
    answer: { type: "status", target: "f4", question: "hanging" },
    attackers: [],
    defenders: ["e5"],
    status: "unattacked",
    valid: [ch("unattacked")],
    wrong: [ch("hanging")],
    difficulty: 2,
  },

  {
    id: "safety-diagnostic",
    role: "diagnostic",
    skill: "destination-safety",
    board: "g1:K h2:P b8:k a7:p f2:B f8:r e5:p",
    focus: "f2",
    answer: { type: "safe-move", from: "f2" },
    attackers: ["f8"],
    valid: [mv("f2", "g3"), mv("f2", "e3")],
    wrong: [mv("f2", "d4")],
  },
  {
    id: "safety-black-knight",
    role: "guided",
    skill: "destination-safety",
    board: "g1:K h2:P c3:P e1:R g8:k h7:p e6:n",
    turn: "b",
    focus: "e6",
    answer: { type: "safe-move", from: "e6" },
    attackers: ["e1"],
    valid: [mv("e6", "f4"), mv("e6", "g5")],
    wrong: [mv("e6", "d4")],
  },
  {
    id: "safety-rook-lines",
    role: "guided",
    skill: "destination-safety",
    board: "g1:K h2:P g8:k a7:p a4:R d7:b h8:r",
    focus: "a4",
    answer: { type: "safe-move", from: "a4" },
    attackers: ["d7"],
    valid: [mv("a4", "b4"), mv("a4", "a3")],
    wrong: [mv("a4", "h4")],
    difficulty: 2,
  },
  {
    id: "safety-transfer-scan",
    role: "transfer",
    skill: "destination-safety",
    board: "g1:K h2:P h8:k h7:p a8:r d4:N c5:p g7:b e6:p",
    focus: "d4",
    answer: { type: "safe-move", from: "d4" },
    attackers: ["c5", "g7"],
    valid: [mv("d4", "f3"), mv("d4", "b3")],
    wrong: [mv("d4", "f5")],
  },
  {
    id: "safety-transfer-black",
    role: "transfer",
    skill: "destination-safety",
    board: "b1:K a2:P c1:N h4:P f1:R g8:k h7:p f6:b",
    turn: "b",
    focus: "f6",
    answer: { type: "safe-move", from: "f6" },
    attackers: ["f1"],
    valid: [mv("f6", "e5"), mv("f6", "d4")],
    wrong: [mv("f6", "g5")],
    difficulty: 2,
  },
  {
    id: "safety-review-jump",
    role: "delayed",
    skill: "destination-safety",
    board: "h1:K h2:P h8:k a7:p e3:R b6:b g5:n b8:r",
    focus: "e3",
    answer: { type: "safe-move", from: "e3" },
    attackers: ["b6"],
    valid: [mv("e3", "e2"), mv("e3", "d3")],
    wrong: [mv("e3", "f3")],
  },
  {
    id: "safety-review-black",
    role: "delayed",
    skill: "destination-safety",
    board: "g1:K h2:P c4:P g2:B a1:R h8:k h7:p b5:n",
    turn: "b",
    focus: "b5",
    answer: { type: "safe-move", from: "b5" },
    attackers: ["c4"],
    valid: [mv("b5", "d4"), mv("b5", "d6")],
    wrong: [mv("b5", "a3")],
    difficulty: 2,
  },

  {
    id: "reply-diagnostic",
    role: "diagnostic",
    skill: "opponent-threats",
    board: "b1:K a2:P g1:N g8:k h7:p e4:p a8:r",
    focus: "g1",
    answer: { type: "reply", candidate: { from: "g1", to: "f3" } },
    attackers: [],
    replySources: ["e4"],
    valid: [sq("e4")],
    wrong: [sq("g8")],
  },
  {
    id: "reply-two-captures",
    role: "guided",
    skill: "opponent-threats",
    board: "g1:K h2:P a2:R h8:k h7:p b5:b f4:n",
    focus: "a2",
    answer: { type: "reply", candidate: { from: "a2", to: "e2" } },
    attackers: [],
    replySources: ["b5", "f4"],
    valid: [sq("b5"), sq("f4")],
    wrong: [sq("h8")],
  },
  {
    id: "reply-black-bishop",
    role: "guided",
    skill: "opponent-threats",
    board: "g1:K a2:P h3:P b1:R g8:k h7:p c8:b",
    turn: "b",
    focus: "c8",
    answer: { type: "reply", candidate: { from: "c8", to: "g4" } },
    attackers: [],
    replySources: ["h3"],
    valid: [sq("h3")],
    wrong: [sq("g1")],
    difficulty: 2,
  },
  {
    id: "reply-transfer-bishop",
    role: "transfer",
    skill: "opponent-threats",
    board: "g1:K h2:P b2:B a8:k b7:p g7:p h5:n c8:r",
    focus: "b2",
    answer: { type: "reply", candidate: { from: "b2", to: "f6" } },
    attackers: [],
    replySources: ["g7", "h5"],
    valid: [sq("g7"), sq("h5")],
    wrong: [sq("a8")],
  },
  {
    id: "reply-transfer-black",
    role: "transfer",
    skill: "opponent-threats",
    board: "b1:K a2:P g2:P f2:N g8:k a7:p h6:r",
    turn: "b",
    focus: "h6",
    answer: { type: "reply", candidate: { from: "h6", to: "h3" } },
    attackers: [],
    replySources: ["g2", "f2"],
    valid: [sq("g2"), sq("f2")],
    wrong: [sq("b1")],
    difficulty: 2,
  },
  {
    id: "reply-review-knight",
    role: "delayed",
    skill: "opponent-threats",
    board: "b1:K a2:P c3:N h8:k h7:p f5:p e8:r a6:b",
    focus: "c3",
    answer: { type: "reply", candidate: { from: "c3", to: "e4" } },
    attackers: [],
    replySources: ["e8", "f5"],
    valid: [sq("e8"), sq("f5")],
    wrong: [sq("h8")],
  },
  {
    id: "reply-review-black",
    role: "delayed",
    skill: "opponent-threats",
    board: "g1:K h2:P a4:P f1:B g8:k h7:p d7:b b8:r",
    turn: "b",
    focus: "d7",
    answer: { type: "reply", candidate: { from: "d7", to: "b5" } },
    attackers: [],
    replySources: ["a4", "f1"],
    valid: [sq("a4"), sq("f1")],
    wrong: [sq("g1")],
    difficulty: 2,
  },
];

function define(seed: Seed): FoundationExercise {
  const definition = concepts[seed.skill];
  const position = fen(seed.board, seed.turn);
  const piece = new Chess(position).get(seed.focus)!;
  const name = `${piece.color === "w" ? "white" : "black"} ${pieceNames[piece.type]} on ${seed.focus}`;
  let instruction: string;
  if (seed.answer.type === "attacker")
    instruction = `Which opponent piece attacks the ${name}? Select any one attacker.`;
  else if (seed.answer.type === "status")
    instruction =
      seed.answer.question === "hanging"
        ? `Is the ${name} hanging: attacked and without a defender? Choose a description.`
        : `Is the ${name} attacked, defended, both, or neither?`;
  else if (seed.answer.type === "reply") {
    const game = new Chess(position);
    const proposed = game.move(seed.answer.candidate);
    instruction = `Imagine ${piece.color === "w" ? "White" : "Black"} plays ${proposed.san}, moving from ${seed.answer.candidate.from} to ${seed.answer.candidate.to}. Which opponent piece could legally capture it immediately? Select that piece on this original board.`;
  } else
    instruction = `Move the ${name} to any legal square the opponent does not attack.`;
  return {
    id: seed.id,
    contentVersion: 1,
    title: definition.title,
    objective: definition.concept,
    concept: definition.concept,
    role: seed.role,
    skillId: seed.skill,
    difficulty: seed.difficulty ?? 1,
    skillTags: [seed.skill],
    fen: position,
    focusSquare: seed.focus,
    answer: seed.answer,
    instruction,
    hints: definition.hints,
    misconceptions: [
      "An attacked piece is automatically a blunder",
      "Legal moves are always safe",
    ],
    correctExplanation: definition.correct,
    incorrectExplanation: definition.incorrect,
    retry: seed.role === "guided" ? "unlimited" : "none",
    completion:
      seed.role === "guided" ? "correct-response" : "submitted-response",
    assessment: seed.role !== "guided",
    review: {
      attackers: seed.attackers,
      validExamples: seed.valid,
      invalidExamples: seed.wrong,
      ...(seed.defenders ? { defenders: seed.defenders } : {}),
      ...(seed.status ? { status: seed.status } : {}),
      ...(seed.replySources ? { replySources: seed.replySources } : {}),
    },
  };
}
export const foundationExercises: readonly FoundationExercise[] =
  seeds.map(define);
export const findExercise = (id: string) =>
  foundationExercises.find((exercise) => exercise.id === id);
