"""Recover the exact embedded build input; never accept a filename hash alone.

SPDX-License-Identifier: GPL-3.0-or-later
This source-package helper does not license the Marcus application.
"""

import argparse
import hashlib
from pathlib import Path

WASM_SHA256 = "ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de"
NETWORK_SHA256 = "61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b"
NETWORK_OFFSET = 39600
NETWORK_SIZE = 1166381


def read_leb(data, pos, signed=False):
    result = shift = 0
    while True:
        byte = data[pos]
        pos += 1
        result |= (byte & 127) << shift
        shift += 7
        if shift > 35:
            raise ValueError("Invalid 32-bit LEB128")
        if not byte & 128:
            break
    if signed and byte & 64:
        result -= 1 << shift
    return result, pos


def recover_network(wasm):
    if hashlib.sha256(wasm).hexdigest() != WASM_SHA256:
        raise ValueError("WASM does not match the pinned upstream release")
    if wasm[:8] != b"\0asm\x01\0\0\0":
        raise ValueError("Invalid WASM header")
    pos = 8
    segments = []
    while pos < len(wasm):
        section = wasm[pos]
        length, cursor = read_leb(wasm, pos + 1)
        end = cursor + length
        if section == 11:
            count, cursor = read_leb(wasm, cursor)
            for _ in range(count):
                flags, cursor = read_leb(wasm, cursor)
                if flags not in (0, 2):
                    raise ValueError("Expected an active data segment")
                if flags == 2:
                    memory, cursor = read_leb(wasm, cursor)
                    if memory != 0:
                        raise ValueError("Unexpected memory index")
                if wasm[cursor] != 0x41:
                    raise ValueError("Expected i32.const data offset")
                offset, cursor = read_leb(wasm, cursor + 1, True)
                if wasm[cursor] != 0x0B:
                    raise ValueError("Unterminated offset expression")
                size, cursor = read_leb(wasm, cursor + 1)
                if offset < 0 or offset + size > 134217728:
                    raise ValueError("Data segment outside expected memory")
                segments.append((offset, wasm[cursor:cursor + size]))
                cursor += size
            if cursor != end:
                raise ValueError("Data section length mismatch")
        pos = end
    memory = bytearray(max(offset + len(data) for offset, data in segments))
    for offset, data in segments:
        memory[offset:offset + len(data)] = data
    network = bytes(memory[NETWORK_OFFSET:NETWORK_OFFSET + NETWORK_SIZE])
    if hashlib.sha256(network).hexdigest() != NETWORK_SHA256:
        raise ValueError("Recovered NNUE input failed its full SHA-256 check")
    return network


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("wasm", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    network = recover_network(args.wasm.read_bytes())
    args.output.write_bytes(network)
    print(f"{NETWORK_SHA256}  {args.output.name} ({len(network)} bytes)")
