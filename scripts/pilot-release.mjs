// Local-only source receipt. This does not run tests, publish, or approve a release.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { join, dirname, resolve, relative } from "node:path";

const [mode = "create", destination = "artifacts/phase2c/release"] =
  process.argv.slice(2);
if (!["create", "verify"].includes(mode))
  throw new Error("Use create or verify [local receipt directory].");
const root = process.cwd();
const output = resolve(destination);
if (output === root || !relative(root, output).startsWith("artifacts/"))
  throw new Error(
    "Store the receipt in an ignored artifacts/ subdirectory of this project.",
  );
const roots = ["src", "public", "scripts", "tests", "assets"];
const configs = [
  "package.json",
  "pnpm-lock.yaml",
  "next.config.ts",
  "tsconfig.json",
  "next-env.d.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "playwright.config.ts",
  "vitest.config.ts",
  ".gitignore",
  ".prettierignore",
];
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function filesUnder(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (path === join("public", "engine")) continue; // Recreated from the pinned dependency.
    if (entry.isSymbolicLink())
      throw new Error(`Unexpected symbolic link in release inputs: ${path}`);
    if (entry.isDirectory()) files.push(...(await filesUnder(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}
async function hashes(paths) {
  const result = {};
  for (const path of [...paths].sort())
    result[path] = sha(await readFile(path));
  return result;
}
const inputs = await hashes([
  ...configs,
  ...(await Promise.all(roots.map(filesUnder))).flat(),
]);
const contentSha256 = sha(JSON.stringify(inputs));
const engine = await hashes(
  (await readdir("public/engine")).map((file) => `public/engine/${file}`),
);
const buildId = (await readFile(".next-phase2c/BUILD_ID", "utf8")).trim();
const manifestPath = join(output, "manifest.json");
if (mode === "verify") {
  const receipt = JSON.parse(await readFile(manifestPath, "utf8"));
  const documentation = await hashes([
    "README.md",
    ...(await filesUnder("docs")),
  ]);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (
    receipt.contentSha256 !== contentSha256 ||
    !same(receipt.engine, engine) ||
    receipt.buildId !== buildId ||
    !same(receipt.documentation, documentation)
  )
    throw new Error(
      "Receipt differs from current source, documentation, engine assets, or build. Inspect changes and reverify before creating a new receipt.",
    );
  // Also verify the archived source, so the rollback copy is trustworthy.
  for (const [file, expected] of Object.entries({
    ...receipt.inputs,
    ...receipt.documentation,
  }))
    if (sha(await readFile(join(output, "source", file))) !== expected)
      throw new Error(`Archived source differs: ${file}`);
  console.log(
    `PASS local receipt ${contentSha256}; build ${buildId}. No test or licensing approval is implied.`,
  );
} else {
  try {
    await stat(manifestPath);
    throw new Error(
      "Receipt exists. Choose a new artifacts/ subdirectory rather than overwriting it.",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const documentation = await hashes([
    "README.md",
    ...(await filesUnder("docs")),
  ]);
  for (const file of Object.keys({ ...inputs, ...documentation })) {
    const target = join(output, "source", file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(file, target);
  }
  const receipt = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    gitHead: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    branch: execFileSync("git", ["branch", "--show-current"], {
      encoding: "utf8",
    }).trim(),
    worktreeIsUncommitted: true,
    node: process.version,
    pnpm: execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim(),
    contentSha256,
    buildId,
    inputs,
    documentation,
    engine,
    buildCommand: "NEXT_DIST_DIR=.next-phase2c pnpm build --webpack",
    verificationReport: "docs/PHASE_2C_VERIFICATION.md",
    publicDistributionApproved: false,
    humanLearningValidationConducted: false,
  };
  await mkdir(output, { recursive: true });
  await writeFile(manifestPath, JSON.stringify(receipt, null, 2) + "\n");
  console.log(
    `Created local receipt ${contentSha256} with allowlisted source and documentation in ${relative(root, output)}. No credentials, browser data, Git metadata, or engine binaries are copied.`,
  );
}
