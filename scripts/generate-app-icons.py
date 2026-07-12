#!/usr/bin/env python3
"""Generate Expo mobile app icons from design/icons/sidequest-icon-master-1024.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "design" / "icons" / "sidequest-icon-master-1024.png"
OUT = ROOT / "assets" / "images"
IOS_APPICON = (
    ROOT / "ios" / "SideQuest" / "Images.xcassets" / "AppIcon.appiconset" / "App-Icon-1024x1024@1x.png"
)

# Purple sampled from master icon body
IOS_BG = (55, 18, 89)  # #371259
ANDROID_BG = IOS_BG
SPLASH_BG = IOS_BG


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode != "RGBA" and path.suffix == ".png":
        img = img.convert("RGBA")
    img.save(path, format="PNG", optimize=True)
    print(f"  {path.relative_to(ROOT)} ({img.size[0]}x{img.size[1]})")


def solid(size: int, rgb: tuple[int, int, int]) -> Image.Image:
    return Image.new("RGBA", (size, size), (*rgb, 255))


def resize(img: Image.Image, size: int) -> Image.Image:
    return ImageOps.fit(img, (size, size), method=Image.Resampling.LANCZOS)


def opaque_bbox(img: Image.Image, alpha_threshold: int = 10) -> tuple[int, int, int, int]:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > alpha_threshold:
                xs.append(x)
                ys.append(y)
    if not xs:
        return (0, 0, w, h)
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def full_bleed_button_icon(master: Image.Image) -> Image.Image:
    """Scale the raised button artwork to the canvas edges so iOS shows a full button."""
    rgba = master.convert("RGBA")
    bbox = opaque_bbox(rgba)
    button = rgba.crop(bbox)
    return resize(button, 1024)


def ios_icon(master: Image.Image) -> Image.Image:
    """Opaque full-bleed icon — no transparent corners for iOS home screen."""
    bleed = full_bleed_button_icon(master)
    canvas = Image.new("RGBA", bleed.size, (*IOS_BG, 255))
    return Image.alpha_composite(canvas, bleed).convert("RGB")


def monochrome_from_icon(icon: Image.Image) -> Image.Image:
    """White glyph on transparent for Android themed icon."""
    rgba = icon.convert("RGBA")
    out = Image.new("RGBA", rgba.size)
    src = rgba.load()
    dst = out.load()
    for y in range(rgba.size[1]):
        for x in range(rgba.size[0]):
            r, g, b, a = src[x, y]
            if a < 16:
                dst[x, y] = (0, 0, 0, 0)
                continue
            lum = int(0.299 * r + 0.587 * g + 0.114 * b)
            if lum > 180:
                dst[x, y] = (255, 255, 255, min(255, lum))
            else:
                dst[x, y] = (0, 0, 0, 0)
    return out


def main() -> None:
    if not MASTER.exists():
        raise SystemExit(f"Master icon missing: {MASTER}")

    master = Image.open(MASTER).convert("RGBA")
    if master.size != (1024, 1024):
        master = resize(master, 1024)

    print("Generating app icons from", MASTER.relative_to(ROOT))

    full_bleed = full_bleed_button_icon(master)
    ios = ios_icon(master)

    # iOS + universal Expo icon — edge-to-edge raised button on opaque purple
    save(ios, OUT / "icon.png")

    # Android adaptive — same full-bleed artwork; solid brand purple background
    save(full_bleed, OUT / "android-icon-foreground.png")
    save(solid(1024, ANDROID_BG), OUT / "android-icon-background.png")
    save(monochrome_from_icon(ios), OUT / "android-icon-monochrome.png")

    # Web favicon
    save(resize(full_bleed, 48), OUT / "favicon.png")

    # Splash — icon centered; expo-splash uses contain on dark background
    save(resize(full_bleed, 288), OUT / "splash-icon.png")

    # Native iOS asset catalog (Expo prebuild may overwrite; keep in sync after generate)
    save(ios, IOS_APPICON)

    print("Done.")


if __name__ == "__main__":
    main()
