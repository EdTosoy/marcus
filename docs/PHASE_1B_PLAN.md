# Phase 1B plan and audit

Keep the original lesson and v1 progress. Add `/learn` for a short diagnostic, guided practice, reserved independent transfer, scheduled review, and an evidence-focused progress view. Domain decisions remain pure TypeScript; no new dependencies or services.

Implementation and local verification are complete; see [executed results](PHASE_1B_VERIFICATION.md). The build passed with Next.js’s supported Webpack option, and all 128 unit tests and 18 desktop/mobile browser scenarios passed. Educator and learner review remain pending under the [review protocol](PHASE_1B_REVIEW_PROTOCOL.md).

## Audit (automated/code review, not educator review)

Fresh baseline: 52 domain tests, strict typecheck, and lint pass. The existing desktop/mobile suite is being rerun before changes. Every original FEN, authored example, and legal alternative is checked with chess.js. Hints describe a scan rather than a destination. Original first-attempt/hint evidence survives retry and reload; completion explicitly does not imply mastery.

| Priority | Finding                                                                                                     | Action                                                                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Original transfer uses a different FEN but repeats the rook/bishop/rook motif and unsafe a-file destination | Keep it as legacy lesson evidence only; reserve varied Phase 1B positions and never import legacy completion as mastery                        |
| P1       | Immediate correctness and retry on the original assessment allow learning during testing                    | New assessment roles use one sealed response with no hints, retries, solution, or detailed correction; original lesson remains supported       |
| P2       | Unlimited retries permit guessing without articulating a reconsideration                                    | Require a targeted reflection before each guided retry; retain every attempt and hint; never count later success as first-attempt independence |
| P2       | After a move gives check, the lesson says “your king” although the opponent is in check                     | Use side-specific chess.js game status; regression test the checking rook move                                                                 |
| P2       | Completion and one assessment are inadequate for retained understanding                                     | Track varied transfer and delayed evidence with provisional, configurable states; no ability score                                             |
| Pending  | Mobile readability and real cognitive engagement are different claims                                       | Verify rendering/touch/keyboard; prepare observation protocol, with actual learner and coach review pending                                    |

## Implementation sequence

1. Preserve baseline behavior, repair the check-status defect, and extend existing answer contracts for status classification and hypothetical opponent replies.
2. Define five prerequisite-linked skills and a small authored bank with role integrity checks.
3. Implement bounded mistake observations, append-only attempt evidence, sealed assessments, deterministic mastery/scheduling/recommendations, and versioned local storage with conservative legacy migration.
4. Reuse the board in a focused mobile practice and progress screen; support local anonymous JSON export.
5. Verify content and alternatives, evidence transitions, migration, scheduling, selection, full browser flows, and original regressions. Publish actual command results in `PHASE_1B_VERIFICATION.md`.

## Invariants

- chess.js owns legal moves and attacks; one-ply/no-defender classifications never claim tactical or material evaluation.
- Assessment positions never enter guided practice, reveal answers, or repeat as fresh evidence. Equivalent color/board reflections are checked for leakage.
- Diagnostics measure baseline and may sample skills before prerequisites; instructional selection respects prerequisites.
- Assistance, repeats, difficulty, time, and first versus eventual outcomes remain visible in the evidence.
- “Demonstrated” means a provisional content-specific evidence rule, not validated mastery or chess strength.
- Original local data stays available; unknown/corrupt new storage gets a visible safe fallback, never silent mastery credit.
- Use an isolated Next build directory for verification so the running server's output is preserved.
