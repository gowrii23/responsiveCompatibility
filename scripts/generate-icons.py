"""Generate store-ready PNG icons without third-party libraries."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path


def png(width: int, height: int, pixels: list[tuple[int, int, int, int]]) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            raw.extend(pixels[y * width + x])

    return b"".join(
        [
            b"\x89PNG\r\n\x1a\n",
            chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)),
            chunk(b"IDAT", zlib.compress(bytes(raw), 9)),
            chunk(b"IEND", b""),
        ]
    )


def rounded_rect(px: int, py: int, w: int, h: int, r: int, size: int, color, out):
    r2 = r * r
    for y in range(size):
        for x in range(size):
            if x < px or y < py or x >= px + w or y >= py + h:
                continue
            dx = 0
            dy = 0
            if x < px + r and y < py + r:
                dx = px + r - x
                dy = py + r - y
            elif x >= px + w - r and y < py + r:
                dx = x - (px + w - 1 - r)
                dy = py + r - y
            elif x < px + r and y >= py + h - r:
                dx = px + r - x
                dy = y - (py + h - 1 - r)
            elif x >= px + w - r and y >= py + h - r:
                dx = x - (px + w - 1 - r)
                dy = y - (py + h - 1 - r)
            if dx * dx + dy * dy > r2 and dx and dy:
                continue
            out[y * size + x] = color


def make_icon(size: int) -> bytes:
    bg = (198, 40, 40, 255)
    white = (255, 255, 255, 255)
    pixels = [(0, 0, 0, 0)] * (size * size)
    pad = max(1, size // 16)
    rounded_rect(pad, pad, size - pad * 2, size - pad * 2, max(3, size // 6), size, bg, pixels)

    phone_w = max(4, size // 5)
    phone_h = max(8, int(size * 0.56))
    phone_x = size // 4 - phone_w // 2
    phone_y = (size - phone_h) // 2
    rounded_rect(phone_x, phone_y, phone_w, phone_h, max(1, size // 20), size, white, pixels)

    tab_w = max(8, int(size * 0.42))
    tab_h = max(6, int(size * 0.34))
    tab_x = size // 2 + size // 18
    tab_y = (size - tab_h) // 2
    rounded_rect(tab_x, tab_y, tab_w, tab_h, max(1, size // 18), size, white, pixels)
    return png(size, size, pixels)


def main() -> None:
    out = Path(__file__).resolve().parents[1] / "icons"
    out.mkdir(exist_ok=True)
    for size in (16, 32, 48, 128):
        (out / f"icon{size}.png").write_bytes(make_icon(size))


if __name__ == "__main__":
    main()
