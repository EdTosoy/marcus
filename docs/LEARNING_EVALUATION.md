# Local learning evaluation

Phase 2B adds `/evaluation` (Local results). Everything remains browser-local. There is no identity field, participant account, external analytics, research upload or automatic study enrollment. JSON exports contain exercise/game IDs, derived outcomes and local timestamps; users should inspect files before sharing them.

## Measures and denominators

| Measure                         | Source and eligibility                                                                                     | Important limit                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Baseline accuracy               | Fresh diagnostic first answers                                                                             | Starting-point evidence, not an ability score                                             |
| Independent post-training proxy | Fresh transfer checks; first answer unhinted; possible prior local game exposure excluded                  | A curriculum proxy, not a controlled research post-test                                   |
| Unseen-position transfer        | Curriculum position fingerprints, including simple reflections/color reversals; local game exposure screen | Exposure outside Marcus and expired/missing history are unknown                           |
| Hint usage                      | Hints opened per curriculum run and review attempt                                                         | Later hints do not rewrite earlier assistance                                             |
| Repeated outcomes               | Familiar retry counts, first versus later successes, distinct reviewed boards/games                        | Same-board repetition is not stronger unfamiliar transfer                                 |
| Delayed review                  | Fresh reserved delayed checks after the scheduled interval                                                 | Actual retention requires real elapsed time, not the automated test clock                 |
| Training duration               | Explicit opt-in foreground timing                                                                          | Includes reading/idling, cannot measure attention; missing historical active time is null |
| Gameplay application            | Separate capture/defender observations and recovery evidence, grouped by skill                             | No conceptual diagnosis or automatic mastery reduction                                    |

Empty denominators use `accuracy: null`, not fabricated zero performance. The report includes exclusions and policy version. It does not merge assisted practice, assessments and game review into one score. Existing Phase 1B mastery remains explainable and curriculum-local; the evaluation report applies an additional conservative local-game exposure exclusion rather than silently changing historical assessment data or mastery rules.

Game records have start/end times but no per-move timestamps. If a game started before an assessment and includes an equivalent position, exposure is treated as possibly earlier and excluded. This can undercount eligible checks; the report names the uncertainty. It does not claim exact chronological exposure or experimental familiarity. Raw timestamps/wall spans are not active training time.

## Timing behavior

The root timing provider is inactive by default. Start/pause controls live on Local results; an active banner offers pause across routes. A five-second heartbeat records only positive intervals at most ten seconds long on the same recognized route. Route changes, long suspension gaps and clock rollback are not credited. Hiding the tab or leaving the page pauses timing. Reload restores paused; a session resumes only by explicit action.

Timing uses `marcus:evaluation-time:v1`, at most 200 segments, each capped at four measured hours. Route subtotals separate learning, play, review, free board and evaluation time. Changing routes between heartbeats can discard up to one interval. Browser scheduling can undercount; foreground does not prove engagement. Corrupt/unavailable timing storage produces a visible warning. Previous unmeasured activity remains unknown. Export before closing if storage fails.

## Review provenance and compatibility

`marcus:games:v1`, `marcus:learning:v2` and the original lesson key remain distinct. New review attempts add optional `prediction` and `coachingVersion: 2`. Existing Phase 2A payloads load without invented predictions; their geometric `meetsGoal` boolean remains unchanged. Current tactical judgment is explicitly policy 2. The export includes first unassisted success, later successes, assistance, prediction support, familiar-position status, original verdict and `conceptualDiagnosis: not-established`.

Legacy export counter names remain aliases for compatibility: `independentRetries` means unassisted **known-position** successes; `repeatedErrors` means observations outside the narrow goal, not proven chess mistakes. New explicit names are `unassistedKnownPositionSuccesses` and `outsideGoalRetries`. Sound verified mating moves receive no weakness prescription. Legal exchanges outside the geometric task are not automatically diagnosed as blunders.

Up to three new decisions are selected. Previously saved decisions are retained even if revised capture/tactical facts change which boards would now be selected, bounded at six retained reviews per game and 20 games. Old recommendation links are history, not fresh prescriptions. Unsupported/future fields are validated conservatively; no global reset of valid Phase 2A progress is needed.

## Study interpretation

Use [BEGINNER_PILOT_PROTOCOL.md](BEGINNER_PILOT_PROTOCOL.md) and separate result rows for baseline, independent practice, original game decisions, familiar recovery, unfamiliar post-test and delayed follow-up. Unknown exposure, facilitator help, interruptions, abandoned tasks and missing follow-ups must remain visible. A 5–8 participant usability pilot cannot establish effectiveness, Elo calibration or a 10× improvement. No such study has been conducted.
