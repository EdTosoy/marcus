# Quiet Chess

A local, mobile-first chess learning application. **“Is Your Piece Safe?”** provides a visual explanation, five practice positions, and a transfer assessment. Phase 1B adds **Learning practice** at `/learn`: a five-decision baseline, guided practice across five skills, reserved independent checks, delayed review, and an evidence-focused progress view.

The goal is better chess understanding. Learning effectiveness and any efficiency improvement remain unvalidated hypotheses.

## Run locally

Use Node 24 and pnpm 11.27.0 (the pinned package manager).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://127.0.0.1:3000** for the lesson, or **/board** for a free practice board with FEN loading. No environment variables, accounts, database, or remote services are required. Fonts and pieces are local to the application bundle.

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
    learning/                Types, answer validation, lesson transitions, progress
  infrastructure/            Versioned, validated browser-local progress
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

- [Product vision](docs/PRODUCT_VISION.md)
- [Architecture and dependency decisions](docs/ARCHITECTURE.md)
- [Learning model and content review](docs/LEARNING_SYSTEM.md)
- [Acceptance criteria and verification](docs/PHASE_1_ACCEPTANCE.md)
- [Phase 1B roadmap](docs/PHASE_1B_ROADMAP.md)
- [Phase 1B implementation plan](docs/PHASE_1B_PLAN.md)
- [Phase 1B verification](docs/PHASE_1B_VERIFICATION.md)
- [Educator and learner review protocol](docs/PHASE_1B_REVIEW_PROTOCOL.md)

No authentication, engine evaluation, AI explanations, multiplayer, payments, or remote backend is included.
