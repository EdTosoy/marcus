# Phase 2C deployment release checklist

Current decision: **do not push or create a preview until the blockers below are resolved.** This checklist is not production approval.

## Preflight completed

- [x] Inspected dirty `main`, Git history, origin and untracked work; preserved initial status and the existing Phase 2C receipt.
- [x] Verified local and remote `main` at `a03de048e1d151dabb88b6f7f17c2467343331f5`; no divergence or force-push required.
- [x] Verified source against the Phase 2C receipt before release edits; product code/assets/tests and lockfile remain unchanged.
- [x] Re-ran 177 unit tests and separately the actual pinned Stockfish integration.
- [x] Re-ran strict typecheck, lint and formatting; clean frozen install/build and browser outcomes are recorded in [DEPLOYMENT_VERIFICATION.md](DEPLOYMENT_VERIFICATION.md).
- [x] Reproduced missing-engine packaging with a bare Next build; supplied minimal `vercel.json` install/build commands.
- [x] Added `.vercel/` Git exclusion and source-only CLI upload exclusions.
- [x] Checked candidate files for common credential patterns without printing secrets; checked ignored credentials/build/test artifacts.
- [x] Confirmed exact existing Vercel project ID, Node 24.x and Authentication setting through project metadata.
- [x] Inspected exact upstream engine tag, release hashes, licensing text, source files and build dependencies.

## Blocking gates

- [ ] Resolve GitHub visibility. API reports **PUBLIC**, while the task specifies private. Obtain the owner's decision and verify effective visibility before any source push.
- [ ] Complete Vercel team-access approval for `team_fnmo0AOdULr7rFrGsUl9Pakx`. Deployment listing currently returns HTTP 403. Keep the same connection; do not disable Authentication.
- [ ] Obtain the required `nn-61e7af4bb97d.nnue` and full engine build inputs. Primary network request returned 403; documented official fallback returned 404.
- [ ] Assemble and validate exact engine corresponding source/build information and an equivalent source-access path for every preview binary recipient. Current notices/source-tag link are incomplete release preparation.
- [ ] Record approved whole-application GPL integration/licensing treatment. No application license is currently recorded; do not infer clearance from private GitHub, a protected preview or a worker boundary.

## Commit, push and protected preview — pending

- [ ] Verify the exact staged paths/diff, absence of secrets/generated output and unchanged product behavior.
- [ ] Choose a release branch and confirm Vercel branch rules prevent unintended production deployment.
- [ ] Commit the reviewed release; record the actual SHA rather than the baseline HEAD.
- [ ] Push without force and verify remote branch contains that exact SHA.
- [ ] Verify project/account/protection again and create only a preview.
- [ ] Record deployment ID, preview URL, source SHA, READY/ERROR and cloud build logs.
- [ ] Confirm unauthenticated protection and authenticated application access without leaking tokens.
- [ ] Smoke-test HTTPS direct loads/refresh, actual review navigation, themes/mobile, legal engine reply, resignation/review/retry, PGN and persistence.
- [ ] Verify worker/WASM HTTPS MIME types/hashes, manifest/favicons and no unexpected runtime/network errors.
- [ ] Update deployment records with observed results. Do not mark cloud tests passed from local results.

## Production remains separate

- [ ] Explicit production authorization and application/engine licensing clearance.
- [ ] Reviewed protected-preview results and known limitations; physical-device/educator/human-validation gaps remain honestly identified.
- [ ] Verify production configuration and stage the exact release commit without assigning domains.
- [ ] Smoke-test the staged production build, then promote only on authorization.
- [ ] Record final production URL/SHA and a realistic rollback target. No custom domain setup is included in this task.

See [DEPLOYMENT.md](DEPLOYMENT.md) for commands, source obligations, access protection and rollback. No source publication, visibility change, commit, push, preview deployment or production promotion was performed in this blocked attempt.
