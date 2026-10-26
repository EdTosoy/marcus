import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  engineManifest,
  engineNotice,
  packageRoot,
  projectRoot,
  provenance,
  vendorRoot,
  verifyEngineRelease,
  verifyReleaseInputs,
} from "./engine-release.mjs";
await verifyReleaseInputs();
const target = new URL("../public/engine/", import.meta.url);
await mkdir(target, { recursive: true });
for (const file of Object.keys(provenance.binaries)) {
  const source = join(packageRoot, "bin", file);
  await copyFile(source, new URL(file, target));
}
for (const [destination, source] of Object.entries({
  [provenance.sourceArchive.file]: provenance.sourceArchive.file,
  "COPYING.txt": "COPYING.txt",
  "AUTHORS.txt": "AUTHORS",
  "EMSCRIPTEN-LICENSE.txt": "EMSCRIPTEN-LICENSE.txt",
  "SOURCE.txt": "SOURCE_README.md",
}))
  await copyFile(join(vendorRoot, source), new URL(destination, target));
await writeFile(new URL("NOTICE.txt", target), engineNotice());
await writeFile(
  new URL("manifest.json", target),
  JSON.stringify(engineManifest(), null, 2) + "\n",
);
const licenses = new URL("../public/licenses/", import.meta.url);
await mkdir(licenses, { recursive: true });
await copyFile(
  join(projectRoot, "third_party/OPEN_SOURCE_LICENSES.txt"),
  new URL("OPEN_SOURCE_LICENSES.txt", licenses),
);
await copyFile(
  join(projectRoot, "third_party/runtime-components.json"),
  new URL("components.json", licenses),
);
await verifyEngineRelease();
console.log(
  "Prepared verified Stockfish binaries, corresponding source and notices (technical checks; no legal approval).",
);
