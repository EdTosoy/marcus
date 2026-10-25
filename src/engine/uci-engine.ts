import { Chess } from "chess.js";
import { isSquare, replay, type MoveInput } from "../domain/chess/game";
import {
  ENGINE_VERSION,
  uciMove,
  type ChessEngine,
  type EngineRequest,
  type EngineResult,
  type EngineLine,
} from "./types";

export type WorkerPort = {
  postMessage(message: string): void;
  terminate(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
  onmessageerror: (() => void) | null;
};
export function parseMove(text: string): MoveInput | null {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(text)) return null;
  const from = text.slice(0, 2),
    to = text.slice(2, 4);
  if (!isSquare(from) || !isSquare(to)) return null;
  return {
    from,
    to,
    ...(text[4] ? { promotion: text[4] as "q" | "r" | "b" | "n" } : {}),
  };
}
function legalPv(fen: string, tokens: string[]): MoveInput[] {
  const game = new Chess(fen);
  const moves: MoveInput[] = [];
  for (const token of tokens.slice(0, 12)) {
    const move = parseMove(token);
    if (!move) break;
    try {
      game.move(move);
      moves.push(move);
    } catch {
      break;
    }
  }
  return moves;
}
const bounded = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) =>
  Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.floor(value!)))
    : fallback;

/** One outstanding UCI exchange. Cancellation destroys its worker because UCI has no request IDs. */
export class UciEngine implements ChessEngine {
  private worker: WorkerPort | null = null;
  private initializing: Promise<void> | null = null;
  private waiting: {
    accept: (line: string) => boolean;
    resolve: (line: string) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;
  private receiveInfo: ((line: string) => void) | null = null;
  private busy = false;
  private generation = 0;
  private disposed = false;
  private gameId: string | null = null;
  constructor(private readonly factory: () => WorkerPort) {}
  private exchange(
    command: string,
    accept: (line: string) => boolean,
    timeoutMs = 15_000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          this.fail(
            new Error("Engine timed out. Restart the engine to continue."),
          ),
        timeoutMs,
      );
      this.waiting = { accept, resolve, reject, timer };
      try {
        this.worker!.postMessage(command);
      } catch {
        this.fail(new Error("Engine command failed."));
      }
    });
  }
  private fail(error: Error) {
    this.generation++;
    this.busy = false;
    if (this.waiting) {
      clearTimeout(this.waiting.timer);
      this.waiting.reject(error);
      this.waiting = null;
    }
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.onmessageerror = null;
      this.worker.terminate();
    }
    this.worker = null;
    this.initializing = null;
    this.receiveInfo = null;
    this.gameId = null;
  }
  private initialize(): Promise<void> {
    if (this.initializing) return this.initializing;
    this.initializing = (async () => {
      const generation = this.generation;
      const worker = this.factory();
      this.worker = worker;
      worker.onmessage = ({ data }) => {
        if (this.worker !== worker || typeof data !== "string") return;
        for (const line of data.split(/\r?\n/)) {
          this.receiveInfo?.(line);
          const pending = this.waiting;
          if (pending?.accept(line.trim())) {
            clearTimeout(pending.timer);
            this.waiting = null;
            pending.resolve(line.trim());
          }
        }
      };
      worker.onerror = () => {
        if (this.worker !== worker) return;
        this.fail(
          new Error("Stockfish could not load or stopped unexpectedly."),
        );
      };
      worker.onmessageerror = () => {
        if (this.worker === worker)
          this.fail(new Error("Stockfish returned an unreadable message."));
      };
      await this.exchange("uci", (line) => line === "uciok");
      if (generation !== this.generation)
        throw new DOMException("Calculation cancelled", "AbortError");
      worker.postMessage("setoption name Threads value 1");
      worker.postMessage("setoption name Ponder value false");
      await this.exchange("isready", (line) => line === "readyok");
    })();
    return this.initializing;
  }
  async search(
    request: EngineRequest,
    signal?: AbortSignal,
  ): Promise<EngineResult> {
    if (this.disposed) throw new Error("Engine has been disposed.");
    if (this.busy) throw new Error("Engine is already calculating.");
    if (signal?.aborted)
      throw new DOMException("Calculation cancelled", "AbortError");
    const game = new Chess(request.fen);
    if (
      request.startingFen &&
      replay(request.startingFen, request.moves).fen() !== game.fen()
    )
      throw new Error("Engine position does not match game history.");
    this.busy = true;
    const generation = this.generation;
    const abort = () => this.cancel();
    signal?.addEventListener("abort", abort, { once: true });
    try {
      await this.initialize();
      if (generation !== this.generation)
        throw new DOMException("Calculation cancelled", "AbortError");
      const worker = this.worker!;
      const time = bounded(request.timeMs, 250, 50, 1000);
      const multiPv = bounded(request.multiPv, 1, 1, 3);
      worker.postMessage(
        `setoption name Hash value ${bounded(request.hashMb, 8, 4, 32)}`,
      );
      worker.postMessage(`setoption name UCI_LimitStrength value false`);
      worker.postMessage(
        `setoption name Skill Level value ${bounded(request.skill, 20, 0, 20)}`,
      );
      worker.postMessage(`setoption name MultiPV value ${multiPv}`);
      if (request.gameId && request.gameId !== this.gameId) {
        worker.postMessage("ucinewgame");
        this.gameId = request.gameId;
      }
      await this.exchange("isready", (line) => line === "readyok");
      if (generation !== this.generation)
        throw new DOMException("Calculation cancelled", "AbortError");
      const lines = new Map<number, EngineLine>();
      this.receiveInfo = (line) => {
        const pv = line.match(/\bpv (.+)$/),
          depth = line.match(/\bdepth (\d+)/);
        if (!pv || !depth) return;
        const rank = Number(line.match(/\bmultipv (\d+)/)?.[1] ?? 1);
        if (rank < 1 || rank > multiPv) return;
        const moves = legalPv(request.fen, pv[1]!.split(" "));
        const score = line.match(/\bscore (cp|mate) (-?\d+)/);
        if (moves.length)
          lines.set(rank, {
            rank,
            depth: Number(depth[1]),
            score:
              score && !/\b(lowerbound|upperbound)\b/.test(line)
                ? { type: score[1] as "cp" | "mate", value: Number(score[2]) }
                : null,
            moves,
          });
      };
      worker.postMessage(
        request.startingFen
          ? `position fen ${request.startingFen} moves ${(request.moves ?? []).map(uciMove).join(" ")}`
          : `position fen ${request.fen}`,
      );
      const best = await this.exchange(
        `go movetime ${time} nodes ${bounded(request.nodes, 40_000, 100, 100_000)} depth ${bounded(request.depth, 14, 1, 14)}`,
        (line) => line.startsWith("bestmove "),
        time + 5000,
      );
      if (generation !== this.generation)
        throw new DOMException("Calculation cancelled", "AbortError");
      const token = best.split(/\s+/)[1]!;
      const move = parseMove(token);
      if (!move && (!game.isGameOver() || !["0000", "(none)"].includes(token)))
        throw new Error("Engine returned no legal move for an active game.");
      if (move) {
        try {
          game.move(move);
        } catch {
          throw new Error("Engine returned an illegal move.");
        }
      }
      return {
        version: ENGINE_VERSION,
        fen: request.fen,
        bestMove: move,
        lines: [...lines.values()].sort((a, b) => a.rank - b.rank),
      };
    } catch (error) {
      if (generation === this.generation)
        this.fail(error instanceof Error ? error : new Error("Engine failed."));
      throw error;
    } finally {
      if (generation === this.generation) {
        this.busy = false;
        this.receiveInfo = null;
      }
      signal?.removeEventListener("abort", abort);
    }
  }
  cancel() {
    this.fail(new DOMException("Calculation cancelled", "AbortError"));
  }
  restart() {
    this.cancel();
  }
  dispose() {
    this.disposed = true;
    this.cancel();
  }
}
export function createBrowserEngine(): ChessEngine {
  return new UciEngine(() => {
    if (typeof Worker === "undefined" || typeof WebAssembly === "undefined")
      throw new Error(
        "This browser needs Web Workers and WebAssembly to play Stockfish. Lessons are still available.",
      );
    const worker = new Worker("/engine/stockfish-19-lite-single.js");
    const port: WorkerPort = {
      postMessage: (message) => worker.postMessage(message),
      terminate: () => worker.terminate(),
      onmessage: null,
      onerror: null,
      onmessageerror: null,
    };
    worker.addEventListener("message", (event) =>
      port.onmessage?.({ data: event.data }),
    );
    worker.addEventListener("error", (event) => {
      event.preventDefault();
      port.onerror?.({ message: event.message });
    });
    worker.addEventListener("messageerror", () => port.onmessageerror?.());
    return port;
  });
}
