# Phase 1B verification

Executed locally on 2026-10-25 (Asia/Manila), Node 24.21.0 and pnpm 11.27.0. This resumes the implementation described in [the Phase 1B plan](PHASE_1B_PLAN.md). Git metadata is unavailable in this workspace, so Git status/diff checks could not run. No commit, push, deployment, or external publication was performed.

## Executed checks

| Command                                            | Result   | Evidence                                                                                 |
| -------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `pnpm lint`                                        | **PASS** | Zero ESLint warnings/errors                                                              |
| `pnpm typecheck`                                   | **PASS** | Strict TypeScript validation                                                             |
| `pnpm test`                                        | **PASS** | 128 tests across 7 files, 1.89 seconds                                                   |
| `pnpm format:check`                                | **PASS** | Source, configuration, and documentation formatted                                       |
| `NEXT_DIST_DIR=.next-phase1b pnpm build`           | **FAIL** | Turbopack CSS worker could not bind a local socket, including the approved retry         |
| `NEXT_DIST_DIR=.next-phase1b pnpm build --webpack` | **PASS** | Production compilation, TypeScript, and static generation of `/`, `/board`, and `/learn` |
| `NEXT_DIST_DIR=.next-phase1b pnpm test:e2e`        | **PASS** | 18 Chromium tests: 9 desktop and 9 mobile, 27.4 seconds                                  |

The successful production build and browser suite required approved process/socket access. An initial restricted Webpack attempt failed while reading TypeScript CLI output; the approved run completed without application changes. Initial browser attempts had no completed isolated production build and could not start; the full suite subsequently passed against the completed build. Build selection follows the installed Next.js [CLI documentation](../node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md), which supports `--webpack`.

Playwright now defaults to `.next` and honors an explicit `NEXT_DIST_DIR`, so ordinary documented builds and isolated verification can both select the matching production output. After the isolated build, lint initially included generated bundles; adding the isolated output alongside `.next` in ESLint’s generated-file exclusions resolved that tooling failure. The isolated directory is also excluded from formatting and version control. Next.js added its generated isolated route-type directories to `tsconfig.json` during the successful build. The original `.next` output was preserved.

## Content and domain evidence

- All 35 new positions pass structural FEN validation and authored attacker, defender, classification, and legal-reply checks. Tests enumerate all legal movement alternatives and all selectable squares where applicable.
- Five unique prerequisite-linked skills have no cycles or missing prerequisites. Each has diagnostic, guided, transfer, and delayed coverage, both side-to-move colors, and two authored difficulty levels.
- Position fingerprints reject exact reuse, counter-only changes, and reflected/color-reversed reuse within the new bank. The bank is checked against original lesson positions. This does not establish that all positions are educationally distinct.
- Independent responses seal correctness and reject hints, retry, and duplicate submissions. Guided retry requires reflection while retaining mistakes and hint use. Mistake observations keep task mismatches, uncertainty, and self-reported reasoning separate.
- Evidence tests distinguish fresh, familiar, first-answer, eventual, assisted, early-delayed, and future outcomes. Demonstration requires varied transfer and eligible delayed evidence; completion alone supplies no credit.
- Scheduling tests cover the first transfer anchor, intervals after eligible reviews, shortened intervals after failure, and practice that cannot postpone review. Recommendations check prerequisites, deterministic ordering, and exhausted assessment pools.
- Persistence tests cover reload, reflection/hint retention, schema/content mismatch, corrupted JSON, revalidated correctness, invalid chronology, repeated assessments, and conservative legacy migration. Export contains interpretable role/difficulty/outcome observations without requiring names or accounts.

## Browser evidence

The adaptive journey completes five sealed baseline decisions, verifies hidden progress/export during the baseline, makes a guided error, opens a hint, reloads, records a reflection, retries successfully, and completes all ten fresh transfer checks. It confirms five developing skills before review. Playwright then advances its controlled clock by one day plus a minute, completes a reserved delayed check, observes one provisional demonstrated skill, downloads JSON, verifies delayed eligibility, and reloads the 26-run record. Both complete journeys report zero page or console errors.

Other adaptive scenarios exercise legacy preservation, corrupt adaptive fallback, original lesson access, unavailable browser storage, reduced motion, keyboard square navigation and submission, instruction order, and viewport overflow. The complete suite also rechecks the original lesson, practice-board special moves, and a checking learner move that must name the opponent as the side in check.

This tests scheduling arithmetic and browser behavior under a simulated clock, not actual learner retention over a day.

## Visual evidence

Local ignored screenshots and anonymous test exports are under `test-results/`. The final report is `playwright-report/index.html`. Opened and visually inspected:

- `test-results/adaptive-keyboard-reduced--65191-out-and-unavailable-storage-mobile/sealed-baseline.png`: 375px phone viewport, readable instruction above the board, sealed response, storage warning, and next action.
- `test-results/adaptive-baseline-reflecti-c827f-ogress-and-anonymous-export-desktop/evidence-after-review.png`: 1440px desktop progress, five skill records, provisional evidence explanation, review dates, and JSON export.

The suite also captures mobile and desktop progress before and after review and original lesson introduction/reflection/retry states. Screenshots establish rendered layout only; touch, keyboard, reload, and download behavior are established by executed interactions.

## Remaining limitations

- **NOT RUN:** independent chess educator review, beginner observations, physical devices, WebKit/Firefox, and a full assistive-technology audit. A [review protocol](PHASE_1B_REVIEW_PROTOCOL.md) is ready.
- **NOT VALIDATED:** teaching effectiveness, lasting mastery, calibrated difficulty, chess ability, or any 10× efficiency claim. The model thresholds remain provisional.
- Independent content is finite: two transfer and two delayed positions per skill. Failed or exhausted checks are never reissued as fresh evidence; new reviewed content is needed for further measurement.
- Browser-local data can be edited, cleared, or lost. Device timestamps do not independently prove elapsed time. There is no cross-device or cross-tab coordination, authoritative record, or remote backup.
- The evidence log allows at most 1,000 runs. Storage fallback remains visible, and JSON export requires completing the baseline and leaving an independent check.
- The default Turbopack production build remains unverified in this environment; the supported Webpack production build and full browser suite passed.
