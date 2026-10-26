"""Make or validate the versioned engine source archive using Python stdlib.

No engine compilation, downloads, or application licensing decisions occur here.
"""

import argparse
import gzip
import hashlib
import importlib.util
import io
import json
from pathlib import Path, PurePosixPath
import subprocess
import sys
import tarfile

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parent.parent
VENDOR = ROOT / "third_party/stockfish/19.0.1"
COMMIT = "0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6"
PREFIX = "stockfish.js-19.0.1/"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def verify(archive):
    provenance = json.loads((VENDOR / "provenance.json").read_text())
    if sha(archive.read_bytes()) != provenance["sourceArchive"]["sha256"]:
        raise ValueError("Source archive checksum mismatch")
    with tarfile.open(archive, "r:gz") as tar:
        members = tar.getmembers()
        if len({m.name for m in members}) != len(members):
            raise ValueError("Duplicate archive paths")
        for member in members:
            path = PurePosixPath(member.name)
            if not member.name.startswith(PREFIX) or ".." in path.parts:
                raise ValueError("Unsafe archive path")
            if member.issym() and (member.name, member.linkname) != (
                PREFIX + "examples/src", "../src"
            ):
                raise ValueError("Unexpected source symlink")
            if not (member.isfile() or member.issym()):
                raise ValueError("Unexpected archive member type")
            if member.name.endswith((".wasm", ".so", ".tgz", ".tar.gz")):
                raise ValueError("Unexpected binary or nested archive in source")
        manifest = json.load(tar.extractfile(PREFIX + "SOURCE-MANIFEST.json"))
        expected = {PREFIX + p for p in manifest["files"]}
        if {m.name for m in members} != expected | {PREFIX + "SOURCE-MANIFEST.json"}:
            raise ValueError("Source inventory mismatch")
        for path, entry in manifest["files"].items():
            member = tar.getmember(PREFIX + path)
            if entry["type"] == "symlink":
                data = member.linkname.encode()
            else:
                data = tar.extractfile(member).read()
            if sha(data) != entry["sha256"]:
                raise ValueError(f"Source member checksum mismatch: {path}")
        required = ["build.js", "src/Makefile", "scripts/net.sh", "Copying.txt",
                    "AUTHORS", "src/emscripten/wasm-makefile.mk", "package-lock.json",
                    "src/nn-61e7af4bb97d.nnue", "MARCUS-SOURCE.md",
                    "recover-network.py", "EMSCRIPTEN-LICENSE.txt"]
        if any(PREFIX + p not in expected for p in required):
            raise ValueError("Incomplete required source inputs")
        network = tar.extractfile(PREFIX + "src/nn-61e7af4bb97d.nnue").read()
        if sha(network) != provenance["network"]["sha256"]:
            raise ValueError("NNUE checksum mismatch")
        pkg = json.load(tar.extractfile(PREFIX + "package.json"))
        if pkg["version"] != "19.0.1" or manifest["upstreamCommit"] != COMMIT:
            raise ValueError("Source release mismatch")
    print(f"PASS: source archive, {len(members)} members, all checksums and required inputs")


def package(source, wasm, output):
    actual = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()
    if actual != COMMIT:
        raise ValueError("Source checkout is not the pinned commit")
    archive = subprocess.check_output(["git", "-C", str(source), "archive", COMMIT])
    files = {}
    with tarfile.open(fileobj=io.BytesIO(archive)) as upstream:
        for member in upstream.getmembers():
            if member.isfile():
                files[member.name] = (upstream.extractfile(member).read(), member.mode, "file")
            elif member.issym():
                files[member.name] = (member.linkname.encode(), 0o777, "symlink")
            elif not member.isdir():
                raise ValueError("Unsupported upstream archive member")
    spec = importlib.util.spec_from_file_location("recover", ROOT / "scripts/extract-stockfish-network.py")
    recovery = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(recovery)
    files["src/nn-61e7af4bb97d.nnue"] = (recovery.recover_network(wasm.read_bytes()), 0o644, "file")
    for name, path in {
        "package-lock.json": VENDOR / "build-package-lock.json",
        "MARCUS-SOURCE.md": VENDOR / "SOURCE_README.md",
        "recover-network.py": ROOT / "scripts/extract-stockfish-network.py",
        "EMSCRIPTEN-LICENSE.txt": VENDOR / "EMSCRIPTEN-LICENSE.txt",
    }.items():
        if name in files:
            raise ValueError(f"Refusing to overwrite upstream file: {name}")
        files[name] = (path.read_bytes(), 0o644, "file")
    inventory = {"schemaVersion": 1, "upstreamCommit": COMMIT, "files": {
        name: {"type": kind, "sha256": sha(data), "bytes": len(data)}
        for name, (data, _mode, kind) in sorted(files.items())
    }}
    files["SOURCE-MANIFEST.json"] = ((json.dumps(inventory, indent=2) + "\n").encode(), 0o644, "file")
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as raw, gzip.GzipFile(fileobj=raw, mode="wb", filename="", mtime=0, compresslevel=9) as compressed:
        with tarfile.open(fileobj=compressed, mode="w", format=tarfile.USTAR_FORMAT) as tar:
            for name, (data, mode, kind) in sorted(files.items()):
                member = tarfile.TarInfo(PREFIX + name)
                member.mode = mode
                member.mtime = member.uid = member.gid = 0
                member.uname = member.gname = ""
                if kind == "symlink":
                    member.type = tarfile.SYMTYPE
                    member.linkname = data.decode()
                    tar.addfile(member)
                else:
                    member.size = len(data)
                    tar.addfile(member, io.BytesIO(data))
    print(f"{sha(output.read_bytes())}  {output.name} ({output.stat().st_size} bytes)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path)
    parser.add_argument("--wasm", type=Path, default=ROOT / "node_modules/stockfish/bin/stockfish-19-lite-single.wasm")
    parser.add_argument("--output", type=Path, default=VENDOR / "stockfish.js-19.0.1-corresponding-source.tar.gz")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    if args.verify:
        verify(args.output)
    elif args.source_dir:
        package(args.source_dir, args.wasm, args.output)
    else:
        parser.error("--source-dir is required when packaging")
