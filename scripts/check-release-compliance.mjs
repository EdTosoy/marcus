import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { projectRoot, sha256, verifyEngineRelease } from "./engine-release.mjs";

await verifyEngineRelease();
for (const [published, original] of [
  ["OPEN_SOURCE_LICENSES.txt", "OPEN_SOURCE_LICENSES.txt"],
  ["components.json", "runtime-components.json"],
])
  assert.equal(
    sha256(await readFile(join(projectRoot, "public/licenses", published))),
    sha256(await readFile(join(projectRoot, "third_party", original))),
    `${published}: public notices do not match reviewed source`,
  );
for (const path of [
  "docs/STOCKFISH_SOURCE_DISTRIBUTION.md",
  "docs/OPEN_SOURCE_NOTICES.md",
])
  assert.ok(
    (await readFile(join(projectRoot, path), "utf8")).includes("19.0.1"),
    `${path}: exact version missing`,
  );
console.log(
  "PASS: binary/source checksums, exact file set, release copies, notices, lockfile and worker path. Legal approval is separate.",
);
