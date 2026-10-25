# Mobile and browser readiness protocol

Status: desktop/mobile Chromium automation available; physical Android/iPhone, Firefox/WebKit and battery/thermal testing pending. A phone viewport is not a physical-device test.

## Reproducible automated checks

```sh
NEXT_DIST_DIR=.next-phase2b pnpm build --webpack
NEXT_DIST_DIR=.next-phase2b pnpm test:e2e
MARCUS_REAL_ENGINE=1 pnpm exec vitest run src/engine/stockfish.integration.test.ts
```

Use the existing browser executable configuration; do not disable the Chromium sandbox. Firefox/WebKit binaries were not installed in this environment. If compatible binaries are installed on a test machine, run:

```sh
MARCUS_EXTRA_BROWSERS=1 NEXT_DIST_DIR=.next-phase2b pnpm test:e2e
```

The optional projects use their own browser defaults rather than the workstation Chromium path. Missing browsers are NOT RUN, not passed. No new browser installation is performed as part of this task.

## Physical-device checklist

Use a local or explicitly authorized test deployment. Log build/content/engine versions, device model, OS/browser version, viewport, input mode, network and starting battery/temperature conditions. Keep the application license/distribution gate separate from a request to test on a publicly hosted URL. Use synthetic game data or a consenting volunteer, not another person’s saved profile.

1. At widths near 320, 375/390 and landscape, open lesson, learning, Play, Review and Local results. Check no clipped controls, overflow, unreadable terminology or browser-toolbar obstruction. Zoom text where supported.
2. Select pieces and destinations by touch and drag. Check both orientations, legal markers, mis-taps and scrolling near the board. Explore a long completed game without losing the current review decision.
3. Promote explicitly to queen/rook/bishop/knight. Verify the choice controls remain visible and at least 44px high; cancellation restores the board. Test an underpromotion ending in a draw.
4. Confirm no worker/download before Play needs an engine or Review explicitly requests analysis. Observe first-load delay on ordinary and throttled networks, unavailable WASM, failure/restart and no hints/evaluations during independent play.
5. Pause during calculation, resign/restart, navigate away, background the tab, lock/unlock the device, then resume. Old results must never enter a new game. Long suspensions must not count as timed foreground study.
6. In Review, reflect, choose a candidate, predict a reply, request one/two hints, retry, reveal and cancel analysis. Inspect the original board and current candidate distinctly. Check verified mate and uncertain exchanges do not become false mistakes.
7. Use external keyboard or desktop emulation: arrow keys, Enter/Space, promotion choices, visible focus, skip link and prediction focus. Focus should move to the first prediction question after selecting a candidate. Try VoiceOver/TalkBack announcements and landmark navigation; automation is not a full accessibility audit.
8. Enable reduced motion. Verify board interactions remain understandable without animation and no essential information depends on motion/color alone.
9. Start the optional timer, move between routes, background the app, pause and reload. It must restore paused, retain measured segments and clearly distinguish foreground duration from attention. Export JSON/PGN locally and inspect their content.
10. Over a prespecified real session (for example 20 minutes), record battery and thermal observations, device power mode, screen brightness, other apps, network and elapsed duration. Compare repeated conditions before drawing conclusions. Do not infer battery efficiency from desktop timings or hash size.

## Recording and outcomes

Use [device-check.csv](templates/device-check.csv). Record observed latency or responsiveness, exact steps and failures; mark unavailable measurements `not_measured`. Note whether an issue blocks reasoning, merely annoys, or requires facilitator help. Preserve screenshots only with consent and without identifiers. Physical device, assistive-technology, total-memory and battery results remain empty until actually executed.

## Phase 2C experience additions

For the current experience build, substitute `.next-phase2c` in the commands above. Include `/pilot`, collapsed navigation at 320px, current-page indication, Escape/return focus, system/light/dark persistence, readable feedback, original/candidate/retry board labels and expanded game-details/PGN controls. Inspect the opaque approved logo badge, favicons, Apple icon and manifest references. No offline, maskable-icon, physical-device or battery validation is implied by metadata. Automated checks now cover 320/375/768/1440px in both themes; run physical and assistive-technology checks before participant use.
