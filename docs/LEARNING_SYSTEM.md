# Learning system

## The learning loop

1. Explain an attack using a rook’s visible line toward a bishop.
2. Identify the attacking piece by selecting it.
3. Move an attacked piece to a safe destination.
4. After an error, discuss the actual position, then restore it for a retry.
5. Offer two conceptual hints, one at a time, by request.
6. Apply the routine in a separate transfer position, trying once before hints become available.
7. Reflect on attempts and assistance without claiming mastery.

The initial worked example intentionally reappears in the first identification exercise. Movement exercises then require new decisions. The transfer position has a distinct piece arrangement and has not appeared in the first run’s practice.

## Definitions

An attacked square is one chess.js reports as attacked by the opponent. This includes geometric attacks by pinned pieces, as documented by chess.js. In this lesson, “safe” means the marked piece moves legally to a square with **no opponent attacks in the resulting position**. The king is protected by chess.js legality rules.

This is a conservative introductory objective, not a universal chess evaluation. A defended piece may remain attacked yet be adequately protected. A capture or sacrifice may be good even when the landing square is attacked. Pins, exchanges, forced mate, piece values, and multi-move tactics are outside this slice. The UI states the narrow objective and avoids claiming rejected moves are strategically bad or illegal.

## Typed content

Each exercise defines an ID, title, objective, skill tags, FEN, focus square, instruction, answer contract, misconceptions, ordered hints, correct/incorrect reasoning, retry policy, completion condition, optional assessment flag, and review examples.

`Answer` supports:

- `attacker`: accepted squares must exactly match the actual attackers of the target
- `safe-move`: every legal move of the marked piece with an unattacked destination is accepted
- `moves`: explicit multiple acceptable moves, including promotion choices where necessary

No exercise assumes the best move is unique. Content is separate from UI. The schema is a typed local authoring contract, not an untrusted remote curriculum format; `assertLesson` enforces content invariants in automated checks.

## Curated position review

White moves in all six exercises. Every king and pawn location is explicit in the content FEN. All initial positions are structurally valid, playable, and do not leave the side not to move already in check.

| Exercise                   | Target and initial threat                       | Accepted examples | Legal but unsafe / incorrect examples                             |
| -------------------------- | ----------------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| Find the threat            | Bishop d4, rook d8 attacks down the open d-file | Select d8         | Selecting d4 identifies the victim; h7 pawn does not attack d4    |
| Find a safe square         | Bishop c3, rook c8 attacks the c-file           | Bb4, Bd4          | Bg7 leaves the bishop attacked by king g8                         |
| Pawns have a say           | Knight f3, pawn e4 attacks f3                   | Nd4, Ne5          | Nh4 enters pawn g5’s diagonal                                     |
| Check the whole board      | Rook d4, bishop b6 attacks through c5           | Re4, Rd3          | Ra4 and Rd8 enter rook a8’s line                                  |
| Look beyond straight lines | Bishop e4, knight f6 attacks in an L            | Bf5, Bf3          | Bd5 enters rook and knight attacks; Bg6 enters pawn h7’s diagonal |
| Transfer assessment        | Rook c4, bishop f7 attacks through e6 and d5    | Rc5, Rd4          | Ra4 and Rc8 enter rook a8’s line                                  |

These examples illustrate the rule; they are not exhaustive answer keys. Tests enumerate all legal moves in every movement exercise and check acceptance against source-piece identity and chess.js attacks on the resulting destination. They also test each authored correct and incorrect example, and every square in the identification exercise. Incorrect feedback names actual destination attackers from the played position. Intro arrows and authored initial attacker claims are verified against chess.js.

Content is fixed in source and mechanically checked. No independent titled coach review or beginner usability study has occurred; both remain release risks. Automated invariants cannot prove explanatory clarity or learning effectiveness.

## Attempts and feedback

`invalid` input means the response cannot answer the current task, such as an illegal move or moving a different piece. It produces guidance without adding a conceptual error. A legal but attacked destination is `incorrect` and counts as an attempt. Any valid answer satisfying the goal is `correct`.

After a response, feedback locks the board. A wrong move remains visible with its SAN so the learner can inspect what happened. Retry, undo, and restart restore the exercise’s FEN while preserving all attempts and opened hints. A successful answer can be undone before advancing; this revokes its solved state until another correct answer is made.

Hints preserve thinking space. First they suggest a scanning method, then they narrow attention to relevant movement patterns. They never prescribe a destination. The assessment requires a first attempt before hints unlock; mistakes can still be corrected and completed.

## Evidence and progress

The current run derives:

- Unique exercises attempted and currently solved
- All correct and incorrect response counts
- Hints opened, retained across retries
- First-try unhinted successes: first response correct with zero hints already opened
- Lesson completion, only after every exercise is solved and final feedback is acknowledged
- Assessment first-attempt correctness, assistance, attempts, eventual solution

First-try success does not become independent after repeated retries. Completion does not become mastery; the domain explicitly reports `mastery: "not-established"`. Archives retain previous completed runs. Metrics on the reflection screen describe the current run. Repeating the same assessment is labeled repeated-position practice; its result must not be interpreted as unseen transfer.

## Phase 1B adaptive practice and current limits

The original lesson retains the behavior above. `/learn` adds five prerequisite-linked skills: recognize attacks, distinguish attacks and defenders, recognize hanging pieces, check destination safety, and anticipate an immediate capture. Each skill has one diagnostic, two guided positions, two transfer positions, and two delayed positions. Positions vary side to move, piece patterns, and two authored difficulty levels. Automated checks validate every FEN, authored example, attacker/defender claim, legal capture reply, and all accepted alternatives. Independent educator review remains pending.

The baseline samples all five skills before teaching, regardless of instructional prerequisites. Independent roles permit one response, including “not sure”, without hints, retries, solutions, or detailed correction. Progress and export stay hidden during the baseline and active checks. Guided practice provides conceptual hints and feedback; after an incorrect response, a learner must record a reflection before retrying. This records a self-report, not proof of reasoning or a diagnosis.

Mistake observations distinguish answer mismatches from possible causes. A selected attacked destination is evidence that the no-attacks objective was missed, not that the move is a strategic blunder. Hanging means geometrically attacked and undefended, not a forced loss. Opponent-reply questions enumerate legal immediate captures after the proposed move, without evaluating the exchange or deeper tactics.

The learner model reports insufficient evidence, needs practice, developing, demonstrated, or review due. Its configurable default rule for “demonstrated” requires two completed guided positions, two fresh unhinted first-answer transfer successes, one eligible fresh delayed success, and independent evidence at both authored difficulty levels. Diagnostics alone, repeated positions, assisted solutions, and early delayed attempts cannot meet this rule. A recent failed fresh check remains visible even after successful familiar rehearsal. These are provisional content-specific states, not calibrated ability estimates.

The first fresh transfer success schedules review after one day. Successful eligible reviews schedule the next interval at three then seven days; failed reviews use a one-day delay. Additional guided practice does not postpone the due date. Recommendations prioritize eligible due reviews, then instructional gaps and fresh transfers while respecting prerequisites. Each skill has only two reserved delayed positions. Exhausted assessments are never recycled as unfamiliar; more content is needed for continuing independent measurement or recovery after exhausting failed checks.

Runs retain response, correctness, hints at the time of response, timestamps, reflection, first versus eventual outcome, role, difficulty, and exposure history. The progress view and JSON export describe this evidence without claiming learning effectiveness. Device timestamps are not independently verified. See the [review protocol](PHASE_1B_REVIEW_PROTOCOL.md) for the pending human evaluation.
