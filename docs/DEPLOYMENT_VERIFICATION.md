# Phase 2C deployment verification

Date: 2026-10-25, Asia/Manila. **Release result: BLOCKED, NO COMMIT/PUSH/PREVIEW CREATED.** No READY deployment, live HTTPS URL, public release or production promotion is claimed.

## Source and target identity

| Item                        | Observed value                                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Local project               | `/mnt/storage/projects/marcus`                                                                                          |
| Branch / local HEAD         | `main` / `a03de048e1d151dabb88b6f7f17c2467343331f5`                                                                     |
| Remote                      | `git@github.com:EdTosoy/marcus.git`                                                                                     |
| Remote main                 | Same SHA, verified by `git ls-remote`                                                                                   |
| Release commit SHA          | **None created**; HEAD above is the old baseline, not the Phase 2C release                                              |
| GitHub default branch       | `main`                                                                                                                  |
| GitHub visibility           | **PUBLIC**, independently confirmed by `gh repo view` and repository API, contrary to the requested private baseline    |
| GitHub caller permission    | ADMIN; no visibility change performed                                                                                   |
| Vercel project              | `marcus` / `prj_fdp1FWAMpF5wHBw1XwXHbnCX1RWt`                                                                           |
| Vercel account              | `team_fnmo0AOdULr7rFrGsUl9Pakx`, access error names scope `edtosoys-projects`                                           |
| Project framework / Node    | Next.js / `24.x`                                                                                                        |
| Protection                  | `ssoProtection.enabled: true`, `all_except_custom_domains`; unchanged                                                   |
| Deployment metadata         | Project reported `live: false`, `latestDeployment: null`; scoped listing returned 403, so no complete list was verified |
| Preview URL / deployment ID | **None created**                                                                                                        |
| Production readiness        | **Blocked**                                                                                                             |

The existing Phase 2C source receipt verified successfully before release edits: product/config/test fingerprint `7e92714c053f3da0fb6e3c9cb38eb3252de8766d801909c788618803b5f650ee`, build ID `Hv6E4gIwYxC_4om07Hp6V`. All runtime source, approved assets, tests and lockfile still match that preserved receipt. Release edits are limited to `vercel.json`, `.vercelignore`, the `.vercel/` exclusion and deployment documentation. The old receipt remains historical; its configuration fingerprint is not silently relabeled after release edits.

Initial status and read-only review artifacts are under `artifacts/deployment/preflight/`. Nothing was staged or committed. An isolated source copy outside the parent workspace used `/tmp/marcus-deployment-locked-build`; existing local servers and their output directories were preserved.

## Executed verification

| Command / scenario                                                                   | Result                | Evidence                                                                                                                                                           |
| ------------------------------------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node scripts/pilot-release.mjs verify artifacts/phase2c/release` before edits       | **PASS**              | Original source, docs, engine hashes, archived copy and build ID matched                                                                                           |
| `pnpm test`                                                                          | **PASS**              | 177 unit tests in 13 files; one real-engine test explicitly skipped by default                                                                                     |
| `MARCUS_REAL_ENGINE=1 pnpm exec vitest run src/engine/stockfish.integration.test.ts` | **PASS**              | One actual pinned Stockfish integration test; 660ms invocation                                                                                                     |
| `pnpm lint`                                                                          | **PASS**              | Zero errors/warnings                                                                                                                                               |
| `pnpm typecheck`                                                                     | **PASS**              | Strict TypeScript                                                                                                                                                  |
| `pnpm format:check`                                                                  | **PASS**              | Source/config/docs formatted                                                                                                                                       |
| `git diff --check`                                                                   | **PASS**              | No tracked whitespace errors                                                                                                                                       |
| `pnpm install --frozen-lockfile --ignore-scripts` outside parent workspace           | **PASS**              | pnpm 11.27.0, 388 packages, no lockfile changes; dependency lifecycle scripts disabled                                                                             |
| `corepack pnpm --version`                                                            | **PASS**              | Corepack 0.36.0 selected the package pin 11.27.0                                                                                                                   |
| Bare `next build --webpack` in clean copy                                            | **REPRODUCED DEFECT** | Exit 0, but `public/engine` absent; not a successful gameplay release build                                                                                        |
| Exact `vercel.json` install/build commands in isolated copy                          | **PASS**              | Frozen install plus engine preparation and Webpack production build; all routes generated                                                                          |
| `NEXT_DIST_DIR=.next-phase2c pnpm test:e2e` in isolated copy                         | **PASS**              | All 46 scenarios, 23 desktop + 23 emulated mobile; 59.0 seconds                                                                                                    |
| Local direct HTTP route/asset smoke                                                  | **PASS**              | 19 routes/assets, HTTP 200; usable JavaScript MIME, WASM `application/wasm`, expected worker/WASM SHA-256                                                          |
| Runtime source/dependency audit                                                      | **PASS**              | No application localhost/absolute-HTTP endpoints or runtime secrets; same-origin `/engine/` assets; local browser persistence                                      |
| Candidate-file/ignore review                                                         | **PASS within scope** | Common private-key/token/access-ID patterns scanned without printing values; credentials/build/test/engine outputs ignored; this is not an exhaustive secret audit |
| Exact staged diff / release commit / remote sync                                     | **NOT RUN**           | Held before staging/commit/push because release gates failed                                                                                                       |
| Vercel team deployment listing                                                       | **BLOCKED**           | HTTP 403; account owner must approve team access with the same connection                                                                                          |
| Vercel remote build / READY                                                          | **NOT RUN**           | No deployment created                                                                                                                                              |
| Deployed HTTPS/browser/worker smoke                                                  | **NOT RUN**           | No preview URL; local HTTP/browser results are not cloud results                                                                                                   |
| Firefox / WebKit / physical device / educator validation                             | **NOT RUN**           | No new coverage or claims introduced in this deployment task                                                                                                       |

The clean-copy build executed `node scripts/prepare-engine.mjs && next build --webpack` with Next 16.4.3 on Node 24.21.0, using the exact existing dependency lock. The explicit `corepack pnpm install --frozen-lockfile --ignore-scripts` deployment install command also completed there. Initial installation under an ignored directory inside the main repository inherited the parent workspace and was a no-op for that copy; it was not counted as the isolated install.

Existing browser journeys cover legal engine replies as both colors, loading/restart/interruption, full-game persistence, resign/review navigation with actual IDs, reflection/retry/prediction/hints, PGN, local progress reload, direct routes, themes, mobile widths, assessment privacy, manifest and icons. No test expectation was changed for deployment. Source hashes verify the clean-copy tests exercised the same product code.

Local smoke used temporary port 3462 and saved response statuses/types/hashes in `artifacts/deployment/preflight/local-http-smoke.json`. It tested `/`, `/learn`, `/play`, `/review`, `/evaluation`, `/pilot`, manifest, all favicon/Apple/brand references, both engine files, notices and engine manifest. This was loopback HTTP only. HTTPS, Vercel CDN MIME behavior, authenticated access and deployed browser behavior remain pending. The temporary smoke server was stopped after verification; existing application previews were left alone.

## Essential release fix

The requested Vercel build command bypasses the existing `pnpm build` engine-preparation wrapper. Because `public/engine` is correctly generated/ignored, a clean bare Next build omits worker/WASM assets. The new `vercel.json` invokes preparation explicitly before the same Webpack build. It pins install behavior through Corepack without changing dependency versions. `.gitignore` protects Vercel link/pulled environment metadata, and `.vercelignore` excludes local artifacts from CLI uploads. No product, learning, chess or infrastructure feature was added.

## Stockfish licensing assessment — unresolved

- Installed distribution is `stockfish@19.0.1`, GPL-3.0, unmodified lite single-threaded. Generated GPL text, attribution, source-tag notice and asset hashes are present.
- Both local engine digests match the exact upstream GitHub release digests. Tag `v19.0.1` resolves to commit `0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6`.
- The npm package excludes engine C++ sources/build scripts. The upstream checkout/archive includes those but lacks the required lite NNUE network. No separately complete source/network archive was present among the release assets.
- Required input `nn-61e7af4bb97d.nnue`: primary upstream download returned HTTP 403; documented official GitHub fallback returned HTTP 404. No network bytes were accepted or substituted.
- Upstream requires Emscripten 6.0.9 and Terser 5.51.2. Emscripten is unavailable; no engine rebuild or reproducibility result is claimed.
- The source-review archive SHA-256 is `1da3f2ca372e2c0d80da07d6b46c977e9de0f25666313154429a4afd2b4dba87`. It is an ignored local review artifact, **not** a complete corresponding-source distribution or a source-access offer to users.
- Complete recipient-accessible engine source/build inputs and an approved whole-application licensing treatment are still missing. Marcus has no recorded application license; no unilateral relicensing was performed.

[GPLv3 section 6](https://www.gnu.org/licenses/gpl.en.html#section6) and [the GNU aggregation/source FAQ](https://www.gnu.org/licenses/gpl-faq.en.html#MereAggregation) were reviewed along with the installed license and [exact upstream README](https://raw.githubusercontent.com/nmrugg/stockfish.js/v19.0.1/README.md). Repository privacy and Vercel Authentication do not establish source access or remove applicable recipient rights. Separate worker/UCI communication alone is not a legal determination about the application's obligations. Therefore the user-requested licensing gate is **not passed**, and no engine deployment was attempted.

## Outstanding decisions and next action

1. Owner resolves the public/private GitHub mismatch before any source push; no visibility change is assumed authorized.
2. Owner completes the team-access approval requested by Vercel. The one-time link expires after ten minutes; request a fresh link if needed. Do not store authorization URLs/tokens in source.
3. Obtain and verify all exact engine source/build inputs, package recipient-equivalent source access, and record the approved application integration/licensing policy. Do not silently change the application license or engine.
4. Only after preflight is clear: review/stage, commit to a preview release branch, push/verify its SHA, then create and smoke-test the protected preview using the existing project. Record actual cloud results and release SHA here.

No external repository write, new Vercel project, Authentication change, custom domain, public deployment or production promotion occurred. See [deployment runbook](DEPLOYMENT.md) for protected-preview execution, rollback and exact later production staging/promotion commands. Production remains separately unauthorized and blocked by the same unresolved gates.
