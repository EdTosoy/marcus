import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { UciEngine, type WorkerPort } from "./uci-engine";
import { difficulties } from "./types";
import { coachingBenchmark } from "../domain/coaching/benchmark";
const enabled = process.env.MARCUS_REAL_ENGINE === "1";
describe.skipIf(!enabled)(
  "installed Stockfish integration (explicit local process)",
  () => {
    it("advertises required UCI options, responds legally for every preset and supports benchmark analysis", async () => {
      const require = createRequire(import.meta.url);
      const root = dirname(require.resolve("stockfish/package.json"));
      const options: string[] = [];
      const exits: Promise<void>[] = [];
      const engine = new UciEngine(() => {
        const child = spawn(
          process.execPath,
          [join(root, "bin/stockfish-19-lite-single.js")],
          { stdio: ["pipe", "pipe", "pipe"] },
        );
        exits.push(
          new Promise((resolve) => child.once("exit", () => resolve())),
        );
        const port: WorkerPort = {
          postMessage: (message) => {
            child.stdin.write(message + "\n");
          },
          terminate: () => {
            child.kill();
          },
          onmessage: null,
          onerror: null,
          onmessageerror: null,
        };
        let buffer = "";
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", (data: string) => {
          buffer += data;
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop()!;
          for (const line of lines) {
            if (line.startsWith("option name ")) options.push(line);
            port.onmessage?.({ data: line });
          }
        });
        child.on("error", () => port.onerror?.({ message: "Child failed" }));
        child.on("exit", (code) => {
          if (code) port.onerror?.({ message: "Child exited" });
        });
        return port;
      });
      const results: unknown[] = [];
      try {
        for (const [id, preset] of Object.entries(difficulties)) {
          const start = performance.now();
          const result = await engine.search({
            gameId: id,
            fen: DEFAULT_POSITION,
            ...preset,
          });
          expect(result.bestMove).not.toBeNull();
          const game = new Chess();
          expect(() => game.move(result.bestMove!)).not.toThrow();
          results.push({
            preset: id,
            skill: preset.skill,
            depth: preset.depth,
            requestedMs: preset.timeMs,
            requestedNodes: preset.nodes,
            bestMove: result.bestMove,
            observedWallMs: Math.round(performance.now() - start),
          });
        }
        expect(
          options.some(
            (line) =>
              line.includes("Skill Level") && line.includes("min 0 max 20"),
          ),
        ).toBe(true);
        expect(options.some((line) => line.includes("UCI_LimitStrength"))).toBe(
          true,
        );
        expect(options.some((line) => line.includes("UCI_Elo"))).toBe(true);
        expect(options.some((line) => line.includes("Hash"))).toBe(true);
        for (const id of [
          "smothered-sacrifice",
          "multiple-answers",
          "en-passant-threat",
        ]) {
          const scenario = coachingBenchmark.find((item) => item.id === id)!;
          const result = await engine.search({
            gameId: id,
            fen: scenario.fen,
            skill: 20,
            depth: 14,
            timeMs: 300,
            nodes: 60_000,
            multiPv: 3,
          });
          expect(result.bestMove).not.toBeNull();
          const game = new Chess(scenario.fen);
          expect(() => game.move(result.bestMove!)).not.toThrow();
          results.push({
            scenario: id,
            bestMove: result.bestMove,
            lines: result.lines,
          });
        }
        await mkdir("artifacts/phase2b", { recursive: true });
        await writeFile(
          "artifacts/phase2b/engine-integration.json",
          JSON.stringify(
            {
              engine: "stockfish.js-19.0.1-lite-single",
              options,
              results,
              eloCalibration: "not-measured",
            },
            null,
            2,
          ),
        );
      } finally {
        engine.dispose();
        await Promise.all(exits);
      }
    }, 30_000);
  },
);
