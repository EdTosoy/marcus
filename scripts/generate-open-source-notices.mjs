import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

// Input: corepack pnpm licenses list --prod --json > /tmp/marcus-licenses.json
// The input contains local install paths; only package metadata/notices are saved.
const root = new URL("../", import.meta.url);
const input = JSON.parse(await readFile(process.argv[2], "utf8"));
if (input.error) throw new Error("pnpm license inventory failed");
const hash = (data) => createHash("sha256").update(data).digest("hex");
const nextRoot = new URL("../node_modules/next/", import.meta.url);
const nextLicense = await readFile(
  new URL("license.md", nextRoot),
  "utf8",
).catch(() => readFile(new URL("LICENSE", nextRoot), "utf8"));
const notices = [];
const packages = [];
for (const [license, entries] of Object.entries(input)) {
  for (const entry of entries) {
    for (const path of entry.paths) {
      const pkg = JSON.parse(
        await readFile(join(path, "package.json"), "utf8"),
      );
      if (
        packages.some((p) => p.name === pkg.name && p.version === pkg.version)
      )
        continue;
      const files = (await readdir(path)).filter((f) =>
        /^(licen[sc]e|copying|notice)([._-]|$)/i.test(f),
      );
      const texts = [];
      for (const file of files.sort())
        texts.push(`${file}\n${await readFile(join(path, file), "utf8")}`);
      let noticeOrigin = "published package license/notice files";
      if (!texts.length && pkg.name.startsWith("@next/")) {
        if (pkg.version !== "16.4.3")
          throw new Error("Review Next license fallback");
        texts.push(nextLicense);
        noticeOrigin = "next@16.4.3 license (same upstream repository)";
      }
      if (!texts.length) {
        noticeOrigin = "package license declaration; no license text supplied";
        texts.push(
          `Published package declares ${license}. No license/copyright file was supplied.\n` +
            `Package metadata: ${JSON.stringify({ name: pkg.name, version: pkg.version, license: pkg.license, repository: pkg.repository ?? null })}\n` +
            "This entry preserves the publisher declaration; it does not invent a copyright grant.\n",
        );
      }
      const text = texts.join("\n\n");
      packages.push({
        name: pkg.name,
        version: pkg.version,
        license,
        noticeOrigin,
      });
      notices.push({ label: `${pkg.name}@${pkg.version} (${license})`, text });
    }
  }
}
async function collectBundled(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collectBundled(path);
    else if (/^(licen[sc]e|copying|notice)([._-]|$)/i.test(entry.name)) {
      notices.push({
        label: `next@16.4.3 bundled ${relative(new URL(nextRoot).pathname, path)}`,
        text: await readFile(path, "utf8"),
      });
    }
  }
}
await collectBundled(new URL("dist/compiled/", nextRoot).pathname);
notices.push({
  label: "Emscripten 6.0.9 compiler/runtime notices for the engine",
  text: await readFile(
    new URL("third_party/stockfish/19.0.1/EMSCRIPTEN-LICENSE.txt", root),
    "utf8",
  ),
});
notices.sort((a, b) => a.label.localeCompare(b.label, "en"));
const combined =
  "MARCUS — THIRD-PARTY COMPONENT NOTICES\n\n" +
  "These licenses apply to the named components, not to all Marcus application code.\n" +
  "Inventory includes the production install graph (including optional/build inputs) and Next bundled notices.\n" +
  "An inventory entry does not assert that every installed component is shipped to a browser.\n" +
  "Stockfish.js 19.0.1 source, GPL and build directions: /open-source and /engine/NOTICE.txt\n\n" +
  notices.map((n) => `===== ${n.label} =====\n\n${n.text.trim()}\n`).join("\n");
const inventory = {
  schemaVersion: 1,
  lockfileSha256: hash(await readFile(new URL("pnpm-lock.yaml", root))),
  noticeSha256: hash(combined),
  bundledNoticeCount: notices.length - packages.length,
  packages: packages.sort((a, b) => a.name.localeCompare(b.name, "en")),
};
await writeFile(
  new URL("third_party/OPEN_SOURCE_LICENSES.txt", root),
  combined,
);
await writeFile(
  new URL("third_party/runtime-components.json", root),
  JSON.stringify(inventory, null, 2) + "\n",
);
console.log(
  `Recorded ${packages.length} packages and ${inventory.bundledNoticeCount} bundled notice files.`,
);
