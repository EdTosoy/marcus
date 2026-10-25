# Phase 2C verification

Technical verification on 2026-10-25 (Asia/Manila), Node 24.21.0, pnpm 11.27.0, Next.js 16.4.3, React 19.3.1, chess.js 1.4.0, Stockfish.js 19.0.1 and workstation Chromium 153.0.8010.52. This is engineering preparation for supervised testing, not educational validation.

## Scope, baseline and exact revision

Inspected Git/worktree state, architecture, curriculum, Phase 2B implementation/verification, engine/transfer/evaluation documentation and pilot materials before editing. The actual starting point passed 177 unit tests, 34 desktop/mobile scenarios, actual Stockfish integration, lint, strict typecheck and formatting. An allowlisted source archive, per-file hashes, Git status and prior browser artifacts were preserved under `artifacts/phase2c/baseline/`.

The existing dirty `main` branch and all prior work were retained. HEAD remains `a03de048e1d151dabb88b6f7f17c2467343331f5`; it does not include the uncommitted implementation. The final product/config/test input fingerprint is:

```text
7e92714c053f3da0fb6e3c9cb38eb3252de8766d801909c788618803b5f650ee
```

The machine-readable local receipt at `artifacts/phase2c/release/manifest.json` binds those 115 inputs, individual documentation hashes, engine hashes and the actual production build ID. Its `source/` directory preserves the exact allowlisted source, including untracked work. The baseline content hash was `5d29e439619551a21e1ae9880e0406f47003ccdea668bd6f1fcaa6ecb85243c6`. No commit, push, deployment, dependency change or infrastructure was introduced.

Per-file comparison against the pre-edit manifest confirmed **no Phase 2C modifications or additions in `src/domain/`, `src/engine/` or `src/infrastructure/`**, and unchanged package/lock files. Curriculum, acceptance rules, difficulty/search bounds, worker lifecycle, mastery/evidence calculations and local schemas are preserved. Next generated the isolated output includes in `tsconfig.json` and route references in `next-env.d.ts`.

## Implemented experience

- Approved supplied knight/book symbol, unchanged source pixels, navigation badge, favicon family, Apple icon and Android/web manifest references. The specified temporary asset directory was absent; repository assets matched the supplied ZIP byte-for-byte. Original artwork is preserved. The application remains Quiet Chess; no logo or wordmark was invented.
- System/light/dark themes, persisted local preference, matching browser-color metadata, restrained green/paper tokens, unchanged board colors and a deliberate light badge for the opaque artwork. No maskable, offline or universally installable PWA claim.
- Compact mobile navigation, current-page semantics, Escape/focus behavior, general skip link, wrapped controls, safe-area spacing and responsive typography.
- Review original/candidate/retry labels, prediction/feedback focus and original-piece return focus. Saved-game controls/PGN and longer scope information are expandable so the decision appears earlier.
- `/pilot` links seven existing stages, gives facilitator/consent/exposure boundaries and shows activity counts without correctness, answer reveals or mastery credit.
- A verified presentation defect is fixed: `/evaluation` previously exposed partial baseline metrics/export. It now withholds outcomes until all baseline decisions finish and active independent checks are left. Optional timing remains usable. Scoring and exports' evidence calculations are unchanged.
- Local source receipt/verification scripts, repeatable screenshot and unclocked observation scripts, facilitator/build/privacy/rollback documentation.

Stitch was explicitly excluded by the user; no Stitch output was integrated or assumed approved. There was no visual redesign or new coaching capability.

## Executed gates

| Check                                                                                | Result                 | Scope                                                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                                                          | **PASS**               | 177 unit tests, 13 files; one explicit real-engine test skipped by default                                                                          |
| `MARCUS_REAL_ENGINE=1 pnpm exec vitest run src/engine/stockfish.integration.test.ts` | **PASS**               | One actual pinned-engine integration test; all difficulty presets and bounded benchmark searches                                                    |
| `NEXT_DIST_DIR=.next-phase2c pnpm test:e2e`                                          | **PASS**               | 46 scenarios: 23 desktop and 23 emulated mobile; final full run 1.4 minutes                                                                         |
| `pnpm lint`                                                                          | **PASS**               | Zero errors/warnings after removing an unused fixture import                                                                                        |
| `pnpm typecheck`                                                                     | **PASS**               | Strict TypeScript                                                                                                                                   |
| `pnpm format:check`                                                                  | **PASS**               | Source/config/tests/docs                                                                                                                            |
| `git diff --check`                                                                   | **PASS**               | No tracked whitespace errors                                                                                                                        |
| `NEXT_DIST_DIR=.next-phase2c pnpm build --webpack`                                   | **PASS**               | Pinned engine preparation, production compilation, TypeScript and all routes including manifest/pilot                                               |
| Local release receipt create/verify                                                  | **PASS**               | Current source, documentation, build ID, engine hashes and archived files; deliberate archived-copy mismatch rejected, then restored and reverified |
| Before/after captures                                                                | **PASS**               | 24 baseline + 24 final light + 24 final dark route states at 320/375/1440px; no overflow/runtime/unexpected request errors                          |
| Unclocked local observations                                                         | **PASS**               | 30 fresh-context loads, five common routes, three samples per version; HTTP 200, no page exceptions, no engine requests                             |
| Firefox / WebKit                                                                     | **NOT RUN**            | Compatible binaries unavailable; optional projects retained                                                                                         |
| Physical Android/iPhone, screen readers, battery/thermal use                         | **NOT RUN**            | Reproducible manual protocol/checklist prepared                                                                                                     |
| Turbopack                                                                            | **NOT RUN this phase** | Prior environment socket restriction remains documented; validated Webpack path retained                                                            |
| Educator approval / recruitment / learner pilot / delayed retention                  | **NOT CONDUCTED**      | No outcomes or effectiveness claims invented                                                                                                        |

The actual-engine check ran separately; the default unit skip is not counted as a pass. Approved local process/socket access was used without disabling browser sandboxing. The initial theme-control type inference error and an unused test import were corrected before final gates. A strengthened test initially assumed a transfer check would be the next recommendation; the unchanged learner model correctly selected prerequisite practice. The test was corrected to follow real transitions until transfer eligibility. The final full suite passes; no acceptance rule was relaxed.

## Browser and accessibility evidence

All 34 existing scenarios remain, including lessons, sealed baseline, hints/retries, transfer/delayed checks, persistence/corrupt storage, real WASM worker play as both colors, interruption/restart/cleanup, PGN/history, special moves, underpromotion, terminal states, sound-sacrifice coaching and targeted practice.

Six added scenarios run in both projects:

1. Metadata/viewport/manifest and byte equality of all seven served icon assets; no maskable purpose.
2. System-dark behavior, persistent explicit theme choice, mobile keyboard menu, Escape/return focus, route focus, current-page semantics and header target dimensions at least 44px.
3. Seven pilot stages, activity counts, held-out-content prerequisite, no answer/export reveal and no learning-record mutation.
4. Hidden outcomes/export for partial baseline, an eligible active transfer check, answered-but-not-left transfer, then visible export after leaving. Optional timer stays available.
5. Seven main routes at 320/375/768/1440px, both themes and reduced motion, without horizontal overflow or engine downloads before use.
6. Primary body/muted/button token pairs meet 4.5:1 contrast in both themes.

The existing recovery scenario additionally verifies Original position → Candidate preview → Your retry, focused feedback and return to the original queen. These checks support practical keyboard/mobile readiness; they do not establish complete WCAG conformance, screen-reader usability or physical touch accuracy.

## Screenshots and performance observations

`artifacts/phase2c/before-verified/`, `final-light/` and `final-dark/` contain comparable lesson, learning home, baseline, guided practice, progress, active Play, populated Review and Local results screenshots. Supplied-icon contact sheets retain the source pixels. See [UX audit](UX_AUDIT.md) for example filenames and visual findings. Pilot and additional recovery screenshots are in `test-results/`; the final browser report is `playwright-report/index.html`.

At 320px, the header measured **252.9px before versus 77px after**; the lesson board remained **288px wide**. The full screenshot collections report no overflow, page exceptions, console errors or unexpected HTTP/request failures. Only exact cancelled Next RSC prefetch requests are classified separately. Early probe attempts incorrectly counted these expected cancellations; their raw results were retained. Fixed-date screenshot fixtures have no usable performance entries, so their null timings/zero resource counts are not performance evidence.

A separate no-clock script recorded local observations in `artifacts/phase2c/performance/observations.json`:

| Route              | Before median DOMContentLoaded (ms) | After median (ms) |
| ------------------ | ----------------------------------: | ----------------: |
| Lesson             |                                26.5 |              36.3 |
| Learning           |                                29.3 |              33.2 |
| Play setup         |                                25.7 |              27.7 |
| Review empty state |                                29.1 |              35.4 |
| Local results      |                                27.1 |              27.2 |

There were three fresh-context samples per route/version on local loopback, no CPU/network throttling. Ranges across samples were 24.1–37.9ms before and 25.8–109.9ms after; the after outlier prevents treating this as proof of equal or improved performance. Encoded script bytes, including variable prefetch activity, are recorded but are not a controlled bundle comparison. No obvious sustained loading regression or premature engine requests appeared in these limited observations. Real network/device behavior, memory, battery and thermal performance remain unmeasured.

## Run and review locally

The Phase 2C production preview runs at **http://127.0.0.1:3460**; begin at `/pilot`. Existing Phase 2A/2B servers on 3457/3458 were preserved. Port 3459 was occupied and left untouched. To reproduce:

```sh
NEXT_DIST_DIR=.next-phase2c pnpm build --webpack
NEXT_DIST_DIR=.next-phase2c pnpm start --port 3460
```

Stop only your Phase 2C preview before rebuilding its directory. Fresh source copies need the pinned dependency install and generated route types; full commands, receipt checks and scoped rollback are in [PILOT_RELEASE_CHECKLIST.md](PILOT_RELEASE_CHECKLIST.md).

Manually inspect icons/theme/menu at 320px and desktop; complete baseline without help, open the lesson and practice, play either color, resign or finish, reflect/retry/predict before reveal, expand game details for PGN and replay the game. Return to targeted practice, finish and leave independent checks, then export local JSON with consent. Inspect hints, novelty exclusions, gameplay observations and timing separately. Keep the same origin/profile throughout the session.

## Pilot status and recommended next milestone

Technical preparation is complete in available Chromium environments. The seven-stage guide, baseline privacy gate, existing consent/observation/results templates, actual delayed-follow-up protocol, local source receipt and release/rollback instructions support a supervised session once prerequisites are met.

Still pending: actual educator review, appropriate unexposed held-out content approval, volunteer recruitment/consent, physical-device/assistive-technology checks, beginner difficulty measurements, actual sessions and delayed follow-up. Existing conservative coaching/search limits remain. The baseline/UI gate is not tamper-resistant local-data access control. Manifest metadata does not establish offline/installable behavior.

Public distribution remains blocked pending the existing Stockfish GPL corresponding-source and release/licensing review in [ENGINE_INTEGRATION.md](ENGINE_INTEGRATION.md). No public release is authorized or claimed.

Next milestone: clear educator/device readiness, then run the prepared 5–8 person formative pilot and record usability separately from unfamiliar transfer/retention evidence. Use those observations to prioritize changes; do not claim effectiveness, Elo calibration or a 10× benefit from this technical phase.
