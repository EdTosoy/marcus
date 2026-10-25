# Marcus product design and learning UX audit

**Read-only audit · 2026-10-26 · current local Marcus build.** No recommendations have been implemented. Scores and severity are engineering/design judgments, not measured educational effectiveness or findings from learners.

## Executive assessment

Marcus has a credible chess and learning foundation, but an uneven product experience. Its strongest parts are legal board interaction, calm visual restraint, conservative coaching claims, and distinct practice/assessment/gameplay evidence. Its weakest part is the orchestration of those capabilities into a clear learning journey.

The interface currently behaves like a guided lesson, an adaptive exercise tool, and a game-analysis tool sharing a navigation bar, with research instrumentation beside them. A learner must repeatedly work out which tool to use, where the next control went, and which position the coach is discussing. Further visual polish alone will leave those problems intact.

### Most important problems

1. **Board accessibility needs repair.** Axe flags nested interactive controls on occupied squares. Legal destination dots measure approximately **2.03:1 on dark squares and 2.64:1 on light squares**, below the relevant 3:1 non-text contrast threshold. See D01, D05 and D10.
2. **Responses are too far from decisions on phones.** At 390 × 900, a guided wrong-answer panel begins at document y=1003, outside the viewport, while the board becomes locked. Submitting an answer also removes the focused square; the next Tab returns to the newly locked board. See D02.
3. **Review fragments one reasoning task across a long page.** At 390px the original board begins at y=689 and the reflection fieldset at y=1237. After reveal the page reaches 3127px, with 405 visible DOM words including board notation. See D03.
4. **Review switches analytical context without switching its board.** After Qh3, the board shows the retry with Black to move, but engine suggestions are calculated for the original White-to-move position. Qe2 is legal in that original position and unavailable in the displayed retry position. The engine data is correct; the presentation makes the relationship difficult to follow. See D04.
5. **Completion breaks continuity.** The guided lesson's completion screen offers “Practice this lesson again” as its only in-content action. Returning to `/` restores that completion screen rather than exposing the learner's next useful practice. See D06.
6. **Ordinary learning and facilitator work are mixed.** Seven global destinations include both Pilot guide and Local results; Learning progress is a separate view inside Learning practice. These paths communicate the implementation more clearly than the learner's next task. See D08.

No P0 was established in the inspected flows. The detailed register contains **seven P1, seven P2 and three P3 findings**. P1 means a major access, task-continuity or educational-context problem; it does not mean a demonstrated learning loss.

## Evidence and audit boundary

The old Phase 2C URL, `http://127.0.0.1:3460`, still responds but serves the older Quiet Chess build. The audited URL is **`http://127.0.0.1:3463`**, build ID `KOUTZeAotm7jRUygWIX5-`. Comparison confirmed that all **79 runtime source/public input files** checked against `/tmp/marcus-name-verification` match the current working tree. Git HEAD is `e7c6787`; existing uncommitted Marcus naming/logo changes were preserved.

Evidence comprises:

- **88 route/state/theme/width captures**: eleven entry, empty, populated or returning states at 320, 390, 768 and 1440px, in light and dark themes.
- **54 task-state captures**: lesson error/hint/retry/success/completion, baseline recording, adaptive feedback, and post-game review with actual bounded Stockfish analysis.
- **16 special-state captures**: real Stockfish play, pause/resignation, actual review navigation, promotion/underpromotion, keyboard/skip/menu behavior, and explicitly simulated loading/storage/worker failures.
- **Five follow-up captures**: contextual practice handoff, legal markers in both themes, and immediate game restart; one additional capture opens full-game replay and advances a ply. Three post-answer keyboard probes and a natural lesson-entry probe inspect focus.
- **Twelve selected axe-core scans**, using the already installed dependency, plus ARIA snapshots and manual source/visual inspection. Four scans flag nested interactive controls; no other violations were reported in those selected scans. Automated coverage is not full accessibility conformance.

All capture viewports were **900px high**; findings cite that controlled height. Shorter phones and browser toolbars may alter the experience and still need physical-device checks. No captured state had horizontal document overflow. No page exceptions or console errors were recorded. One cancelled `/review` request occurred during successful client navigation; its page rendered. The deliberately failed worker request is also recorded. Neither is presented as a spontaneous production outage.

Every browser context was created for this audit, populated only with synthetic records, then closed. Existing browser profiles and real learner data were never read or changed. Synthetic fixture timestamps were shifted into the past to inspect returning/due states; they are **not learner retention results**. Screenshots expose some assessment boards and should be treated as maintainer evidence, not a participant answer resource or an unseen assessment bank.

The repository has **one six-exercise guided lesson and 35 adaptive exercises**, rather than several distinct guided lessons. The returning-user walkthrough therefore uses completion of that lesson plus several adaptive positions. It does not invent additional content.

Full state records, viewport geometry, ARIA snapshots, selected axe results, screenshots and reproducible audit helpers are under [artifacts/design-audit](../../artifacts/design-audit/INDEX.md). Application, configuration and existing test hashes are checked before and after the audit. No dependencies, builds, source changes, commits, pushes, deployments or production configuration changes were made for this audit. Final [read-only verification](../../artifacts/design-audit/read-only-verification.json) confirmed 113 protected input hashes unchanged, unchanged Git HEAD, only the permitted audit documentation as new Git entries, and 90 valid local evidence/source links at the initial link check.

## Four-method evaluation

### 1. Hallmark 2.0 — audit mode only

Read the installed [Hallmark 2.0 instructions](/home/edtosoy/.agents/skills/hallmark/SKILL.md), its audit branch, app-screen rules and relevant judged gates. Marcus is an app/workbench, not a marketing landing page: the board and reasoning task are its visual signature. No theme was dealt, scaffold written, redesign invoked or styling changed.

The app-scope static sweep reported **11 Floor findings, six Reflex findings and eleven warnings**, chiefly raw spacing values, a pilot context label, side stripes and long control labels. These are Hallmark gate counts, **not 28 established usability defects**. Records were directed into the audit artifacts directory rather than a project-root `.hallmark` cache.

Hallmark's native render tier **did not run** because Puppeteer was unavailable. No dependency was installed. The existing Playwright/Chromium tooling supplied actual rendered evidence and the judged visual review. Do not call this a Hallmark native-render pass.

| Hallmark observation                                        | Audit judgment                                                                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| App has three styling layers and duplicated spacing recipes | Keep as a P3 maintenance finding; fix local drift as related UI work happens, not through a broad token rewrite                                    |
| “Supervised beginner session” is an eyebrow                 | Its audience boundary is useful. Move facilitator content out of ordinary navigation before considering whether that label should become a heading |
| Side stripes appear on feedback                             | They reinforce labeled states and can remain; removing them would not repair feedback placement                                                    |
| Short ledes use 36–40ch measures                            | Appropriate for short instructional copy; not a reason to force longer lines                                                                       |
| Long button labels wrap                                     | Wrapping preserves narrow-screen access. Do not apply `nowrap` merely to satisfy a house rule                                                      |
| System typography and consistent shell                      | Preserve. A new display face, decoration, hero treatment or visual variety is unnecessary for this application                                     |

Judged read: the introduction works well on desktop; mobile instructions are readable but push action down. Review's administrative and explanatory stack delays the board. Progress and evaluation have an evidence-report hierarchy rather than a next-action hierarchy. The logo/green direction is coherent and does not need replacement.

### 2. Nielsen's ten heuristics

The [Nielsen Norman Group framework](https://www.nngroup.com/articles/ten-usability-heuristics/) is applied to observed tasks, not used as a checklist that overrides chess education.

| Heuristic                       | Observed result                                                                                                                             | Findings      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Visibility of system status     | Engine/thinking, saved-game and sealed-answer states are explicit; feedback can be offscreen and answer focus is lost                       | D02, D15      |
| Match with the real world       | Board and threat examples are concrete; “fresh transfer,” “geometric defender,” SAN and plies assume knowledge                              | D04, D09, D13 |
| User control and freedom        | Pause, original-position retry and cancel analysis exist; resignation/restart commits immediately                                           | D14           |
| Consistency and standards       | Shared board/themes help; Undo, Restart position, Try again and Recheck have different contextual meanings                                  | D17           |
| Error prevention                | Legal move validation is strong; a square selection commits an independent answer without a confirmation stage                              | D07           |
| Recognition over recall         | The original/retry badge helps; analysis still requires remembering another board and notation                                              | D03, D04      |
| Flexibility and efficiency      | Keyboard/touch/drag alternatives exist; returning learners lack a direct completion-to-next-practice path                                   | D01, D06, D12 |
| Aesthetic and minimalist design | Restraint and board artwork are strengths; ordinary screens carry repeated instrument/qualification text                                    | D08, D13      |
| Error recognition and recovery  | Feedback is conservative and retries preserve evidence; recovery controls can be distant or blocked by an unexplained reflection dependency | D02, D03, D15 |
| Help and documentation          | Conceptual hints are available; basic-rule prerequisites and local notation help are unclear at first entry                                 | D09, D13      |

### 3. Cognitive walkthrough

[USER_JOURNEYS.md](USER_JOURNEYS.md) records goal, control discovery, action/result understanding and continuation for each meaningful step. It uses the [cognitive walkthrough practitioner's method](https://www.colorado.edu/ics/sites/default/files/attached-files/93-07.pdf) as an analyst simulation. It contains no participant quotes or claimed novice observations.

The largest breakdowns are: finding the initial action on a phone; recognizing feedback after a board answer; leaving a completed lesson for appropriate new practice; reconciling a locked review board with controls below it; and returning from review to a prerequisite-constrained practice flow with competing primary actions.

Current assistance gates are broadly appropriate: method hints disclose progressively, independent checks withhold solutions, and engine comparison follows an attempt. The primary “Reveal and compare” can outweigh the quieter retry control after an error; a revised hierarchy should invite another reasoned attempt while keeping help available. No learner misuse or passive-consumption rate was measured.

### 4. Chess education UX rubric

This extends the existing [coaching rubric](../COACHING_QUALITY_RUBRIC.md) with presentation and interaction criteria. “Supported” describes implementation evidence, not teaching effectiveness.

| Dimension                 | Evidence-based assessment                                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chess correctness         | Preserve chess.js legality and validated curriculum facts. No new tactical defect was established by this UX audit                                                     |
| Cognitive load            | One-board tasks are appropriate; stacked headers, generic coach language, metrics and distant feedback compete with that task                                          |
| Sequencing                | Worked example → practice → transfer exists. The transition between the legacy lesson, adaptive sequence and game recovery is weak                                     |
| Board annotations         | Introductory rook arrow is useful. Later textual coaching has few equivalent board-linked cues; legal markers need contrast repair                                     |
| Active recall             | Actual board choices, one-answer checks and first-candidate prediction are strengths                                                                                   |
| Assistance                | Hints disclose methods gradually; review reveal requires an attempt. Do not introduce mandatory delays or make hints inaccessible merely to increase effort            |
| Independent thinking      | No evaluation bar during play; several sound alternatives remain possible. The UI should emphasize a retry without implying an engine answer is unique                 |
| Feedback timing and scope | Independent checks stay sealed. Guided feedback placement and original-versus-retry analysis context need repair                                                       |
| Misconception correction  | Evidence is qualified and reflection is explicitly self-report. The interface must make the relevant attack/reply easier to inspect, without inventing intent          |
| Practice versus mastery   | Data separation and caveats are strong. Learner-facing progress still demands interpretation of technical evidence terms                                               |
| Transfer                  | Relevant existing practice is recommended, but its handoff can require a baseline or present two primary next actions. No real transfer/retention benefit was measured |

## Visual and learning UX scorecard

Scale: **1 = obstructive, 2 = substantial friction, 3 = usable with notable gaps, 4 = strong, 5 = exemplary**. These are heuristic judgments; no composite effectiveness score is calculated.

| Dimension             | Score / 5 | Basis                                                                                                      |
| --------------------- | --------: | ---------------------------------------------------------------------------------------------------------- |
| Visual hierarchy      |         3 | Desktop introduction is clear; review and utility hierarchy precede the decision                           |
| Typography            |         4 | Readable system face, restrained weights, good main text contrast; terminology is the larger problem       |
| Layout and spacing    |         3 | Consistent gutters and no observed overflow; repeated vertical stacks increase navigation distance         |
| Board prominence      |         3 | Strong lesson/game object; review board starts low and is separated from its controls                      |
| Navigation            |         2 | Seven peer destinations mix learner tasks, sandbox and research tools                                      |
| Responsive behavior   |         3 | All sampled widths fit, but fitting is insufficient when feedback sits outside the working viewport        |
| Theme consistency     |         4 | Both themes preserve board readability and approved identity; destination-marker contrast fails in both    |
| Accessibility         |         2 | Useful keyboard/focus/status patterns coexist with nested controls, weak markers and reading-order risks   |
| Instructional clarity |         3 | Concrete concepts and qualified claims; insufficient first-time orientation and inconsistent context       |
| Feedback UX           |         2 | Useful content, but distant placement, focus loss and mixed board references undermine the learning moment |
| Product coherence     |         2 | Modules are individually functional; completion, review and next-practice orchestration remain fragmented  |

## Preserve versus change

| Preserve                                                                      | Change                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Approved knight/book symbol, Marcus name and restrained green direction       | Task hierarchy and ordinary-versus-facilitator navigation                                   |
| Existing chessboard representation and legal move handling                    | Nested interactive markup, marker contrast and instruction reading order                    |
| Replaceable single-worker Stockfish adapter, search limits and cancellation   | Candidate presentation and the board context shown during comparison                        |
| Valid alternatives, conservative tactical facts and unknown-intention wording | Long technical presentation into concise, board-linked explanations with accessible details |
| Hint provenance, first/later attempt distinctions, familiar-review labels     | Placement and hierarchy of assistance/retry controls                                        |
| Sealed assessments, novelty exclusions and delayed-evidence rules             | Evaluate an explicit independent-answer commitment step before adopting it                  |
| Local schemas, keys, records, export fidelity and privacy                     | Discoverability of learner progress and segregation of facilitator tools                    |
| Existing curriculum and prerequisite/model decisions                          | Direct, contextual handoffs between current modules                                         |

## Recommended direction and first milestones

Recommend **Direction B: a learner journey shell, delivered incrementally**, rather than a visual overhaul. Its foundation is the existing curriculum and engine. Direction A is a useful short-term refinement, but leaves the one-lesson homepage and competing module entry points largely intact. See [DESIGN_DIRECTIONS.md](DESIGN_DIRECTIONS.md) for both options and the design-system proposal.

Prioritize board accessibility, completion handoff, feedback/reading order and review context before IA restructuring. Validate independent-answer commitment and first-time orientation with beginners/educators before changing the assessment instrument. [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) defines small approval gates, acceptance checks and rollback boundaries. No milestone is authorized for implementation by this audit.

## Limits

Chromium automation, DOM/ARIA inspection and source review were available. Physical touch accuracy, real screen-reader speech/navigation, 200% text resize, browser/device diversity, battery/performance under real conditions and actual learner comprehension remain pending. The 320px captures support a reflow inspection, not a complete WCAG 2.2 AA conformance claim. The [24px AA target criterion](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) includes exceptions; 36px board cells are below a useful 44px comfort goal but are **not automatically an AA target-size failure**. Disabled controls are not judged as normal-text contrast failures.

Use the existing pilot protocol with educator-approved, unexposed boards. Keep usability findings separate from unfamiliar transfer, delayed retention or learning-efficiency evidence. No educator approval, participants, learning outcomes or 10× benefit was fabricated.
