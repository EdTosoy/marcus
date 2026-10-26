import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const vendorRoot = join(projectRoot, "third_party/stockfish/19.0.1");
export const engineRoot = join(projectRoot, "public/engine");
export const provenance = JSON.parse(
  await readFile(join(vendorRoot, "provenance.json"), "utf8"),
);
const require = createRequire(import.meta.url);
export const packageRoot = dirname(require.resolve("stockfish/package.json"));
export const sha256 = (data) => createHash("sha256").update(data).digest("hex");
export const expectedFiles = [
  ...Object.keys(provenance.binaries),
  provenance.sourceArchive.file,
  "COPYING.txt",
  "AUTHORS.txt",
  "EMSCRIPTEN-LICENSE.txt",
  "SOURCE.txt",
  "NOTICE.txt",
  "manifest.json",
].sort();

export function engineNotice() {
  return (
    "Stockfish.js 19.0.1 — unmodified lite single-threaded engine.\n" +
    "Copyright Chess.com, LLC; Nathan Rugg and contributors; based on Stockfish by T. Romstad, M. Costalba, J. Kiiski, G. Linscott and the Stockfish developers.\n" +
    "Lite network by Chris Bao (sscg13). No engine source patches.\n" +
    "License: /engine/COPYING.txt (GPLv3; source files retain their own notices). No warranty.\n" +
    "Authors: /engine/AUTHORS.txt. Compiler/runtime notices: /engine/EMSCRIPTEN-LICENSE.txt.\n" +
    `Exact corresponding source, including embedded NNUE and build inputs: ${provenance.sourceArchive.publicPath}\n` +
    `Source archive SHA-256: ${provenance.sourceArchive.sha256}\n` +
    `Upstream source commit: ${provenance.upstream.commit}\n` +
    "Build/acquisition instructions: /engine/SOURCE.txt. Notices: /open-source.\n" +
    "Source is available alongside the binaries at no additional charge with equivalent access. Recipients retain their applicable GPL rights.\n"
  );
}

export function engineManifest() {
  return {
    version: provenance.version,
    variant: provenance.variant,
    hashes: Object.fromEntries(
      Object.entries(provenance.binaries).map(([name, info]) => [
        name,
        info.sha256,
      ]),
    ),
    upstreamCommit: provenance.upstream.commit,
    source: provenance.sourceArchive,
    network: provenance.network,
    license: "/engine/COPYING.txt",
    instructions: "/engine/SOURCE.txt",
  };
}

export async function verifyReleaseInputs() {
  assert.equal(
    provenance.version,
    "19.0.1",
    "Review changed provenance version",
  );
  assert.equal(
    provenance.variant,
    "lite-single",
    "Review changed binary variant",
  );
  assert.equal(
    provenance.upstream.commit,
    "0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6",
    "Review changed source commit",
  );
  const pkg = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8"),
  );
  assert.equal(pkg.version, "19.0.1", "Review changed engine version");
  assert.equal(pkg.license, "GPL-3.0", "Review changed engine license");
  const app = JSON.parse(
    await readFile(join(projectRoot, "package.json"), "utf8"),
  );
  assert.equal(
    app.dependencies.stockfish,
    pkg.version,
    "Engine dependency must stay exact",
  );
  const lock = await readFile(join(projectRoot, "pnpm-lock.yaml"));
  assert.ok(
    lock.toString().includes(provenance.package.integrity),
    "Engine lock integrity changed",
  );
  for (const [name, info] of Object.entries(provenance.binaries)) {
    const data = await readFile(join(packageRoot, "bin", name));
    assert.equal(data.length, info.bytes, `${name}: package size mismatch`);
    assert.equal(
      sha256(data),
      info.sha256,
      `${name}: package checksum mismatch`,
    );
  }
  const source = await readFile(
    join(vendorRoot, provenance.sourceArchive.file),
  );
  assert.equal(
    sha256(source),
    provenance.sourceArchive.sha256,
    "Source archive checksum mismatch",
  );
  assert.equal(
    sha256(await readFile(join(vendorRoot, "COPYING.txt"))),
    "0b383d5a63da644f628d99c33976ea6487ed89aaa59f0b3257992deac1171e6b",
    "GPL license changed",
  );
  const inventory = JSON.parse(
    await readFile(
      join(projectRoot, "third_party/runtime-components.json"),
      "utf8",
    ),
  );
  assert.equal(
    inventory.lockfileSha256,
    sha256(lock),
    "Regenerate component notices for this lockfile",
  );
  assert.equal(
    inventory.noticeSha256,
    sha256(
      await readFile(join(projectRoot, "third_party/OPEN_SOURCE_LICENSES.txt")),
    ),
    "Component notices checksum mismatch",
  );
  const worker = await readFile(
    join(projectRoot, "src/engine/uci-engine.ts"),
    "utf8",
  );
  assert.ok(
    worker.includes('new Worker("/engine/stockfish-19-lite-single.js")'),
    "Worker path changed: review release provenance",
  );
}

export async function verifyEngineRelease(directory = engineRoot) {
  await verifyReleaseInputs();
  assert.deepEqual(
    (await readdir(directory)).sort(),
    expectedFiles,
    "Unexpected or missing engine release files",
  );
  for (const [name, info] of Object.entries(provenance.binaries))
    assert.equal(
      sha256(await readFile(join(directory, name))),
      info.sha256,
      `${name}: distributed checksum mismatch`,
    );
  const copies = {
    [provenance.sourceArchive.file]: provenance.sourceArchive.file,
    "COPYING.txt": "COPYING.txt",
    "AUTHORS.txt": "AUTHORS",
    "EMSCRIPTEN-LICENSE.txt": "EMSCRIPTEN-LICENSE.txt",
    "SOURCE.txt": "SOURCE_README.md",
  };
  for (const [destination, source] of Object.entries(copies))
    assert.equal(
      sha256(await readFile(join(directory, destination))),
      sha256(await readFile(join(vendorRoot, source))),
      `${destination}: release copy differs`,
    );
  assert.equal(
    await readFile(join(directory, "NOTICE.txt"), "utf8"),
    engineNotice(),
    "Engine notice/link mismatch",
  );
  assert.deepEqual(
    JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")),
    engineManifest(),
    "Engine release manifest mismatch",
  );
}
