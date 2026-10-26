# Stockfish.js 19.0.1 — engine corresponding source

This archive accompanies the unmodified **lite single-threaded** engine files
`stockfish-19-lite-single.js` and `stockfish-19-lite-single.wasm`.
It contains engine source, not Marcus application source or an application license.

## Exact origin

- Repository: https://github.com/nmrugg/stockfish.js
- Release: https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.1
- Annotated tag object: `8d9ca57043594a8fa6ae0b73fb685d9105bf51df` (unsigned).
- Source commit: `0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6`.
- Commit source: https://github.com/nmrugg/stockfish.js/tree/0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6
- npm package: `stockfish@19.0.1`; https://registry.npmjs.org/stockfish/-/stockfish-19.0.1.tgz

Original distributed artifacts, SHA-256:

```text
ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a  stockfish-19-lite-single.js
ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de  stockfish-19-lite-single.wasm
```

The lite network by Chris Bao (sscg13), embedded in WASM, is included at
`src/nn-61e7af4bb97d.nnue` (1,166,381 bytes):

```text
61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b  nn-61e7af4bb97d.nnue
```

The network was recovered from the exact shipped WASM's initialized memory:
225 active data segments, network offset 39,600. WASM's zero-filled gaps must be
restored; simply slicing the binary file does not recover the network. The
first 12 digest digits match the filename in upstream `src/evaluate.h` and its
`scripts/net.sh` validation rule. No replacement network or retraining was used.
`recover-network.py` reproduces the recovery and checks the entire binary and
network digests. If needed, run:

```sh
python3 recover-network.py /path/to/stockfish-19-lite-single.wasm recovered.nnue
```

Upstream acquisition endpoint:
https://tests.stockfishchess.org/api/nn/nn-61e7af4bb97d.nnue
(returned 403 during preparation). Recovery makes rebuilding this archive
independent of that endpoint. Network provenance and attribution are preserved
in `src/emscripten/credits-lite.js` and the upstream README.

## Rebuild

Prerequisites: Linux or another upstream-supported build system, Node.js,
npm, Python 3, GNU Make, and **Emscripten 6.0.9** including its normal LLVM,
Binaryen and Closure tooling. Upstream requires **Terser 5.51.2**. The added
`package-lock.json` pins its dependency graph; it does not change the upstream
`package.json`. General-purpose tools are obtained separately.

```sh
npm ci --ignore-scripts --no-audit --no-fund
emcc --version
node build.js --single-threaded --lite --no-split --strict-em-check
sha256sum src/stockfish-19-lite-single.js src/stockfish-19-lite-single.wasm
```

The included network validates locally; a build should not need a network
download after installing tooling. Do not use `--all`, `--ultra-lite`, a full
network, multithreading, Syzygy retention, debug flags or split WASM for this
release. Output lives in `src/`. Original build options and Emscripten glue are
included without patches. `build.js` chooses concurrency from CPU count; a
Make wrapper appending `-j2` can bound local memory without changing code or
compiler options.

An exact Linux amd64 toolchain image is available as:

```text
emscripten/emsdk@sha256:3ba391c5b1554e06f9af0a69652ff20919dff14e771619339dba988bd62574b5
```

SDK tag `6.0.9` resolves to `5eb0bde7585670252e8ba05e9d361627bffd08b5`:
https://github.com/emscripten-core/emsdk/tree/5eb0bde7585670252e8ba05e9d361627bffd08b5
Compiler sources: https://github.com/emscripten-core/emscripten/tree/6.0.9
Compiler/runtime notices are in `EMSCRIPTEN-LICENSE.txt`.

This recipe supplies exact source and build inputs. Byte-for-byte engine
reproducibility is a separate measurement: compare the rebuilt outputs against
the published hashes; do not silently replace the pinned release if they differ.
No signed source-to-binary build attestation was verified. On 2026-10-26 the
recipe was executed locally with the pinned Linux amd64 image, Node 24.19.0,
GNU Make 4.3, Terser 5.51.2, two build jobs and networking disabled. Both output
digests matched the published hashes above byte-for-byte. Emscripten identified
its compiler commit as `4e4223852a0835923411059a3929907d7df1232e`.
This independently establishes the source/input mapping without claiming an
upstream signature, legal approval, or reproducibility on every host platform.

## Contents and licenses

All files tracked by the exact upstream commit are retained, including C++,
NNUE implementation, Emscripten glue, build/pack/net scripts, copyright headers,
AUTHORS, license, tests and examples. `examples/src` is the upstream relative
symlink to `../src`.

Marcus adds the exact embedded network, a Terser dependency lock, this document,
an inventory, the recovery helper and compiler notices. No upstream source file
is patched. `SOURCE-MANIFEST.json` records each member's checksum and origin
commit. The recovery helper is supplied under GPL-3.0-or-later solely as part of
this engine source package; this does not grant or change a Marcus application
license.

The engine is GPLv3; individual Stockfish source headers allow GPLv3 or later.
Preserve `Copying.txt`, AUTHORS and all per-file notices. Upstream's non-engine
utilities declare MIT in their source; the archive retains those declarations.
The GNU GPL includes warranty disclaimers. No additional restriction is imposed
on recipients' license rights by this source-access mechanism.

## Access and retention

The release's Open Source Licenses page and `/engine/NOTICE.txt` point to this
archive beside the binaries, at no additional charge and with equivalent copying
facilities. Any recipient who can obtain an engine binary must also be able to
obtain its exact source archive, license, notices and manifest. Authentication
must not admit binary access while denying the matching source.

For network distribution under GPLv3 section 6(d), keep equivalent source access
available for as long as the corresponding binaries are offered. This is not a
section 6(b) written offer, and its three-year rule must not be substituted for
the chosen network-access method. Retain a durable copy of every released
archive and digest outside ephemeral deployment retention. If URLs move, maintain
clear directions and equivalent access; remove no source while its binaries
remain accessible. A private repository alone is not sufficient for recipients
who cannot read it.
