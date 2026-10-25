# Gameplay-to-practice bridge

Phase 2B adds a conservative local evaluation view that groups repeated observations by distinct positions and games, keeps familiar retry success separate from unfamiliar assessment, and excludes possible earlier game exposure from research transfer denominators. Proven mating moves get no weakness prescription. The earlier counter names remain compatibility aliases with explicit meanings, and prior records keep missing predictions absent. See [Learning evaluation](LEARNING_EVALUATION.md); this does not change curriculum mastery thresholds.

## Distinct evidence sources

Phase 1B assessment data stays in `marcus:learning:v2`; the original lesson stays in `quiet-chess:learning:v1`. Phase 2A stores gameplay and recovery separately in `marcus:games:v1`. No game move, hint, retry, resignation, result or review changes `learnerModel` thresholds or automatically reduces a skill state. A game review cannot submit an assessment result.

`gameplayEvidence` derives `source: gameplay-review`, decision ID, skill associations, bounded certainty, unknown intention, self-reported observation, independent/assisted retry counts, unsuccessful retry counts, review status and the practice recommendation link. It always reports `masteryCredit: false`. Review JSON includes these observations and raw recovery records, so an observer can compare them with the separate Phase 1B export without conflating sources.

An original game move with a legal capture available supplies a contextual observation, not a validated ability measurement. Successful replay of the same board is familiar-position practice. Multiple unassisted retries do not turn into unseen transfer. No study or chess strength claim has been validated.

## Existing skill mappings

| Verified observation                                      | Related existing skill ID | Limit                                                        |
| --------------------------------------------------------- | ------------------------- | ------------------------------------------------------------ |
| Opponent can capture the moved piece immediately          | `opponent-threats`        | Legal immediate capture only; not a forced winning tactic    |
| Moved piece’s destination is attacked                     | `destination-safety`      | Conservative no-attacks goal; trades/sacrifices can be good  |
| Actual capturing piece identified from resulting position | `recognize-attacks`       | Does not establish which pattern the learner missed          |
| Geometric defenders recorded separately from attackers    | `attack-defense`          | A defender does not cancel an attack; no exchange evaluation |
| Immediate capture and no friendly geometric defender      | `hanging-pieces`          | Not proof of forced material loss                            |

Unclassified analysis opportunities have no skill mapping. The product reports the gap instead of inventing a diagnosis or a new exercise. No pawn-direction, pin, sacrifice or multi-move misconception is diagnosed from a single selected move.

## Targeted practice

`targetedPractice` checks the existing learner model and prerequisite graph. It selects only authored `guided` content in a related skill, preferring unfamiliar and simpler available examples. It falls back to recognizing attacks when more advanced related skills lack prerequisites. The reason references the observed capture and explicitly states that assessment evidence is unchanged. No reserved diagnostic, transfer or delayed position is exposed as practice.

The review link records exercise ID, skill ID and local time and opens `/learn?practice=<id>`. The learning screen offers an explicit **Start practice from game** action when the baseline is complete, prerequisites allow it, no run is active and the bounded log has room. Otherwise it preserves the current sequence and explains what must be completed first. Domain transitions enforce the same rules, including rejecting forged reserved-assessment IDs. Existing active work is never overwritten.

Guided practice started from this link produces normal guided exercise evidence. That is an explicit new curriculum activity, distinct from importing game-review success into mastery. Repeated guided positions remain familiar in Phase 1B’s exposure accounting.

## Follow-up evidence needed

To test practical transfer, compare independently attempted unfamiliar exercises, unassisted original game decisions, familiar review retries and delayed unfamiliar decisions. Control prior exposure and practice time. The current selector is deliberately incomplete, and a small number of moves cannot establish stable weakness. More reviewed content and educator/learner observations are needed before expanding mappings or calibrating instructional decisions.
