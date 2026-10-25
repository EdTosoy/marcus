"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import {
  isSquare,
  pieceNames,
  type MoveInput,
  type Promotion,
} from "@/domain/chess/game";

type Props = {
  fen: string;
  onMove?: (move: MoveInput) => void;
  onSquare?: (square: Square) => void;
  locked?: boolean;
  focusSquare?: Square;
  arrow?: { from: Square; to: Square };
  orientation?: "white" | "black";
};

export function ChessBoard({
  fen,
  onMove,
  onSquare,
  locked = false,
  focusSquare,
  arrow,
  orientation = "white",
}: Props) {
  const id = useId().replaceAll(":", "");
  const game = useMemo(() => new Chess(fen), [fen]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [focused, setFocused] = useState<Square>("a1");
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const legal = selected ? game.moves({ square: selected, verbose: true }) : [];

  function requestMove(from: Square, to: Square): boolean {
    if (locked || game.isGameOver() || !onMove) return false;
    const options = game
      .moves({ square: from, verbose: true })
      .filter((move) => move.to === to);
    if (!options.length) {
      setNotice(
        "That move is not legal. Select a piece and choose a marked destination.",
      );
      return false;
    }
    if (options.some((move) => move.promotion)) setPromotion({ from, to });
    else onMove({ from, to });
    setSelected(null);
    setNotice("");
    return true;
  }

  function select(square: Square) {
    if (locked || promotion) return;
    if (onSquare) {
      onSquare(square);
      return;
    }
    if (game.isGameOver()) return;
    if (selected === square) {
      setSelected(null);
      return;
    }
    const piece = game.get(square);
    if (piece?.color === game.turn()) {
      setSelected(square);
      setNotice(
        `${pieceNames[piece.type]} on ${square} selected. Marked squares are legal moves; they may still be attacked.`,
      );
    } else if (selected) requestMove(selected, square);
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>, square: Square) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      select(square);
      return;
    }
    if (event.key === "Escape") {
      setSelected(null);
      return;
    }
    const direction = orientation === "white" ? 1 : -1;
    const delta: Record<string, [number, number]> = {
      ArrowRight: [direction, 0],
      ArrowLeft: [-direction, 0],
      ArrowUp: [0, direction],
      ArrowDown: [0, -direction],
    };
    const change = delta[event.key];
    if (!change) return;
    event.preventDefault();
    event.stopPropagation();
    const file = Math.max(97, Math.min(104, square.charCodeAt(0) + change[0]));
    const rank = Math.max(1, Math.min(8, Number(square[1]) + change[1]));
    const next = `${String.fromCharCode(file)}${rank}`;
    if (isSquare(next)) {
      setFocused(next);
      document.getElementById(`${id}-key-${next}`)?.focus();
    }
  }

  return (
    <div className="board-interaction">
      <div
        className="chess-surface"
        aria-label="Interactive chessboard"
        aria-describedby={`${id}-help`}
      >
        <Chessboard
          options={{
            id,
            position: fen,
            boardOrientation: orientation,
            showNotation: true,
            showAnimations: false,
            allowDrawingArrows: false,
            allowDragging:
              !locked && !onSquare && !promotion && !game.isGameOver(),
            canDragPiece: ({ piece }) => piece.pieceType[0] === game.turn(),
            onPieceDrag: ({ square }) => {
              if (square && isSquare(square)) setSelected(square);
            },
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              isSquare(sourceSquare) &&
              targetSquare !== null &&
              isSquare(targetSquare) &&
              requestMove(sourceSquare, targetSquare),
            onSquareClick: ({ square }) => {
              if (isSquare(square)) select(square);
            },
            lightSquareStyle: { backgroundColor: "var(--board-light)" },
            darkSquareStyle: { backgroundColor: "var(--board-dark)" },
            lightSquareNotationStyle: { color: "var(--board-notation)" },
            darkSquareNotationStyle: { color: "var(--board-notation)" },
            arrows: arrow
              ? [
                  {
                    startSquare: arrow.from,
                    endSquare: arrow.to,
                    color: "var(--color-accent)",
                  },
                ]
              : [],
            squareRenderer: ({ square, children }) => {
              const piece = isSquare(square) ? game.get(square) : undefined;
              const destination = legal.some((move) => move.to === square);
              return (
                <div
                  id={`${id}-key-${square}`}
                  role="button"
                  aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${pieceNames[piece.type]}` : " empty"}${destination ? ", legal destination" : ""}`}
                  aria-pressed={selected === square}
                  aria-disabled={locked}
                  tabIndex={focused === square ? 0 : -1}
                  className={`board-square ${selected === square ? "selected" : ""} ${focusSquare === square ? "piece-focus" : ""} ${destination ? "legal-destination" : ""}`}
                  onFocus={() => {
                    if (isSquare(square)) setFocused(square);
                  }}
                  onKeyDownCapture={(event) => {
                    if (isSquare(square)) navigate(event, square);
                  }}
                  ref={(element) => {
                    element
                      ?.querySelectorAll<HTMLElement>("[tabindex]")
                      .forEach((child) => {
                        child.tabIndex = -1;
                      });
                  }}
                >
                  <div className="piece-visual" aria-hidden="true">
                    {children}
                  </div>
                </div>
              );
            },
          }}
        />
      </div>
      {promotion && (
        <fieldset className="promotion-picker">
          <legend>Promote your pawn to…</legend>
          {(["q", "r", "b", "n"] as const).map((piece: Promotion) => (
            <button
              key={piece}
              className="button quiet"
              onClick={() => {
                onMove?.({ ...promotion, promotion: piece });
                setPromotion(null);
              }}
            >
              {pieceNames[piece]}
            </button>
          ))}
          <button className="text-button" onClick={() => setPromotion(null)}>
            Cancel promotion
          </button>
        </fieldset>
      )}
      <p id={`${id}-help`} className="board-help">
        {locked
          ? "Position paused. Read the explanation to continue."
          : onSquare
            ? "Tap a piece to answer."
            : "Tap a piece, then a destination. Or drag to move."}{" "}
        <span>Keyboard: arrow keys to explore, Enter to select.</span>
      </p>
      <p className="sr-only" role="status">
        {notice}
      </p>
    </div>
  );
}
