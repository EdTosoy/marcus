"use client";

import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard, defaultArrowOptions } from "react-chessboard";
import {
  isSquare,
  gameStatus,
  pieceNames,
  type MoveInput,
  type Promotion,
} from "@/domain/chess/game";
import { nextBoardSquare } from "./board-navigation";

export type ChessBoardHandle = { focus: () => void };
type Props = {
  fen: string;
  onMove?: (move: MoveInput) => void;
  onSquare?: (square: Square) => void;
  locked?: boolean;
  lockedMessage?: string;
  focusSquare?: Square;
  arrow?: { from: Square; to: Square };
  lastMove?: Pick<MoveInput, "from" | "to">;
  orientation?: "white" | "black";
  interactionKey?: string | number;
  ref?: Ref<ChessBoardHandle>;
};
type Interaction = {
  key: string;
  selected: Square | null;
  promotion: { from: Square; to: Square } | null;
  notice: string;
};

export function ChessBoard({
  fen,
  onMove,
  onSquare,
  locked = false,
  lockedMessage,
  focusSquare,
  arrow,
  lastMove,
  orientation = "white",
  interactionKey = "",
  ref,
}: Props) {
  const id = useId().replaceAll(":", "");
  const root = useRef<HTMLDivElement>(null);
  const promotionChoice = useRef<HTMLButtonElement>(null);
  const focusWithin = useRef(false);
  const game = useMemo(() => new Chess(fen), [fen]);
  const positionKey = `${fen}|${interactionKey}|${locked}`;
  const livePositionKey = useRef<string | null>(positionKey);
  useLayoutEffect(() => {
    livePositionKey.current = positionKey;
    return () => {
      livePositionKey.current = null;
    };
  }, [positionKey]);
  const [interaction, setInteraction] = useState<Interaction>({
    key: positionKey,
    selected: null,
    promotion: null,
    notice: "",
  });
  // Reset transient state without remounting square controls or losing focus.
  if (interaction.key !== positionKey)
    setInteraction({
      key: positionKey,
      selected: null,
      promotion: null,
      notice: "",
    });
  const { selected, promotion, notice } =
    interaction.key === positionKey
      ? interaction
      : { selected: null, promotion: null, notice: "" };
  const [focused, setFocused] = useState<Square>("a1");
  const legal = selected ? game.moves({ square: selected, verbose: true }) : [];
  const unavailable = locked || (!onSquare && (game.isGameOver() || !onMove));
  const side = game.turn() === "w" ? "White" : "Black";
  const terminal = !onSquare && game.isGameOver();
  const pausedDescription =
    lockedMessage ??
    (terminal
      ? gameStatus(game)
      : "Position paused. Read the explanation to continue.");
  const modeDescription = unavailable
    ? terminal && !lockedMessage
      ? ""
      : pausedDescription
    : onSquare
      ? "Activate a square to answer."
      : "Select a piece, then a destination.";
  const description = `${terminal ? gameStatus(game) : `${side} to move${game.inCheck() ? ", in check" : ""}.`} ${orientation === "white" ? "White" : "Black"} at the bottom. ${modeDescription}`;

  function update(patch: Partial<Interaction>) {
    setInteraction((current) => ({ ...current, ...patch }));
  }
  function focus(square: Square, preventScroll = false) {
    setFocused(square);
    root.current
      ?.querySelector<HTMLElement>(`[data-board-square="${square}"]`)
      ?.focus({ preventScroll });
  }
  useImperativeHandle(ref, () => ({ focus: () => focus(focused) }));
  useLayoutEffect(() => {
    if (promotion) promotionChoice.current?.focus();
  }, [promotion]);
  useLayoutEffect(() => {
    if (
      !promotion &&
      focusWithin.current &&
      document.activeElement === document.body
    )
      root.current
        ?.querySelector<HTMLElement>(`[data-board-square="${focused}"]`)
        ?.focus({ preventScroll: true });
  }, [positionKey, promotion, focused]);

  function requestMove(from: Square, to: Square): boolean {
    // The pinned renderer may finish a drag with its drag-start callback.
    // A reset, lock, new FEN or unmount makes that callback obsolete.
    if (livePositionKey.current !== positionKey) return false;
    if (unavailable || promotion || !onMove) return false;
    const options = game
      .moves({ square: from, verbose: true })
      .filter((move) => move.to === to);
    focus(to, true);
    if (!options.length) {
      update({
        notice:
          "That move is not legal. Select a piece and choose a marked destination.",
      });
      return false;
    }
    update({
      selected: null,
      notice: "",
      promotion: options.some((move) => move.promotion) ? { from, to } : null,
    });
    if (!options.some((move) => move.promotion)) onMove({ from, to });
    return true;
  }
  function select(square: Square) {
    focus(square, true);
    if (unavailable || promotion) return;
    if (onSquare) {
      onSquare(square);
      return;
    }
    if (selected === square) {
      update({ selected: null, notice: "Selection cancelled." });
      return;
    }
    const piece = game.get(square);
    if (piece?.color === game.turn()) {
      update({
        selected: square,
        notice: `${pieceNames[piece.type]} on ${square} selected. Marked squares are legal moves; they may still be attacked.`,
      });
    } else if (selected) requestMove(selected, square);
    else update({ notice: `Select a ${side.toLowerCase()} piece to move.` });
  }
  function cancel() {
    const source = promotion?.from ?? selected;
    update({ selected: null, promotion: null, notice: "Selection cancelled." });
    if (source) focus(source);
  }
  function navigate(event: KeyboardEvent<HTMLDivElement>, square: Square) {
    // Keep the visual drag sensor out of square-keyboard activation.
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      select(square);
      return;
    }
    const next = nextBoardSquare(square, event.key, orientation, event.ctrlKey);
    if (!next) return;
    event.preventDefault();
    event.stopPropagation();
    focus(next);
  }

  return (
    <div
      className="board-interaction"
      ref={root}
      onFocusCapture={() => {
        focusWithin.current = true;
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          focusWithin.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          // The renderer's document listener must also cancel a pointer drag.
          cancel();
        }
      }}
    >
      <div
        className="chess-surface"
        role="group"
        aria-label="Interactive chessboard"
        aria-describedby={`${id}-description ${id}-help ${id}-legend`}
      >
        <Chessboard
          options={{
            id,
            position: fen,
            boardOrientation: orientation,
            showNotation: true,
            showAnimations: false,
            allowDrawingArrows: false,
            arrowOptions: {
              ...defaultArrowOptions,
              opacity: 1,
              arrowStartOffset: 0.4,
            },
            allowDragging: !unavailable && !onSquare && !promotion,
            canDragPiece: ({ piece }) => piece.pieceType[0] === game.turn(),
            onPieceDrag: ({ square }) => {
              if (square && isSquare(square)) {
                focus(square, true);
                update({ selected: square });
              }
            },
            onPieceDragCancel: () =>
              update({ selected: null, notice: "Move cancelled." }),
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
                    color: "var(--board-dot)",
                  },
                ]
              : [],
            squareRenderer: ({ square, children }) => {
              const piece = isSquare(square) ? game.get(square) : undefined;
              const destination = legal.find((move) => move.to === square);
              const capture = Boolean(destination?.captured);
              const check =
                piece?.type === "k" &&
                piece.color === game.turn() &&
                game.inCheck();
              const last = lastMove?.from === square || lastMove?.to === square;
              const label = `${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${pieceNames[piece.type]}` : " empty"}${destination ? `, legal destination${capture ? ", capture" : ""}` : ""}${focusSquare === square ? ", instructional highlight" : ""}${check ? ", in check" : ""}${last ? `, last move ${lastMove.from === square ? "from" : "to"}` : ""}`;
              return (
                <div
                  role="button"
                  id={`${id}-key-${square}`}
                  data-board-square={square}
                  aria-label={label}
                  aria-pressed={
                    !onSquare && piece?.color === game.turn()
                      ? selected === square
                      : undefined
                  }
                  aria-disabled={unavailable || Boolean(promotion)}
                  tabIndex={focused === square ? 0 : -1}
                  className={`board-square square-control ${selected === square ? "selected" : ""} ${focusSquare === square ? "piece-focus" : ""} ${destination ? (capture ? "capture-destination legal-destination" : "legal-destination") : ""} ${last ? "last-move" : ""}`}
                  onFocus={() => {
                    if (isSquare(square)) setFocused(square);
                  }}
                  onKeyDownCapture={(event) => {
                    if (isSquare(square)) navigate(event, square);
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isSquare(square)) select(square);
                  }}
                >
                  <div
                    className="piece-visual"
                    aria-hidden="true"
                    ref={(element) => {
                      // 5.12.1 has no drag-wrapper accessibility option. These visual
                      // wrappers keep pointer listeners; the square owns keyboard/AT.
                      element
                        ?.querySelectorAll<HTMLElement>(
                          "[tabindex], [role=button]",
                        )
                        .forEach((child) => {
                          for (const attribute of [
                            "tabindex",
                            "role",
                            "aria-roledescription",
                            "aria-describedby",
                            "aria-pressed",
                            "aria-disabled",
                          ])
                            child.removeAttribute(attribute);
                        });
                    }}
                  >
                    {children}
                  </div>
                  {check && (
                    <span className="check-marker" aria-hidden="true">
                      !
                    </span>
                  )}
                </div>
              );
            },
          }}
        />
      </div>
      {promotion && (
        <fieldset
          className="promotion-picker"
          aria-describedby={`${id}-promotion`}
        >
          <legend>Promote your pawn to…</legend>
          <p id={`${id}-promotion`}>
            Pawn from {promotion.from} to {promotion.to}. Choose a piece or
            cancel.
          </p>
          {(["q", "r", "b", "n"] as const).map((piece: Promotion, index) => (
            <button
              key={piece}
              type="button"
              ref={index === 0 ? promotionChoice : undefined}
              className="button quiet"
              onClick={() => {
                if (unavailable) return;
                const move = { ...promotion, promotion: piece };
                update({ promotion: null });
                focus(promotion.to);
                onMove?.(move);
              }}
            >
              {pieceNames[piece]}
            </button>
          ))}
          <button type="button" className="text-button" onClick={cancel}>
            Cancel promotion
          </button>
        </fieldset>
      )}
      <p id={`${id}-description`} className="sr-only">
        {description}
      </p>
      <p id={`${id}-help`} className="board-help">
        {unavailable
          ? pausedDescription
          : onSquare
            ? "Tap a square to answer."
            : "Tap a piece, then a destination. Or drag to move."}{" "}
        <span>
          Keyboard: arrows to explore, Enter or Space to activate, Escape to
          cancel. Home/End: row edges; Ctrl+Home/End: board edges.
        </span>
      </p>
      <p id={`${id}-legend`} className="sr-only">
        Solid outline: selected. Dot: legal move. Ring: capture. Corner marks:
        last move. Exclamation mark: check. Dashed outline: instructional
        highlight.
        {arrow && ` Instructional arrow from ${arrow.from} to ${arrow.to}.`}
      </p>
      <p className="sr-only" role="status" aria-atomic="true">
        {notice}
      </p>
    </div>
  );
}
