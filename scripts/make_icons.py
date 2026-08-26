"""
One-off script: generates the Griefcase PWA icon set and OG social card
from plain geometry (no external art assets), matching the brand mark
already used inline in index.html. Run with: python3 scripts/make_icons.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(ROOT, "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

CREAM = (244, 238, 227, 255)
CHARCOAL = (42, 39, 36, 255)
CHARCOAL_LID = (53, 47, 42, 255)
ACCENT = (176, 106, 74, 255)
TRANSPARENT = (0, 0, 0, 0)


def draw_case(size, padding_ratio=0.22, bg=CREAM, transparent_bg=False):
    """Draws the briefcase glyph centered in a square canvas."""
    img = Image.new("RGBA", (size, size), TRANSPARENT if transparent_bg else bg)
    d = ImageDraw.Draw(img)

    pad = int(size * padding_ratio)
    w = size - pad * 2
    # Proportions echo the inline SVG brand mark (viewBox 24x20-ish).
    body_h = w * 0.56
    body_top = size / 2 - body_h * 0.28
    body_bottom = body_top + body_h
    body_left = pad
    body_right = size - pad
    radius = max(2, int(w * 0.06))

    # Body
    d.rounded_rectangle([body_left, body_top, body_right, body_bottom], radius=radius, fill=CHARCOAL)

    # Handle (arc) — approximate with a rounded rectangle outline
    handle_w = w * 0.34
    handle_h = w * 0.22
    handle_left = size / 2 - handle_w / 2
    handle_top = body_top - handle_h * 0.85
    stroke_w = max(2, int(w * 0.045))
    d.rounded_rectangle(
        [handle_left, handle_top, handle_left + handle_w, handle_top + handle_h],
        radius=radius * 0.7,
        outline=CHARCOAL,
        width=stroke_w,
    )

    # Latch (accent)
    latch_w = w * 0.16
    latch_h = w * 0.11
    latch_left = size / 2 - latch_w / 2
    latch_top = body_top + body_h * 0.32
    d.rounded_rectangle(
        [latch_left, latch_top, latch_left + latch_w, latch_top + latch_h],
        radius=max(1, int(latch_w * 0.2)),
        fill=ACCENT,
    )

    # Seam line
    seam_y = body_top + body_h * 0.14
    d.line([(body_left, seam_y), (body_right, seam_y)], fill=CHARCOAL_LID, width=max(1, int(w * 0.02)))

    return img


def save(img, name):
    path = os.path.join(ICONS_DIR, name)
    img.save(path, "PNG")
    print("wrote", path, img.size)


# Standard + maskable app icons
save(draw_case(192, padding_ratio=0.24), "icon-192.png")
save(draw_case(512, padding_ratio=0.24), "icon-512.png")
save(draw_case(512, padding_ratio=0.32), "icon-512-maskable.png")  # extra safe-zone padding
save(draw_case(180, padding_ratio=0.24), "apple-touch-icon.png")
save(draw_case(32, padding_ratio=0.18), "favicon-32.png")
save(draw_case(16, padding_ratio=0.14), "favicon-16.png")

# --- OG / Twitter social card (1200x630) ---
card = Image.new("RGB", (1200, 630), CREAM[:3])
d = ImageDraw.Draw(card)

glyph = draw_case(220, padding_ratio=0.12)
card.paste(glyph, (490, 90), glyph)


def load_font(paths, size):
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


serif_candidates = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
]
sans_candidates = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]

title_font = load_font(serif_candidates, 64)
sub_font = load_font(sans_candidates, 30)

title = "Griefcase"
tw = d.textlength(title, font=title_font)
d.text(((1200 - tw) / 2, 350), title, font=title_font, fill=CHARCOAL[:3])

subtitle = "Leave it here. Feel a little lighter."
sw = d.textlength(subtitle, font=sub_font)
d.text(((1200 - sw) / 2, 440), subtitle, font=sub_font, fill=(74, 69, 63))

save(card, "social-card.png")

print("Done.")
