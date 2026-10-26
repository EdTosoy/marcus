# Marcus deployment runbook

Latest release preparation: [D0.1 source/compliance verification](PHASE_D0_1_VERIFICATION.md) and [D1 release gates](PHASE_D1_RELEASE_GATES.md). The exact engine source package is now prepared and reproducible; application licensing and authorization remain open. D1 also proposes free All Deployments authentication on Hobby, using current September 2026 guidance. No live setting or deployment was changed.

For the current configuration, verification and proposed D1 procedure, see [Phase D0 deployment readiness](PHASE_D0_DEPLOYMENT_READINESS.md). The Phase 2C record below is historical; D0 confirms authenticated deployment-listing access is now working and the existing Vercel project has no Git repository linked. Deployment remains unauthorized and blocked by the recorded distribution/licensing gate.

## Current release status

**BLOCKED BEFORE PUSH / PREVIEW CREATION.** This is deployment preparation, not a successful Vercel release. See [the verification record](DEPLOYMENT_VERIFICATION.md) for executed checks and outstanding gates.

Reuse only these resources:

- GitHub: `EdTosoy/marcus`, remote `git@github.com:EdTosoy/marcus.git`, default branch `main`.
- Vercel: `marcus`, project `prj_fdp1FWAMpF5wHBw1XwXHbnCX1RWt`, account `team_fnmo0AOdULr7rFrGsUl9Pakx` / scope reported as `edtosoys-projects`.
- Framework Next.js; Node 24.x. Project metadata confirms Vercel Authentication enabled (`all_except_custom_domains`). No protection setting was changed.

GitHub API inspection reports the repository **public**, contrary to the requested private baseline. The owner has admin rights, but visibility was not changed without confirmation. No release source has been pushed. Vercel project metadata was readable, but team-scoped deployment listing returned HTTP 403 and requires the account owner's access approval. Do not reconnect, change accounts, create another project or disable protection to work around that requirement.

## Build and package manager

`vercel.json` supplies the minimal release correction:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "corepack pnpm install --frozen-lockfile --ignore-scripts",
  "buildCommand": "node scripts/prepare-engine.mjs && next build --webpack"
}
```

The configured bare `next build --webpack` was reproduced on clean locked dependencies: it succeeded while `public/engine` was absent. The existing `pnpm build` wrapper prepares the engine, but the bare command bypasses that wrapper. The explicit deployment command fixes packaging without changing chess logic or the engine distribution. Worker/WASM binaries remain generated and Git-ignored.

Corepack 0.36.0 selected the existing `packageManager` pin `pnpm@11.27.0` successfully. The frozen install completed in a directory outside the parent pnpm workspace with dependency lifecycle scripts disabled. That exact install policy and build command then passed. Node's current project range `>=24 <25` matches the Vercel project's 24.x setting. [Vercel supports Node 24](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions); its [package-manager documentation](https://vercel.com/docs/package-managers) recommends Corepack for explicit versions rather than assuming the build-image default matches the pin.

Keep `pnpm-workspace.yaml` in source; it contains the existing build-script policy. A first nested test directory inherited the parent workspace and did not install its own modules, so it was replaced by a genuinely isolated `/tmp/marcus-deployment-locked-build` install. That first no-op is not counted as clean-install verification.

`.gitignore` now excludes `.vercel/`, including pulled credentials and local linking metadata. `.vercelignore` excludes builds, dependencies, environment files and local/test artifacts from CLI uploads. No runtime secret, database or external engine API is required by the app. `NEXT_DIST_DIR` is an optional local build selector; omit it on Vercel so Next uses `.next`.

## Stockfish distribution gate

Pinned package: `stockfish@19.0.1`, unmodified lite single-threaded engine. Both shipped files match upstream release digests:

| File                            | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `stockfish-19-lite-single.js`   | `ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a` |
| `stockfish-19-lite-single.wasm` | `ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de` |

The generated `/engine/COPYING.txt`, `/engine/NOTICE.txt` and hash manifest preserve licensing/attribution. These alone do not complete source distribution. The npm package's published file list excludes C++ sources and `build.js`.

The upstream annotated tag `v19.0.1` resolves to commit `0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6`. Its source was inspected and archived locally for review. It requires Emscripten **6.0.9**, Terser **5.51.2**, and lite network **`nn-61e7af4bb97d.nnue`**. The network is not in the source checkout. Attempts to retrieve it from the build script's primary source returned HTTP 403; the official GitHub fallback returned HTTP 404. Emscripten is not installed; no source rebuild was conducted. The local review archive is **incomplete for release** and is not served as corresponding source.

The upstream build invocation to validate after obtaining the input/toolchain is:

```sh
node build.js --single-threaded --lite --no-split --strict-em-check
```

[Upstream exact-version instructions](https://raw.githubusercontent.com/nmrugg/stockfish.js/v19.0.1/README.md) identify the build tools and engine flavors. Before any engine deployment, supply the exact engine's complete corresponding source, build/configuration scripts, required network, notices and directions accessible to every binary recipient. Verify the source/binary mapping and preserve access. [GPLv3 section 6(d)](https://www.gnu.org/licenses/gpl.en.html#section6) requires equivalent source access for network distribution; a private GitHub repository is insufficient when a binary recipient lacks access.

The application has no recorded license or approved whole-application determination. The replaceable adapter exchanges UCI text with a separate worker, but that boundary alone does not establish that the complete distributed application is an independent aggregate. [The GNU FAQ](https://www.gnu.org/licenses/gpl-faq.en.html#MereAggregation) considers both communication mechanism and semantics. The owner must approve a defensible integration/licensing policy; do not silently relicense Marcus. Protected previews restrict access but do not remove recipients' applicable GPL rights. This assessment does not claim legal clearance.

Required closure: obtain the network/build inputs, assemble and verify the complete engine source package and recipient-access path, and resolve the application's applicable obligations. Do not deploy an engine-disabled substitute or change engine distributions without approval.

## Synchronize and create a protected preview — after gates pass

1. Resolve repository visibility explicitly. Recheck private status immediately before pushing. Confirm team access, expected project/account, Authentication and Git integration target. A push to the production branch must not accidentally create production; use a release branch such as `release/phase-2c-preview` and confirm the project's branch rules before pushing.
2. Review candidate paths and secrets. Exclude environment files, `.vercel`, generated engine/build files, test artifacts and participant exports. Stage explicit reviewed source paths; inspect the entire staged diff and names. Preserve unrelated work. Run the checks in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).
3. Commit with `feat: complete phase 2c pilot-ready release`, record `git rev-parse HEAD`, and push the release branch to the existing origin. Compare `git ls-remote origin refs/heads/release/phase-2c-preview` with the exact commit; do not force-push or merge.
4. Prefer the existing authenticated Vercel connection. If CLI fallback is required, authenticate as the intended account, then explicitly link the existing project:

```sh
vercel link --project marcus --scope edtosoys-projects
vercel project inspect --non-interactive --scope edtosoys-projects
vercel deploy --scope edtosoys-projects
```

Use installed CLI help to confirm flags before executing. Verify `.vercel/project.json` contains project ID `prj_fdp1FWAMpF5wHBw1XwXHbnCX1RWt` and the expected account. `vercel deploy` is preview; do not add `--prod`. Do not create a custom domain or disable Authentication. Link/CLI commands above are a runbook, not commands executed in the blocked attempt.

5. Inspect the exact deployment until READY or ERROR, record its ID/URL/commit and build logs, then run the live checks below. READY without application smoke verification is not acceptance.

## Live smoke and access protection

Authenticate requests through the existing account. Use `vercel curl` with the **full preview URL**, never the path-only production default. For browser automation, use a short-lived project development OIDC token through `x-vercel-trusted-oidc-idp-token`, scoped to the exact preview origin. Keep tokens only in memory, never in source/logs/screenshots/traces. Do not weaken Deployment Protection. Validate that an unauthenticated request is protected separately from authenticated application checks.

Verify `/`, `/learn`, `/play`, `/evaluation` and `/pilot` with direct loads and refresh. Enter Review through the completed game's actual link, preserving its generated game query ID. Test light/dark, 320px layouts, a legal Stockfish reply, resign/complete, review reflection/candidate/prediction/retry, PGN download and local progress after reload. Inspect page exceptions, console and unexpected network failures; treat exact normal cancelled Next RSC prefetches separately.

Fetch worker JS and WASM over HTTPS. Require usable JavaScript MIME and `application/wasm`, successful worker readiness and legal engine moves; check asset hashes against the prepared manifest. Resolve favicon/Apple/manifest icons. No continuous analysis or engine computation should begin merely by visiting the pilot/lesson routes.

## Rollback and later production promotion

No deployment or release commit was created in this blocked attempt, so there is no new remote release to roll back. Preserve the existing local preview/production processes. Local changes are limited to release configuration, ignore rules and these documents; compare against `artifacts/deployment/preflight/git-status-before.txt` before restoring anything.

For a later bad preview, retain its URL/logs for diagnosis, return testers to the last verified protected preview, and issue a corrected commit/deployment. Do not rewrite history, change production aliases or delete unrelated deployments. Browser-local data belongs to an origin; changing preview URLs does not migrate progress.

**Production is not authorized.** After licensing, privacy, preview smoke and explicit production approval are all satisfied, use a clean checkout of the verified release commit, the same project/account and a production-configured staged deployment:

```sh
vercel project inspect --non-interactive --scope edtosoys-projects
vercel deploy --prod --skip-domain --scope edtosoys-projects
vercel inspect <staged-production-url> --scope edtosoys-projects
# Verify READY, exact source/production configuration and authenticated smoke tests.
vercel promote <staged-production-url> --scope edtosoys-projects
```

Do not promote an untested preview directly: production configuration can require a rebuild. These are the exact command forms for the later approved procedure, with the future URL intentionally unresolved. Confirm behavior with the installed CLI version. [Vercel deployment](https://vercel.com/docs/cli/deploy) and [promotion](https://vercel.com/docs/cli/promote) documentation describe staging/promotion. After promotion, verify the production URL and preserve a known-good deployment for an authorized rollback; a first production release has no previous production version to assume.
