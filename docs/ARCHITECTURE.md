# Architecture

## Modular monolith

One Next.js application with framework-independent TypeScript domain modules. The domain imports chess.js, but never React, Next.js, browser APIs, or presentation components. There are no network API routes in this phase.

```text
Route → lesson player → transition / validateResponse → chess.js
                    ↘ browser-local store → validated JSON
Route → practice board → replay moves → chess.js
```

| Responsibility        | Location                                                | Contract                                                                                  |
| --------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Chess state and rules | `src/domain/chess/game.ts`                              | chess.js creates positions, legal moves, SAN, and terminal states                         |
| Curriculum            | `src/domain/curriculum/piece-safety.ts`                 | Typed deterministic content with objectives, misconceptions, hints, and reviewed examples |
| Exercises             | `src/domain/learning/types.ts`, `validation.ts`         | Discriminated answer types; return correct, incorrect, or invalid                         |
| Attempts and feedback | `src/domain/learning/session.ts`                        | Pure transitions, append-only attempts within a run, graduated hints                      |
| Progress              | `progress()` and `src/infrastructure/local-progress.ts` | Derived metrics, versioned decoding, revalidation of stored answers                       |
| Presentation          | `src/components/`                                       | Board adapter, lesson interaction, feedback, accessible controls                          |
| Routing and shell     | `src/app/`                                              | Server-rendered pages and layout; client components at interaction boundaries             |

## Decisions

**chess.js is the rules authority.** `play` catches its illegal-move error and returns null; `replay` reconstructs a game from starting FEN and moves. Practice preserves the full move sequence so repetition detection is not lost by reconstructing only the latest FEN. Undo removes a move; restart preserves the loaded starting position.

**The board is an adapter.** react-chessboard handles piece rendering, responsive geometry, dragging, arrows, and coordinates. The adapter uses chess.js for legal destinations and validates every requested move. It offers tap-to-select, drag, roving square focus with arrow keys, Enter/Space selection, and explicit queen/rook/bishop/knight promotion. Animations are disabled; reduced motion is also respected globally.

**A small answer union instead of an engine.** Attacker identification accepts every reviewed actual attacker. Safe-move validation evaluates the resulting board rather than a single preferred move. Explicit move sets are supported for future bounded exercises. Adding a new objective requires an intentional new validator and tests, rather than arbitrary executable code in curriculum data.

**Pure lesson transitions.** `next`, `submit`, `hint`, and `retry` events are deterministic. A current response must be correct before advancing. A response stays locked while feedback is visible. Undo/restart restores the position but retains attempt and hint evidence. Checkmate and draw handling are visible in the practice board.

**Local persistence at a boundary.** A small `useSyncExternalStore` adapter reads after hydration and saves on learner events. Stable server snapshots avoid SSR mismatch and prevent a fresh client render from overwriting saved data. JSON decoding validates version, IDs, positions in the lesson sequence, attempt types, correctness, hint bounds, solved state, and completed runs. Data is untrusted even though it is local. Corruption starts a new session with a warning. Write/read failure leaves usable in-memory practice.

Storage is per browser origin, last writer wins across tabs. At most 20 archived completed runs are retained. This is not an authoritative record and can be edited by the learner. A changed content version starts fresh instead of silently interpreting old attempts under new rules. No migration framework is warranted yet.

**Design.** The Dose direction supplies restrained green, warm paper, system sans typography, and calm controls. Local system fonts avoid runtime font requests and build-time remote downloads. The primary object is a real chessboard, with a single teaching task. On phones, instructions precede the board; feedback and actions follow. Tailwind 4 is configured through its PostCSS integration; semantic CSS classes and shared tokens carry the board’s detailed states and responsive geometry.

## Dependency compatibility

Exact versions are in `package.json` and `pnpm-lock.yaml`. Registry metadata and installed declarations were inspected during implementation.

- Node 24.21.0, pnpm 11.27.0
- Next.js 16.4.3 supports Node >=20.9 and React 19
- React / React DOM 19.3.1
- react-chessboard 5.12.1 requires React / React DOM ^19; uses the `options` API
- chess.js 1.4.0 provides `attackers`, `isAttacked`, FEN, SAN, and full legal move handling
- TypeScript 5.9.3 and ESLint 9.39.5 match the installed Next.js lint plugins’ peer ranges. Newer major versions were not compatible with those ranges. ESLint 9 is deprecated upstream; review this tooling choice when the plugins support the newer major.
- Vitest 5.0.5 supports Node 24; Playwright 1.64.1 drives Chromium
- Tailwind and its PostCSS adapter 4.3.3

The optional unrs-resolver package build script is explicitly disabled in `pnpm-workspace.yaml`; its distributed native package works in the verified lint run. No other custom install scripts are introduced.

## Official sources consulted

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), plus installed `next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `05-server-and-client-components.md`, and `11-css.md` for the installed version
- [react-chessboard repository](https://github.com/Clariity/react-chessboard), plus installed `dist/ChessboardProvider.d.ts`, `types.d.ts`, and square/drag implementation for the exact API
- [chess.js 1.4.0 documentation](https://jhlywa.github.io/chess.js/), plus installed declarations

## Phase 1B adaptive practice

`/learn` → `AdaptivePractice` → pure `learningTransition`, `recommend`, and `learnerModel` → `chess.js`. `useAdaptiveProgress` owns hydration, browser-local persistence, and clock refresh. `src/domain/curriculum/foundations.ts` contains the 35 authored exercises; `src/domain/adaptive/skills.ts` defines five skills and their prerequisites. No dependencies or services were added.

Exercise roles are diagnostic, guided, transfer, and delayed. Independent roles seal one response and expose neither hints nor solutions. The progress screen and export are withheld until the baseline is complete and the learner leaves an independent check. Guided retries require a recorded self-reflection. Content validation rejects repeated or reflected/color-reversed positions across the bank; the original lesson is also checked against the bank. This detects simple board reuse, not all conceptual similarity.

The separate `marcus:learning:v2` store validates curriculum versions, chronology, legal responses, recomputed correctness, monotonic hints, reflection gates, and assessment uniqueness. Legacy v1 results are summarized without timestamps or independent-evidence credit; the v1 key is untouched. Unsupported or damaged adaptive data falls back visibly. Evidence remains local and editable; no authoritative timing or tamper resistance is claimed.

Model thresholds live in `defaultModelConfig`. Scheduling and selection use explicit timestamps supplied to pure functions. The UI refreshes its clock each minute and on focus; transitions refuse clock rollback against recorded events. JSON export includes raw runs and derived observations, without requiring identity. The bank has finite independent content, and familiar guided rehearsal never supplies fresh transfer credit.

## Extension boundaries

Phase 2B adds `src/domain/coaching/` for validated tactical facts and bounded mate proofs, plus `src/domain/evaluation/` for source-separated metrics and measured foreground time. `/evaluation` offers an explicit local export and opt-in timer. A root client provider retains timing across in-app navigation; it does no analytics upload. Review asks one first-candidate reply prediction and treats legacy missing fields as uncollected. Mastery rules remain unchanged. See [coaching rubric](COACHING_QUALITY_RUBRIC.md), [benchmark](COACHING_BENCHMARK.md), and [evaluation definitions](LEARNING_EVALUATION.md).

Phase 2A adds `/play` → `PlayGame` → pure game sessions → chess.js, and `/review` → selective review/recovery → separate gameplay evidence → existing guided curriculum. `src/engine/` owns a replaceable typed UCI adapter with one lazy Stockfish Web Worker per mounted Play/Review session. It is never imported into the chess-rule implementation. `src/infrastructure/game-progress.ts` validates the independent `marcus:games:v1` record; original learning keys and mastery derivation are preserved. Engine analysis runs only for an opponent turn or an explicit review reveal. Details and pending distribution obligations are in [Engine integration](ENGINE_INTEGRATION.md), [Review design](GAME_REVIEW_DESIGN.md), and [Learning transfer](LEARNING_TRANSFER.md).

Introduce a database or engine only when a concrete next slice needs one. Avoid repository packages, generic plugin systems, event buses, or service layers until their costs solve a real problem. Educator review, learner observations, and calibrated learning claims remain pending; see the [review protocol](PHASE_1B_REVIEW_PROTOCOL.md).
