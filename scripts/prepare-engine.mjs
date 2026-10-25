import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const root = dirname(require.resolve("stockfish/package.json"));
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (pkg.version !== "19.0.1" || pkg.license !== "GPL-3.0")
  throw new Error(
    "Review engine assets and licensing before changing Stockfish versions.",
  );
const target = new URL("../public/engine/", import.meta.url);
await mkdir(target, { recursive: true });
const hashes = {};
for (const file of [
  "stockfish-19-lite-single.js",
  "stockfish-19-lite-single.wasm",
]) {
  const source = join(root, "bin", file);
  await copyFile(source, new URL(file, target));
  hashes[file] = createHash("sha256")
    .update(await readFile(source))
    .digest("hex");
}
await copyFile(join(root, "Copying.txt"), new URL("COPYING.txt", target));
await writeFile(
  new URL("NOTICE.txt", target),
  "Stockfish.js 19.0.1 by Nathan Rugg and contributors, based on Stockfish. GPL-3.0. Unmodified lite single-threaded build.\nSource release: https://github.com/nmrugg/stockfish.js/tree/v19.0.1\nLicense: COPYING.txt. Before public distribution, supply the exact Corresponding Source and build instructions as described in docs/ENGINE_INTEGRATION.md.\n",
);
await writeFile(
  new URL("manifest.json", target),
  JSON.stringify({ version: pkg.version, hashes }, null, 2) + "\n",
);
console.log("Prepared pinned Stockfish lite single-threaded assets.");
