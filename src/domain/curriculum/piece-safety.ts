import type { Lesson, StudentResponse } from "../learning/types";
import type { Square } from "chess.js";

const move = (from: Square, to: Square): StudentResponse => ({
  type: "move",
  move: { from, to },
});
const common = {
  skillTags: ["piece-safety", "threat-awareness"],
  retry: "unlimited",
  completion: "correct-response",
  assessment: false,
} as const;

export const pieceSafetyLesson = {
  id: "piece-safety",
  version: 1,
  title: "Is Your Piece Safe?",
  objective:
    "Notice the opponent’s threats and check a destination before moving.",
  skillTags: ["piece-safety", "threat-awareness", "safe-destinations"],
  introduction: {
    fen: "3r2k1/7p/8/8/3B4/8/7P/6K1 w - - 0 1",
    target: "d4",
    attacker: "d8",
    explanation:
      "A piece is attacked when an opponent’s piece could capture it. The black rook on d8 has a clear line to the white bishop on d4. If White ignores the threat, Black can capture the bishop next turn.",
  },
  exercises: [
    {
      ...common,
      id: "spot-the-rook",
      title: "Find the threat",
      objective: "Identify the opponent’s attacking piece.",
      fen: "3r2k1/7p/8/8/3B4/8/7P/6K1 w - - 0 1",
      focusSquare: "d4",
      instruction:
        "Which black piece attacks the bishop on d4? Select that piece.",
      answer: { type: "attacker", target: "d4", squares: ["d8"] },
      misconceptions: [
        "Selecting the threatened piece instead of its attacker",
        "Rooks move diagonally",
      ],
      hints: [
        "Start with the opponent’s pieces. Which one has a clear path to the bishop?",
        "A rook attacks along a rank or file. Follow the bishop’s file upward.",
      ],
      correctExplanation:
        "Yes. The rook on d8 attacks down the d-file. No piece blocks its path to the bishop on d4.",
      incorrectExplanation:
        "Look for the black piece that could capture the bishop, rather than the bishop itself. Trace its movement toward d4.",
      review: {
        attackers: ["d8"],
        validExamples: [{ type: "square", square: "d8" }],
        invalidExamples: [
          { type: "square", square: "d4" },
          { type: "square", square: "h7" },
        ],
      },
    },
    {
      ...common,
      id: "bishop-escape",
      title: "Find a safe square",
      objective: "Move an attacked bishop out of danger.",
      fen: "2r3k1/7p/8/8/8/2B5/7P/6K1 w - - 0 1",
      focusSquare: "c3",
      instruction:
        "The bishop on c3 is attacked. Move it to any square Black does not attack.",
      answer: { type: "safe-move", from: "c3" },
      misconceptions: [
        "Every legal move is safe",
        "Moving farther always escapes danger",
      ],
      hints: [
        "Before you move, trace the black rook’s line. Then check your destination against every black piece.",
        "Bishops move diagonally. Be careful near the black king: kings attack adjacent squares.",
      ],
      correctExplanation:
        "You left the rook’s file and checked the landing square. More than one escape works here.",
      incorrectExplanation:
        "Leaving one attack is only half the job. Check what attacks the new square, then try another destination.",
      review: {
        attackers: ["c8"],
        validExamples: [move("c3", "b4"), move("c3", "d4")],
        invalidExamples: [move("c3", "g7")],
      },
    },
    {
      ...common,
      id: "pawn-threat",
      title: "Pawns have a say",
      objective: "Account for diagonal pawn attacks.",
      fen: "r5k1/7p/8/6p1/4p3/5N2/7P/6K1 w - - 0 1",
      focusSquare: "f3",
      instruction:
        "Save the knight on f3. Choose a destination that no black piece attacks.",
      answer: { type: "safe-move", from: "f3" },
      misconceptions: [
        "Pawns capture straight ahead",
        "Knights can jump out of every threat safely",
      ],
      hints: [
        "A pawn moves forward, but captures diagonally. Black’s pawns attack toward rank 1.",
        "Check both black pawns on e4 and g5. A knight jumps in an L shape, but its landing square still matters.",
      ],
      correctExplanation:
        "You checked the pawn diagonals before landing. A small pawn can threaten a valuable piece.",
      incorrectExplanation:
        "Check the direction of Black’s pawn captures. Jumping over pieces does not protect a knight after it lands.",
      review: {
        attackers: ["e4"],
        validExamples: [move("f3", "d4"), move("f3", "e5")],
        invalidExamples: [move("f3", "h4")],
      },
    },
    {
      ...common,
      id: "rook-escape",
      title: "Check the whole board",
      objective: "Escape a bishop without entering a rook’s line.",
      fen: "r5k1/7p/1b6/8/3R4/8/7P/7K w - - 0 1",
      focusSquare: "d4",
      instruction:
        "Move the rook on d4 to safety. Look at every black piece before choosing.",
      answer: { type: "safe-move", from: "d4" },
      misconceptions: [
        "Escaping the original attacker guarantees safety",
        "Only nearby pieces are dangerous",
      ],
      hints: [
        "Name the piece attacking your rook. Then scan for a second opponent’s piece.",
        "The bishop attacks diagonals; the black rook attacks ranks and files. Test your destination against both.",
      ],
      correctExplanation:
        "Your rook escaped the bishop’s diagonal without entering another attack.",
      incorrectExplanation:
        "There is more than one black threat to consider. Retrace the rook’s files and the bishop’s diagonals.",
      review: {
        attackers: ["b6"],
        validExamples: [move("d4", "e4"), move("d4", "d3")],
        invalidExamples: [move("d4", "a4"), move("d4", "d8")],
      },
    },
    {
      ...common,
      id: "knight-threat",
      title: "Look beyond straight lines",
      objective:
        "Recognize knight attacks and test a destination against multiple pieces.",
      fen: "3r2k1/7p/5n2/8/4B3/8/7P/6K1 w - - 0 1",
      focusSquare: "e4",
      instruction: "The bishop on e4 is under attack. Find a safe move for it.",
      answer: { type: "safe-move", from: "e4" },
      misconceptions: [
        "Only line-moving pieces attack",
        "Pawns are harmless far from the original threat",
      ],
      hints: [
        "Knights attack in an L shape. Find the black knight’s landing squares before moving.",
        "After leaving the knight’s attack, check the rook’s file and the h7 pawn’s diagonal too.",
      ],
      correctExplanation:
        "You checked different attack patterns together. Use the same scan before each move in your games.",
      incorrectExplanation:
        "Check all three patterns: the knight’s L, the rook’s lines, and the pawn’s diagonal.",
      review: {
        attackers: ["f6"],
        validExamples: [move("e4", "f5"), move("e4", "f3")],
        invalidExamples: [move("e4", "d5"), move("e4", "g6")],
      },
    },
    {
      ...common,
      id: "transfer-safety",
      title: "Your turn to apply it",
      objective: "Apply the safety scan independently in a new position.",
      assessment: true,
      repeatInstruction:
        "You’ve seen this position before. Practice the safety scan again: move the rook on c4 to a square Black does not attack.",
      fen: "r5k1/5b1p/8/8/2R5/8/7P/6K1 w - - 0 1",
      focusSquare: "c4",
      instruction:
        "A new position. Move the rook on c4 to a square Black does not attack. Try without a hint first.",
      answer: { type: "safe-move", from: "c4" },
      misconceptions: ["Remembering a square replaces checking a new position"],
      hints: [
        "Use your routine: find the threat, choose a destination, then scan all of Black’s pieces.",
        "Trace the bishop’s diagonals and the rook’s ranks and files before you settle on a square.",
      ],
      correctExplanation:
        "You applied the safety check in a new position. This is one useful signal; lasting mastery needs more varied practice over time.",
      incorrectExplanation:
        "Pause and scan the full board again. The original attacker may differ from the piece attacking your new square.",
      review: {
        attackers: ["f7"],
        validExamples: [move("c4", "c5"), move("c4", "d4")],
        invalidExamples: [move("c4", "a4"), move("c4", "c8")],
      },
    },
  ],
} as const satisfies Lesson;
