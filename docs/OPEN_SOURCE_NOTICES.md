# Marcus open source notices

Release preparation: 2026-10-26. Engine: **Stockfish.js 19.0.1**, unmodified lite single-threaded browser distribution. These component notices do not choose a license for all Marcus code.

## Recipient-facing access

The global footer links to `/open-source`. The page identifies the engine, version, authors, GPL, exact source archive, build instructions and checksum manifest. `scripts/prepare-engine.mjs` installs these files into the production public directory; release checks reject missing/corrupt copies.

| URL                                                       | Purpose                                                |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `/engine/COPYING.txt`                                     | Exact engine GPL text                                  |
| `/engine/AUTHORS.txt`                                     | Upstream contributors                                  |
| `/engine/NOTICE.txt`                                      | Attribution, version, source location and access terms |
| `/engine/stockfish.js-19.0.1-corresponding-source.tar.gz` | Exact source/build/network package                     |
| `/engine/SOURCE.txt`                                      | Build, acquisition and retention instructions          |
| `/engine/manifest.json`                                   | Machine-readable version/checksums                     |
| `/engine/EMSCRIPTEN-LICENSE.txt`                          | Compiler/runtime notices                               |
| `/licenses/OPEN_SOURCE_LICENSES.txt`                      | Component license/copyright texts and declarations     |
| `/licenses/components.json`                               | Pinned component inventory and notice hash             |

Stockfish.js is by Nathan Rugg, Chess.com and contributors, based on Stockfish by T. Romstad, M. Costalba, J. Kiiski, G. Linscott and the Stockfish developers. The lite network is by Chris Bao (sscg13). The package declares `GPL-3.0`; engine headers preserve GPLv3-or-later permissions where stated. Upstream non-engine utilities retain their MIT declarations. `Copying.txt`, AUTHORS and per-file notices remain in the source archive. Emscripten's own license notices are copied from the exact compiler image; none are replaced with invented copyright text.

## Other components

| Direct dependency | Pinned version | Declared license |
| ----------------- | -------------- | ---------------- |
| chess.js          | 1.4.0          | BSD-2-Clause     |
| React / React DOM | 19.3.1         | MIT              |
| react-chessboard  | 5.12.1         | MIT              |
| Next.js           | 16.4.3         | MIT              |

`third_party/OPEN_SOURCE_LICENSES.txt` retains notices for the installed production dependency graph and Next's bundled components, plus the Emscripten notices applicable to the engine. The machine inventory records **72 package/version entries and 132 additional bundled notice files**, with the exact pnpm lock hash and combined notice hash. This deliberately includes some optional/build inputs; it does not assert that every installed package is sent to the browser.

Some `@next` package tarballs omit a standalone license copy; their same-version Next.js repository license is retained with that origin stated. `client-only@0.0.1` and optional `@img/sharp-libvips-linux-x64@1.3.4` provide license declarations without complete notice files in their published install. Their metadata is preserved explicitly rather than fabricating a copyright grant. The locally traced `client-only` index is a zero-byte placeholder. Next's generic server trace includes Sharp/libvips, while the two dynamic-page traces do not; no native library is in public assets. D1 must inspect actual cloud output before distributing any optional native library; a shipped LGPL library would require its own applicable notice/source/relinking review, not merely the Stockfish archive. The local output's native-library findings are recorded in verification.

Regenerate the inventory after dependency changes on the intended build platform:

```sh
corepack pnpm licenses list --prod --json > /tmp/marcus-licenses.json
node scripts/generate-open-source-notices.mjs /tmp/marcus-licenses.json
corepack pnpm engine:prepare
corepack pnpm compliance:check
```

The intermediate pnpm output has local install paths. It must not be published. The committed inventory and combined notices contain package metadata and relative upstream notice identifiers only. License/copyright texts are copied from installed files; a complete legal audit of every upstream component is not implied by collecting them.

## Scope and release status

The source-recovery helper supplied in the engine archive is explicitly scoped GPLv3-or-later; this does not relicense Marcus. The application's brand assets and educational content retain their existing provenance and require the owner's rights review. No third-party font service or remote piece-image download is introduced.

Recipient download links and checksums are technically prepared and locally verified. Actual HTTPS/authentication behavior and long-term source availability remain D1 responsibilities. Application-license interpretation remains pending in [the assessment](APPLICATION_LICENSE_ASSESSMENT.md). A protected preview does not waive recipients' applicable license rights.
