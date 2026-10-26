# Stockfish.js 19.0.1 source distribution

Date: 2026-10-26. **Technical source/input preparation is complete. Application licensing and release approval remain pending.** No engine binary was changed, and no deployment occurred.

## Exact binary and source provenance

Marcus installs `stockfish@19.0.1` from the exact pnpm lock entry. Original package: https://registry.npmjs.org/stockfish/-/stockfish-19.0.1.tgz. Its registry integrity matches the lockfile:

```text
sha512-bTwsO4e9HAwPBKls1+szcfibmaWRNzTF20rQE/XPdB3LOSoT6XTZDr1zYwriwSRRFT5MkvqrglPmJrKEVXGnyQ==
```

The selected files also match the digests reported by [GitHub release v19.0.1](https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.1), release ID `408947742`, published 2026-10-10:

| Artifact                        |     Bytes | SHA-256                                                            |
| ------------------------------- | --------: | ------------------------------------------------------------------ |
| `stockfish-19-lite-single.js`   |    28,230 | `ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a` |
| `stockfish-19-lite-single.wasm` | 1,845,971 | `ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de` |
| Embedded `nn-61e7af4bb97d.nnue` | 1,166,381 | `61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b` |
| Corresponding-source archive    | 1,414,857 | `7b4c25c19c23e3b82e5c15953299e5a754f84383300a2583991dc629c748683e` |
| Original GPL license            |    35,821 | `0b383d5a63da644f628d99c33976ea6487ed89aaa59f0b3257992deac1171e6b` |

Annotated tag object `8d9ca57043594a8fa6ae0b73fb685d9105bf51df` resolves to exact source commit **`0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6`**. The tag is unsigned, and npm metadata does not provide `gitHead`. We did not verify a publisher-signed source-to-binary attestation. Independently rebuilding both artifacts byte-for-byte establishes their source/input correspondence; it does not authenticate contributor identities or provide legal approval. The full npm tarball was not redownloaded; installed selected bytes were checked against release digests, and npm integrity against the existing lock. [Pinned source](https://github.com/nmrugg/stockfish.js/tree/0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6)

`scripts/prepare-engine.mjs` copies these two package files byte-for-byte. There are no Marcus source patches, minification changes, renaming, splitting or recompilation in the application build. The full, multithreaded, ASM-JS and ultra-lite binary variants are not copied.

`createBrowserEngine` in `src/engine/uci-engine.ts` uses the classic worker constructor `new Worker("/engine/stockfish-19-lite-single.js")`. Its upstream loader requests the adjacent WASM using the worker origin/path. No external engine service, runtime network download of NNUE, shared application memory or SharedArrayBuffer is used. The source build embeds the lite network; normal engine startup needs only worker JS and WASM.

## Recovered required input and verified rebuild

The exact source `src/evaluate.h` names `nn-61e7af4bb97d.nnue`; `build.js` embeds its raw bytes as a C++ array. Upstream credits identify Chris Bao (sscg13). The normal official download returned 403, and the official network repository did not contain this filename. No alternate neural network was substituted.

The WASM optimizer encodes initialized memory in 225 active data segments, eliding zero-filled gaps. `scripts/extract-stockfish-network.py` reconstructs those segments without executing WASM and recovers 1,166,381 bytes at linear-memory offset 39,600. Its full SHA-256 matches the pinned recovered input; its first 12 hex digits match upstream's network filename and validation convention. A direct slice of the WASM file was tested and did not match; only reconstructed memory produces the correct input.

The pinned source was compiled locally with:

- Emscripten **6.0.9**, compiler commit `4e4223852a0835923411059a3929907d7df1232e`.
- Terser **5.51.2**, with an added npm lock for its 11 installed packages.
- Node **24.19.0**, GNU Make **4.3**, Linux amd64.
- Image `emscripten/emsdk@sha256:3ba391c5b1554e06f9af0a69652ff20919dff14e771619339dba988bd62574b5`.
- `node build.js --single-threaded --lite --no-split --strict-em-check` with a Make wrapper appending `-j2` solely to limit concurrency.
- Networking disabled during compilation, 2 CPU quota, 6 GiB memory limit, no application or credential mounts.

**Both output digests equal the release hashes above.** The build produced two Closure type warnings and zero errors. No rebuilt output replaced Marcus's installed or distributed binaries. General-purpose compiler/tools are obtained separately; the exact source, engine-specific build inputs/configuration and compiler/runtime notices are in the archive. This is one verified host/toolchain recipe, not a claim that every host produces identical bytes. [Upstream exact-version build instructions](https://raw.githubusercontent.com/nmrugg/stockfish.js/0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6/README.md)

## Versioned, recipient-accessible package

Tracked release input: `third_party/stockfish/19.0.1/stockfish.js-19.0.1-corresponding-source.tar.gz`.

The deterministic archive has 151 members under `stockfish.js-19.0.1/`: every tracked upstream file, the exact embedded network, locked Terser dependency graph, build/acquisition instructions, member checksum inventory, GPL, authors, all upstream per-file notices, the source-recovery helper and Emscripten license/notices. No upstream source file is patched. `examples/src` preserves the upstream relative symlink. The new recovery helper carries a GPLv3-or-later grant scoped to that helper; no Marcus application license is added.

`third_party/stockfish/19.0.1/provenance.json` records package integrity, tag/commit/release identity, binary/network/archive hashes, toolchain and measured rebuild result. `SOURCE-MANIFEST.json` inside the archive hashes every other archive member. The archive is canonical USTAR with sorted paths, normalized owner/mode/time metadata and gzip timestamp zero. Repeated packaging on the recorded Python 3.12.14 implementation produces identical bytes.

The existing application build automatically verifies and copies:

```text
/engine/stockfish-19-lite-single.js
/engine/stockfish-19-lite-single.wasm
/engine/stockfish.js-19.0.1-corresponding-source.tar.gz
/engine/COPYING.txt
/engine/AUTHORS.txt
/engine/EMSCRIPTEN-LICENSE.txt
/engine/SOURCE.txt
/engine/NOTICE.txt
/engine/manifest.json
```

The `/open-source` page is linked from the global footer. Both it and the adjacent `NOTICE.txt` give the exact source download, license, directions and checksum. This same-origin approach is small enough for Hobby and avoids relying solely on an upstream service, a moving branch or access to a private Git repository. Source is not loaded during normal gameplay. The complete source payload adds about 1.4 MB to deployment storage and transfers only when requested.

## Regeneration and checks

After obtaining and reviewing a checkout of the exact commit:

```sh
python3 scripts/package-stockfish-source.py --source-dir /path/to/exact/stockfish.js
corepack pnpm engine:prepare
corepack pnpm compliance:source
corepack pnpm compliance:check
corepack pnpm compliance:test
```

Packaging reads the immutable commit with `git archive`; it does not include checkout changes. Repacking after a deliberate source-package change requires reviewing/updating the archive hash/size in provenance, rerunning preparation and checking notices/docs. The checker rejects missing/corrupt source, altered binaries, unexpected binary variants and inconsistent notices. A checker PASS is artifact evidence only.

## Retention and legal boundary

The selected distribution mechanism is equivalent network access under GPLv3 **6(d)**. Every engine recipient must be able to copy the exact source in the same practical way, at no additional charge. D1 must test source access under the same authentication session as binary access. Authentication cannot be used to impose restrictions on recipients' GPL rights.

Keep exact archives and notices available for as long as corresponding binaries are offered, including old previews and rollback deployments. Retain durable versioned copies and hashes independently of Vercel deployment garbage collection; confirm a named owner and access plan before release. If a source URL changes, preserve clear directions and equivalent copying access. The 6(b) physical-product written-offer three-year term is not the selected mechanism and is not a universal replacement for 6(d)'s continuing availability obligation. [GPLv3 sections 1 and 6](https://www.gnu.org/licenses/gpl-3.0.en.html)

The earlier missing-network/source-package technical blocker is closed. Whether Marcus as a whole must be distributed under GPL-compatible terms remains the separate [application licensing decision](APPLICATION_LICENSE_ASSESSMENT.md). No legal clearance or deployment approval is implied.
