# Local pilot release checklist

Status: engineering preparation for supervised testing. No participants recruited, educator approval obtained, efficacy demonstrated or public deployment authorized. Use the existing [beginner protocol](BEGINNER_PILOT_PROTOCOL.md), [session checklist](templates/pilot-execution-checklist.md), [blank results CSV](templates/pilot-results.csv) and [device template](templates/device-check.csv).

## Identify the actual revision

The worktree contains uncommitted Phase 1B/2A/2B/2C work. Git HEAD `a03de048e1d151dabb88b6f7f17c2467343331f5` on `main` alone does **not** identify this pilot. The final local receipt at `artifacts/phase2c/release/manifest.json` records HEAD, the SHA-256 of allowlisted product/config/test inputs, each input/document hash, engine asset hashes, Node/pnpm versions and `.next-phase2c/BUILD_ID`. Its `source/` directory preserves the exact allowlisted source and documentation, including untracked files. This receipt is not a test runner or licensing approval.

Before Phase 2C editing, `artifacts/phase2c/baseline/source-before.tar.gz`, `source-manifest.json` and Git status preserved the dirty baseline. Its content hash is `5d29e439619551a21e1ae9880e0406f47003ccdea668bd6f1fcaa6ecb85243c6`. The branch was retained to avoid moving a shared dirty workspace. No commits or pushes were made.

## Reproduce locally

Use Node 24 and the package manager pinned in `package.json` (`pnpm@11.27.0`). From a fresh local folder copied from the receipt's `source/` directory:

```sh
pnpm install --frozen-lockfile
NEXT_DIST_DIR=.next-phase2c pnpm build --webpack
pnpm lint
pnpm typecheck
pnpm test
MARCUS_REAL_ENGINE=1 pnpm exec vitest run src/engine/stockfish.integration.test.ts
pnpm format:check
NEXT_DIST_DIR=.next-phase2c pnpm test:e2e
NEXT_DIST_DIR=.next-phase2c pnpm start --port 3460
```

The build generates Next route types before the standalone typecheck; the archived `next-env.d.ts` references that isolated output. Choose an unused port if needed. The browser runner uses its own port 3100 and refuses an existing server there. Engine preparation runs during the normal build and reconstructs the pinned assets from the dependency. Network access may be needed for dependency installation; a populated package cache can be used with `--offline`. No cloud computation, accounts or database are needed. Browser installation prerequisites and optional Firefox/WebKit projects are described in [the mobile protocol](MOBILE_TEST_PROTOCOL.md); absent binaries are not passing results.

A fresh build may have a different build ID. After verifying that build, create a **new** local receipt, never overwrite the original:

```sh
node scripts/pilot-release.mjs create artifacts/phase2c/release-next
node scripts/pilot-release.mjs verify artifacts/phase2c/release-next
```

The script copies only explicit source/config/assets/tests/docs. It excludes `.env`, browser storage/exports, Git metadata, dependencies and generated engine binaries. The original receipt verifies only its original input/build state. It fails if inputs, documentation, engine hashes, build ID or archived files differ. Verification does not rerun tests. Inspect the receipt and recorded verification report before sharing anything.

## Facilitator walkthrough

1. Open `http://127.0.0.1:3460/pilot` in a fresh browser profile. Keep the same origin/port throughout a participant session. Get informed consent and explain local storage, optional notes/export, withdrawal and deletion arrangements. Keep identifying consent records separately from task codes.
2. Approve suitable held-out content with an educator before measuring learning. Do not teach the baseline/post/follow-up boards, expose answer keys or use regression benchmark boards as unfamiliar assessments. Pause a measurement if appropriate content is unavailable.
3. Complete the five sealed baseline decisions without coaching; uncertainty is an acceptable answer. Check that Local results withholds outcomes/export during baseline and independent checks. It is a UI safeguard, not protection from inspecting one's own browser data.
4. Observe the guided lesson, then existing independent practice. Record help and hints. `/pilot` activity counts indicate completion, not understanding or mastery. The optional foreground timer on `/evaluation` can run before results are unlocked; it measures neither attention nor past unrecorded time.
5. Play an untimed game against Getting Started or another recorded preset. Let the learner resign if fatigued. Review a decision: reflect, choose a candidate, predict a reply, then hints/retry/reveal as needed. Track original game behavior separately from familiar recovery.
6. Return to relevant practice. Use genuinely unfamiliar, reviewed post-training checks only when eligible. Schedule an actual delayed follow-up with unused boards; never simulate time in participant sessions.
7. Finish and leave independent checks, pause timing, and export JSON with consent. Inspect source-specific denominators, novelty exclusions, hints and timing limitations. PGN and game-review exports remain separate. Preserve missing values and usability observations; do not manufacture findings.

## Manual device and accessibility acceptance

- [ ] Physical Android and iPhone: 320px upward, portrait/landscape, browser toolbar and safe areas, zoom, touch selection, promotion/underpromotion, scrolling, engine loading/failure/restart and downloads.
- [ ] Keyboard and assistive technology: skip link, mobile menu, current page, Escape, move/promotion controls, candidate prediction and feedback announcements, return to original position.
- [ ] System/light/dark modes: persistent explicit choice, readable feedback and board, favicon/home-screen appearance. No maskable or offline claim.
- [ ] Real session: record device/network/power conditions, duration, responsiveness, battery and temperature without inference from desktop observations.
- [ ] Educator comprehension and held-out-content review; participant eligibility, consent, scheduling and retention/deletion arrangements.

These remain pending until actually performed. Chromium desktop and emulated mobile are the automated environments verified here; Firefox/WebKit are pending compatible binaries.

## Privacy and release boundary

No external analytics or participant identity is collected. Learning, games, review and optional timing remain in existing local stores. Exports include IDs and timestamps and should be inspected before sharing. Screenshots use synthetic data. Keep source receipts and study records separately, and never copy a participant browser profile into a release bundle.

Public distribution/deployment remains blocked by the existing Stockfish GPL corresponding-source packaging and application release/licensing review in [ENGINE_INTEGRATION.md](ENGINE_INTEGRATION.md). This checklist does not clear that review. No public deployment or new infrastructure was created.

## Scoped rollback

The original Phase 2A (3457) and Phase 2B (3458) servers/build directories were preserved. The new Phase 2C preview uses 3460; port 3459 was occupied and left alone. Stop only the Phase 2C process you started before rebuilding its output directory. Keep the same origin if preserving a participant's local profile; different ports have different storage.

For source rollback, first preserve any later work and inspect the Phase 2C receipt against the baseline manifest. Extract `source-before.tar.gz` into a **new empty local folder** for comparison, then restore only confirmed Phase 2C edits with user authorization. Do not reset/clean the dirty repository or blindly replace its working tree. New Phase 2C files must be considered separately from pre-existing untracked Phase 2A/2B files. Rebuild the chosen source in an isolated output directory and run relevant checks. There is no storage migration to reverse: learning/game/timing schemas and domain logic are unchanged; an older UI simply ignores the optional theme key.
