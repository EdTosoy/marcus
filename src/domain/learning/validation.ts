import { Chess, SQUARES } from "chess.js";
import {
  isSquare,
  opposite,
  pieceNames,
  play,
  type Promotion,
} from "../chess/game";
import type { Exercise, Feedback, Lesson, StudentResponse } from "./types";

export function pieceFacts(fen: string, target: import("chess.js").Square) {
  const game = new Chess(fen);
  const piece = game.get(target);
  if (!piece) throw new Error("A classification target must contain a piece");
  const attackers = game.attackers(target, opposite(piece.color));
  const defenders = game.attackers(target, piece.color);
  return {
    attackers,
    defenders,
    attacked: attackers.length > 0,
    defended: defenders.length > 0,
  };
}

export function responseOptions(
  exercise: Exercise,
): { id: string; label: string }[] {
  if (exercise.answer.type !== "status") return [];
  return exercise.answer.question === "hanging"
    ? [
        { id: "hanging", label: "Attacked and undefended (hanging)" },
        { id: "defended", label: "Attacked, with a defender" },
        { id: "unattacked", label: "Not attacked" },
      ]
    : [
        { id: "attacked-defended", label: "Attacked and defended" },
        { id: "attacked-undefended", label: "Attacked, without a defender" },
        { id: "unattacked-defended", label: "Not attacked, but defended" },
        { id: "unattacked-undefended", label: "Neither attacked nor defended" },
      ];
}

export function expectedStatus(exercise: Exercise): string {
  if (exercise.answer.type !== "status")
    throw new Error("Expected a status question");
  const facts = pieceFacts(exercise.fen, exercise.answer.target);
  return exercise.answer.question === "hanging"
    ? facts.attacked
      ? facts.defended
        ? "defended"
        : "hanging"
      : "unattacked"
    : `${facts.attacked ? "attacked" : "unattacked"}-${facts.defended ? "defended" : "undefended"}`;
}

export function immediateCaptures(exercise: Exercise) {
  if (exercise.answer.type !== "reply") return [];
  const result = play(exercise.fen, exercise.answer.candidate);
  if (!result) return [];
  const target = exercise.answer.candidate.to;
  return result.game
    .moves({ verbose: true })
    .filter(
      (move) =>
        (move.isCapture() && move.to === target) ||
        (move.isEnPassant() && `${move.to[0]}${move.from[1]}` === target),
    );
}

export function validateResponse(
  exercise: Exercise,
  response: StudentResponse,
): Feedback {
  if (response.type === "unsure")
    return {
      kind: "incorrect",
      message: `You chose “not sure”. ${exercise.incorrectExplanation}`,
    };
  const game = new Chess(exercise.fen);
  const answer = exercise.answer;
  if (answer.type === "status") {
    if (
      response.type !== "choice" ||
      !responseOptions(exercise).some((option) => option.id === response.choice)
    )
      return {
        kind: "invalid",
        message: "Choose one of the piece descriptions.",
      };
    const correct = response.choice === expectedStatus(exercise);
    const facts = pieceFacts(exercise.fen, answer.target);
    const describe = (squares: import("chess.js").Square[]) =>
      squares.length
        ? squares
            .map(
              (square) => `${pieceNames[game.get(square)!.type]} on ${square}`,
            )
            .join(", ")
        : "none";
    return {
      kind: correct ? "correct" : "incorrect",
      message: `Attackers: ${describe(facts.attackers)}. Defenders: ${describe(facts.defenders)}. ${correct ? exercise.correctExplanation : exercise.incorrectExplanation}`,
    };
  }
  if (answer.type === "reply") {
    if (response.type !== "square")
      return {
        kind: "invalid",
        message:
          "Select the opponent piece that could make the capture after the proposed move.",
      };
    const replies = immediateCaptures(exercise);
    const correct = replies.some((move) => move.from === response.square);
    const result = play(exercise.fen, answer.candidate)!;
    return {
      kind: correct ? "correct" : "incorrect",
      message: correct
        ? `After ${result.move.san}, ${replies
            .filter((move) => move.from === response.square)
            .map((move) => move.san)
            .join(
              " or ",
            )} can capture that piece. ${exercise.correctExplanation}`
        : exercise.incorrectExplanation,
    };
  }
  if (answer.type === "attacker") {
    if (response.type !== "square")
      return {
        kind: "invalid",
        message: "Select a square to identify the attacking piece.",
      };
    const correct = answer.squares.includes(response.square);
    return {
      kind: correct ? "correct" : "incorrect",
      message: correct
        ? exercise.correctExplanation
        : exercise.incorrectExplanation,
    };
  }
  if (response.type !== "move")
    return { kind: "invalid", message: "Make a move on the board." };
  const result = play(exercise.fen, response.move);
  if (!result)
    return {
      kind: "invalid",
      message:
        "That move is not legal. Choose one of the marked legal destinations.",
    };
  if (answer.type === "safe-move" && response.move.from !== answer.from) {
    return {
      kind: "invalid",
      message: `For this exercise, move the ${pieceNames[game.get(answer.from)!.type]} on ${answer.from}.`,
    };
  }
  const attackers = result.game.attackers(
    response.move.to,
    opposite(game.turn()),
  );
  const correct =
    answer.type === "safe-move"
      ? attackers.length === 0
      : answer.moves.some(
          (move) =>
            move.from === response.move.from &&
            move.to === response.move.to &&
            move.promotion === response.move.promotion,
        );
  const reason = correct
    ? `${result.move.san} works: no ${game.turn() === "w" ? "black" : "white"} piece attacks ${response.move.to}. ${exercise.correctExplanation}`
    : answer.type === "safe-move"
      ? `${result.move.san} is legal, but ${response.move.to} is attacked by ${attackers.map((square) => `the ${pieceNames[result.game.get(square)!.type]} on ${square}`).join(" and ")}. ${exercise.incorrectExplanation}`
      : exercise.incorrectExplanation;
  return {
    kind: correct ? "correct" : "incorrect",
    message:
      answer.type === "moves" && correct ? exercise.correctExplanation : reason,
    fen: result.game.fen(),
    san: result.move.san,
    attackers,
  };
}

export function acceptableResponses(exercise: Exercise): StudentResponse[] {
  if (exercise.answer.type === "status")
    return [{ type: "choice", choice: expectedStatus(exercise) }];
  if (exercise.answer.type === "reply")
    return [
      ...new Set(immediateCaptures(exercise).map((move) => move.from)),
    ].map((square) => ({ type: "square", square }));
  if (exercise.answer.type === "attacker")
    return exercise.answer.squares.map((square) => ({
      type: "square",
      square,
    }));
  return new Chess(exercise.fen)
    .moves({ verbose: true })
    .map((move) => ({
      type: "move" as const,
      move: {
        from: move.from,
        to: move.to,
        ...(move.promotion ? { promotion: move.promotion as Promotion } : {}),
      },
    }))
    .filter(
      (response) => validateResponse(exercise, response).kind === "correct",
    );
}

function requireContent(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(`Invalid lesson content: ${message}`);
}

export function assertPosition(fen: string) {
  const game = new Chess(fen); // Includes structural FEN validation from chess.js.
  const waitingKing = SQUARES.find(
    (square) =>
      game.get(square)?.type === "k" &&
      game.get(square)?.color === opposite(game.turn()),
  );
  requireContent(
    waitingKing && !game.isAttacked(waitingKing, game.turn()),
    "the side not to move cannot already be in check",
  );
  requireContent(
    !game.isGameOver(),
    "exercise must start in a playable position",
  );
  return game;
}

export function assertLesson(lesson: Lesson): void {
  requireContent(
    lesson.id &&
      lesson.title &&
      lesson.objective &&
      Number.isInteger(lesson.version) &&
      lesson.version > 0,
    "lesson metadata",
  );
  requireContent(
    lesson.skillTags.length && lesson.exercises.length,
    "lesson needs skills and exercises",
  );
  const intro = assertPosition(lesson.introduction.fen);
  requireContent(
    intro
      .attackers(lesson.introduction.target, opposite(intro.turn()))
      .includes(lesson.introduction.attacker),
    "intro arrow must show a real attack",
  );
  const ids = new Set<string>();
  for (const exercise of lesson.exercises) {
    requireContent(
      exercise.id && !ids.has(exercise.id),
      "unique exercise identifiers",
    );
    ids.add(exercise.id);
    assertExercise(exercise);
  }
  const assessments = lesson.exercises.filter(
    (exercise) => exercise.assessment,
  );
  for (const assessment of assessments) {
    requireContent(
      !lesson.exercises.some(
        (exercise) =>
          !exercise.assessment &&
          exercise.fen.split(" ")[0] === assessment.fen.split(" ")[0],
      ),
      "assessment position must be unseen in practice",
    );
  }
}

export function assertExercise(exercise: Exercise): void {
  requireContent(
    exercise.title &&
      exercise.objective &&
      exercise.instruction &&
      exercise.correctExplanation &&
      exercise.incorrectExplanation,
    `${exercise.id}: missing text`,
  );
  requireContent(
    exercise.hints.length >= 2 &&
      exercise.hints.every(Boolean) &&
      exercise.misconceptions.length &&
      exercise.skillTags.length,
    `${exercise.id}: teaching metadata`,
  );
  requireContent(
    (exercise.retry === "unlimited" &&
      exercise.completion === "correct-response") ||
      (exercise.retry === "none" &&
        exercise.completion === "submitted-response"),
    "unsupported progression policy",
  );
  const game = assertPosition(exercise.fen);
  requireContent(
    isSquare(exercise.focusSquare) &&
      game.get(exercise.focusSquare)?.color === game.turn(),
    "focus must be a student piece",
  );
  const attackers = game
    .attackers(exercise.focusSquare, opposite(game.turn()))
    .sort();
  requireContent(
    JSON.stringify(attackers) ===
      JSON.stringify([...exercise.review.attackers].sort()),
    `${exercise.id}: reviewed attackers mismatch`,
  );
  if (exercise.answer.type === "attacker") {
    const actual = game
      .attackers(exercise.answer.target, opposite(game.turn()))
      .sort();
    requireContent(
      actual.length &&
        JSON.stringify(actual) ===
          JSON.stringify([...exercise.answer.squares].sort()),
      "accept every attacking piece",
    );
  } else if (exercise.answer.type === "safe-move") {
    requireContent(
      exercise.answer.from === exercise.focusSquare && attackers.length,
      "safety exercise must begin with an attacked piece",
    );
  } else if (exercise.answer.type === "moves") {
    requireContent(
      exercise.answer.moves.length &&
        exercise.answer.moves.every((move) => play(exercise.fen, move)),
      "expected moves must be legal",
    );
  }
  if (exercise.answer.type === "status") {
    requireContent(
      exercise.answer.target === exercise.focusSquare,
      "classification target must match focus",
    );
    expectedStatus(exercise);
  }
  if (exercise.answer.type === "reply")
    requireContent(
      play(exercise.fen, exercise.answer.candidate) &&
        immediateCaptures(exercise).length,
      "a reply question needs a legal candidate and immediate capture",
    );
  requireContent(
    acceptableResponses(exercise).length,
    `${exercise.id}: no acceptable responses`,
  );
  requireContent(
    exercise.review.validExamples.length &&
      exercise.review.invalidExamples.length,
    "review examples required",
  );
  for (const response of exercise.review.validExamples)
    requireContent(
      validateResponse(exercise, response).kind === "correct",
      `${exercise.id}: valid review example`,
    );
  for (const response of exercise.review.invalidExamples)
    requireContent(
      validateResponse(exercise, response).kind === "incorrect",
      `${exercise.id}: invalid review example must be legal but incorrect`,
    );
}
