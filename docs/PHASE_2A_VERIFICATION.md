# Phase 2A verification

Executed locally on 2026-10-25, Asia/Manila. Node 24.21.0, pnpm 11.27.0, Next.js 16.4.3, chess.js 1.4.0, Stockfish.js 19.0.1, Playwright 1.64.1. Git metadata is unavailable in this workspace; status/diff verification could not run. Existing application files and Phase 1 documentation were inspected before implementation. No commit, push, deployment, public publication, cloud resource, authentication, AI API or database was created.

## Final executed checks

| Command                                            | Status                  | Evidence                                                                                                                                                                       |
| -------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm lint`                                        | **PASS**                | ESLint, zero warnings/errors                                                                                                                                                   |
| `pnpm typecheck`                                   | **PASS**                | Strict TypeScript validation                                                                                                                                                   |
| `pnpm test`                                        | **PASS**                | 150 tests across 11 files; final unit run 2.10 seconds                                                                                                                         |
| `pnpm format:check`                                | **PASS**                | Source, config, tests and documentation formatted                                                                                                                              |
| `NEXT_DIST_DIR=.next-phase2a pnpm build --webpack` | **PASS**                | Final production compilation, TypeScript, static generation and route output                                                                                                   |
| `NEXT_DIST_DIR=.next-phase2a pnpm test:e2e`        | **PASS**                | 28 Chromium tests: 14 desktop and 14 mobile; 38.7 seconds                                                                                                                      |
| Default Turbopack production build                 | **NOT RUN in Phase 2A** | Prior task reproduced CSS worker socket EPERM, including an approved retry. See Phase 1B report; this phase uses the validated Webpack route without claiming a Turbopack pass |
| Git status/diff                                    | **NOT RUN**             | Workspace has no usable Git metadata                                                                                                                                           |

Build and browser commands used approved local process/socket access. The isolated `.next-phase2a` output preserved existing `.next` and `.next-phase1b` output. Playwright starts and stops its own loopback production server on port 3100 and refuses to reuse an existing server. Existing development servers were not stopped. Generated assets are excluded from lint/formatting; Next.js added isolated generated route-type paths to `tsconfig.json`.

The installed Next.js CLI and page-convention docs were checked for `--webpack` and promised `searchParams`. Stockfish’s exact installed package README/metadata/license and pinned files were inspected; current upstream loading and licensing references are recorded in [Engine integration](ENGINE_INTEGRATION.md).

## Engine evidence

Nine deterministic adapter tests cover UCI initialization/readiness, bounded difficulty/hash/time/nodes/MultiPV, legal PV decoding, one worker reused across completed searches, full history, `ucinewgame` on changed game ID, missing/illegal moves, terminal no-move markers, malformed output, overlapping work, abort during initialization/search, stale output, restart, disposal, worker/message errors, timeout and unavailable Worker support.

The **actual shipped WASM engine** runs in the browser tests for both desktop and mobile projects. Tests verify no worker before game start, play Black against a legal White opening, save/reload/resign, start White, make two learner moves and receive two legal replies, pause/resume, export PGN and preserve completed history. Three animation frames execute during initial engine work; this is a basic main-thread responsiveness check, not a latency or mobile-performance benchmark. The actual-engine journey reports zero page errors. Worker-count assertions verify normal search reuse across turns rather than per-turn construction.

Served raw engine payload: 28,230-byte JS loader plus 1,845,971-byte WASM, approximately 1.87 MB decimal before compression. GPL/notice/manifest add about 36 KB. The installed npm package includes other large flavors, but those are not copied to public assets. Default hash is 8 MiB, one worker thread, no pondering, playing searches 150–400 ms with node/depth limits; total worker memory is not measured and is not limited to hash size.

The generated manifest records:

```text
stockfish-19-lite-single.js
ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a
stockfish-19-lite-single.wasm
ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de
```

## Gameplay, review and transfer evidence

The 150-unit suite includes all existing lesson/adaptive/chess checks plus game sessions, review and persistence. New domain tests cover either player color, legal actor gating, resignation and sealing, checkmate, replay reconstruction, PGN round-trip/result, castling, en passant, all promotion choices, stalemate, insufficient material and repetition. Existing chess-rule tests also cover illegal castling, check and fifty-move handling.

Review tests verify selected original FENs, at most three learner decisions, observed legal captures, multiple acceptable retry moves, illegal/attacked alternatives, unclassified opportunities without fabricated skill diagnoses, reflection/reveal gates, retained hints and assistance, separate evidence sources, unchanged assessment state, prerequisite-aware guided recommendations and rejection of reserved assessment IDs or active-run replacement.

Persistence tests revalidate game legality/outcome and review correctness, retain PGN, resume active games/reviews, reject unsupported/corrupt or forged data, bound completed games at 20 and prune expired review links. The two original learning keys remain distinct. Version 1 game decoding rebuilds history incrementally rather than replaying the entire prefix after every move.

Ten new browser scenarios (five per project) supplement the original 18 regressions:

- Actual Stockfish as both colors, normal worker reuse, initial animation-frame responsiveness, pause/resume, saved results and PGN download.
- A deterministic legal game ending in resignation, original-position reconstruction, reflection before retry, a repeated attacked destination, hint, successful alternative, analysis cancellation/retry, legal engine candidate display, preserved assistance after reload, full-game replay, JSON download, unchanged baseline assessment evidence, and targeted guided-practice launch.
- Simulated worker load failure with visible restart, recovery, resign-and-restart while a deliberately delayed calculation is pending, rejection of its late result, and corrupt-storage fallback.
- Automatic checkmate completion from a legally reconstructed pre-mate game using a deterministic engine reply, completed-game persistence and replay.
- Black/Challenging restart after reload preserving color/difficulty and archiving the old game.

The first full browser run passed 24/26; the failure-scenario locator matched both the engine alert and Next.js’s route announcer. It was scoped to the engine alert without weakening its expected message. Focused scenarios then passed; coverage was strengthened for cancellation, automatic mate and restart persistence. The final full suite passed all 28 against the final build. An initial TypeScript worker-port mismatch and React lint findings were repaired before final verification.

## Visual and interaction evidence

Screenshots and test exports are local, ignored artifacts in `test-results/`; the final HTML report is `playwright-report/index.html`. Opened and inspected representative actual renders:

- `test-results/gameplay-real-Stockfish-wo-400ad-gnation-persistence-and-PGN-mobile/real-stockfish-play.png` — phone Play, board and notation, controls, saved game and engine notice.
- `test-results/gameplay-real-Stockfish-wo-400ad-gnation-persistence-and-PGN-desktop/real-stockfish-play.png` — 1440px desktop Play.
- `test-results/gameplay-complete-game-foc-23f8e-ation-and-targeted-practice-desktop/focused-game-review.png` — desktop original-position/retry review, bounded candidate, contextual practice and full-game replay.
- `test-results/gameplay-complete-game-foc-23f8e-ation-and-targeted-practice-mobile/focused-game-review.png` — the same flow on phone layout.

Desktop uses 1440×1000; mobile uses Playwright’s iPhone 13 Chromium viewport/touch emulation. Overflow assertions pass for Play and expanded Review. Existing narrow-layout, reduced-motion and keyboard-board regressions also pass. Review screenshots use a controlled future clock and synthetic test game, not learner-study data. Automated interactions establish behavior; screenshots alone do not establish accessibility or learning outcomes.

## Manual test

With dependencies installed, the final build is ready for local use:

```sh
NEXT_DIST_DIR=.next-phase2a pnpm start --port 3457
```

Choose another unused port if needed. Open `http://127.0.0.1:3457/play`.

1. Choose Black and a difficulty; start and wait for the engine’s opening. Reload and use **Resign and restart**; Black and difficulty should remain selected for the restarted game.
2. Play legal moves, including special moves when available. Pause/resume, check notation, and resign or reach a terminal state. Reopen a completed game from Play or Review and export PGN.
3. Choose a decision, reflect before moving, try an alternative and inspect feedback. Open optional hints, return to the original position, and explicitly reveal/compare. Cancel analysis or navigate away while it runs; old results must not affect a new position or game.
4. Follow a contextual practice link. A completed baseline and prerequisites enable **Start practice from game**; otherwise finish the existing learning sequence. Check that lesson assessments retain their prior evidence.
5. Reload review, inspect preserved assistance/attempt counts, replay previous/next moves, and export gameplay JSON. Compare it separately with the learning-progress export.
6. Revisit `/`, `/learn` and `/board` for original lessons and free-position practice.

## Remaining limitations and Phase 2B recommendation

- **NOT RUN:** physical low-power phones, WebKit/Firefox, battery/thermal or total-memory measurement, network-throttled loading, full screen-reader conformance, independent coach review and the 5–8 learner pilot. Mobile Chromium emulation is not physical-device evidence.
- **NOT VALIDATED:** beginner difficulty calibration, educational importance of every selected capture, learning effectiveness, transferable mastery or a 10× efficiency gain. The pilot protocol is preparation only.
- Selection is a bounded immediate-capture/defender heuristic and may flag good trades or sacrifices. It can miss deep tactics, quiet threats, en passant captures of a pawn on a different landing square, and important decisions outside the selected three. Unclassified cases remain analysis opportunities. Retry success only establishes the explicit no-attacks destination rule, not best play or resolution of every threat.
- Short lite-engine searches can miss strong moves. Candidate ranking can vary by device/search history; candidates are suggestions, not a unique answer key or complete tactical proof. Actual full-length games were not benchmarked; actual-engine browser games end by resignation, while deterministic scenarios verify automatic mate.
- No PGN import, accounts, database, cross-device/cross-tab coordination or remote backup. Game storage is browser-local and editable. The latest 20 games, at most 600 plies each and 30 retries per selected decision are retained. Analysis cache is session-local; reload recomputes on demand.
- Public distribution requires exact corresponding-source/build packaging and application licensing review described in [Engine integration](ENGINE_INTEGRATION.md). That release work and deployment are not completed or authorized here.

Recommended Phase 2B: coach-review the selector and language; conduct the small supervised pilot; calibrate an actually approachable beginner opponent; expand reviewed unfamiliar transfer content; add qualified exchange/forcing-reply evidence only where it improves explanations; test physical phones and broader browsers; and complete GPL release packaging before considering public deployment. Keep the separate gameplay/assessment evidence sources and measure transfer before adding AI coaching or infrastructure.
