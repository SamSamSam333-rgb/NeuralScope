"""Builds a synthetic training set of letters and digits in YOLO format.

Every image gets 1-6 characters drawn with random fonts, sizes, colours, rotations, backgrounds,
blur and noise. The boxes are computed from the drawn pixels, so the labels are exact.
Classes: 0-9, A-Z, a-z (62). Usage:  python tools/make_letters_dataset.py --n 6000
"""
from __future__ import annotations

import argparse
import glob
import math
import os
import random
import string
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CLASSES = list(string.digits + string.ascii_uppercase + string.ascii_lowercase)
SKIP = ("symbol", "wingding", "webding", "marlett", "emoji", "dingbat", "holo", "bssym", "mtextra", "ocr", "script", "segmdl", "icon")


def find_fonts() -> list[str]:
    dirs = []
    if sys.platform.startswith("win"):
        dirs = [os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")]
    elif sys.platform == "darwin":
        dirs = ["/System/Library/Fonts", "/Library/Fonts", os.path.expanduser("~/Library/Fonts")]
    else:
        dirs = ["/usr/share/fonts", os.path.expanduser("~/.fonts")]
    out = []
    for d in dirs:
        for ext in ("ttf", "otf"):
            out += glob.glob(os.path.join(d, "**", f"*.{ext}"), recursive=True)
    return [f for f in out if not any(s in os.path.basename(f).lower() for s in SKIP)]


def usable(path: str) -> bool:
    """A font is usable if it can draw every class (some fonts miss glyphs)."""
    try:
        f = ImageFont.truetype(path, 64)
        for ch in "AVag09":
            if f.getmask(ch).getbbox() is None:
                return False
        return True
    except Exception:
        return False


def background(size: int, rng: random.Random) -> Image.Image:
    kind = rng.choice(["solid", "gradient", "noise", "stripes"])
    base = np.array([rng.randint(0, 255) for _ in range(3)], dtype=np.float32)
    if kind == "solid":
        arr = np.tile(base, (size, size, 1))
    elif kind == "gradient":
        other = np.array([rng.randint(0, 255) for _ in range(3)], dtype=np.float32)
        t = np.linspace(0, 1, size, dtype=np.float32)[:, None, None]
        arr = base * (1 - t) + other * t
        arr = np.repeat(arr, size, axis=1)
        if rng.random() < 0.5:
            arr = arr.transpose(1, 0, 2)
    elif kind == "noise":
        arr = base + np.random.default_rng(rng.randint(0, 10**9)).normal(0, 30, (size, size, 3))
    else:
        arr = np.tile(base, (size, size, 1))
        step = rng.randint(8, 40)
        for y in range(0, size, step * 2):
            arr[y:y + step] = np.clip(arr[y:y + step] + rng.randint(-50, 50), 0, 255)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def contrast_colour(bg: np.ndarray, rng: random.Random) -> tuple:
    lum = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]
    for _ in range(30):
        c = tuple(rng.randint(0, 255) for _ in range(3))
        if abs((0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) - lum) > 90:
            return c
    return (255, 255, 255) if lum < 128 else (0, 0, 0)


def make_image(size: int, fonts: list[str], rng: random.Random):
    img = background(size, rng).convert("RGBA")
    labels, placed = [], []
    for _ in range(rng.randint(1, 6)):
        for _try in range(15):
            cls = rng.randrange(len(CLASSES))
            px = rng.randint(max(28, size // 10), size // 3)
            font = ImageFont.truetype(rng.choice(fonts), px)
            mask = font.getmask(CLASSES[cls])
            if mask.getbbox() is None:
                continue
            glyph = Image.new("L", (px * 2, px * 2), 0)
            ImageDraw.Draw(glyph).text((px // 2, px // 4), CLASSES[cls], font=font, fill=255)
            glyph = glyph.rotate(rng.uniform(-25, 25), resample=Image.BICUBIC, expand=True)
            bb = glyph.getbbox()
            if bb is None:
                continue
            glyph = glyph.crop(bb)
            gw, gh = glyph.size
            if gw >= size - 4 or gh >= size - 4 or gw < 8 or gh < 8:
                continue
            x, y = rng.randint(0, size - gw), rng.randint(0, size - gh)
            box = (x, y, x + gw, y + gh)
            if any(not (box[2] < p[0] - 3 or box[0] > p[2] + 3 or box[3] < p[1] - 3 or box[1] > p[3] + 3) for p in placed):
                continue
            region = np.array(img.crop(box).convert("RGB")).reshape(-1, 3).mean(0)
            col = contrast_colour(region, rng)
            img.paste(Image.new("RGBA", (gw, gh), col + (255,)), (x, y), glyph)
            placed.append(box)
            labels.append((cls, (x + gw / 2) / size, (y + gh / 2) / size, gw / size, gh / size))
            break
    img = img.convert("RGB")
    if rng.random() < 0.5:
        img = img.filter(ImageFilter.GaussianBlur(rng.uniform(0.3, 1.6)))
    if rng.random() < 0.5:
        a = np.array(img).astype(np.float32) + np.random.default_rng(rng.randint(0, 10**9)).normal(0, rng.uniform(3, 14), (size, size, 3))
        img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    return img, labels


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=6000)
    ap.add_argument("--size", type=int, default=640)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "datasets", "letters"))
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    rng = random.Random(a.seed)
    np.random.seed(a.seed)
    fonts = [f for f in find_fonts() if usable(f)]
    if not fonts:
        sys.exit("No usable fonts found on this computer.")
    print(f"{len(fonts)} usable fonts found")
    out = os.path.abspath(a.out)
    for split in ("train", "val"):
        os.makedirs(os.path.join(out, "images", split), exist_ok=True)
        os.makedirs(os.path.join(out, "labels", split), exist_ok=True)
    nval = max(1, a.n // 10)
    for i in range(a.n):
        split = "val" if i < nval else "train"
        img, labels = make_image(a.size, fonts, rng)
        name = f"{i:06d}"
        img.save(os.path.join(out, "images", split, name + ".jpg"), quality=92)
        with open(os.path.join(out, "labels", split, name + ".txt"), "w") as f:
            f.write("".join(f"{c} {x:.6f} {y:.6f} {w:.6f} {h:.6f}\n" for c, x, y, w, h in labels))
        if (i + 1) % 500 == 0:
            print(f"{i + 1}/{a.n} images")
    with open(os.path.join(out, "letters.yaml"), "w") as f:
        f.write(f"path: {out.replace(os.sep, '/')}\ntrain: images/train\nval: images/val\nnames:\n")
        f.writelines(f"  {i}: '{c}'\n" for i, c in enumerate(CLASSES))
    print("Dataset ready:", out)


if __name__ == "__main__":
    main()
