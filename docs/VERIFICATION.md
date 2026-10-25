# Verification results

Executed locally on 2026-10-25 (Asia/Manila), Node 24.21.0, pnpm 11.27.0. No remote infrastructure was changed. The workspace did not contain an existing application or a usable Git repository; Git diff/status verification was therefore unavailable.

## Final checks

| Check                                                          | Result            | Evidence                                                                                                      |
| -------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                                    | **PASS**          | ESLint, zero warnings/errors                                                                                  |
| `pnpm typecheck`                                               | **PASS**          | TypeScript strict + noUncheckedIndexedAccess                                                                  |
| `pnpm test`                                                    | **PASS**          | 52 tests across 3 files                                                                                       |
| `pnpm build`                                                   | **PASS**          | Next.js 16.4.3 production compilation, TypeScript, and static generation of `/` and `/board`                  |
| `pnpm test:e2e`                                                | **PASS**          | 10 tests: 5 desktop and 5 mobile touch Chromium scenarios, final production build, 13.3 seconds               |
| `pnpm format:check`                                            | **PASS**          | All matched source, test, config, and documentation files formatted                                           |
| `pnpm peers check`                                             | **PASS**          | No peer dependency issues                                                                                     |
| Responsive runtime probe                                       | **PASS**          | 320, 375, 768, 1440, and 1920px widths; board and nav fit; zero horizontal overflow                           |
| Browser runtime errors in responsive probe                     | **PASS**          | Zero page errors, console errors, failed requests, or HTTP errors at all five widths                          |
| Hallmark static design sweep                                   | **PASS**          | Zero FAIL or REFLEX findings; 3 nonblocking warnings described below                                          |
| Hallmark Puppeteer render tier                                 | **NOT RUN**       | Puppeteer is not installed; actual browser renders and visual inspection used the existing Playwright instead |
| Physical devices, WebKit/Firefox, complete screen-reader audit | **NOT RUN**       | Chromium emulation and practical keyboard checks are the available evidence                                   |
| Learning effectiveness and lasting mastery                     | **NOT VALIDATED** | No learner study or delayed-retention experiment has been conducted                                           |

## Behavioral evidence

The full browser journey uses real DOM interactions and, in the phone project, real emulated touch taps. It completes the introduction, identification error, both graduated hints, reload, retry, correct identification, unsafe bishop move, SAN feedback, undo, all remaining practice positions, independent transfer assessment, reflection, restored completion, and repeat practice. The final complete journeys reported no JavaScript or browser console errors.

The practice board scenarios execute legal and illegal destination selection, SAN history, undo/restart, orientation flipping, invalid FEN feedback, castling with rook relocation, en passant with captured pawn removal, explicit rook underpromotion, check, and disabled interaction after checkmate.

The domain suite also covers both castling sides, castling through check rejection, all four promotions, required promotion selection, en passant, checkmate, stalemate, insufficient material, fifty-move and repetition draws, content invariants, every legal alternative in the curated movement exercises, incorrect and invalid answers, hint bounds, progression gates, optional assessment absence, assessment errors, independent versus assisted results, storage corruption, version mismatches, and revalidated persisted correctness.

## Visual evidence

Chromium 153.0.8010.52, driven by Playwright 1.64.1, with the browser sandbox enabled. Final local evidence is in `artifacts/quiet-chess-final/`:

- `320.png` and `375.png`: narrow full-page introduction
- `768.png`: tablet, two-column workbench
- `1440.png` and `1920.png`: capped desktop layout
- `results.json`: runtime counts and overflow results
- Corresponding `.zip` traces

The 375px, 768px, and 1440px screenshots were opened and visually inspected. Desktop/mobile retry and full lesson screenshots were also inspected during implementation. Playwright journey evidence includes introduction, retry, and reflection screenshots in `test-results/`.

The task instruction precedes the board on phone layouts. Board coordinates, pieces, rook-to-bishop arrow, button contrast, and navigation remain readable. The visual sweep’s warnings concern a short 40ch introductory sentence and two button labels whose no-wrap rule is supplied by their CSS classes; responsive browser checks confirm those labels fit.

## Environment issues and corrected checks

The first sandboxed build failed because Turbopack’s CSS compiler needed a local worker socket. The same `pnpm build` completed successfully with command-scoped process/socket access. No sandbox configuration or browser security was disabled.

The first browser run exposed three incorrect test assumptions: `Bg7` was incorrectly expected to contain a check suffix, an alert locator also matched Next.js’s route announcer, and a test attempted to click an intentionally disabled checkmated square. The tests were corrected to the observed chess.js SAN, a specific error alert, and a disabled-state assertion. The application behavior was retained, and the complete suite then passed against the final build.

Ports 3000 and 3001 were occupied. Existing processes were preserved. The final app was started successfully on **http://127.0.0.1:3456**. An aborted capture against the occupied port is excluded from the evidence; its generated artifacts were removed. Only the verified Quiet Chess server’s captures are retained.

## Known limitations

- Fixed content is mechanically validated but has not received independent chess educator review or beginner usability evaluation.
- Safety checks are one move deep and intentionally exclude strategically favorable attacked destinations. Pins, trades, sacrifices, and deeper tactics need later teaching.
- A single transfer position is evidence for one response, not a reliable mastery measure. Repeat attempts use familiar positions and are labeled practice.
- Browser-local storage can be cleared or edited; there is no cross-device synchronization, cross-tab coordination, migration UI, or progress export.
- Practical keyboard operation is tested, but complete assistive-technology conformance and physical phone behavior remain unverified.
- ESLint 9 is deprecated upstream but is compatible with the installed plugins; update when their peer ranges support the current major.

The recommended next slice is [Phase 1B](PHASE_1B_ROADMAP.md): educator review, usability work, varied and delayed transfer, and an explainable learner-evidence model before new infrastructure.
