# Focused post-game review

Phase 2B supersedes the generic geometric-only retry feedback described below: verified checkmate, a bounded forced mate, terminal draws and legal en passant captures now receive explicit tactical feedback. Unproved exchanges/sacrifices remain uncertain. The first new candidate asks for a reply prediction before feedback; later retries avoid repeating the mandatory question. Existing geometric `meetsGoal` values are preserved, while current policy-2 judgments are recorded/derived separately. Up to three new decisions are selected and up to six saved reviews per game may be retained for old selection compatibility. See [Coaching benchmark](COACHING_BENCHMARK.md) and [Learning evaluation](LEARNING_EVALUATION.md).

## Learning contract

Play remains independent: no evaluation, hint, engine arrow or recommended move. Review starts only after chess.js ends the game or the learner resigns. The learner can replay every ply, but the review highlights at most three decisions. There is no automated “blunder count” or evaluation-loss threshold.

`src/domain/gameplay/session.ts` owns pure game transitions and PGN. chess.js owns legality, castling, en passant, promotion and terminal conditions. Full history is retained for repetition. Checkmate, stalemate, repetition, insufficient material and the fifty-move condition follow the app’s existing chess.js automatic-ending convention rather than a tournament draw-claim UI. Games also stop at 600 plies to bound storage; that reason is explicit. Restart resigns and saves the old game first.

## Selection and uncertainty

`src/domain/review/decisions.ts` reconstructs positions incrementally and inspects learner moves. It asks whether the opponent has a **legal immediate capture of the moved piece** after that move, then records the capturing sources and geometric defenders. Undefended capture opportunities sort first, followed by earlier plies. At most three are retained. An observed capture is not necessarily a loss: equal trades, sacrifices, tactical continuations and checks can change its significance.

If no such observation exists, sample up to three learner decisions as unclassified analysis opportunities. These have no inferred skill weakness and no targeted prescription. Selection does not use an engine score delta, material-loss claim, inferred plan, or purported player intention. Even a mechanically verified capture observation is not proof of why the learner chose the move. Reflections are explicitly self-reports.

This simple selection policy can surface good trades and miss quiet threats, missed wins, distant undefended pieces and deeper combinations. It is a small bridge to the five existing skills, not a complete game annotator.

## Recovery interaction

1. Reconstruct the position **before** the original move and show its notation and a focused question about the opponent’s reply.
2. Require a reflection: inspected opponent threats, inspected defenders, or unsure. This opens retry; it does not validate the learner’s reasoning.
3. Offer a new move with the stated narrow goal: any legal move whose destination is unattacked. Accept all moves satisfying that rule. The original source piece is marked for context, but a different legal move is permitted. No claim is made that the selected move solves every threat or is strategically best.
4. Preserve legal attempts and whether hints or a previous reveal were used. Show the resulting position and deterministic goal feedback; return to the original position to retry.
5. Offer two method hints without prescribing a square. Require at least one legal attempt before **Reveal and compare**.
6. On reveal, show the verified capture/defender facts and request one short engine search of the original position. Show legal candidate SAN with search depth; do not present them as a unique answer key, a forced line, or all necessarily satisfying the no-attacks retry rule. Failed analysis leaves deterministic review usable; retry or cancel remains available.
7. Explain and link an existing guided exercise when a concrete observation and available prerequisites support it.

The review record allows at most 30 attempts per decision and preserves all assistance. Independent successful retries mean unhinted/unrevealed responses to a **known** position; they never mean fresh transfer or mastery. The UI reports assisted successes, unsuccessful retries under the narrow goal, and review completion separately.

## Persistence and compatibility

`marcus:games:v1` stores one active game, the latest 20 completed games with derived PGN, and reviews attached to retained selected decisions. The serializer derives PGN from legal history; loading reconstructs games and revalidates outcomes, review moves, goal results, hints, reveals and guided-practice references. Unsupported versions or corrupt data fall back visibly without changing original lesson or adaptive keys. Expiring games removes their review records. There is no network sync, import, account or database.

The selection/evaluation algorithm is effectively content version 1 under this store schema. A changed interpretation must increment the schema or introduce an explicit conservative migration; never silently reinterpret prior successes under a new rule. Source records remain browser-local and editable, not an authoritative study database. LocalStorage quota failures leave the page usable in memory with a warning and PGN/JSON export.
