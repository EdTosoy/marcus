# Phase 2D.1 — chessboard accessibility and interaction verification

Date: 2026-10-26. Scope: audit D01, D05, D10 and related board focus/interruption behavior. This is an engineering verification, not complete WCAG certification or learner validation.

## Baseline and preservation

Started on clean `main` at `331011948565656f5a8bd326071b2215f8c26ce6`. Before editing application components, reproduced the defects in fresh browser contexts, wrote the [interaction specification](PHASE_2D1_INTERACTION_SPEC.md), and ran the original tests: **177 unit tests passed**, with the opt-in engine test skipped; **46 desktop/mobile browser scenarios passed**.

The existing Marcus preview on port 3463 supplied before evidence. A separate production preview on **http://127.0.0.1:3464** supplies the repaired experience. Existing previews were not stopped. No dependencies were installed; no commits, pushes or deployments were made. Domain, curriculum, engine, persistence, dependency/lockfile, approved logo and public assets remain unchanged. All browser records are isolated synthetic fixtures; existing learner data was not opened or migrated.

## Reproduced defects and resulting behavior

| Concern                  | Before                                                                                                                                 | Repair and verification                                                                                                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01: nested controls     | Initial board contained 32 square controls wrapping additional draggable controls. Both selected axe scans flagged nested interaction. | Each square owns one named, operable button role. The pinned renderer's visual drag wrappers have redundant roles, tabindex and drag-only ARIA attributes removed. All square controls remain available to AT, with one Tab entry. DOM assertions and selected axe scans verify the result. |
| D05: legal indicators    | Dot color `#314d3b` at opacity .55 yielded **2.0326:1** on `#9eaf98`, **2.6370:1** on `#e7e9dc`. A dot could overlap a captured piece. | Opaque markers yield **4.0080:1 / 7.5763:1**, respectively, in both themes. Captures use a ring with contrasting light backing around the artwork. Browser assertions cover both square colors, black/white occupied targets, en passant and actual computed focus colors.                  |
| D10: ordering            | Tab from “Find the threat” reached guidance; Shift+Tab led back to the board. Mobile CSS visually rearranged the DOM.                  | Document order is task → board → guidance. Explicit grid areas retain desktop board-left composition and phone task-first layout. Forward Tab reaches the board before hints; heading/instruction geometry is asserted.                                                                     |
| Move/answer focus        | Answer/move updates remounted boards; focus fell to BODY.                                                                              | Boards retain their square DOM nodes. Moves retain destination focus; locked answers retain the activated square and remain explorable. Reset keys clear transient state without remounting controls.                                                                                       |
| Promotion                | Opening choices left focus at the destination.                                                                                         | Queen receives focus. Normal Tab reaches all choices/cancel; Escape and Cancel restore the source. Underpromotion restores the destination on a retained board. Position changes dismiss stale choices.                                                                                     |
| Promotion interruption   | A dedicated test reproduced choices remaining open after “Pause game.”                                                                 | Lock/pause cancels pending promotion and selection; no move is recorded, and Resume retains focus. Resuming allows a fresh promotion. Terminal game/lesson transitions focus the result heading when the board disappears; restoring saved results does not auto-focus them.                |
| Color-independent states | Several states shared an outline or translucent dot.                                                                                   | Selection: solid inset outline/fill; legal move: dot; capture: ring; last move: corner mark; check: “!”; instructional highlight: dashed outline. Square names describe relevant states. The existing instructional arrow is opaque and has an equivalent coordinate description.           |

Keyboard navigation follows visible directions in either orientation, stops at edges, and supports row/board Home/End. Enter/Space activates once; arrow exploration does not commit answers. Invalid moves retain selection and announce failure. Escape reaches the renderer's document listener to cancel an active pointer drag. A position/reset/lock identity guard rejects late drag-start callbacks after the board changes or unmounts. Locked boards cannot activate moves/answers but remain explorable.

## Implementation boundaries

- [chess-board.tsx](../../src/components/chess-board.tsx): semantics adapter, roving focus, cancellation, promotion, descriptions and marker states. `interactionKey` replaces forced remounts and includes lock changes; focus state survives position changes. The FEN-only board does not infer repetition or rewrite session outcomes.
- [board-navigation.ts](../../src/components/board-navigation.ts): small presentation-only coordinate navigation helper, with seven unit tests. It does not decide move legality.
- [globals.css](../../src/app/globals.css) and [experience.css](../../src/app/experience.css): marker styles, separate focus presentation and scoped lesson grid placement. Removed obsolete mobile ordering and conflicting selection styling.
- Lesson/practice/play/adaptive/review callers preserve the board instance and provide actual last-move metadata. Lesson/practice retry focus and game/lesson result-heading focus address controls disappearing or becoming disabled. Feedback content/placement, assessment commitment, recommendations and review orchestration are unchanged.

`react-chessboard` **5.12.1** has no public option for its internal draggable accessibility attributes. The explicit rendering-boundary adaptation retains its pointer/touch listeners; keyboard events are owned by the square. Re-test this boundary on library upgrades. No replacement chessboard, new rules implementation, engine or dependency was introduced.

## Automated verification

Commands ran with Node **24.21.0**, pnpm **11.27.0**, existing locked dependencies and the repository's sandboxed Chromium configuration. Local process/socket permission was used where required; browser sandboxing remained enabled.

| Command/check                                                                        | Result                                        | Scope                                                                                                                                 |
| ------------------------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                                                          | **PASS: 184**, one opt-in skip                | Original 177 plus seven navigation tests; no existing assertions weakened.                                                            |
| `MARCUS_REAL_ENGINE=1 pnpm exec vitest run src/engine/stockfish.integration.test.ts` | **PASS: 1**                                   | Actual installed Stockfish options, legal preset responses and bounded benchmark analysis. The default skip is not counted as a pass. |
| `pnpm test:e2e`                                                                      | **PASS: 64**, two project-specific exclusions | Original 46 plus 18 applicable new checks; two project-specific exclusions (mouse drag on touch project, touch tap on desktop).       |
| `pnpm lint`                                                                          | **PASS**                                      | Zero-warning repository check.                                                                                                        |
| `pnpm typecheck`                                                                     | **PASS**                                      | Strict TypeScript; generated Next environment imports restored to their original tracked form after building.                         |
| `pnpm format:check`                                                                  | **PASS**                                      | Whole repository formatting, including the two deliverables.                                                                          |
| `pnpm build --webpack`                                                               | **PASS**                                      | Engine preparation, production compile, TypeScript and all existing routes.                                                           |
| `git diff --check` / protected-path diff                                             | **PASS**                                      | No unintended whitespace or changes to domain/engine/persistence/dependencies/branding.                                               |
| Available axe-core scans                                                             | **PASS in selected final states**             | 390px lesson answer in both themes; zero reported violations. This is limited coverage, not conformance certification.                |

The browser tests exercise keyboard boundaries/orientation, Space/Enter, invalid moves, destination focus, same-FEN reset, disabled reset controls, locked independent answers committing once, promotion/cancel/underpromotion, pause interruption, game result focus, real mouse drag/Escape, emulated touch, marker/focus contrast and instructional text equivalents. Existing regression scenarios retain castling, en passant, checkmate/draws, engine failure/interruption, saved games/PGN, coaching safeguards, hints/retries, assessment separation, mastery/persistence, mobile themes/navigation and reduced motion.

Intermediate failures were investigated and corrected: the sandboxed build initially failed parsing child TypeScript `--showConfig` output; the same Webpack pathway succeeded with approved local process execution. The installed renderer requires the complete arrow-options object, so the implementation extends its exported defaults. Screenshot inspection caught an old ID-specific mobile ordering rule. The pause/promotion reproduction failed before its repair ([before screenshot](../../artifacts/phase2d1/reproduction/promotion-pause-before.png), [after screenshot](../../artifacts/phase2d1/reproduction/promotion-paused-after-1440-light.png)). None of these failures was relabeled as a passing test or bypassed by weakening assertions.

## Before/after visual evidence

See the [evidence index](../../artifacts/phase2d1/INDEX.md), [measured comparison](../../artifacts/phase2d1/comparison.json), [source/build receipt](../../artifacts/phase2d1/source-receipt.json) and [verification logs](../../artifacts/phase2d1/logs). Final evidence paths and build identity are recorded there.

Seven states × four widths × two themes give **56 before and 56 final screenshots**, at 900px height: legal destinations, moved position, occupied capture target, check, instructional highlight/arrow, locked lesson answer and promotion. Additional focus/axe records accompany each set. Early visual iterations are retained separately and are not the final comparison.

Board widths remain unchanged: **288px at 320**, **358px at 390**, **363.72px at 768**, **597.81px at 1440**. The captured states show no horizontal document overflow, page exceptions or console errors. Image inspection confirms readable occupied-square rings, distinct instructional/check markers, focused promotion choices and corrected mobile heading order. Measurements do not establish physical-device performance or touch accuracy.

## Manual review and remaining limitations

Use a fresh test profile at **http://127.0.0.1:3464/board**. If starting another local process, run `pnpm build --webpack`, then `pnpm start --port <free-port>`; do not rebuild a directory while a preview is using it.

1. Tab into the board; explore with arrows, Home/End and Ctrl+Home/End. Verify flipped orientation. Select with Enter/Space, attempt an illegal move, Escape, then move legally. Confirm destination focus and one normal Tab exit.
2. Load `7k/P7/8/8/8/8/8/7K w - - 0 1`; promote, cancel by Escape/button, and choose Knight. Verify focus and the draw. During a synthetic Play game, pause with promotion open: choices must close without a move, and Resume must keep focus.
3. Begin the lesson. From its focused question, Tab must reach the board before guidance. Submit an answer, explore the locked position, retry, continue and complete it. Verify intentional task/result focus without changing recorded hints or attempts.
4. Inspect both themes at 320/390/768/1440px. Check dots, occupied capture rings, dashed highlight, last-move corners, check badge and keyboard frame. Inspect reduced motion.
5. **Pending actual manual validation:** NVDA/Firefox or Chrome and VoiceOver/Safari reading/focus modes, switch/voice control, physical Android/iPhone taps/dragging, browser zoom/high-contrast configurations and shorter real browser viewports. Screen-reader users can browse named controls or use focus/pass-through mode for arrows; no application role is imposed.

Browser automation is Chromium desktop plus emulated mobile, not physical touch or a screen-reader session. Firefox/WebKit were not run for this milestone. No battery, thermal or memory-performance claim is made. The imperative adapter boundary is the main maintenance risk. Full feedback placement, independent-answer confirmation, review context restructuring, completion handoffs and navigation changes remain outside this milestone.

## Next milestone and rollback

Recommend separately approved **M2: completed-lesson continuation** into existing eligible practice, preserving mastery and assessment prerequisites. M3 feedback placement and M4 review comparison remain separate work.

This patch is reversible in UI callers/styles/helper/tests without data migration. Reverse only its scoped changes and preserve any subsequent work; no history rewrite or learner-storage reset is needed. No commit, push or deployment is authorized by this verification.
