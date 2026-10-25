# Coaching quality rubric and Phase 2B audit

This is an engineering/content review rubric, not chess-coach approval. No independent educator has signed off this phase. Mechanical chess checks and agent editorial review supply different evidence.

## Rubric

Score each dimension 0 (incorrect/missing), 1 (qualified/partial), or 2 (supported and clear). Record the exact exercise/decision ID, content/policy version, displayed text, position, evidence, reviewer role/date, score and action. A total never overrides a critical defect.

| Dimension                    | Questions                                                                                                                | Release blocker                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Chess facts                  | Is the FEN playable? Are moves, attackers, defenders and terminal states correct under chess.js?                         | Illegal line or false fact                               |
| Tactical support             | Does a loss/mate/forcing claim have a verified line or bounded exhaustive proof? Is a capture distinguished from a loss? | Unsupported tactical verdict                             |
| Alternatives                 | Does every answer satisfying the stated goal work? Is one engine candidate being mistaken for the only correct move?     | Rejecting a valid answer without an explicit scoped goal |
| Observation versus inference | Is intention unknown unless reported? Does one move become an invented misconception?                                    | Fabricated intention, diagnosis or mastery               |
| Beginner language            | Are attack, defender, hanging, trade, pin and en passant explained where needed? Is the task short and specific?         | Wording that changes the chess meaning                   |
| Transferable principle       | Does feedback name a reusable scan rather than just a square? Are task boundaries stated?                                | Copying an answer presented as understanding             |
| Graduated assistance         | Does the first hint suggest a method, the next narrow attention, and reveal wait for thinking?                           | Revealing reserved assessment answers as guidance        |
| Evidence integrity           | Are hints, reveals, first/later responses, familiar boards and uncertainty retained?                                     | Assisted/repeated success counted as unfamiliar mastery  |

A verified chess/tactical defect must be fixed and regression-tested. Ambiguous strategic merit remains uncertain. Language and learning usefulness require beginner observations and educator review even when mechanical checks pass.

## Audited content and findings

The audit covers the original six exercises and introduction, all 35 Phase 1B exercises grouped by five explanation/hint families, and Phase 2A selection, retry feedback, candidates and evidence labels. Tests revalidate every authored FEN/example, attacker/defender/reply claim and accepted alternative; they cannot establish comprehension.

| Finding                                                                                      | Evidence                                                                 | Resolution                                                                                                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| P1: mating sacrifice receives generic “recheck” feedback because its destination is attacked | Reproduced with Qg8+ Rxg8 Nf7#                                           | Bounded exact proof and verified-mate feedback take precedence; no weakness prescription for proven mating moves                  |
| P1: checkmate on a king’s geometric attack square can be criticized as unsafe                | Qg7# benchmark                                                           | Recognize actual checkmate, never call it a mistake through the square heuristic                                                  |
| P1: en passant missed by destination-only/isCapture checks                                   | e4 dxe3 benchmark; captured pawn occupies e4, capturing pawn lands on e3 | Include legal en passant metadata in coaching and immediate-reply validation                                                      |
| P2: independent retries/repeated errors overstate familiar-board evidence                    | Original labels include later successes after wrong attempts             | Known-board unassisted successes and retries outside the narrow goal; add first/later outcomes and no-diagnosis/no-mastery fields |
| P2: introduction equates attack with legal capture generally                                 | Curriculum counts geometric attacks, including pinned pieces             | Define capture patterns; keep the specific rook’s legal capture claim position-specific                                           |
| P2: unnecessarily technical trade terminology                                                | “geometric description” / “exchange evaluation”                          | Plain-language attack paths and who wins a trade                                                                                  |
| P2: no prediction before retry feedback                                                      | Reflection followed by immediate feedback                                | First candidate asks a short reply prediction, checked against legal replies; later retries avoid another mandatory question      |
| Positive: conceptual hints and fair alternatives                                             | Method hints and exhaustive acceptance checks                            | Retain; hints do not prescribe destination squares                                                                                |
| Positive: checks sealed, gameplay separate from mastery                                      | Existing transition/storage checks                                       | Retain; evaluation export separates guided, assessment and gameplay sources                                                       |

The 14-position [benchmark](COACHING_BENCHMARK.md) covers these boundaries. Initial draft fixture errors were corrected after validation caught illegal moves; they are not reported as product defects. Editorial clarity findings are provisional engineering judgments, not expert approval or learner evidence.

## Human review ledger template

```csv
review_date,reviewer_role,content_policy_version,exercise_or_decision_id,displayed_claim,position_reference,chess_fact_score,tactical_support_score,alternatives_score,observation_inference_score,language_score,principle_score,assistance_score,evidence_score,blocking_issue,proposed_change,resolution,independent_coach_approval
```

Leave approval empty until a qualified reviewer actually reviews it. Preserve unsuccessful examples and ambiguous findings. Recheck after answer/proof changes and migrate explicitly before changing persisted answer semantics.
