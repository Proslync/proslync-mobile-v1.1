"""
Brand asset generator for ProSlync.

Source:   ../proslync-logo-1024.png  (1024x1024, near-black background)
Output:   ./<category>/proslync-*.png

Re-run any time the master changes:
    python3 assets/images/brand/_generate.py
"""

from pathlib import Path
from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageChops
import math
import random

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "proslync-logo-1024.png"

BRAND_COPPER = (235, 98, 26)          # #EB621A
BRAND_COPPER_LIGHT = (240, 133, 77)   # #F0854D
BRAND_COPPER_DARK = (196, 78, 16)     # #C44E10
BRAND_INK = (10, 9, 9)                # near-black source bg
BRAND_PAPER = (250, 247, 242)         # warm off-white
BRAND_BONE = (235, 230, 222)          # darker paper

SIZES = [16, 32, 64, 128, 256, 512, 1024]


def load_master() -> Image.Image:
    img = Image.open(SRC).convert("RGBA")
    assert img.size == (1024, 1024), f"unexpected master size {img.size}"
    return img


def luminance_mask(rgba: Image.Image, threshold: int = 28) -> Image.Image:
    """Return an L-mode mask where the foreground mark is white and the
    near-black background is black. Soft transition for anti-aliased edges."""
    gray = rgba.convert("L")
    # Anything brighter than `threshold` is foreground; sub-threshold gets
    # ramped down smoothly so edges keep their anti-aliasing.
    lut = []
    for v in range(256):
        if v <= threshold:
            lut.append(0)
        elif v <= threshold + 16:
            lut.append(int((v - threshold) / 16 * 255))
        else:
            lut.append(255)
    return gray.point(lut, mode="L")


def cut_background(rgba: Image.Image) -> Image.Image:
    """Replace the dark background with full transparency, keeping the
    original (color, alpha) of the mark itself."""
    mask = luminance_mask(rgba)
    out = rgba.copy()
    r, g, b, a = out.split()
    # Multiply original alpha by the luminance mask so source alpha edges
    # (vignette) still fade out gracefully.
    new_alpha = ImageChops.multiply(a, mask)
    out.putalpha(new_alpha)
    return out


def tight_bbox(mark_rgba: Image.Image, alpha_threshold: int = 8) -> tuple[int, int, int, int]:
    a = mark_rgba.split()[-1]
    # Threshold the alpha to ignore faint halo when measuring extent.
    bw = a.point(lambda v: 255 if v > alpha_threshold else 0, mode="L")
    bbox = bw.getbbox()
    return bbox or (0, 0, mark_rgba.size[0], mark_rgba.size[1])


def centered_on(bg_color, mark: Image.Image, size: int, pad_ratio: float = 0.18) -> Image.Image:
    """Paste the tight-cropped mark, scaled, into a square of bg_color."""
    bbox = tight_bbox(mark)
    cropped = mark.crop(bbox)
    target = int(size * (1 - pad_ratio * 2))
    w, h = cropped.size
    scale = target / max(w, h)
    cropped = cropped.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    bg = Image.new("RGBA", (size, size), bg_color + (255,) if len(bg_color) == 3 else bg_color)
    x = (size - cropped.size[0]) // 2
    y = (size - cropped.size[1]) // 2
    bg.alpha_composite(cropped, (x, y))
    return bg


def rounded_square(image: Image.Image, radius_ratio: float = 0.22) -> Image.Image:
    """Apply an iOS-style rounded mask to a square RGBA image."""
    w, h = image.size
    r = int(min(w, h) * radius_ratio)
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, w - 1, h - 1), radius=r, fill=255)
    out = image.copy()
    out.putalpha(ImageChops.multiply(out.split()[-1], mask))
    return out


def circle_mask(image: Image.Image) -> Image.Image:
    w, h = image.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, w - 1, h - 1), fill=255)
    out = image.copy()
    out.putalpha(ImageChops.multiply(out.split()[-1], mask))
    return out


def mono(mark_transparent: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    """Replace all mark pixels with a single color, preserving alpha."""
    a = mark_transparent.split()[-1]
    fill = Image.new("RGBA", mark_transparent.size, color + (255,))
    fill.putalpha(a)
    return fill


def gradient_fill(mark_transparent: Image.Image, top: tuple, bottom: tuple) -> Image.Image:
    """Fill the mark with a vertical top→bottom gradient."""
    w, h = mark_transparent.size
    grad = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        c = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        grad.putpixel((0, y), c)
    grad = grad.resize((w, h))
    out = Image.new("RGBA", (w, h))
    out.paste(grad, mask=mark_transparent.split()[-1])
    return out


def glow(mark_transparent: Image.Image, color: tuple[int, int, int], radius: int = 60, intensity: float = 1.6) -> Image.Image:
    """Render the mark with an outer glow halo on a transparent canvas."""
    w, h = mark_transparent.size
    a = mark_transparent.split()[-1]
    halo = Image.new("RGBA", (w, h), color + (0,))
    halo.putalpha(a.filter(ImageFilter.GaussianBlur(radius)))
    # Intensify
    ha = halo.split()[-1].point(lambda v: min(255, int(v * intensity)))
    halo.putalpha(ha)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.alpha_composite(halo)
    out.alpha_composite(halo)  # double for stronger bloom
    out.alpha_composite(mark_transparent)
    return out


def emboss(mark_on_dark: Image.Image) -> Image.Image:
    """Subtle embossed depth treatment on the dark-bg version."""
    rgb = mark_on_dark.convert("RGB")
    em = rgb.filter(ImageFilter.EMBOSS)
    # Blend so the mark still reads as orange/grey, with light highlights.
    base = rgb
    out = Image.blend(base, em.convert("RGB"), 0.35)
    return out.convert("RGBA")


def metallic(mark_transparent: Image.Image) -> Image.Image:
    """Vertical brushed-silver gradient fill with subtle highlight band."""
    w, h = mark_transparent.size
    # Luminance ramp: bright highlight band at ~30%, mid at top, shadow at bottom.
    ramp = Image.new("L", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        base = 140 + int(60 * math.cos(t * math.pi))  # 200 -> 80
        highlight = int(70 * math.exp(-((t - 0.30) ** 2) / 0.015))
        ramp.putpixel((0, y), max(0, min(255, base + highlight)))
    ramp = ramp.resize((w, h))
    # Slightly warm-silver tint
    silver = Image.merge("RGB", (
        ramp,
        ramp.point(lambda v: max(0, v - 4)),
        ramp.point(lambda v: max(0, v - 12)),
    ))
    # Horizontal brushing: low-amplitude noise blended at 20%
    noise = Image.effect_noise((w, h), 12).filter(
        ImageFilter.GaussianBlur(radius=0.6))
    brushed = Image.blend(silver, Image.merge("RGB", (noise, noise, noise)), 0.18)
    out = Image.new("RGBA", (w, h))
    out.paste(brushed, mask=mark_transparent.split()[-1])
    return out


def add_grain(image: Image.Image, amount: int = 14) -> Image.Image:
    w, h = image.size
    noise = Image.effect_noise((w, h), amount).convert("RGB")
    rgb = image.convert("RGB")
    blended = ImageChops.add(rgb, noise, scale=2, offset=-amount // 2)
    out = Image.new("RGBA", (w, h))
    out.paste(blended, mask=image.split()[-1])
    return out


def glitch(mark_transparent: Image.Image, offset_px: int = 10) -> Image.Image:
    """Chromatic-aberration glitch: shift R / G / B channels independently.

    Where all three channels overlap the result is white; where only one or
    two cover the pixel a colored fringe appears.
    """
    size = mark_transparent.size
    mask = mark_transparent.split()[-1]
    zero = Image.new("L", size, 0)

    def shifted(channel_index: int, dx: int, dy: int = 0) -> Image.Image:
        """Return an RGBA where only one channel carries the (shifted) mask."""
        ch = Image.new("L", size, 0)
        ch.paste(mask, (dx, dy))
        layers = [zero, zero, zero]
        layers[channel_index] = ch
        return Image.merge("RGBA", (*layers, ch))

    red = shifted(0, -offset_px, 0)
    grn = shifted(1, 0, 0)
    blu = shifted(2, offset_px, 0)
    # Additive blend: sum RGB, max() alpha so coverage is the union.
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    for layer in (red, grn, blu):
        out_rgb = ImageChops.add(out.convert("RGB"), layer.convert("RGB"))
        out_a = ImageChops.lighter(out.split()[-1], layer.split()[-1])
        r2, g2, b2 = out_rgb.split()
        out = Image.merge("RGBA", (r2, g2, b2, out_a))
    return out


def watermark(mark_transparent: Image.Image, color: tuple, opacity: float) -> Image.Image:
    """Single-color flat mark at low opacity, for screen watermarks."""
    flat = mono(mark_transparent, color)
    r, g, b, a = flat.split()
    a = a.point(lambda v: int(v * opacity))
    out = Image.merge("RGBA", (r, g, b, a))
    return out


def pattern_tile(mark_transparent: Image.Image, tile: int = 256, mark_px: int = 96,
                 color: tuple = (255, 255, 255), opacity: float = 0.04) -> Image.Image:
    """Repeating-mark tile suitable for CSS / RN background pattern."""
    bbox = tight_bbox(mark_transparent)
    small = mark_transparent.crop(bbox).resize((mark_px, mark_px), Image.LANCZOS)
    small = watermark(small, color, opacity * 4)  # opacity tuned for tile
    canvas = Image.new("RGBA", (tile, tile), (0, 0, 0, 0))
    # offset rows for nicer rhythm
    for row, ox in enumerate([0, tile // 2]):
        y = row * (tile // 2) - mark_px // 2
        for x in range(-mark_px, tile + mark_px, tile // 2):
            canvas.alpha_composite(small, (x + ox, y + tile // 4))
    # final opacity polish
    r, g, b, a = canvas.split()
    a = a.point(lambda v: int(v * opacity * 4))
    return Image.merge("RGBA", (r, g, b, a))


def save(img: Image.Image, rel: str) -> Path:
    p = HERE / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    img.save(p, optimize=True)
    return p


def make_sizes(src: Image.Image, name_pattern: str, subdir: str = "sized"):
    for s in SIZES:
        out = src.resize((s, s), Image.LANCZOS)
        save(out, f"{subdir}/{name_pattern.format(size=s)}")


def main():
    master = load_master()              # 1024 black-bg PNG
    transparent_full = cut_background(master)  # 1024 mark on transparent

    # --- 1. Transparent / cutout ---
    for s in SIZES:
        save(transparent_full.resize((s, s), Image.LANCZOS),
             f"transparent/proslync-mark-{s}.png")

    # tight-cropped mark (no padding) at 1024 for hero / overlay use
    tight = transparent_full.crop(tight_bbox(transparent_full))
    save(tight, "transparent/proslync-mark-tight-1024.png")

    # --- 2. Solid-bg padded variants (square cards) ---
    for s in SIZES:
        if s >= 64:
            save(centered_on(BRAND_PAPER, transparent_full, s),
                 f"light/proslync-light-{s}.png")
            save(centered_on(BRAND_BONE, transparent_full, s, pad_ratio=0.16),
                 f"light/proslync-bone-{s}.png")

    # --- 3. Rounded square (iOS-style) ---
    for s, name in [(1024, "1024"), (512, "512"), (180, "ios-180"), (120, "ios-120")]:
        dark_card = centered_on(BRAND_INK, transparent_full, s, pad_ratio=0.16)
        save(rounded_square(dark_card), f"rounded/proslync-rounded-dark-{name}.png")
        light_card = centered_on(BRAND_PAPER, transparent_full, s, pad_ratio=0.16)
        save(rounded_square(light_card), f"rounded/proslync-rounded-light-{name}.png")
        copper_card = centered_on(BRAND_COPPER, mono(transparent_full, (255, 255, 255)), s, pad_ratio=0.18)
        save(rounded_square(copper_card), f"rounded/proslync-rounded-copper-{name}.png")

    # --- 4. Circle badge ---
    for s in (256, 512, 1024):
        dark_card = centered_on(BRAND_INK, transparent_full, s, pad_ratio=0.18)
        save(circle_mask(dark_card), f"circle/proslync-circle-dark-{s}.png")
        copper_card = centered_on(BRAND_COPPER, mono(transparent_full, (255, 255, 255)), s, pad_ratio=0.18)
        save(circle_mask(copper_card), f"circle/proslync-circle-copper-{s}.png")
        light_card = centered_on(BRAND_PAPER, transparent_full, s, pad_ratio=0.18)
        save(circle_mask(light_card), f"circle/proslync-circle-light-{s}.png")

    # --- 5. Mono recolors (transparent bg, single color) ---
    mono_palette = {
        "white":  (255, 255, 255),
        "black":  (0, 0, 0),
        "copper": BRAND_COPPER,
        "copper-light": BRAND_COPPER_LIGHT,
        "copper-dark":  BRAND_COPPER_DARK,
        "ink":    BRAND_INK,
        "ash":    (95, 93, 91),
    }
    for label, color in mono_palette.items():
        m = mono(transparent_full, color)
        for s in (128, 256, 512, 1024):
            save(m.resize((s, s), Image.LANCZOS),
                 f"mono/proslync-mono-{label}-{s}.png")

    # --- 6. Effects ---
    # 6a. Outer copper glow on transparent (splash / hero)
    glowed = glow(transparent_full, BRAND_COPPER, radius=70, intensity=1.4)
    save(glowed, "effects/proslync-glow-copper-1024.png")
    save(glowed.resize((512, 512), Image.LANCZOS), "effects/proslync-glow-copper-512.png")
    glowed_w = glow(mono(transparent_full, (255, 255, 255)), (255, 255, 255), radius=70, intensity=1.2)
    save(glowed_w, "effects/proslync-glow-white-1024.png")

    # 6b. Embossed depth on dark
    save(emboss(master), "effects/proslync-emboss-1024.png")

    # 6c. Metallic silver fill on transparent
    save(metallic(transparent_full), "effects/proslync-metallic-1024.png")

    # 6d. Fire gradient fill (copper-light -> copper-dark)
    fire = gradient_fill(transparent_full, BRAND_COPPER_LIGHT, BRAND_COPPER_DARK)
    save(fire, "effects/proslync-gradient-fire-1024.png")
    sunset = gradient_fill(transparent_full, (255, 196, 96), BRAND_COPPER)
    save(sunset, "effects/proslync-gradient-sunset-1024.png")
    steel = gradient_fill(transparent_full, (210, 215, 220), (60, 64, 72))
    save(steel, "effects/proslync-gradient-steel-1024.png")
    night = gradient_fill(transparent_full, (40, 44, 52), (10, 11, 14))
    save(night, "effects/proslync-gradient-night-1024.png")

    # 6e. Film grain on dark bg (subtle texture for hero card)
    save(add_grain(master, amount=18), "effects/proslync-grain-1024.png")

    # 6f. Chromatic-aberration glitch (dev / debug branding)
    save(glitch(transparent_full, offset_px=10), "effects/proslync-glitch-1024.png")

    # --- 7. Watermark (low-alpha mark for backgrounds) ---
    save(watermark(transparent_full, (255, 255, 255), 0.08),
         "watermark/proslync-watermark-light-1024.png")
    save(watermark(transparent_full, (0, 0, 0), 0.06),
         "watermark/proslync-watermark-dark-1024.png")
    save(watermark(transparent_full, BRAND_COPPER, 0.10),
         "watermark/proslync-watermark-copper-1024.png")

    # --- 8. Pattern tile for repeating backgrounds ---
    save(pattern_tile(transparent_full, tile=256, mark_px=72,
                      color=(255, 255, 255), opacity=0.05),
         "pattern/proslync-pattern-tile-256.png")
    save(pattern_tile(transparent_full, tile=512, mark_px=120,
                      color=BRAND_COPPER, opacity=0.07),
         "pattern/proslync-pattern-tile-copper-512.png")

    print("done.")


if __name__ == "__main__":
    main()
