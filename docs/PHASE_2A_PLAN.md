# Phase 2A implementation plan

Preserve the existing lessons, adaptive assessments, board adapter, and local keys. Add `/play` and `/review` using the current visual system. No remote computation or new services.

1. Pin and inspect Stockfish.js, distribute only its lite single-threaded worker/WASM assets, document GPL obligations, and implement a typed UCI adapter with resource bounds, timeouts, cancellation, and stale-response protection.
2. Add pure game-session transitions with chess.js legality, full history, terminal states, resignation, replay, and PGN. Persist active and completed games separately from learning assessments with bounded, validated records.
3. Select at most three deterministic review opportunities from learner moves. Prefer demonstrable immediate capture/undefended-destination observations; use qualified analysis opportunities otherwise. Never infer intention or classify a move from an evaluation delta alone.
4. Require an observation before retry, preserve hints/reveals/repeated attempts, reveal bounded engine alternatives only on request, and recommend existing guided curriculum by skill. Gameplay evidence never changes assessment mastery.
5. Verify adapter races/failures, domain behavior, persistence, real worker play, review/recommendation browser flows, mobile layouts, and existing regressions. Use isolated Webpack output to preserve existing servers.
6. Prepare a lightweight 5–8 beginner pilot protocol and record actual verification and limitations.

Acceptance: legal complete games as either color, one responsive lazy worker, completed-game replay and focused retries, honest deterministic explanations, separate gameplay evidence, targeted guided practice, and passing repository checks. No commits, deployment, public distribution, or infrastructure changes are authorized.
