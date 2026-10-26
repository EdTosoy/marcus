import assert from "node:assert/strict";
import { test } from "node:test";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  engineRoot,
  provenance,
  verifyEngineRelease,
} from "./engine-release.mjs";

test("release integrity rejects corruption, missing source, extra variants and notice changes", async (t) => {
  const parent = await mkdtemp(join(tmpdir(), "marcus-compliance-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const cases = [
    ["valid release", async () => {}, false],
    [
      "changed WASM",
      async (dir) => {
        const path = join(dir, "stockfish-19-lite-single.wasm");
        const data = await readFile(path);
        data[data.length - 1] ^= 1;
        await writeFile(path, data);
      },
      true,
    ],
    [
      "corrupted corresponding source",
      async (dir) =>
        writeFile(join(dir, provenance.sourceArchive.file), "corrupt"),
      true,
    ],
    [
      "missing corresponding source",
      async (dir) => rm(join(dir, provenance.sourceArchive.file)),
      true,
    ],
    [
      "unexpected full engine variant",
      async (dir) => writeFile(join(dir, "stockfish-19.wasm"), "unexpected"),
      true,
    ],
    [
      "broken source notice",
      async (dir) => writeFile(join(dir, "NOTICE.txt"), "Source: /missing"),
      true,
    ],
  ];
  for (const [name, mutate, rejects] of cases)
    await t.test(name, async () => {
      const dir = join(parent, name);
      await cp(engineRoot, dir, { recursive: true });
      await mutate(dir);
      if (rejects) await assert.rejects(verifyEngineRelease(dir));
      else await verifyEngineRelease(dir);
    });
});
