# Phase 2D.1 — chessboard interaction specification

Scope: audit D01, D05, D10 and board focus preservation. Keep chess.js, curriculum/assessment commitment, engine policy, local records, routes, approved brand and feedback placement unchanged. No new answer-confirmation step or review redesign.

## Reproduced baseline

At clean revision `3310119`, 177 unit tests and all 46 existing desktop/mobile browser scenarios pass. Fresh-context [before evidence](../../artifacts/phase2d1/before/results.json) reproduces nested draggable/square controls, translucent legal dots, question-heading Tab moving to guidance before the board, focus falling to BODY after an answer, and promotion opening without focus entering the choices. Screenshots cover 320/390/768/1440px, both themes. These are interface defects despite the passing historical suite.

## One board, one keyboard entry

- Expose a labeled board group containing 64 operable square controls (`role="button"`) with coordinate, piece/color or “empty,” and relevant state in their accessible names. One square participates in Tab order; the other 63 remain available to arrow navigation and assistive-technology exploration. Do not introduce an application role or 64 sequential Tab stops.
- The installed renderer supplies internal draggable controls without a public semantics option. At the rendering boundary, remove their roles, tabindex and drag-only ARIA attributes while retaining pointer listeners, and hide the visual subtree from accessibility. Each square then owns the only control and its keyboard behavior. A sibling native-button overlay was considered, but would intercept the existing drag targets. Regression-test this explicit adapter boundary on library upgrades. Coordinate notation and piece artwork must not be announced a second time.
- Tab enters at the last explored square (initially a1 for compatibility); Tab/Shift+Tab leaves normally. Arrow keys move one square in the visible direction, respecting board orientation and stopping at edges. Home/End move to the visible row's first/last square; Ctrl+Home/End reach the board's first/last visible square.
- Enter or Space activates the focused square once. Exploring never submits an answer. Attacker/reply assessments retain their existing immediate activation/commitment policy; locked boards remain explorable but cannot submit or move.

Keyboard-only users navigate and activate without dragging. Screen-reader users can browse every named square and activate it; arrow-key exploration requires their reader's focus/pass-through mode. The visual piece subtree is silent. Touch users tap the same squares or use supported dragging. Actual NVDA/VoiceOver and physical touch usability remain manual checks; browser semantics alone cannot establish them.

## Selection, movement and cancellation

- Click/tap or Enter/Space selects a side-to-move piece. A second activation of that piece or Escape cancels selection. Another friendly piece changes selection. Legal destination activation requests the same chess.js-validated move used by drag/drop.
- Announce selection and clarify that legal does not mean safe from attack. Empty destinations use an opaque dot; capture destinations use a ring around the piece, including en passant's empty capture square. Names identify capture destinations explicitly. Invalid destinations retain selection/focus, announce why no move occurred, and never call the move callback.
- A completed learner move keeps keyboard focus on its destination. Subsequent engine/externally supplied positions update labels and status without stealing focus from controls elsewhere. Board instances survive ordinary move/answer updates.
- Position changes clear selection, pending promotion and stale notices. Explicit resets/retries invalidate local interaction state even if FEN is unchanged. A reset initiated outside the board keeps focus on its trigger; if the trigger becomes disabled/disappears, restore focus to the board's remembered square. Lesson/task transitions retain existing heading focus. No mount-time autofocus or unconditional scrolling.
- Locking/pausing cancels pending selection and promotion, without submitting a move or taking focus from the external pause control. When a completed game or lesson removes the board, focus its result heading; repeating a lesson focuses its introductory task. Restoring previously saved results does not auto-focus them.
- Drag and drop remains available through the existing renderer. Pointer/touch activation uses the same selection/request path. Focus changes caused by pointer actions use `preventScroll`; ordinary keyboard exploration may bring the requested square into view. Escape also cancels an active drag through the library.

## Promotion

Opening promotion focuses Queen in the existing non-modal fieldset and describes the source/destination. Four named piece buttons and Cancel remain reachable with normal Tab; no focus trap. Board exploration remains available, but further move requests are suspended. Escape anywhere inside this board interaction cancels promotion and restores its source square. Choosing a piece submits once and restores the destination; explicit Cancel also restores the source. A position/reset change dismisses obsolete choices without submitting them.

## Instructional and status presentation

Keep the approved square/piece colors. Opaque dark-green markers must exceed 3:1 against both square colors; occupied-square rings have a square-colored backing/contrast edge so artwork cannot conceal them. Distinguish selection (solid inset outline), destination (dot), capture (ring), last-move endpoints (small corner marks), check (visible “!” badge), and teaching highlight (dashed inset outline). Relevant states also appear in square names; an accessible legend explains the shapes. Existing instructional arrows receive an equivalent text description. Do not reveal new coaching or attacked-square answers.

Board description updates with side to move, orientation and interaction mode/locked reason. An initially silent polite status announces selection/cancellation/errors, without re-announcing all 64 squares. Updated square names and the description expose new positions; existing session status regions retain turn/result announcements. Full history-dependent draw status remains owned by the existing game/session UI; the FEN-only board must not invent repetition evidence.

## Lesson sequence and acceptance

Use DOM sequence **task/question → board → assistance/continuation** at every width. Keep the desktop board-left/instruction-right composition through explicit grid placement, with the task before assistance in document order; do not use mobile `order` to reverse the meaningful sequence. Preserve feedback's current area for a later milestone.

Regression evidence must cover single-control semantics/no nested or hidden focusable controls, one board Tab stop, both orientations, boundary keys, Enter/Space, cancel/invalid/valid moves, promotion/cancel/underpromotion, reset with identical FEN, lesson/assessment focus, real drag and mobile taps, legal special moves, both themes and actual computed marker colors. Existing unit/browser/real-Stockfish and build gates must pass. Screen-reader/device usability remains pending actual manual testing.

References: [WAI keyboard conventions](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/), [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [meaningful focus order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html). Installed `react-chessboard` 5.12.1 source confirms the draggable wrapper and touch/drag event contracts; no dependency replacement is required.
