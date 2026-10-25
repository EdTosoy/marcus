# Prioritized findings

Read alongside [the executive assessment](DESIGN_AUDIT.md). All screenshots are the **current application before any recommended implementation**. Evidence uses synthetic, disposable browser contexts. Severity prioritizes access, task completion and educational interpretation; it is not an estimate of measured learning harm.

- **P0:** established critical data/safety/integrity failure. None identified in this audit.
- **P1:** major access, continuity or reasoning-context barrier.
- **P2:** recoverable friction, ambiguity or plausible learning/measurement risk.
- **P3:** minor copy, visual consistency or maintenance issue.

## D01 · P1 · Occupied squares contain nested interactive controls

**Route/state:** every board using the shared renderer; introduction and populated review scanned in light/mobile and dark/desktop.

**Evidence:** [intro board](../../artifacts/design-audit/evidence/home-320-light.png), [axe record](../../artifacts/design-audit/evidence/home-320-light.json). Axe reports `nested-interactive` on all six occupied intro squares and all 32 occupied review squares in the sampled boards. The outer square has `role="button"`; the piece renderer supplies a focusable descendant. Negative tabindex and an `aria-hidden` visual wrapper do not settle the nesting problem.

**Problem/impact:** accessible names/states and focus are less reliable at the application's primary interaction. This is an automated accessibility defect, with actual screen-reader impact still requiring AT testing.

**Likely cause/files:** composition of the wrapper and third-party piece controls in [chess-board.tsx](../../src/components/chess-board.tsx#L156), including descendant tabindex rewriting.

**Recommendation:** make the board expose one coherent interaction layer while retaining keyboard, click and drag alternatives. Repair the renderer integration, rather than replacing chess legality or hiding the board from accessibility APIs.

**Acceptance:** no nested-interactive violations on occupied squares; one predictable board entry point; coordinate/piece/selection/disabled information remains available; legal click/drag/promotion and both orientations still work. Verify with actual screen readers before asserting conformance.

**Confidence:** high on DOM/automated finding; assistive-technology consequences unvalidated on physical platforms.

## D02 · P1 · Answer feedback can disappear from the working viewport

**Route/state:** `/learn` guided incorrect, independent answer recorded, and `/` exercise answers.

**Evidence:** [390px wrong-answer viewport](../../artifacts/design-audit/evidence/adaptive-incorrect-390-light-viewport.png), [state geometry](../../artifacts/design-audit/evidence/adaptive-incorrect-390-light.json), [keyboard probe](../../artifacts/design-audit/evidence/keyboard-after-answer.json). The guided feedback starts at y=1003 in a 900px viewport. The board locks. In all three keyboard probes, the answered square unmounts, focus falls to BODY, and the next Tab returns to a newly locked board square, not the result.

**Problem/impact:** the visible board can appear to stop responding without an in-view result or clear next action. The guided retry is disabled until a reflection farther down the page is selected. A learner must discover both the result and the dependency.

**Likely cause/files:** feedback is a separate following region; the board key changes on answer state. [adaptive-practice.tsx](../../src/components/adaptive-practice.tsx#L98) focuses start/next/retry transitions but not submission; [lesson-player.tsx](../../src/components/lesson-player.tsx#L46) has a similar transition gap.

**Recommendation:** provide a concise in-view answer status and a deliberate focus/continuation path. Keep the board available for comparison. Explain the reflection dependency next to the disabled retry action rather than relying on discovery.

**Acceptance:** after pointer or keyboard answers at 320/390px, the learner can perceive what happened and the next valid action; focus does not fall back to a locked board; independent answers reveal no correctness; existing hint/first-attempt records remain unchanged.

**Confidence:** high on geometry/focus; incidence of learner confusion needs observation. Live status announcements already exist and should be preserved.

## D03 · P1 · Review separates a locked board from the controls that unlock it

**Route/state:** `/review?game=audit-game`, original → reflection → candidate → feedback/retry, especially phones.

**Evidence:** [original review](../../artifacts/design-audit/evidence/review-original-390-light.png), [focused feedback](../../artifacts/design-audit/evidence/review-feedback-focused-390-light.png), [focused viewport geometry](../../artifacts/design-audit/evidence/review-feedback-focused-390-light.json), [revealed review](../../artifacts/design-audit/evidence/review-reveal-390-light.png). At 390px the board begins at y=689, the initial reflection fieldset at y=1237. At 320px they begin at y=768 and y=1245. After error-feedback focus, only about 26% of the 390px board remains visible. The final reveal view is 3127px high at 390px and 3422px at 320px.

**Problem/impact:** inspect, unlock, move, predict, compare and retry require repeated spatial reorientation. Feedback focus works, but can take the visual evidence away from the explanation. Initial metadata and repeated headings delay the board even on desktop.

**Likely cause/files:** stacked route header/game details/decision picker plus [game-review.tsx](../../src/components/game-review.tsx#L307) board/sidebar layout and broad sibling spacing in [globals.css](../../src/app/globals.css#L950).

**Recommendation:** compose one decision workspace: compact context, question, board and current coaching step together. Put the reflection next to the board interaction it enables; progressively disclose completed steps, game administration and deeper evidence. Preserve prediction focus and optional assistance.

**Acceptance:** a learner can find the unlock/reflection control without searching below a locked board; the current question, relevant board and response are visually connected at sampled widths. Retrying never requires locating a distant unexplained control. No critical content is clipped to force a one-screen layout.

**Confidence:** high on distances and sequence; ideal panel/scroll behavior requires beginner and AT validation.

## D04 · P1 · Engine suggestions refer to a different board from the one displayed

**Route/state:** review after a candidate retry, then “Reveal and compare.”

**Evidence:** [revealed state](../../artifacts/design-audit/evidence/review-reveal-390-light.png), [chess.js context proof](../../artifacts/design-audit/evidence/review-context-proof.json). After Qh3 the visible badge is “Your retry” and the board is Black to move. The candidate list includes Qe2, generated for the original position before Qxe5+. Qe2 is legal there and unavailable on the displayed retry board. Candidates are SAN text with search-depth metadata and no candidate preview control.

**Problem/impact:** learners must remember/reconstruct another position to interpret suggestions. They may confuse the coach's scope or infer that an unavailable move is being recommended. Existing original/retry labels help, but are far from the candidate list.

**Likely cause/files:** [game-review.tsx](../../src/components/game-review.tsx#L271) correctly analyzes `decision.fen`, while its board can show retry FEN; [candidate rendering](../../src/components/game-review.tsx#L553) is a text list. This is a presentation-context problem, not an illegal engine response.

**Recommendation:** bind analysis explicitly to an original-position view, preserve the retry for comparison, and offer a selectable legal candidate preview with plain piece/destination language. Keep engine support qualified; previews must follow a learner attempt.

**Acceptance:** the displayed/identified analysis position is unambiguous, including side to move; every candidate preview reconstructs its actual analysis FEN and uses chess.js legality; a learner can return to their retry without losing evidence. No candidate becomes the sole correct answer or appears during independent play.

**Confidence:** high; exact preferred comparison layout needs learner testing.

## D05 · P1 · Legal destination dots have insufficient contrast

**Route/state:** active Play with e2 selected; same marker styling is shared across move tasks and themes.

**Evidence:** [light markers](../../artifacts/design-audit/evidence/legal-markers-320-light.png), [dark markers](../../artifacts/design-audit/evidence/legal-markers-320-dark.png), [computed measurements](../../artifacts/design-audit/evidence/marker-contrast-light.json). The `#314d3b` dot at 0.55 opacity composites to approximately 2.03:1 against the dark square and 2.64:1 against the light square. Screenshot center pixels corroborate the composite colors. The values are identical in both themes.

**Problem/impact:** these dots communicate which destinations are legal, but are faint in the board's essential interaction state. Treat this as a [WCAG 1.4.11 non-text contrast repair](https://www.w3.org/WAI/WCAG22/understanding/non-text-contrast.html), rather than relying on ordinary text-contrast tests.

**Likely cause/files:** [globals.css](../../src/app/globals.css#L196) applies a translucent marker, without checking the resulting color against each square.

**Recommendation:** retain the approved board palette, but give legal markers an opaque/high-contrast shape or edge that meets contrast against both squares. Preserve the accessible “legal destination” labels and selected-piece distinction.

**Acceptance:** relevant marker pixels reach at least 3:1 against each adjacent square in both themes; capture/castling/promotion destinations remain legible and legal; keyboard focus and selection remain distinct. Recheck at 320px and with low-vision users.

**Confidence:** high on measured contrast; this audit is not a complete WCAG certification.

## D06 · P1 · The guided lesson ends in a repeat loop

**Route/state:** `/`, lesson complete and returning learner.

**Evidence:** [completion](../../artifacts/design-audit/evidence/lesson-complete-390-light.png), [returning entry](../../artifacts/design-audit/evidence/returning-home-390-light.png). The only in-content action is “Practice this lesson again.” There is no direct route to the existing adaptive recommendation or Play, despite copy encouraging varied positions/games. Reload and logo/home entry preserve this completion view.

**Problem/impact:** completing the lesson does not explain how to continue the wider product. Learners must infer that another global navigation destination holds new practice. Repeating known positions becomes the most prominent action, although it adds no fresh evidence.

**Likely cause/files:** [lesson-player.tsx](../../src/components/lesson-player.tsx#L68) owns a standalone completion screen and only wires the repeat transition.

**Recommendation:** make an existing appropriate next-learning route the clear continuation, with repeat as a secondary rehearsal option. State any baseline/prerequisite needed instead of inventing another lesson.

**Acceptance:** both fresh completion and returning entry expose a clear next action into existing eligible practice; repetition stays available and remains familiar practice; saved results, baseline gates and mastery calculations do not change.

**Confidence:** high on the absent handoff; abandonment/repetition frequency is not measured.

## D07 · P2 · Selecting a square commits an independent answer immediately

**Route/state:** `/learn`, baseline and other one-answer checks.

**Evidence:** [keyboard commitment](../../artifacts/design-audit/evidence/baseline-keyboard-commit-390-light.png), [stored synthetic record](../../artifacts/design-audit/evidence/baseline-commit-probe.json). Arrow navigation followed by Enter on an empty square records the sole response and finishes the run, without a selected-answer review/submit stage. The UI does say one answer/no retry; the generic board help says Enter selects.

**Problem/impact:** exploratory selection and final commitment share an action. At small board sizes, a mistaken activation can be recorded as skill evidence. No actual participant mis-tap was observed; this is an instrument/usability risk.

**Likely cause/files:** square callbacks in [adaptive-practice.tsx](../../src/components/adaptive-practice.tsx#L322) submit directly through the shared board, which also serves exploratory move selection elsewhere.

**Recommendation:** prototype an explicit independent-answer commitment step or equally clear final-action affordance. Validate it before adoption; do not add correctness previews, hints or post-commit retries.

**Acceptance:** selection and submission semantics are clear to novices; first **committed** response remains independent and immutable; no solution is revealed before commitment; document/version any changed assessment interaction protocol and preserve old records.

**Confidence:** high on behavior, medium on practical risk; requires educator and beginner validation.

## D08 · P2 · Global navigation mixes learner tasks and facilitator instruments

**Route/state:** all routes; expanded mobile menu and desktop navigation.

**Evidence:** [mobile menu](../../artifacts/design-audit/evidence/navigation-expanded-320-light.png), [desktop](../../artifacts/design-audit/evidence/home-1440-light.png), [Local results](../../artifacts/design-audit/evidence/evaluation-sealed-390-light.png). Seven peers include The lesson, Learning practice, Play, Review, Pilot guide, Local results and Practice board. Learning progress sits inside another route. Practice board is a FEN-capable sandbox, not adaptive practice.

**Problem/impact:** purpose and audience are difficult to recognize from these labels alone. A casual learner can enter a research timer/sealed export screen while looking for progress. The pilot page is a facilitator protocol, not an ordinary lesson plan.

**Likely cause/files:** [site-header.tsx](../../src/components/site-header.tsx#L7) mirrors independently delivered modules as equal destinations.

**Recommendation:** establish a small learner task hierarchy and a clearly labeled secondary facilitator/tools area. Keep direct routes and local-only operation; this is information architecture, not a request for accounts or access-control infrastructure.

**Acceptance:** learners can distinguish Learn, Play, Review/Progress and free-board utilities; facilitator functions remain reachable but are not peer next-learning actions. Validate first-click choices with beginners; do not call fewer links automatically better.

**Confidence:** high on structure; medium on discoverability impact/design preference.

## D09 · P2 · First entry assumes orientation and places its action beyond the board

**Route/state:** fresh `/` at phone widths; complete-beginner walkthrough.

**Evidence:** [390px entry](../../artifacts/design-audit/evidence/home-390-light.png). “Let’s try it” begins at y=1134 in a 900px viewport; at 320px it begins at y=1113. Disabled Undo/Restart and board-status copy precede it. The page assumes recognition of a rook, bishop and coordinates. The pilot protocol separately requires basic legal-move knowledge.

**Problem/impact:** the app offers one primary lesson action, but its initial visibility and prerequisite boundary are weak. A true first-time chess learner may try the locked diagram or choose another global tool before understanding the intended sequence.

**Likely cause/files:** `/` mounts [lesson-player.tsx](../../src/components/lesson-player.tsx#L141) directly; its mobile composition rearranges a desktop worked example and keeps ancillary controls.

**Recommendation:** clarify the module's basic-rules prerequisite and intended first action. Use a compact, board-linked worked example with optional elaboration and omit irrelevant inactive tools from the introductory task. Do not claim an orientation curriculum exists or remove the explanation merely to expose a button.

**Acceptance:** first-time learners understand read/inspect/continue versus move; the next action is near the diagram at 320/390px without passing irrelevant controls. Rule beginners have an honest boundary/orientation route; new content needs educator review.

**Confidence:** high on layout/scope, medium on novice comprehension; no beginner session was conducted.

## D10 · P1 · Mobile visual order and keyboard/reading order disagree

**Route/state:** `/`, lesson question after “Let’s try it,” especially mobile.

**Evidence:** [visual task](../../artifacts/design-audit/evidence/lesson-dom-order-320-light.png), [ARIA order](../../artifacts/design-audit/evidence/lesson-dom-order-320-light.aria.txt), [natural focus probe](../../artifacts/design-audit/evidence/lesson-entry-focus.json). The focused “Find the threat” heading visually precedes the board. Pressing Tab goes to **“A little guidance”**, skipping forward past the board; Shift+Tab returns to a1. The DOM/ARIA order places the board before the task-specific question.

**Problem/impact:** the apparent next action and sequential navigation differ. A keyboard beginner can encounter assistance before reaching the independent response control; screen-reader reading may enumerate the board before the task that explains it.

**Likely cause/files:** [lesson-player.tsx](../../src/components/lesson-player.tsx#L178) places the board section before the teaching section, while [mobile CSS](../../src/app/globals.css#L646) uses `display: contents` and `order` to change visual sequence.

**Recommendation:** give instructions, board and continuation a coherent DOM sequence, using layout placement without reversing the task's meaning. Preserve useful heading focus and board arrow-key exploration.

**Acceptance:** forward keyboard navigation from the focused question reaches the board before assistance; accessible reading order and visual task order agree in both desktop and mobile layouts. Check meaningful sequence/focus order with real AT; do not infer full conformance from an automated scan.

**Confidence:** high on observed keyboard order; screen-reader speech remains untested.

## D11 · P2 · Targeted practice handoff either detours or competes with another primary action

**Route/state:** review → actual recommendation link → `/learn?practice=…`, fresh versus returning synthetic histories.

**Evidence:** [fresh-profile handoff](../../artifacts/design-audit/evidence/practice-handoff-blocked-390-light.png), [eligible returning handoff](../../artifacts/design-audit/evidence/practice-handoff-eligible-390-light.png). The first requires baseline/prerequisites before the requested exercise. The second exposes both “Start practice from game” and “Start recommended exercise” as primary actions, targeting different needs.

**Problem/impact:** the learner's explicit intent from review is not carried through as one clear next step. The prerequisite rule is legitimate, but its cost and return path are introduced after the link is followed.

**Likely cause/files:** [game-review.tsx](../../src/components/game-review.tsx#L595) links a requested exercise; [adaptive-practice.tsx](../../src/components/adaptive-practice.tsx#L151) adds that context alongside its normal recommendation block.

**Recommendation:** preview prerequisite requirements at handoff and keep the requested practice visible through them. When eligible, prioritize the learner's selected context and present the ordinary recommendation as an alternative, not a competing primary task.

**Acceptance:** the route explains what will happen and why; one clear primary continuation is shown; baseline/sealed checks/prerequisites remain enforced; contextual intent survives required steps; no nonexistent exercise is offered.

**Confidence:** high on both rendered states; educational benefit of ordering remains a hypothesis.

## D12 · P2 · Progress reports evidence without an actionable learner summary

**Route/state:** `/learn` → Learning progress, returning history.

**Evidence:** [desktop progress](../../artifacts/design-audit/evidence/progress-1440-dark.png), [phone progress](../../artifacts/design-audit/evidence/progress-390-light.png). The fixture produces 401 visible DOM words, five similarly weighted blocks and detailed source counts. “Review due” is text; there is no in-content action to start that existing eligible review. The learner must switch back to Practice.

**Problem/impact:** honest measurement becomes an interpretation exercise. Completed work, fresh evidence and what to do next are distinguishable in data but compete in presentation.

**Likely cause/files:** [adaptive-practice.tsx](../../src/components/adaptive-practice.tsx#L198) renders the complete model ledger rather than a task-oriented summary.

**Recommendation:** lead with the existing next eligible action and a short explanation, then separate completed activity from evidence on unfamiliar checks. Keep counts and model reasons in an accessible evidence disclosure/export.

**Acceptance:** learners can identify their next useful task without interpreting every metric; all original counts/reasons remain available; no percentage/rating/mastery claim is invented; locked skills and due dates remain accurate.

**Confidence:** high on presentation/action absence; terminology comprehension requires testing.

## D13 · P2 · Coaching/evaluation language foregrounds implementation and qualifications

**Route/state:** guided error, review reveal, progress, evaluation and pilot.

**Evidence:** [guided error](../../artifacts/design-audit/evidence/adaptive-incorrect-390-light.png), [review reveal](../../artifacts/design-audit/evidence/review-reveal-390-light.png), [evaluation](../../artifacts/design-audit/evidence/evaluation-ready-390-light.png). Examples include “observed answer mismatch,” “geometric friendly defender,” “fresh transfer,” “search depth,” and repeated no-mastery statements. The underlying uncertainty is often justified.

**Problem/impact:** the learner must distinguish method limits and evidence bookkeeping from the immediate chess fact and thinking routine. Technical detail can obscure a useful explanation without adding a next inspection step.

**Likely cause/files:** editorial safeguards and research fields are rendered directly across [adaptive-practice.tsx](../../src/components/adaptive-practice.tsx#L365), [game-review.tsx](../../src/components/game-review.tsx#L541) and [learning-evaluation.tsx](../../src/components/learning-evaluation.tsx#L131).

**Recommendation:** use a short result → concrete fact → thinking prompt structure. Keep necessary uncertainty adjacent to the claim; place deeper source/method detail behind “How this feedback works” or facilitator evidence views. Explain unfamiliar notation where it is used.

**Acceptance:** every result has an understandable next inspection step; qualifications preventing false blunder/mastery claims remain visible; records/export semantics stay intact. Have educators verify rewritten examples before release.

**Confidence:** high on terminology/repetition, medium on cognitive burden; not an instruction to delete safeguards or impose Hallmark's marketing word limit.

## D14 · P2 · Resign/restart ends a game without a recovery checkpoint

**Route/state:** active `/play` → “Resign and restart” or resignation.

**Evidence:** [one-click restart](../../artifacts/design-audit/evidence/restart-after-one-click-390-light.png), [result record](../../artifacts/design-audit/evidence/restart-confirmation.json). One activation archives a resigned result and starts a new game. The old game is saved, so this is not loss of its history, but the active game cannot simply continue.

**Problem/impact:** an accidental activation can terminate independent play and change outcome evidence. Destructive completion is less differentiated than its consequence warrants.

**Likely cause/files:** direct actions in [play-game.tsx](../../src/components/play-game.tsx#L200) and `start()`.

**Recommendation:** add a concise, accessible confirmation/recovery checkpoint for ending an active game, with cancel returning to the same board. Keep pause distinct and immediately available.

**Acceptance:** cancel preserves the active game exactly; confirm archives once and starts/ends as requested; keyboard focus and engine cancellation remain correct; no automatic move help or undo is added to independent play.

**Confidence:** high on immediate behavior; actual accidental-activation frequency is unknown.

## D15 · P3 · Failure-state copy promises normal progression while intervention is required

**Route/state:** `/play`, intentionally failed worker download.

**Evidence:** [failure](../../artifacts/design-audit/evidence/play-failure-320-dark.png). “Engine needs attention” and an actionable restart are present, but the ordinary sentence “The board will unlock when it is your turn” remains. At 320px the restart button starts at y=872, near/below the viewport boundary. The failure was simulated, not a spontaneous outage.

**Problem/impact:** the learner must reconcile a wait message with a recovery action. The error state could more directly explain the consequence for the saved game and the available recovery.

**Likely cause/files:** sidebar instructions depend only on `engineTurn` in [play-game.tsx](../../src/components/play-game.tsx#L158), while error details are rendered separately.

**Recommendation:** replace normal-turn instructions with concise recovery instructions in the failure state and keep the recovery action next to the status. Preserve the current safe restart/resign behavior.

**Acceptance:** failed, loading and paused states give distinct next actions; no instruction implies waiting alone fixes a failed engine; game preservation and local-only behavior remain truthful.

**Confidence:** high on observed copy; frequency and network/device conditions unmeasured.

## D16 · P3 · Styling layers make consistent refinement harder

**Route/state:** shared design system/source, with differing task/control compositions.

**Evidence:** [Hallmark output](../../artifacts/design-audit/hallmark/output.txt). The shared token file, later globals and experience overrides contain repeated container/type/spacing values; Hallmark found raw lengths and off-scale gaps. Several catalog font/palette tokens are unused by the actual system-font UI.

**Problem/impact:** there is no demonstrated global visual failure from each raw value, but future changes can drift or require more overrides. This is maintenance risk, not proof that 10px gaps confuse learners.

**Likely cause/files:** [tokens.css](../../src/app/tokens.css#L1), [globals.css](../../src/app/globals.css#L1), [experience.css](../../src/app/experience.css#L1) accrued across phases.

**Recommendation:** document the effective system and consolidate only the recipes touched by approved UI milestones. Keep the approved palette, system fonts and responsive constraints; avoid a broad token replacement.

**Acceptance:** touched spacing/type/control recipes use one documented source of truth, with no unintended light/dark or board regressions; unrelated styling stays out of the change.

**Confidence:** high on source structure; low/medium on user-facing impact unless tied to another observed finding.

## D17 · P3 · Similar recovery labels imply different operations across modes

**Route/state:** lesson Undo/Restart position/Try again, adaptive Recheck and try again, review Try the original position again, free-board Undo.

**Evidence:** [lesson retry](../../artifacts/design-audit/evidence/lesson-retry-390-light.png), [adaptive feedback](../../artifacts/design-audit/evidence/adaptive-incorrect-390-light.png), [review retry](../../artifacts/design-audit/evidence/review-retry-390-light.png). In the guided lesson, Undo and Restart position dispatch the same retry event, retaining attempts/hints. Free-board Undo really changes move history. Review returns to an original decision without erasing records.

**Problem/impact:** users must relearn whether an action resets the board, reverses a move or removes evidence. Long labels also vary the placement/shape of controls.

**Likely cause/files:** independently authored labels across [lesson-player.tsx](../../src/components/lesson-player.tsx#L215), [adaptive-practice.tsx](../../src/components/adaptive-practice.tsx#L419), [game-review.tsx](../../src/components/game-review.tsx#L374) and practice board.

**Recommendation:** establish a small terminology map: move undo for sandbox history, retry/original-position return for learning, and explicit end-game actions. Explain retained evidence once in context. Do not rename materially different operations as though identical.

**Acceptance:** a novice can predict the board/history/evidence effect of each control; current records and reset boundaries remain unchanged; labels wrap accessibly at 320px.

**Confidence:** high on label/handler differences; misunderstanding frequency requires validation.

## Findings not claimed

No evidence here establishes weak learner outcomes, expert-coach approval, calibrated engine strength, complete screen-reader conformance or a need to replace the logo/typeface. No new unsupported tactical diagnosis was identified. A 36px board cell is not automatically a WCAG 2.2 AA target-size failure; disabled-control contrast and normal wrapped labels are not counted as defects. A successful fit/no-overflow check does not establish coherent learning UX.
