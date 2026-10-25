# Implementation roadmap — approval required

No milestone is implemented or authorized by this read-only audit. The sequence below favors access, continuity and reliable reasoning context before broader visual/IA work. Each should be a small, reviewable change with its own evidence, rather than one redesign commit.

Effort/risk labels are relative engineering judgments. They are not measured schedules. Keep a before reference from this audit and make each milestone reversible without a storage migration.

## M1 · Board accessibility correctness

**Type:** accessibility repair, including a small visual state correction. **Findings:** D01, D05, D10. **Priority:** first. **Relative risk:** medium because the shared renderer affects every mode.

Scope: remove nested interactive semantics while preserving drag/click/keyboard; repair legal-marker contrast; make the question-to-board DOM/focus sequence coherent. Keep the approved artwork, ordinary board palette and all legal/domain behavior.

Acceptance:

- Occupied-square nested-interactive findings are absent in representative lesson, game and review states.
- Keyboard navigation from the task heading reaches the board before hints; both orientations, selection, legal destinations, cancellation and promotion remain usable.
- Marker contrast is at least 3:1 against relevant adjacent squares/states in both themes; text alternatives remain.
- Real AT testing confirms names/states/sequence before a conformance claim.

Verification: focused browser journeys plus axe/contrast/ARIA evidence; existing chess special-move and lesson regressions. Do not disable a failing assertion. Rollback: presentation/renderer patch only; records/keys unchanged. **User approval needed:** this bounded repair, not a broad board replacement.

## M2 · Close the completed-lesson loop

**Type:** interaction/continuity. **Findings:** D06. **Relative risk:** low.

Scope: expose an existing appropriate next-learning continuation on completion/returning entry; make repeat a secondary familiar-rehearsal action. Do not invent a next lesson, unlock reserved assessments or change recommendation policy.

Acceptance: fresh completion and restored completion each offer a clear continuation into current eligible learning, with prerequisites stated. Repeating remains available and keeps its evidence classification. Verify the existing completion record is unchanged after navigation.

Verification: one completed synthetic session, reload, next-action navigation, repeat regression, 320/390/desktop. Rollback: completion UI only. **Suggested first low-risk product improvement once the accessibility plan is approved.**

## M3 · Keep decisions, responses and recovery together

**Type:** interaction/layout, with accessibility focus management. **Findings:** D02, D03, D09, D15, D17. **Relative risk:** medium.

Scope: compact redundant route/task chrome, place current feedback/next action near the board, retain useful instructions, explain disabled reflection dependencies, align recovery terminology with actual effects, and use failure-specific instructions. Work inside existing components first; extract a shared layout only where actual repeated structure justifies it.

Acceptance: an answer's status and next action are perceptible at 320/390px; keyboard focus has an intentional target after submission; the learner can retry without hunting above/below disconnected regions. Review's reflection/unlock control is close to the board. Independent checks remain sealed. Failures clearly distinguish intervention from normal waiting. Do not hide controls or shrink prose to manufacture fit.

Verification: original/incorrect/hint/retry/success/recorded states, keyboard sequence, both themes, 900px and shorter phone heights, focus not obscured, reduced motion. Rollback: component layout/copy, without data changes.

## M4 · Make review comparison position-explicit

**Type:** coaching interaction. **Findings:** D04, D13. **Relative risk:** medium.

Scope: explicit original/learner-move/retry/candidate context; a candidate preview tied to its actual analysis position; plain move descriptions and concise supported facts. Preserve the engine adapter, search policy and judgment/selection logic.

Acceptance: the Qh3/Qe2 scenario cannot suggest a candidate belongs to the visible retry board. Side to move and analysis scope are clear. Candidate previews are legal from the intended FEN, remain after-attempt assistance and do not overwrite retry records. Sound alternatives, uncertain trades and sacrifice safeguards remain intact. The learner can return to their own candidate.

Verification: before/after original/retry FEN binding, multiple alternatives, proven sacrifice/uncertainty regressions, cancelled/error analysis, mobile focus and targeted-practice handoff. Educator review of rewritten coaching copy is required. Rollback: comparison presentation only.

## M5 · Prevent accidental end-game actions

**Type:** interaction/error prevention. **Findings:** D14. **Relative risk:** low–medium.

Scope: a concise cancel/confirm checkpoint before resigning or replacing an active game. Preserve pause and worker lifecycle.

Acceptance: cancel leaves position, turn/history and evidence unchanged; confirm archives exactly once; the correct engine calculation is cancelled/restarted only when appropriate; focus returns predictably. No analysis hint or game-move undo is introduced.

Verification: White/Black, engine-thinking/paused, keyboard/mobile cancel and confirm. Rollback: end-game confirmation UI only.

## M6 · Approve and increment the learner information architecture

**Type:** navigation/IA restructuring and evidence presentation. **Findings:** D08, D11, D12, D13, D16. **Relative risk:** medium–high; do not combine with M1.

First approve the Direction B map and labels using a simple task-based evaluation. Then deliver smaller slices:

1. Separate learner destinations from facilitator/tools while preserving all existing direct routes.
2. Resolve contextual-practice versus ordinary recommendation hierarchy; explain baseline/prerequisite detours and retain the requested exercise.
3. Give progress an existing next eligible action and a concise activity-versus-independent-evidence summary, preserving detailed records/exports.
4. Only if separately approved, change the root entry/lesson routing. Review bookmark/query behavior, old completion states, timer route categories and empty/error recovery explicitly.

Acceptance: first-time and returning users can identify where to learn, resume, play/review and inspect progress; a facilitator can still find protocol/export functions. No new auth, schema, ranking or model policy. No arbitrary assessment selection or fabricated curriculum. One current task has one clear primary continuation; alternatives remain accessible.

Verification: full navigation/lesson/game/review flows, history/back/refresh/query links, all evidence sources, both themes and widths. Keep route-only changes separable from cosmetic changes. Rollback: navigation/presentation slices; no migration.

## M7 · Validate independent commitment and novice orientation before changing them

**Type:** requires educator/user validation, then a separately approved interaction change. **Findings:** D07 and prerequisite aspects of D09. **Risk:** potentially material to measurement even if coding is small.

Compare a clearly signaled one-action commitment with select-then-submit on unused, educator-reviewed boards. Observe mis-activations, whether learners understand finality, unnecessary extra work and any assistance leakage. Clarify the rule-literacy boundary: current positional-safety content must not pretend to be a complete rules curriculum.

Acceptance before adoption: there is an approved commitment definition, source/protocol version plan and no correctness feedback before commitment. Preserve first independent submissions and all earlier records. Guided retries and familiar review remain different. Do not add artificial wait timers, forced successful attempts before help, or a new curriculum as an incidental UI change.

No real study result is available from this audit. This milestone is preparation/observation until actual sessions occur.

## M8 · Validate the repaired learning journey with people and devices

**Type:** human/device validation, not cosmetic implementation.

Use the existing 5–8 beginner pilot preparation after actual consent, educator review and device readiness. Include keyboard/AT and short/physical-phone cases, then inspect learning separately on appropriate unexposed boards.

Record at least:

- Whether the learner finds the first action and next practice without facilitator rescue.
- Whether feedback and the original/candidate/retry board are correctly identified.
- Whether hints support an explained method rather than copying a move.
- Whether the learner distinguishes completed work, assisted recovery and unfamiliar success.
- Mis-activations, focus/scroll recovery, perceived difficulty and device failures.

Use anonymous source-separated notes/exports. Do not reuse exposed audit/benchmark positions as unseen post-tests. A small usability sample will not establish learning efficiency or Elo; unfamiliar transfer and actual delayed retention require their own valid interpretation.

## Cosmetic work versus structural work

| Category             | Appropriate scope                                                                                         | Avoid                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Cosmetic             | Marker clarity, local spacing consistency, concise labels, effective token documentation in touched files | Font/palette replacement, new logo, broad CSS/token rewrite         |
| Interaction          | Result focus, clear retry/continue, original-position comparison, end-game confirmation                   | Treating every move as a blunder or hiding necessary help           |
| Navigation/IA        | Learner/facilitator grouping, contextual handoffs, progress next action                                   | New infrastructure, accounts, arbitrary curriculum unlocking        |
| Accessibility        | Nested controls, logical order, non-text contrast, focus and AT verification                              | Removing keyboard alternatives or using color alone                 |
| Validation-sensitive | Commitment semantics, novice prerequisites, label/sequence comprehension                                  | Calling a heuristic preference or successful test proof of learning |

## Definition of a completed approved milestone

A milestone is complete only when its own acceptance checks run, current functionality and data distinctions remain intact, before/after evidence is inspectable, and untested human/device assumptions are explicit. Use repository-native checks appropriate to the actual change. Passing the historical 177/46 baseline alone is not proof of improved usability. No production deployment, commit or push follows automatically from this roadmap.
