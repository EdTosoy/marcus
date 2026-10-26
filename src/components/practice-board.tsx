"use client";

import { useMemo, useRef, useState } from "react";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { gameStatus, replay, type MoveInput } from "@/domain/chess/game";
import { ChessBoard, type ChessBoardHandle } from "./chess-board";
import { Icon } from "./icon";

export function PracticeBoard() {
  const [startingFen, setStartingFen] = useState(DEFAULT_POSITION);
  const [moves, setMoves] = useState<MoveInput[]>([]);
  const [fenInput, setFenInput] = useState("");
  const [error, setError] = useState("");
  const [positionVersion, setPositionVersion] = useState(0);
  const board = useRef<ChessBoardHandle>(null);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const game = useMemo(() => replay(startingFen, moves), [startingFen, moves]);
  return (
    <main id="main" className="shell lesson-main">
      <div className="lesson-heading">
        <div>
          <h1>A board to think on.</h1>
          <p>Explore legal moves or load a position of your own.</p>
        </div>
      </div>
      <div className="lesson-workbench practice-workbench">
        <section className="board-column" aria-label="Practice position">
          <ChessBoard
            ref={board}
            interactionKey={positionVersion}
            lastMove={moves.at(-1)}
            fen={game.fen()}
            locked={game.isGameOver()}
            orientation={orientation}
            onMove={(move) => {
              setMoves((current) => [...current, move]);
              setError("");
            }}
          />
          <div className="board-controls">
            <button
              className="text-button"
              disabled={!moves.length}
              onClick={() => {
                setMoves((current) => current.slice(0, -1));
                if (moves.length === 1)
                  requestAnimationFrame(() => board.current?.focus());
              }}
            >
              <Icon name="undo" size={17} />
              Undo
            </button>
            <button
              className="text-button"
              disabled={!moves.length}
              onClick={() => {
                setMoves([]);
                setPositionVersion((current) => current + 1);
                requestAnimationFrame(() => board.current?.focus());
              }}
            >
              <Icon name="reset" size={17} />
              Restart position
            </button>
            <button
              className="text-button"
              onClick={() =>
                setOrientation((current) =>
                  current === "white" ? "black" : "white",
                )
              }
            >
              Flip board
            </button>
          </div>
        </section>
        <section className="teaching-column">
          <h2>Take your time.</h2>
          <p className="game-status" role="status">
            {gameStatus(game)}
          </p>
          <p>
            Both sides are yours to move. Legal destinations are marked after
            you select a piece.
          </p>
          <h3>Move history</h3>
          <p className="notation" aria-label="Move history">
            {game.history({ verbose: true }).map((move, index) => (
              <span key={index}>
                {move.color === "w"
                  ? `${Math.floor((Number(startingFen.split(" ")[5]) * 2 - (startingFen.split(" ")[1] === "w" ? 2 : 1) + index) / 2) + 1}. `
                  : index === 0
                    ? `${startingFen.split(" ")[5]}… `
                    : ""}
                {move.san}{" "}
              </span>
            ))}
            {!moves.length && "No moves yet."}
          </p>
          <form
            className="fen-form"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                const position = new Chess(fenInput.trim());
                setStartingFen(position.fen());
                setPositionVersion((current) => current + 1);
                setMoves([]);
                setError("");
              } catch {
                setError(
                  "That FEN is invalid. Include a valid board, both kings, side to move, castling rights, en passant square, and move counters.",
                );
              }
            }}
          >
            <label htmlFor="fen">Load a position (FEN)</label>
            <textarea
              id="fen"
              value={fenInput}
              onChange={(event) => setFenInput(event.target.value)}
              rows={3}
              spellCheck={false}
              placeholder="Paste a full FEN position"
              aria-describedby={error ? "fen-error" : undefined}
              aria-invalid={Boolean(error)}
              required
            />
            {error && (
              <p id="fen-error" role="alert" className="input-notice">
                {error}
              </p>
            )}
            <button className="button quiet" type="submit">
              Load position
            </button>
          </form>
          <button
            className="text-button"
            onClick={() => {
              setStartingFen(DEFAULT_POSITION);
              setPositionVersion((current) => current + 1);
              setMoves([]);
              setFenInput("");
              setError("");
            }}
          >
            Return to starting position
          </button>
          <details className="position-details">
            <summary>Current FEN</summary>
            <code>{game.fen()}</code>
          </details>
        </section>
      </div>
    </main>
  );
}
