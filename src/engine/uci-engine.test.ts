import { describe, expect, it, vi } from "vitest";
import { Chess, DEFAULT_POSITION } from "chess.js";
import {
  UciEngine,
  createBrowserEngine,
  parseMove,
  type WorkerPort,
} from "./uci-engine";

class FakeWorker implements WorkerPort {
  onmessage: WorkerPort["onmessage"] = null;
  onerror: WorkerPort["onerror"] = null;
  onmessageerror: WorkerPort["onmessageerror"] = null;
  commands: string[] = [];
  terminated = false;
  answer = "e2e4";
  auto = true;
  postMessage(command: string) {
    this.commands.push(command);
    queueMicrotask(() => {
      if (command === "uci") this.emit("id name Fake\nuciok");
      if (command === "isready") this.emit("readyok");
      if (command.startsWith("go ") && this.auto) {
        this.emit("info depth 6 multipv 1 score cp 30 pv e2e4 e7e5 g1f3");
        this.emit(`bestmove ${this.answer}`);
      }
    });
  }
  emit(data: string) {
    this.onmessage?.({ data });
  }
  terminate() {
    this.terminated = true;
  }
}
const untilSearch = async (worker: FakeWorker) => {
  for (
    let i = 0;
    i < 20 && !worker.commands.some((command) => command.startsWith("go "));
    i++
  )
    await Promise.resolve();
};
describe("typed UCI worker adapter", () => {
  it("resets between game IDs, retains history and reuses the worker between searches", async () => {
    const worker = new FakeWorker(),
      engine = new UciEngine(() => worker);
    const board = new Chess();
    board.move("e4");
    worker.answer = "e7e5";
    const request = {
      gameId: "one",
      fen: board.fen(),
      startingFen: DEFAULT_POSITION,
      moves: [{ from: "e2" as const, to: "e4" as const }],
    };
    await engine.search(request);
    await engine.search(request);
    expect(
      worker.commands.filter((command) => command === "ucinewgame"),
    ).toHaveLength(1);
    expect(worker.commands).toContain(
      `position fen ${DEFAULT_POSITION} moves e2e4`,
    );
    await engine.search({ ...request, gameId: "two" });
    expect(
      worker.commands.filter((command) => command === "ucinewgame"),
    ).toHaveLength(2);
    engine.dispose();
  });
  it("fails gracefully when workers are unavailable", async () => {
    vi.stubGlobal("Worker", undefined);
    const engine = createBrowserEngine();
    try {
      await expect(engine.search({ fen: DEFAULT_POSITION })).rejects.toThrow(
        "Web Workers and WebAssembly",
      );
    } finally {
      engine.dispose();
      vi.unstubAllGlobals();
    }
  });
  it("accepts a terminal no-move marker and rejects malformed terminal output", async () => {
    const worker = new FakeWorker(),
      engine = new UciEngine(() => worker);
    const fen = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
    worker.answer = "(none)";
    expect((await engine.search({ fen })).bestMove).toBeNull();
    worker.answer = "garbage";
    await expect(engine.search({ fen })).rejects.toThrow("no legal move");
    engine.dispose();
  });
  it("initializes, configures bounded difficulty/resources, parses PV and reuses one worker", async () => {
    const worker = new FakeWorker(),
      factory = vi.fn(() => worker);
    const engine = new UciEngine(factory);
    const result = await engine.search({
      fen: DEFAULT_POSITION,
      skill: 0,
      timeMs: 99999,
      nodes: 999999,
      hashMb: 100,
      multiPv: 9,
    });
    expect(result.bestMove).toEqual({ from: "e2", to: "e4" });
    expect(result.lines[0]).toMatchObject({
      depth: 6,
      score: { type: "cp", value: 30 },
      moves: [
        { from: "e2", to: "e4" },
        { from: "e7", to: "e5" },
        { from: "g1", to: "f3" },
      ],
    });
    expect(worker.commands).toContain("setoption name Skill Level value 0");
    expect(worker.commands).toContain("setoption name Hash value 32");
    expect(worker.commands).toContain("go movetime 1000 nodes 100000 depth 14");
    await engine.search({ fen: DEFAULT_POSITION });
    expect(factory).toHaveBeenCalledTimes(1);
    engine.dispose();
    expect(worker.terminated).toBe(true);
    await expect(engine.search({ fen: DEFAULT_POSITION })).rejects.toThrow(
      "disposed",
    );
  });
  it("rejects overlapping work and cancels without accepting late responses", async () => {
    const first = new FakeWorker();
    first.auto = false;
    const second = new FakeWorker();
    const engine = new UciEngine(
      vi.fn().mockReturnValueOnce(first).mockReturnValue(second),
    );
    const controller = new AbortController();
    const pending = engine.search({ fen: DEFAULT_POSITION }, controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    await untilSearch(first);
    await expect(engine.search({ fen: DEFAULT_POSITION })).rejects.toThrow(
      "already",
    );
    const staleHandler = first.onmessage;
    controller.abort();
    const next = engine.search({ fen: DEFAULT_POSITION });
    staleHandler?.({ data: "bestmove a1a8" });
    await rejected;
    expect((await next).bestMove).toEqual({ from: "e2", to: "e4" });
    expect(first.terminated).toBe(true);
    engine.dispose();
  });
  it("cancels during initialization and can restart", async () => {
    const first = new FakeWorker();
    const second = new FakeWorker();
    const engine = new UciEngine(
      vi.fn().mockReturnValueOnce(first).mockReturnValue(second),
    );
    const pending = engine.search({ fen: DEFAULT_POSITION });
    const rejected = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    engine.restart();
    expect(
      (await engine.search({ fen: DEFAULT_POSITION })).bestMove,
    ).not.toBeNull();
    await rejected;
    engine.dispose();
  });
  it("handles worker errors, unreadable messages, illegal and missing moves", async () => {
    for (const mode of ["error", "message", "illegal", "none"] as const) {
      const worker = new FakeWorker();
      worker.auto = false;
      const engine = new UciEngine(() => worker);
      const pending = engine.search({ fen: DEFAULT_POSITION });
      const assertion = expect(pending).rejects.toThrow();
      await untilSearch(worker);
      if (mode === "error") worker.onerror?.({ message: "failed" });
      else if (mode === "message") worker.onmessageerror?.();
      else worker.emit(`bestmove ${mode === "illegal" ? "e2e5" : "(none)"}`);
      await assertion;
      expect(worker.terminated).toBe(true);
      engine.dispose();
    }
  });
  it("times out a stuck search and rejects a pre-aborted request", async () => {
    vi.useFakeTimers();
    try {
      const worker = new FakeWorker();
      worker.auto = false;
      const engine = new UciEngine(() => worker);
      const pending = engine.search({ fen: DEFAULT_POSITION, timeMs: 50 });
      const assertion = expect(pending).rejects.toThrow("timed out");
      await untilSearch(worker);
      await vi.advanceTimersByTimeAsync(16_000);
      await assertion;
      expect(worker.terminated).toBe(true);
      const controller = new AbortController();
      controller.abort();
      await expect(
        engine.search({ fen: DEFAULT_POSITION }, controller.signal),
      ).rejects.toMatchObject({ name: "AbortError" });
      engine.dispose();
    } finally {
      vi.useRealTimers();
    }
  });
  it("preserves full move history and refuses mismatched positions", async () => {
    const worker = new FakeWorker(),
      engine = new UciEngine(() => worker);
    await expect(
      engine.search({
        fen: DEFAULT_POSITION,
        startingFen: DEFAULT_POSITION,
        moves: [{ from: "e2", to: "e4" }],
      }),
    ).rejects.toThrow("history");
    expect(worker.commands).toHaveLength(0);
    expect(parseMove("a7a8n")).toEqual({
      from: "a7",
      to: "a8",
      promotion: "n",
    });
    expect(parseMove("bad\nquit")).toBeNull();
    engine.dispose();
  });
});

it("applies and bounds explicit playing depths without replacing Stockfish move selection", async () => {
  const worker = new FakeWorker(),
    engine = new UciEngine(() => worker);
  await engine.search({ fen: DEFAULT_POSITION, depth: 1 });
  expect(worker.commands).toContain("go movetime 250 nodes 40000 depth 1");
  await engine.search({ fen: DEFAULT_POSITION, depth: 999 });
  expect(worker.commands).toContain("go movetime 250 nodes 40000 depth 14");
  engine.dispose();
});
