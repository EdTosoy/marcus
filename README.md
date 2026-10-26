# Marcus

A local, mobile-first chess learning application. **“Is Your Piece Safe?”** provides a visual explanation, five practice positions, and a transfer assessment. Phase 1B adds **Learning practice** at `/learn`: a five-decision baseline, guided practice across five skills, reserved independent checks, delayed review, and an evidence-focused progress view.

The goal is better chess understanding. Learning effectiveness and any efficiency improvement remain unvalidated hypotheses.

Phase 2A adds **Play** at `/play` against a local Stockfish Web Worker, and **Review** at `/review` for selected decisions, reflective retries, optional engine candidates, whole-game replay, and targeted guided practice. Gameplay review remains separate from assessment mastery.

Phase 2B improves coaching for verified mates, sacrifices, en passant and uncertain captures; adds descriptive, uncalibrated beginner presets; and provides **Local results** at `/evaluation` with an opt-in foreground timer and source-separated JSON export. The 14-position coaching benchmark is engineering evidence, not an educational validation study.

## Run locally

Use Node 24 and pnpm 11.27.0 (the pinned package manager).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://127.0.0.1:3000** for the lesson, or **/board** for a free practice board with FEN loading. No environment variables, accounts, database, or remote services are required. Fonts and pieces are local to the application bundle.

The dev/build commands prepare the pinned Stockfish.js lite single-thread assets automatically. To prepare them separately: `pnpm engine:prepare`. Only Play or an explicit review-analysis request starts the engine. Public distribution requires the licensing work described in [Engine integration](docs/ENGINE_INTEGRATION.md).

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Playwright starts the **production build** on port 3100 automatically; run `pnpm build` first. It uses workstation Chromium when available, otherwise Playwright’s Chromium. To select an existing browser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium pnpm test:e2e
```

To verify without replacing another server’s build output, use the same isolated directory for both commands:

```sh
NEXT_DIST_DIR=.next-phase1b pnpm build
NEXT_DIST_DIR=.next-phase1b pnpm test:e2e
```

For Phase 2A verification, use `.next-phase2a` in both commands; the validated environment fallback is `NEXT_DIST_DIR=.next-phase2a pnpm build --webpack`.

For current Phase 2B verification, use `NEXT_DIST_DIR=.next-phase2b pnpm build --webpack` followed by `NEXT_DIST_DIR=.next-phase2b pnpm test:e2e`. Actual-engine checks run with `MARCUS_REAL_ENGINE=1 pnpm exec vitest run src/engine/stockfish.integration.test.ts`. Optional Firefox/WebKit projects use `MARCUS_EXTRA_BROWSERS=1` when those binaries are installed.

If a restricted environment prevents Turbopack’s CSS worker from opening a local socket, the supported alternative is `NEXT_DIST_DIR=.next-phase1b pnpm build --webpack`. Builds still require child-process access; browser tests require loopback sockets and Chromium subprocesses.

On a clean machine without Chromium, install the browser with `pnpm exec playwright install chromium`. Chromium’s sandbox stays enabled. Restricted execution environments must permit loopback sockets and browser subprocesses for builds and browser tests.

For production-mode local use: `pnpm build && pnpm start`.

## Structure

```text
src/
  app/                       Next.js routes, layout, design tokens, Tailwind entry
  components/                Lesson player, maintained chessboard adapter, practice board
  domain/
    chess/                   Thin chess.js integration; no custom chess rules
    curriculum/              Deterministic lesson content, separate from UI
    adaptive/                Skill graph, evidence states, review scheduling, selection
    gameplay/                Legal game lifecycle, reconstruction, PGN
    review/                  Decision selection, recovery evidence, practice bridge
    learning/                Types, answer validation, lesson transitions, progress
  infrastructure/            Versioned, validated browser-local progress
  engine/                    Replaceable typed worker/UCI adapter
tests/e2e/                   Production browser journeys, desktop and mobile touch
docs/                        Product, architecture, learning design, acceptance, roadmap
```

## Learning and persistence

Safe means **no opposing piece attacks the destination after a legal move**. Every move meeting the stated objective is accepted. This introductory rule is deliberately stricter than “a good chess move”; defended pieces, favorable exchanges, pins, sacrifices, and deeper tactics need later lessons.

Progress records attempts, hints, first-try unhinted successes, completion, and first versus eventual assessment success. Completion never establishes mastery. Undo and retry retain attempt and hint evidence. A repeated lesson retains the previous run and explicitly describes the assessment as repeated practice.

Data stays in `localStorage` under `quiet-chess:learning:v1`. The latest 20 previous completed runs are retained alongside the active run. Clearing browser data removes progress. Unavailable storage falls back to in-memory practice with a visible warning. There is no cross-device synchronization or automatic coordination between tabs.

Adaptive practice uses a separate `marcus:learning:v2` record and preserves the original lesson data. Its 35 positions span recognizing attacks, attacks and defenders, hanging pieces, destination safety, and immediate opponent captures. Baseline, transfer, and delayed checks accept one response with no hints, retries, or solutions. Guided retries require a reflection and retain assistance and earlier mistakes.

Recommendations respect instructional prerequisites and reserve unfamiliar assessment positions. Review starts one day after a first fresh transfer success, then uses three- and seven-day intervals after successful reviews. “Demonstrated” is a provisional rule requiring two completed guided positions, two fresh independent transfer successes, an eligible delayed success, and two difficulty levels. It is not validated mastery or a chess rating. Each skill has only two delayed positions; exhausted checks are never reused as fresh evidence.

After completing the baseline and leaving any active independent check, **Learning progress** offers a local JSON download of responses, assistance, roles, difficulty, and timestamps. No name or account is required and nothing is uploaded. Local timestamps and evidence are editable and cannot establish elapsed time independently of the device clock. The log supports up to 1,000 runs; storage corruption or unsupported versions produce a visible fresh-record fallback.

## Documentation

Deployment preparation: [Phase D0 readiness, current Vercel settings and proposed D1 procedure](docs/PHASE_D0_DEPLOYMENT_READINESS.md). No preview or production deployment is authorized by this preparation.

Gameplay uses `marcus:games:v1`: one active game, the latest 20 completed games, PGN, and up to three review decisions per game with 30 retries per decision. Games are bounded at 600 plies. Unsupported/corrupt game data falls back visibly; earlier learning keys are preserved. Export PGN from Play or Review and recovery evidence as JSON from Review. Short engine searches and approximate difficulty are not validated beginner calibration, and a possible capture is not automatically a blunder.

- [Product vision](docs/PRODUCT_VISION.md)
- [Architecture and dependency decisions](docs/ARCHITECTURE.md)
- [Learning model and content review](docs/LEARNING_SYSTEM.md)
- [Acceptance criteria and verification](docs/PHASE_1_ACCEPTANCE.md)
- [Phase 1B roadmap](docs/PHASE_1B_ROADMAP.md)
- [Phase 1B implementation plan](docs/PHASE_1B_PLAN.md)
- [Phase 1B verification](docs/PHASE_1B_VERIFICATION.md)
- [Educator and learner review protocol](docs/PHASE_1B_REVIEW_PROTOCOL.md)
- [Phase 2A implementation plan](docs/PHASE_2A_PLAN.md)
- [Engine integration and licensing](docs/ENGINE_INTEGRATION.md)
- [Game review design](docs/GAME_REVIEW_DESIGN.md)
- [Learning transfer](docs/LEARNING_TRANSFER.md)
- [Beginner pilot protocol — not conducted](docs/BEGINNER_PILOT_PROTOCOL.md)
- [Phase 2A verification](docs/PHASE_2A_VERIFICATION.md)
- [Phase 2B plan](docs/PHASE_2B_PLAN.md)
- [Coaching rubric and audit](docs/COACHING_QUALITY_RUBRIC.md)
- [Coaching benchmark](docs/COACHING_BENCHMARK.md)
- [Difficulty calibration](docs/DIFFICULTY_CALIBRATION.md)
- [Mobile test protocol](docs/MOBILE_TEST_PROTOCOL.md)
- [Local learning evaluation](docs/LEARNING_EVALUATION.md)
- [Phase 2B verification](docs/PHASE_2B_VERIFICATION.md)

No authentication, AI explanations, multiplayer, payments, or remote backend is included. Engine computation stays in the browser; independent play has no evaluations or best-move suggestions.

### Phase 2C local pilot experience

Approved knight/book branding, system/light/dark themes, compact mobile navigation and a supervised `/pilot` guide refine the existing learning/gameplay flows. Stitch is excluded. Learning/engine rules and local evidence schemas remain unchanged; Local results withholds outcomes during independent checks.

```sh
NEXT_DIST_DIR=.next-phase2c pnpm build --webpack
NEXT_DIST_DIR=.next-phase2c pnpm test:e2e
NEXT_DIST_DIR=.next-phase2c pnpm start --port 3460
```

See [verification](docs/PHASE_2C_VERIFICATION.md), [brand provenance](docs/BRAND_INTEGRATION.md), [UX findings](docs/UX_AUDIT.md) and [local pilot release/rollback](docs/PILOT_RELEASE_CHECKLIST.md). This is preparation for supervised testing, not educational validation or public-release approval.
