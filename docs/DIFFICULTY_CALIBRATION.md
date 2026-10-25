# Beginner difficulty presets and calibration

Status: controls and legal-response checks implemented; **human ability/Elo calibration pending**. Labels are provisional, not ratings or proof of suitability for every beginner.

## Installed engine audit

Actual Stockfish.js 19.0.1 lite single-thread UCI output advertises Threads fixed at 1, Hash, MultiPV, Skill Level 0–20, UCI_LimitStrength and UCI_Elo 1320–3190. That Elo interval is engine metadata, not a Marcus/human rating range; Marcus displays no Elo. Captured options are in the integration artifact.

The [official Stockfish strength explanation](https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html) describes native weaker-move selection and the precedence of UCI_LimitStrength/UCI_Elo over Skill Level. Marcus keeps UCI_LimitStrength false and sets Skill Level explicitly. It does not choose arbitrary random legal moves or inject a custom chaotic policy.

Prior presets all searched up to depth 14 and 20,000–80,000 nodes. Skill 0 may remain too strong for true beginners. This phase adds explicit shallow resource limits; renaming settings does not establish human calibration.

| Label           | Stable saved ID | Skill | Depth cap | Nodes  | Time cap |
| --------------- | --------------- | ----- | --------- | ------ | -------- |
| Getting Started | getting-started | 0     | 1         | 500    | 80 ms    |
| Beginner        | gentle          | 0     | 2         | 2,000  | 100 ms   |
| Developing      | steady          | 3     | 6         | 8,000  | 175 ms   |
| Challenging     | challenging     | 10    | 12        | 60,000 | 350 ms   |

Getting Started is the new default. Old IDs load and restart still preserves color/difficulty. The first two differ by search resources, not an invented skill below Stockfish’s supported minimum. Presets are not guaranteed to rank monotonically on every board or device. Native weaker-move selection and cutoffs affect the result.

All use one worker, no pondering, 8 MiB default hash and playing MultiPV 1. Adapter bounds: depth 1–14, time 50–1,000 ms, nodes 100–100,000, hash 4–32 MiB. Review uses its own stronger bounded request. Hash is not total memory; time caps are not wall-clock promises.

## Technical observations

Tests cover explicit/clamped depth, legal output, interruptions and old IDs. The actual engine returned legal openings for all four presets and legal candidates on representative benchmark boards. One local Node run measured wall times of 194, 7, 25 and 119 ms, with initial startup included in the first. These single observations are not speed guarantees, battery findings, distributions or strength calibration. Real-worker browser checks are separate.

## Human calibration procedure

Use 5–8 consenting beginners formatively; record prior experience without assigning an invented Elo. Start at Getting Started. Where feasible observe two short untimed games, counterbalance color/order and keep practice time comparable. Record device, policy version, outcome, resignation reason, facilitator help, frustration, confusing moves and whether there were understandable decisions to review.

Do not adapt from one loss or mistake. Escalate only with participant/facilitator agreement and record why. If the lowest setting remains discouraging, report that gap and separately evaluate instructional opponents or constrained teaching games. Do not silently add random blunders. A small formative pilot cannot establish Elo bands; a larger prespecified comparison study with suitable reference players is required.
