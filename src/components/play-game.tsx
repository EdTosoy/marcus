"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gameStatus, replay } from "@/domain/chess/game";
import {
  gamePgn,
  moveInGame,
  newGame,
  resignGame,
} from "@/domain/gameplay/session";
import { difficulties, type Difficulty } from "@/engine/types";
import { saveSession } from "@/infrastructure/game-progress";
import { ChessBoard } from "./chess-board";
import { useGameProgress } from "./use-game-progress";
import { useChessEngine } from "./use-chess-engine";
import { downloadText } from "@/infrastructure/download";

export function PlayGame() {
  const { data, ready, notice, update } = useGameProgress();
  const engine = useChessEngine();
  const [color, setColor] = useState<"w" | "b">("w");
  const [difficulty, setDifficulty] = useState<Difficulty>("getting-started");
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [retry, setRetry] = useState(0);
  const session = data.active;
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const previouslyActive = useRef(false);
  const hasActiveGame = Boolean(session);
  useEffect(() => {
    // Only an actual game ending moves focus; restoring a saved result does not.
    if (previouslyActive.current && !hasActiveGame)
      resultHeading.current?.focus();
    previouslyActive.current = hasActiveGame;
  }, [hasActiveGame]);
  const game = useMemo(
    () => (session ? replay(session.startingFen, session.moves) : null),
    [session],
  );
  const engineTurn = Boolean(session && game && game.turn() !== session.player);
  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);
  useEffect(() => {
    if (!session || !game || !engineTurn || paused) return;
    const controller = new AbortController();
    const fen = game.fen(),
      id = session.id;
    const settings = difficulties[session.difficulty];
    void engine()
      .search(
        {
          gameId: id,
          fen,
          startingFen: session.startingFen,
          moves: session.moves,
          skill: settings.skill,
          timeMs: settings.timeMs,
          nodes: settings.nodes,
          depth: settings.depth,
        },
        controller.signal,
      )
      .then((result) => {
        if (controller.signal.aborted || !result.bestMove) return;
        update((current) => {
          const active = current.active;
          if (
            !active ||
            active.id !== id ||
            replay(active.startingFen, active.moves).fen() !== result.fen
          )
            return current;
          return saveSession(
            current,
            moveInGame(active, result.bestMove!, "engine", Date.now()),
          );
        });
      })
      .catch((problem: unknown) => {
        if (!controller.signal.aborted)
          setError(
            problem instanceof Error
              ? problem.message
              : "Engine calculation failed.",
          );
      });
    return () => controller.abort();
  }, [session, game, engineTurn, paused, retry, engine, update]);
  function start() {
    setError("");
    setPaused(false);
    update((current) => {
      const nextColor = current.active?.player ?? color;
      const nextDifficulty = current.active?.difficulty ?? difficulty;
      const saved = current.active
        ? saveSession(current, resignGame(current.active, Date.now()))
        : current;
      return saveSession(
        saved,
        newGame(crypto.randomUUID(), nextColor, nextDifficulty, Date.now()),
      );
    });
  }
  return (
    <main id="main" className="shell gameplay-main">
      <div className="lesson-heading">
        <div>
          <h1>A game to learn from.</h1>
          <p>Think for yourself. Revisit a few decisions after the game.</p>
        </div>
      </div>
      {notice && (
        <p className="storage-notice" role="status">
          {notice}
        </p>
      )}
      {!ready ? (
        <p role="status">Restoring local games…</p>
      ) : session && game ? (
        <div className="game-workbench">
          <section aria-label="Game board">
            <p className="game-status" role="status">
              {gameStatus(game)}
            </p>
            <ChessBoard
              interactionKey={session.id}
              lastMove={session.moves.at(-1)}
              fen={game.fen()}
              orientation={session.player === "w" ? "white" : "black"}
              locked={engineTurn || paused}
              lockedMessage={
                paused
                  ? "Game paused. Resume when ready."
                  : error
                    ? "The engine stopped. Restart it or resign the game."
                    : "Stockfish is thinking. Your turn follows its move."
              }
              onMove={(move) => {
                setError("");
                update((current) =>
                  current.active?.id === session.id
                    ? saveSession(
                        current,
                        moveInGame(current.active, move, "learner", Date.now()),
                      )
                    : current,
                );
              }}
            />
          </section>
          <section className="game-sidebar" aria-label="Game controls">
            <h2 aria-live="polite" aria-atomic="true">
              {engineTurn
                ? paused
                  ? "Game paused"
                  : error
                    ? "Engine needs attention"
                    : "Stockfish is thinking…"
                : paused
                  ? "Game paused"
                  : "Your decision"}
            </h2>
            <p>
              {engineTurn
                ? "The board will unlock when it is your turn."
                : "Look for threats, consider a move, then imagine the reply."}
            </p>
            <p className="small muted">
              You play {session.player === "w" ? "White" : "Black"}.{" "}
              {difficulties[session.difficulty].label} difficulty is
              approximate, not a chess rating. No evaluations or suggestions
              appear during play.
            </p>
            {error && (
              <div role="alert" className="input-notice">
                <p>{error}</p>
                <button
                  className="button quiet"
                  onClick={() => {
                    engine().restart();
                    setError("");
                    setRetry((n) => n + 1);
                  }}
                >
                  Restart engine
                </button>
              </div>
            )}
            <button
              className="button quiet"
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? "Resume game" : "Pause game"}
            </button>
            <h3>Move history</h3>
            <p className="notation" aria-label="Move history">
              {game.history().map((san, index) => (
                <span key={index}>
                  {index % 2 === 0 ? `${Math.floor(index / 2) + 1}. ` : ""}
                  {san}{" "}
                </span>
              ))}
              {!session.moves.length && "No moves yet."}
            </p>
            <button
              className="button quiet"
              onClick={() => {
                engine().cancel();
                update((current) =>
                  current.active
                    ? saveSession(
                        current,
                        resignGame(current.active, Date.now()),
                      )
                    : current,
                );
              }}
            >
              Resign game
            </button>
            <button className="text-button" onClick={start}>
              Resign and restart
            </button>
            <button
              className="text-button"
              onClick={() =>
                downloadText(
                  gamePgn(session),
                  "marcus-game.pgn",
                  "application/x-chess-pgn",
                )
              }
            >
              Export current PGN
            </button>
          </section>
        </div>
      ) : (
        <section className="game-setup" aria-label="New game">
          {data.games[0] && (
            <div className="feedback">
              <h2 ref={resultHeading} tabIndex={-1}>
                {data.games[0].outcome?.reason}
              </h2>
              <p>Game saved locally. Pick a few decisions to investigate.</p>
              <Link
                className="button primary"
                href={`/review?game=${data.games[0].id}`}
              >
                Review this game
              </Link>
            </div>
          )}
          <h2>Choose your game</h2>
          <fieldset className="answer-options">
            <legend>Your color</legend>
            <label>
              <input
                type="radio"
                name="color"
                checked={color === "w"}
                onChange={() => setColor("w")}
              />{" "}
              White
            </label>
            <label>
              <input
                type="radio"
                name="color"
                checked={color === "b"}
                onChange={() => setColor("b")}
              />{" "}
              Black
            </label>
          </fieldset>
          <label className="game-select">
            Approximate difficulty
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as Difficulty)
              }
            >
              {Object.entries(difficulties).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <p>
            Even Getting Started may be demanding. These are uncalibrated engine
            settings, not calibrated beginner ratings. Take your time; there is
            no clock.
          </p>
          <button className="button primary" onClick={start}>
            Start game
          </button>
          <p className="small muted">
            One local engine runs only when needed. No account or cloud
            computation. The latest 20 completed games stay in this browser.
          </p>
        </section>
      )}
      {ready && (
        <section className="completed-games" aria-label="Completed games">
          <h2>Completed games</h2>
          {!data.games.length ? (
            <p>Your completed games will appear here.</p>
          ) : (
            <ol>
              {data.games.map((item) => (
                <li key={item.id}>
                  <Link href={`/review?game=${item.id}`}>
                    {new Date(item.startedAt).toLocaleDateString()} ·{" "}
                    {item.player === "w" ? "White" : "Black"} ·{" "}
                    {item.outcome?.result} · {item.moves.length} plies
                  </Link>
                  <button
                    className="text-button"
                    onClick={() =>
                      downloadText(
                        gamePgn(item),
                        "marcus-game.pgn",
                        "application/x-chess-pgn",
                      )
                    }
                  >
                    Export PGN
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      <p className="small muted">
        Engine: Stockfish.js 19.0.1 lite, GPL-3.0.{" "}
        <a href="/engine/NOTICE.txt">Engine notice</a> ·{" "}
        <a href="/engine/COPYING.txt">License</a>
      </p>
    </main>
  );
}
