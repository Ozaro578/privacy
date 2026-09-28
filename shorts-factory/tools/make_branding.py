#!/usr/bin/env python3
"""Profilbild (800x800) und Banner (2560x1440, Text in der YouTube-Sicherheitszone 1546x423) bauen.

  python tools/make_branding.py --profile in.png --banner in.png --name "The Mind Twist" \
      --tagline "One weird thing about your brain. Every day." --out assets/branding/mindtwist \
      --color "#FFD400" --text-color "#FFFFFF" --align left
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def cover(img: Image.Image, w: int, h: int) -> Image.Image:
    r = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)
    x, y = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def make_profile(src: Path, out: Path) -> None:
    img = cover(Image.open(src).convert("RGB"), 800, 800)
    img.save(out / "profile_800.png")
    # Rund-Vorschau, so wie YouTube es anzeigt
    mask = Image.new("L", (800, 800), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 799, 799), fill=255)
    rgba = img.convert("RGBA"); rgba.putalpha(mask)
    rgba.save(out / "profile_round_preview.png")


def make_banner(src: Path, out: Path, name: str, tagline: str, color: str, text_color: str, align: str, shadow: bool) -> None:
    W, H = 2560, 1440
    SW, SH = 1546, 423                      # Sicherheitszone (auf allen Geraeten sichtbar)
    img = cover(Image.open(src).convert("RGB"), W, H)
    sx, sy = (W - SW) // 2, (H - SH) // 2
    draw = ImageDraw.Draw(img, "RGBA")
    if shadow:  # weiche dunkle Flaeche hinter dem Text
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        pad = 60
        box = (sx - pad, sy - pad, sx + SW * 0.62 + pad, sy + SH + pad) if align == "left" else (sx - pad, sy - pad, sx + SW + pad, sy + SH + pad)
        od.rounded_rectangle(box, radius=40, fill=(0, 0, 0, 110))
        overlay = overlay.filter(ImageFilter.GaussianBlur(30))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
        draw = ImageDraw.Draw(img, "RGBA")

    max_w = SW * (0.58 if align == "left" else 0.96)   # Text bleibt links, Motiv rechts bleibt frei
    f_name = ImageFont.truetype(FONT_BOLD, 150)
    f_tag = ImageFont.truetype(FONT, 56)
    while draw.textlength(name, font=f_name) > max_w and f_name.size > 80:
        f_name = ImageFont.truetype(FONT_BOLD, f_name.size - 6)

    def wrap(text: str, font: ImageFont.FreeTypeFont) -> list[str]:
        lines, cur = [], ""
        for word in text.split():
            trial = f"{cur} {word}".strip()
            if draw.textlength(trial, font=font) <= max_w:
                cur = trial
            else:
                lines.append(cur); cur = word
        if cur:
            lines.append(cur)
        return lines

    tag_lines = wrap(tagline, f_tag) if tagline else []
    block_h = f_name.size + (30 + len(tag_lines) * (f_tag.size + 12) if tag_lines else 0)
    y_name = sy + (SH - block_h) / 2 - 10
    name_w = draw.textlength(name, font=f_name)
    x_name = sx if align == "left" else sx + (SW - name_w) / 2
    draw.text((x_name + 4, y_name + 4), name, font=f_name, fill=(0, 0, 0, 160))
    draw.text((x_name, y_name), name, font=f_name, fill=text_color)
    y = y_name + f_name.size + 30
    for ln in tag_lines:
        lw = draw.textlength(ln, font=f_tag)
        x = sx if align == "left" else sx + (SW - lw) / 2
        draw.text((x + 3, y + 3), ln, font=f_tag, fill=(0, 0, 0, 160))
        draw.text((x, y), ln, font=f_tag, fill=color)
        y += f_tag.size + 12
    draw.rectangle((x_name, y + 18, x_name + 220, y + 26), fill=color)   # Akzentlinie

    img.save(out / "banner_2560x1440.png")
    img.crop((sx, sy, sx + SW, sy + SH)).save(out / "banner_safe_area_preview.png")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", required=True)
    ap.add_argument("--banner", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--tagline", default="")
    ap.add_argument("--out", required=True)
    ap.add_argument("--color", default="#FFD400")
    ap.add_argument("--text-color", default="#FFFFFF")
    ap.add_argument("--align", choices=["left", "center"], default="left")
    ap.add_argument("--no-shadow", action="store_true")
    a = ap.parse_args()
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    make_profile(Path(a.profile), out)
    make_banner(Path(a.banner), out, a.name, a.tagline, a.color, a.text_color, a.align, not a.no_shadow)
    print(f"fertig: {out}")


if __name__ == "__main__":
    main()
