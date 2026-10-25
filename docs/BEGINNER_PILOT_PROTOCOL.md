# Supervised beginner pilot — preparation only

Status: **not conducted**. Proposed formative sample: approximately 5–8 beginner participants. No results, coach approvals or effectiveness estimates exist. This small pilot is for finding confusion and testing the learning loop, not demonstrating a 10× improvement.

## Before the session

Obtain consent for anonymous notes and optional local JSON exports. Use participant codes P01–P08; keep identifying/consent information separate. Record prior chess familiarity and device/input method, not names in the app. Ask a chess educator to approve held-out positions and wording before using the pilot to assess learning. Keep all baseline/post/follow-up positions out of teaching, review demonstrations and participant-facing answer keys.

Use fresh browser profiles. Keep game-review JSON and Phase 1B results as separate sources; record the app/content/engine versions and real local times. Explain browser-local storage, optional export, and that Getting Started is uncalibrated and may still be challenging. Allow breaks or withdrawal without framing engine losses as learner failure.

For this small first pilot, recruit approximately 5–8 adult volunteer beginners who can consent and know basic legal moves. Record prior experience and exclude prior exposure to the chosen held-out boards. If a rules orientation is needed, provide it separately and record that exposure. Explain withdrawal without penalty, who can see exports, intended retention/deletion, and that no educational benefit is guaranteed. Keep consent/contact records outside the app and apart from anonymous task data. Do not recruit or contact participants automatically.

Use [the execution checklist](templates/pilot-execution-checklist.md), [results template](templates/pilot-results.csv), [coaching rubric](COACHING_QUALITY_RUBRIC.md), [difficulty procedure](DIFFICULTY_CALIBRATION.md) and [device protocol](MOBILE_TEST_PROTOCOL.md). Obtain actual educator approval of held-out content before making a learning comparison. The engineering benchmark is exposed regression material and is not an unfamiliar pilot post-test.

## Session outline

1. **Short baseline, about 5 minutes.** Use the five existing sealed diagnostic decisions before any teaching. No hints, coaching or correctness feedback during the baseline. Record first answers, uncertainty and prior position exposure. Ask for reasoning only after the sealed baseline ends; avoid teaching future held-out material.
2. **Guided learning, about 10 minutes.** Follow the current prerequisite-based practice. Observe how the learner scans attacks, blockers, defenders and replies. Record hints, repeated guesses and wording trouble. Ask the learner to explain a guided decision in their own words; a reflection button is not proof of reasoning.
   Follow with a separately recorded independent practice decision: one unassisted response on an unexposed position, no hint or answer reveal. Do not relabel a successful guided retry as independent practice.
3. **Gameplay and recovery, about 15 minutes.** Play one untimed game as either color. Do not expose engine candidates during play. If fatigue prevents completion, let the learner resign and label the result accurately. Review one or two decisions: reflection, unassisted retry, optional hints, explicit reveal, then targeted practice. Note whether the learner understands that a possible capture is not automatically a blunder.
4. **Unfamiliar post-training assessment, about 5 minutes.** Use educator-reviewed held-out boards with different arrangements and patterns, comparable goals/difficulty and no prior exposure. One response, no assistance or immediate correction. The current app’s reserved transfer pool can support a subset after prerequisites, but fixed diagnostic boards must not be relabeled as unfamiliar post-tests. If appropriate held-out content is unavailable, record that gap and postpone this measurement.
5. **Delayed follow-up, 2–3 days later.** Use an actual elapsed interval and new educator-reviewed boards, not the original review board or repeated transfer. Existing reserved reviews may be used only once eligible and unexposed. Record missed follow-ups and elapsed time. Never fast-forward the app clock in a learner study.

## Observation checklist

- Instruction understood without facilitator paraphrasing; unfamiliar terminology identified.
- Can locate the side to move and marked piece in both orientations.
- Traces pawn direction, knight jumps and blocked lines before choosing.
- Distinguishes attacked, defended, undefended and lost.
- Imagines the opponent’s legal reply; does not assume every capture wins material.
- Explains a retry rather than copying a revealed engine candidate.
- Recognizes several acceptable answers under the stated narrow rule.
- Understands first response, assisted retry, familiar rehearsal and independent transfer are different evidence.
- Can pause/resume, recognize game end, reopen a saved game, replay and return to practice.
- Phone readability, scrolling, touch accuracy, keyboard focus, loading/failure copy and feedback announcements are usable.
- Device gets unusually hot, drains battery, lags or fails to load the engine; record observed conditions without inventing measurements.

## Debrief questions

What was confusing? What did you check before your move? Which feedback helped you decide what to inspect? Did an engine suggestion feel like the only acceptable answer? What did “attacked” and “defended” mean to you? Was the opponent too easy or too difficult? What would you try in a new game? Which part would you change?

## Anonymous results template

Optional timing starts explicitly on `/evaluation`, continues across in-app navigation, and pauses on hidden tabs/reload. Record foreground time separately from attention and wall duration. Export local evaluation only with consent; it supplements rather than replaces the source-specific records and facilitator notes. Its transfer figure is a curriculum proxy, not a controlled study post-test. See [Learning evaluation](LEARNING_EVALUATION.md).

Copy one row per participant/task; do not fill with invented data.

```csv
participant_code,app_content_version,device_browser,input_method,prior_experience,stage,task_or_game_id,skill_id,evidence_source,position_previously_seen,first_response_correct,hints_before_response,reveal_before_response,attempt_count,retry_goal_success,reasoning_note,practice_minutes,elapsed_followup_hours,confusion_or_usability_issue,feedback_usefulness,perceived_difficulty,followup_missing_reason
```

Use `not_measured` or `not_applicable` where needed, preserving original notes and exports. Summarize observed barriers and uncertain explanations first. Compare baseline, unfamiliar post-test, original game behavior and delayed unfamiliar responses separately from familiar recovery. A larger prespecified comparison study, calibrated assessments and meaningful effect criteria are needed for learning-effectiveness claims.

## Phase 2C local session entry

The new `/pilot` guide links the existing baseline, guided lesson, practice, game, review and local export routes. It shows activity counts without correctness or mastery claims and does not force curriculum progression. Local outcomes/export stay hidden during unfinished baseline and active independent checks; the optional timer remains available. Finish and leave a check before export. See [the local release checklist](PILOT_RELEASE_CHECKLIST.md) for exact source receipts, build commands, privacy, manual acceptance and rollback. Held-out-content approval and the actual pilot are still pending.
