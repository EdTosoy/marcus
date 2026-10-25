# Browser engine integration

## Selected distribution

Pinned `stockfish@19.0.1` (GPL-3.0), Nathan Rugg’s Stockfish.js distribution. Installed package metadata, README, license, browser loader and actual worker behavior were inspected. Only `stockfish-19-lite-single.js` (28,230 bytes) and its matching `.wasm` (1,845,971 bytes) are copied into `public/engine/`. The package itself contains other, much larger flavors; they are not served by this application. This dependency supplies local chess computation; no other dependency or cloud service was added.

The upstream [browser loading documentation](https://github.com/nmrugg/stockfish.js/tree/v19.0.1) describes a classic Web Worker with the matching WASM file alongside it. The single-thread flavor does not require cross-origin isolation or SharedArrayBuffer. The installed loader uses WebAssembly; unsupported Worker/WASM environments get a visible error and can still use the existing lessons. Chromium is exercised here; modern Safari/Firefox support is an upstream claim, not device coverage from this task.

`pnpm engine:prepare`, `pnpm dev`, and `pnpm build` run `scripts/prepare-engine.mjs`. It verifies package version/license, copies the unmodified engine files, and writes a SHA-256 manifest, GPL text, and attribution/source notice. No dependency build scripts were enabled. Runtime assets are generated and ignored by Git, lint, and formatting. Deployment packaging must include the generated `public/engine` folder, with JavaScript and WASM MIME types. Next.js serves these locally.

## Adapter and lifecycle

`src/engine/types.ts` defines the replaceable `ChessEngine` interface. `UciEngine` uses an injected worker port for deterministic tests. The browser wrapper owns a real Web Worker, never running Stockfish on the UI thread.

Initialization waits for `uciok`, configures one thread and no pondering, then waits for `readyok`. Each search configures hash, skill and MultiPV and uses another readiness barrier. Playing requests include starting FEN plus the complete move list, checked against the current FEN, preserving repetition context. Returned best moves and each retained principal-variation move are validated with chess.js. No line is used as a trusted natural-language diagnosis.

Only one request may be outstanding. UCI has no request identifiers, so cancellation terminates the worker and rejects the request rather than trying to reuse an undrained result stream. A generation guard and worker-identity checks reject stale output; the Play component additionally compares game ID and requested FEN before applying a reply. The next search lazily initializes a replacement. Normal completed searches reuse one worker. Unmount disposes it. Restart, pause, resignation, navigation, errors and timeouts cannot commit an old best move. Hiding Play pauses the game; the learner explicitly resumes it.

UCI initialization/readiness has a 15-second timeout. Searches have a watchdog of requested search time plus five seconds; watchdog failures destroy the worker and expose restart. Worker errors, message errors, missing/illegal best moves, and unsupported environments fail visibly. The adapter rejects overlapping requests instead of queueing expensive background work.

## Resource and strength policy

| Setting     | Playing defaults                                                        | Hard adapter bound                                   |
| ----------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| Threads     | 1, single-thread binary                                                 | 1; UCI Threads has no effect on this flavor          |
| Hash        | 8 MiB                                                                   | 4–32 MiB; this is hash size, not total worker memory |
| Search time | Getting Started 80 / Beginner 100 / Developing 175 / Challenging 350 ms | 50–1,000 ms                                          |
| Nodes       | 500 / 2,000 / 8,000 / 60,000                                            | 100–100,000                                          |
| Depth       | 1 / 2 / 6 / 12                                                          | 1–14                                                 |
| MultiPV     | 1                                                                       | 1–3                                                  |
| Skill Level | 0 / 0 / 3 / 10                                                          | 0–20                                                 |

Review uses skill 20, up to three candidates, 300 ms and 60,000 nodes. Node/depth/time limits can end a search before its requested time. A short search can miss tactics. No continuous analysis, pondering, whole-game engine sweep, opening-book download, tablebase service, evaluation bar, or automatic best-move display is used.

Skill Level deliberately weakens move selection; [Stockfish’s strength FAQ](https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html) explains that this is different from calibrated human ability. Phase 2B adds descriptive shallow-search presets while retaining old saved IDs; see [Difficulty calibration](DIFFICULTY_CALIBRATION.md). Even Getting Started may remain difficult for a true beginner. Do not display an Elo estimate or claim calibrated ability. Physical low-power devices and total memory/battery use still need measurement.

Completed review analyses are cached in memory by engine version, game ID, decision ply/FEN and search policy. Only requested decisions are analyzed. A reload runs a fresh bounded search; stored review evidence is retained independently. The cache is not an authoritative or permanent analysis record.

## GPL distribution obligations — before public release

The installed package includes `Copying.txt`, copied to `/engine/COPYING.txt`; `/engine/NOTICE.txt` attributes Stockfish.js, Nathan Rugg and contributors and identifies the exact version. The engine files remain unmodified. Local implementation does not establish public-distribution compliance for a future deployment.

Before serving these binaries publicly, provide accessible **Corresponding Source for the exact distributed engine**, including its build scripts, required network assets/configuration, and any modifications, together with license and copyright notices. Keep a versioned source archive or verified equivalent source location and clear directions next to the binaries; do not rely on a moving default branch or assume an npm binary package contains all source needed to rebuild. Preserve access for as long as the chosen distribution method requires it. See [GPLv3 section 6](https://www.gnu.org/licenses/gpl.en.html) and the [GNU source-distribution FAQ](https://www.gnu.org/licenses/gpl-faq.en.html#SourceAndBinaryOnDifferentSites).

The release owner must verify that the v19.0.1 source/build recipe reproduces the selected published artifact, archive the matching source and notices, disclose changes if any, and review the licensing of the distributed application as a whole. A worker boundary alone is not a determination that the surrounding product is exempt from GPL obligations. This phase neither chooses a public application license nor supplies a complete corresponding-source release bundle. **Public distribution remains pending that work and explicit deployment authorization.**

## Sources and verification boundary

The installed package’s README, `package.json`, `Copying.txt`, and pinned loader are the exact-version evidence. Current upstream loading and licensing information was checked against those files. The installed Next.js CLI documents `--webpack`; its page convention documents awaited `searchParams`, used for review and targeted practice links. See [Phase 2A verification](PHASE_2A_VERIFICATION.md) for executed worker/browser checks and environmental limitations.
