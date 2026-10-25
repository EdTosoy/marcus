# Phase 2B verification

Technical verification on 2026-10-25 (Asia/Manila), Node 24.21.0, pnpm 11.27.0, Next.js 16.4.3, chess.js 1.4.0 and stockfish 19.0.1. This is not human educational validation.

## Scope and preservation

The actual implementation, package metadata, architecture, learning/transfer design, engine integration, pilot protocol, tests and Phase 2A verification were inspected. Git metadata is now available. The workspace already contained substantial modified/untracked Phase 2A work; its initial status/stat were recorded in `/tmp/marcus-phase2b-initial-status.txt` and `/tmp/marcus-phase2b-initial-stat.txt`. Existing work was preserved. No dependency, cloud resource, AI service, commit, push or deployment was added.

An isolated `.next-phase2b` production directory preserves the running Phase 2A server and other builds. Generated assets remain the same pinned lite engine flavor; its GPL publication obligations remain pending under [Engine integration](ENGINE_INTEGRATION.md).

## Executed verification

| Check                                                                                | Status                 | Evidence                                                                                                        |
| ------------------------------------------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                                                          | **PASS**               | Zero ESLint warnings/errors                                                                                     |
| `pnpm typecheck`                                                                     | **PASS**               | Strict TypeScript check                                                                                         |
| `pnpm test`                                                                          | **PASS**               | 177 passing unit tests, 13 files; one explicit actual-engine test skipped in this default invocation            |
| `MARCUS_REAL_ENGINE=1 pnpm exec vitest run src/engine/stockfish.integration.test.ts` | **PASS**               | Actual pinned engine, all four presets plus three benchmark searches; one integration test                      |
| `pnpm format:check`                                                                  | **PASS**               | Source/config/tests/documentation formatted                                                                     |
| `git diff --check`                                                                   | **PASS**               | No whitespace errors in tracked diffs                                                                           |
| `NEXT_DIST_DIR=.next-phase2b pnpm build --webpack`                                   | **PASS**               | Production compilation, TypeScript and routes including `/evaluation`                                           |
| `NEXT_DIST_DIR=.next-phase2b pnpm test:e2e`                                          | **PASS**               | 34 Chromium scenarios, 17 desktop and 17 mobile, 46.2 seconds; includes all 28 prior scenarios and six new runs |
| Firefox / WebKit                                                                     | **NOT RUN**            | Browser executable paths checked; compatible binaries absent                                                    |
| Physical Android/iPhone, battery/thermal/total-memory tests                          | **NOT RUN**            | No physical-device access; reproducible protocol prepared                                                       |
| Turbopack                                                                            | **NOT RUN this phase** | Prior environment socket restriction documented; Webpack pathway preserved                                      |
| Coach review / beginner pilot / efficacy                                             | **NOT CONDUCTED**      | Rubric, consent/eligibility/checklists and templates prepared; no findings invented                             |

The default unit skip is explicit and does not represent a passed engine integration. The real-engine test ran separately to completion. Approved local process/socket access was used for production build/browser/engine checks; browser sandboxing stayed enabled. An earlier browser launch did not execute because automatic approval review hit a usage limit, rather than rejecting the action as unsafe. After the user requested continuation, the authorized command retried successfully. No approval check was bypassed.

## Coaching audit and regression evidence

The 14-position benchmark checks valid FENs, authored legal lines, actual attack/defender facts, fair alternatives, exact tactical exceptions and uncertainty. All original six lesson exercises and 35 adaptive exercises remain mechanically validated, including accepted alternatives. Editorial review uses the [rubric and audit ledger](COACHING_QUALITY_RUBRIC.md); it does not imply expert approval.

A failing regression reproduced the original retry message criticizing Qg8+ despite the forced line Qg8+ Rxg8 Nf7#. Current code covers every immediate legal defense under its bounded proof. Checkmate on an attacked square, stalemate, pinned attackers, multiple acceptable moves and exchanges have distinct qualified feedback. En passant now recognizes that the capturing pawn lands on a different square and that chess.js `isCapture()` alone excludes the special move. Its reply validator and review helper both have regression assertions.

Initial draft benchmark errors were caught by legal-move checks and corrected before acceptance. They are documented as fixture-authoring corrections, not pre-existing product defects. The benchmark is test material, not a validated assessment bank.

## Engine and difficulty evidence

Actual UCI output advertised Threads fixed at 1, Hash, MultiPV, Skill Level 0–20, UCI_LimitStrength and UCI_Elo 1320–3190. Marcus does not display Elo or claim that interval maps to human ability. The new presets change explicit search resources/native skill, retaining existing saved IDs and native move selection.

The actual engine returned legal opening responses for Getting Started, Beginner, Developing and Challenging, plus legal bounded candidates for sacrifice, alternatives and en passant boards. The sacrifice search returned Qg8+ and mate in two, agreeing with the independent deterministic proof. Exact option/output data is in `artifacts/phase2b/engine-integration.json`.

One Node run measured 194/7/25/119 ms wall time for the presets, with startup included in the first. These are single observations, not phone benchmarks, strength calibration, latency guarantees or battery measurements. The browser suite separately runs the actual WASM worker as both colors and checks responsiveness, normal worker reuse, interruption, restart and late-result rejection.

## Evidence and persistence

Unit tests distinguish baseline, fresh transfer, eligible delayed checks, guided hints and familiar reviews. Possible earlier local game exposure is excluded conservatively from unfamiliar research denominators. Repeated observations are grouped by distinct boards/games; same-position repetition is explicitly classified. None changes curriculum mastery or establishes conceptual misunderstanding.

New review prediction/version metadata is validated. Missing old metadata stays absent; existing saved IDs and geometric goal booleans round-trip unchanged. Previously saved decisions outside revised selection remain available. Six retained reviews per game accommodate old/current selection while three new decisions are selected. Unsupported metadata and forged correctness are rejected.

Timer tests cover bounded foreground intervals, route changes, long gaps, clock rollback, corrupt versions and impossible durations. No active-state flag survives reload. The browser journey verifies opt-in timing across navigation, pause, export, paused restoration, no account identifiers and unchanged assessment runs. Historical active time remains null rather than inferred from timestamps.

## Browser and visual coverage

New scenarios run on desktop and mobile projects:

1. Local evaluation: opt-in timing, route navigation, pause/reload, separated JSON denominators, absent identity fields, preserved learning data and viewport fit.
2. At 320px with reduced motion: proven sacrifice review, candidate prediction, focus/keyboard progression, saved prediction provenance, verified mating line and no weakness prescription.
3. At 320px with reduced motion: keyboard underpromotion, explicit knight choice with a control at least 44px high, legal terminal draw and persistence.

The original full journeys still cover sealed baseline, assisted retry/reload, transfer, simulated delayed review, game/PGN persistence, real Stockfish, failure/restart/cancellation, special moves, checkmate, color/difficulty preservation and lesson regressions. Browser delayed-review time is simulated and supplies no actual learner-retention evidence.

Local artifacts are in `test-results/` and `playwright-report/index.html`; engine evidence is in `artifacts/phase2b/`. Screenshots use synthetic records and controlled clocks. Opened and visually inspected final renders:

- `test-results/coaching-optional-foregrou-b9e64-n-export-survive-navigation-desktop/local-evaluation.png`: 1440px desktop metrics, timer and export.
- `test-results/coaching-optional-foregrou-b9e64-n-export-survive-navigation-mobile/local-evaluation.png`: phone metrics, navigation and export.
- `test-results/coaching-small-screen-sacr-eb4df-es-no-weakness-prescription-mobile/sacrifice-review-320.png`: 320px board, qualified proof, prediction feedback and known-board evidence.

Controls and content fit; automated viewport checks establish no horizontal overflow in those scenarios. Keyboard/promotion checks are practical evidence, not full accessibility conformance.

## Manual review and pilot readiness

Start the isolated build on an unused local port:

```sh
NEXT_DIST_DIR=.next-phase2b pnpm start --port 3458
```

Open `/play`, inspect the four descriptive presets, play and review a game. Reflect, select a candidate, predict an opponent reply, compare qualified feedback, try hints and reveal candidates only after thinking. On `/evaluation`, start timing, navigate between learning/play/review, pause and export. Inspect source/novelty exclusions and familiar retries separately from assessment results. Reload restores timing paused and retained progress intact.

The final local Phase 2B preview was started on port 3458 and `/evaluation` returned HTTP 200. The existing Phase 2A server on port 3457 was preserved and `/play` still returned HTTP 200. This is local preview execution, not public deployment.

For the supervised pilot, use [the protocol](BEGINNER_PILOT_PROTOCOL.md), [execution checklist](templates/pilot-execution-checklist.md), [blank results CSV](templates/pilot-results.csv), [mobile protocol](MOBILE_TEST_PROTOCOL.md) and [device CSV](templates/device-check.csv). Eligibility/consent, independently approved held-out boards and facilitator scheduling remain prerequisites. Benchmark boards must not be reused as unseen post-tests.

## Remaining limits and next milestone

- Coaching proofs cover direct terminal outcomes or a checking candidate with at most three legal defenses and mate in one after every defense. Deeper tactics/strategic exchange value remain unassessed. Retry facts reconstruct FEN; repetition history is not available to that local judgment, while full-game rules and engine requests preserve history.
- Difficulty is not calibrated to human ability, and Getting Started may still be too hard. Native randomness/search cutoffs do not guarantee monotonic strength on each board.
- The evaluation export is a curriculum proxy, not a controlled experimental post-test. Expired history, exposure outside Marcus, actual attention and earlier active training time remain unknown. Foreground time includes idle reading and may undercount route transitions/long scheduling gaps.
- Physical devices, Firefox/WebKit, screen readers, battery/thermal measurements, educator approval and learner sessions remain pending. A 5–8 person formative pilot alone cannot prove learning efficiency or Elo.
- Public Stockfish corresponding-source packaging and application licensing review remain pending. No production deployment or public distribution is claimed.

Recommended next milestone: obtain educator review and run the prepared small supervised pilot, measure actual beginner opponent suitability and physical-device barriers, then expand independently reviewed unfamiliar assessment content. Preserve conservative evidence boundaries and resolve licensing before considering public release. No unrestricted AI coach or infrastructure expansion is warranted by these technical checks alone.
