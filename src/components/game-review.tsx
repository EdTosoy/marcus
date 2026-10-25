"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { ChessBoard } from "./chess-board";
import { useGameProgress } from "./use-game-progress";
import { useAdaptiveProgress } from "./use-adaptive-progress";
import { useChessEngine } from "./use-chess-engine";
import { downloadText } from "@/infrastructure/download";
import {
  gamePgn,
  positionAt,
  type GameSession,
} from "@/domain/gameplay/session";
import {
  selectDecisions,
  evaluateRetry,
  undefendedPieces,
  type Decision,
} from "@/domain/review/decisions";
import {
  gameplayEvidence,
  newReview,
  reviewTransition,
  targetedPractice,
  type ReviewRecord,
  type ReviewEvent,
} from "@/domain/review/session";
import { foundationExercises } from "@/domain/curriculum/foundations";
import { updateReview } from "@/infrastructure/game-progress";
import {
  ENGINE_VERSION,
  type ChessEngine,
  type EngineResult,
} from "@/engine/types";
import type { LearningData } from "@/domain/adaptive/types";
import { judgePrediction, type Prediction } from "@/domain/coaching/facts";
import type { MoveInput } from "@/domain/chess/game";
import { inspectDecision } from "@/domain/review/decisions";

export function GameReview({ gameId }: { gameId?: string }) {
  const { data, ready, notice, update } = useGameProgress();
  const learning = useAdaptiveProgress();
  const engine = useChessEngine();
  const [decisionIndex, setDecisionIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(gameId);
  const game =
    data.games.find((item) => item.id === selectedId) ??
    (!selectedId ? data.games[0] : undefined);
  const decisions = useMemo(() => {
    if (!game) return [];
    const selected = selectDecisions(game);
    const old = Object.keys(data.reviews)
      .filter(
        (id) =>
          id.startsWith(`${game.id}:`) &&
          !selected.some((item) => item.id === id),
      )
      .map((id) => inspectDecision(game, Number(id.split(":")[1])))
      .filter((item): item is Decision => item !== null);
    return [...selected, ...old].slice(0, 6);
  }, [game, data.reviews]);
  const decision = decisions[decisionIndex];
  const [ply, setPly] = useState(0);
  const [cache] = useState(() => new Map<string, EngineResult>());
  return (
    <main id="main" className="shell gameplay-main">
      <div className="lesson-heading">
        <div>
          <h1>Look again. Find the idea.</h1>
          <p>
            Investigate a few decisions, then take the idea into fresh practice.
          </p>
        </div>
        <Link href="/play" className="text-button">
          Back to Play
        </Link>
      </div>
      {notice && (
        <p role="status" className="storage-notice">
          {notice}
        </p>
      )}
      {learning.notice && (
        <p role="status" className="storage-notice">
          {learning.notice}
        </p>
      )}
      {!ready || !learning.ready ? (
        <p role="status">Restoring local review…</p>
      ) : !game ? (
        <section className="game-setup">
          <h2>No completed game here yet.</h2>
          <p>Complete or resign a game to begin a review.</p>
          <Link href="/play" className="button primary">
            Play a game
          </Link>
        </section>
      ) : (
        <>
          <details className="review-game-details">
            <summary>
              {new Date(game.startedAt).toLocaleDateString()} ·{" "}
              {game.outcome?.result} · Change game or export
            </summary>
            <div className="review-game-picker">
              <label>
                Completed game
                <select
                  value={game.id}
                  onChange={(event) => {
                    setSelectedId(event.target.value);
                    setDecisionIndex(0);
                    setPly(0);
                    engine().cancel();
                  }}
                >
                  {data.games.map((item) => (
                    <option key={item.id} value={item.id}>
                      {new Date(item.startedAt).toLocaleDateString()} ·{" "}
                      {item.outcome?.result} · {item.moves.length} plies
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="text-button"
                onClick={() =>
                  downloadText(
                    gamePgn(game),
                    "marcus-game.pgn",
                    "application/x-chess-pgn",
                  )
                }
              >
                Export PGN
              </button>
            </div>
            <p className="game-status">{game.outcome?.reason}</p>
          </details>
          <section
            className="review-decisions"
            aria-label="Important decisions"
          >
            <h2>Choose a decision</h2>
            <div className="board-controls">
              {decisions.map((item, index) => (
                <button
                  className="button quiet"
                  aria-pressed={index === decisionIndex}
                  key={item.id}
                  onClick={() => setDecisionIndex(index)}
                >
                  Decision {index + 1}: {item.san}
                </button>
              ))}
            </div>
            {!decisions.length && (
              <p>
                No learner move is available to review in this game. Play
                another game to collect decisions.
              </p>
            )}
          </section>
          {decision && (
            <FocusedReview
              key={decision.id}
              game={game}
              decision={decision}
              record={data.reviews[decision.id] ?? newReview(decision.id)}
              learning={learning.data}
              engine={engine}
              cache={cache}
              now={learning.now}
              onEvent={(event) =>
                update((current) =>
                  updateReview(current, decision.id, (record) =>
                    reviewTransition(record, decision, event, Date.now()),
                  ),
                )
              }
            />
          )}
          <details className="review-boundaries">
            <summary>What this review can tell you</summary>
            <p>
              We can verify immediate captures and defenders. We cannot know
              what you intended unless you tell us; no intention is inferred
              here. A possible capture is not automatically a mistake.
            </p>
          </details>
          <details className="game-replay">
            <summary>Replay the whole game</summary>
            <Replay game={game} ply={ply} setPly={setPly} />
          </details>
          <p className="small muted">
            Reviewing a familiar board is practice, not an independent mastery
            check. Gameplay observations stay separate from lesson assessments.
          </p>
          <button
            className="text-button"
            onClick={() =>
              downloadText(
                JSON.stringify(
                  {
                    version: 1,
                    source: "gameplay-review",
                    gameId: game.id,
                    observations: decisions.map((item) =>
                      gameplayEvidence(
                        item,
                        data.reviews[item.id] ?? newReview(item.id),
                      ),
                    ),
                    reviews: decisions.map(
                      (item) => data.reviews[item.id] ?? newReview(item.id),
                    ),
                  },
                  null,
                  2,
                ),
                "marcus-gameplay-evidence.json",
                "application/json",
              )
            }
          >
            Export gameplay review (JSON)
          </button>
        </>
      )}
    </main>
  );
}
function FocusedReview({
  game,
  decision,
  record,
  learning,
  engine,
  cache,
  onEvent,
  now,
}: {
  game: GameSession;
  decision: Decision;
  record: ReviewRecord;
  learning: LearningData;
  engine: () => ChessEngine;
  cache: Map<string, EngineResult>;
  onEvent: (event: ReviewEvent) => void;
  now: number;
}) {
  const [showOriginal, setShowOriginal] = useState(true);
  const [candidate, setCandidate] = useState<MoveInput | null>(null);
  const predictionHeading = useRef<HTMLLegendElement>(null);
  const feedbackHeading = useRef<HTMLHeadingElement>(null);
  const [analysis, setAnalysis] = useState<EngineResult | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const last = record.attempts.at(-1);
  const result = last ? evaluateRetry(decision, last.move) : null;
  const practice = targetedPractice(
    decision,
    learning,
    foundationExercises,
    now,
  );
  const evidence = gameplayEvidence(decision, record);
  const key = `${ENGINE_VERSION}:${game.id}:${decision.ply}:${decision.fen}:300:60000:3`;
  function focusFeedback() {
    requestAnimationFrame(() => feedbackHeading.current?.focus());
  }
  async function reveal() {
    onEvent({ type: "reveal" });
    setError("");
    const cached = cache.get(key);
    if (cached) {
      setAnalysis(cached);
      return;
    }
    const controller = new AbortController();
    abort.current = controller;
    setAnalysing(true);
    try {
      const found = await engine().search(
        {
          gameId: game.id,
          fen: decision.fen,
          startingFen: game.startingFen,
          moves: game.moves.slice(0, decision.ply),
          skill: 20,
          timeMs: 300,
          nodes: 60_000,
          multiPv: 3,
        },
        controller.signal,
      );
      if (!controller.signal.aborted) {
        cache.set(key, found);
        setAnalysis(found);
      }
    } catch (problem) {
      if (!controller.signal.aborted)
        setError(
          problem instanceof Error
            ? problem.message
            : "Analysis is unavailable.",
        );
    } finally {
      if (!controller.signal.aborted) setAnalysing(false);
    }
  }
  return (
    <div className="game-workbench focused-review">
      <section aria-label="Review position">
        <h2>Before {decision.san}</h2>
        <p className="position-context">
          <strong>
            {candidate
              ? "Candidate preview"
              : !showOriginal
                ? "Your retry"
                : "Original position"}
          </strong>
          <span>
            {candidate
              ? "Predict the reply before comparing."
              : !showOriginal
                ? "Inspect what changed, then return to the original board."
                : "Think first. Guidance and alternatives are optional."}
          </span>
        </p>
        <p className="instruction">{decision.question}</p>
        <p className="small muted">
          {decision.kind === "capture-opportunity"
            ? "A legal immediate capture was observed. Investigate whether it matters."
            : "Analysis opportunity: no specific weakness has been established."}
        </p>
        <ChessBoard
          key={`${decision.id}:${showOriginal}:${record.attempts.length}`}
          fen={
            candidate
              ? (() => {
                  const board = new Chess(decision.fen);
                  board.move(candidate);
                  return board.fen();
                })()
              : !showOriginal && result
                ? result.fen
                : decision.fen
          }
          orientation={game.player === "w" ? "white" : "black"}
          focusSquare={decision.focus}
          locked={
            !record.observation ||
            Boolean(candidate) ||
            !showOriginal ||
            record.attempts.length >= 30
          }
          lockedMessage={
            !record.observation
              ? "Reflect on what you checked, then try a move."
              : candidate
                ? "Candidate preview. Predict a legal reply before feedback."
                : record.attempts.length >= 30
                  ? "Review attempt limit reached. Your record is preserved."
                  : "Your retry is shown. Return to the original position to try again."
          }
          onMove={(move) => {
            if (!record.attempts.length) {
              setCandidate(move);
              requestAnimationFrame(() => predictionHeading.current?.focus());
            } else {
              onEvent({ type: "try", move, prediction: null });
              setShowOriginal(false);
              focusFeedback();
            }
          }}
        />
        <button
          className="button quiet"
          disabled={showOriginal && !candidate}
          onClick={() => {
            setCandidate(null);
            setShowOriginal(true);
            requestAnimationFrame(() =>
              document
                .querySelector<HTMLElement>(
                  `.focused-review [aria-label^="${decision.focus} "]`,
                )
                ?.focus(),
            );
          }}
        >
          Try the original position again
        </button>
      </section>
      <section className="game-sidebar" aria-label="Review guidance">
        <h2>Think before revealing</h2>
        {candidate && (
          <fieldset className="answer-options">
            <legend ref={predictionHeading} tabIndex={-1}>
              After this candidate, what could your opponent do?
            </legend>
            {(
              [
                { id: "capture", label: "Capture the moved piece" },
                { id: "check", label: "Give check" },
                { id: "other", label: "Make another quiet move" },
                { id: "unsure", label: "I’m not sure about the reply" },
              ] as { id: Prediction; label: string }[]
            ).map((option) => (
              <button
                key={option.id}
                className="button quiet"
                onClick={() => {
                  onEvent({
                    type: "try",
                    move: candidate,
                    prediction: option.id,
                  });
                  setCandidate(null);
                  setShowOriginal(false);
                  focusFeedback();
                }}
              >
                {option.label}
              </button>
            ))}
          </fieldset>
        )}
        {!record.observation ? (
          <fieldset className="answer-options">
            <legend>
              What did you inspect? Choose a reflection before moving.
            </legend>
            <button
              className="button quiet"
              onClick={() =>
                onEvent({ type: "notice", observation: "threats" })
              }
            >
              I looked for opponent threats
            </button>
            <button
              className="button quiet"
              onClick={() =>
                onEvent({ type: "notice", observation: "defenders" })
              }
            >
              I checked defenders
            </button>
            <button
              className="button quiet"
              onClick={() => onEvent({ type: "notice", observation: "unsure" })}
            >
              I’m not sure yet
            </button>
          </fieldset>
        ) : (
          <>
            <p>
              Your reflection is a self-report. Now try any legal move whose
              destination is not attacked. Several answers may work; this narrow
              goal does not rank trades or sacrifices.
            </p>
            {record.hints > 0 && (
              <div className="thinking-note">
                <p>
                  Hint 1: Imagine the new position and scan every opponent piece
                  toward the destination.
                </p>
                {record.hints > 1 && (
                  <p>
                    Hint 2: Check pawn diagonals, knight jumps, line blockers,
                    and friendly defenders separately. A defender does not
                    cancel an attack.
                  </p>
                )}
              </div>
            )}
            <button
              className="button quiet"
              disabled={record.hints >= 2}
              onClick={() => onEvent({ type: "hint" })}
            >
              {record.hints ? "Another review hint" : "A review hint"}
            </button>
            {result && (
              <div className="feedback" role="status">
                <h3 ref={feedbackHeading} tabIndex={-1}>
                  {result.judgment?.verdict === "checkmate"
                    ? "Checkmate is verified."
                    : result.judgment?.verdict === "forced-mate"
                      ? "A mating continuation is verified."
                      : result.judgment?.verdict === "draw"
                        ? "This position ends in a draw."
                        : result.judgment?.verdict === "unattacked"
                          ? "That meets the review goal."
                          : "Inspect the destination again."}
                </h3>
                <p>{result.explanation}</p>
                {last?.prediction && (
                  <p>
                    {
                      judgePrediction(decision.fen, last.move, last.prediction)
                        ?.text
                    }
                  </p>
                )}
                {result.judgment?.lines.map((line, index) => (
                  <p key={index}>Verified legal line: {line.join(" → ")}</p>
                ))}
              </div>
            )}
            <button
              className="button primary"
              disabled={!last || analysing}
              onClick={() => void reveal()}
            >
              {analysing ? "Checking alternatives…" : "Reveal and compare"}
            </button>
            {analysing && (
              <button
                className="text-button"
                onClick={() => {
                  abort.current?.abort();
                  setAnalysing(false);
                  setError(
                    "Analysis cancelled. Your review attempts are preserved.",
                  );
                }}
              >
                Cancel analysis
              </button>
            )}
          </>
        )}
        {record.revealed && (
          <div className="review-explanation">
            <h3>What the position establishes</h3>
            <p>{decision.explanation}</p>
            {decision.judgment?.lines.map((line, index) => (
              <p key={index}>Verified legal line: {line.join(" → ")}</p>
            ))}
            <p>
              Undefended non-king pieces before your move:{" "}
              {undefendedPieces(decision.fen).join(", ") || "none"}. Undefended
              does not necessarily mean attacked or lost.
            </p>
            {analysis && (
              <>
                <h3>Engine-supported candidates</h3>
                <p>
                  Short bounded search, not a unique answer key. These
                  candidates are not all necessarily suitable for the no-attacks
                  retry goal.
                </p>
                <ul>
                  {(analysis.lines.length
                    ? analysis.lines.map((line) => ({
                        move: line.moves[0]!,
                        depth: line.depth,
                      }))
                    : analysis.bestMove
                      ? [{ move: analysis.bestMove, depth: 0 }]
                      : []
                  ).map(({ move, depth }) => {
                    const chess = new Chess(decision.fen);
                    const played = chess.move(move);
                    return (
                      <li key={`${move.from}${move.to}${move.promotion ?? ""}`}>
                        {played.san}
                        {depth ? ` · search depth ${depth}` : ""}
                      </li>
                    );
                  })}
                </ul>
                <p className="small muted">
                  {analysis.version}. No claim of forced material loss follows
                  from these suggestions.
                </p>
              </>
            )}
          </div>
        )}
        {error && (
          <p className="input-notice" role="status">
            {error}
          </p>
        )}
        {record.attempts.length > 0 && (
          <div className="practice-recommendation">
            <h3>Take the idea into practice</h3>
            <p>{practice.reason}</p>
            {practice.exercise && (
              <Link
                className="button quiet"
                href={`/learn?practice=${practice.exercise.id}`}
                onClick={() =>
                  onEvent({
                    type: "recommend",
                    skillId: practice.exercise!.skillId,
                    exerciseId: practice.exercise!.id,
                  })
                }
              >
                Practice {practice.exercise.title}
              </Link>
            )}
          </div>
        )}
        <p className="small muted">
          Unassisted successes on this known board:{" "}
          {evidence.independentRetries}. Assisted successes:{" "}
          {evidence.assistedRetries}. Retries outside the narrow goal:{" "}
          {evidence.repeatedErrors}. Every retry uses a known position and adds
          no independent mastery credit.
        </p>
        {record.attempts.length >= 30 && (
          <p>
            Review attempt limit reached for this decision. Your record is
            preserved; return to guided practice.
          </p>
        )}
      </section>
    </div>
  );
}
function Replay({
  game,
  ply,
  setPly,
}: {
  game: GameSession;
  ply: number;
  setPly: (value: number) => void;
}) {
  const position = positionAt(game, ply);
  const sans = positionAt(game, game.moves.length).history();
  return (
    <div className="replay-content">
      <ChessBoard
        fen={position.fen()}
        locked
        lockedMessage="Replay position. Use previous or next move to explore."
        orientation={game.player === "w" ? "white" : "black"}
      />
      <div>
        <p role="status">
          Position after {ply} of {game.moves.length} plies.
        </p>
        <div className="board-controls">
          <button
            className="button quiet"
            disabled={!ply}
            onClick={() => setPly(ply - 1)}
          >
            Previous move
          </button>
          <button
            className="button quiet"
            disabled={ply >= game.moves.length}
            onClick={() => setPly(ply + 1)}
          >
            Next move
          </button>
        </div>
        <ol className="replay-moves">
          {sans.map((san, index) => (
            <li key={index}>
              <button
                className="text-button"
                aria-current={ply === index + 1 ? "step" : undefined}
                onClick={() => setPly(index + 1)}
              >
                {index + 1}. {san}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
