"""Builds Joe's social media kit (Facebook posts/cover, stickers, business cards) from the pose cut-outs."""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
POSES = os.path.join(HERE, "..", "..", "..", "public", "joe")
FONTS = os.path.join(HERE, "fonts")
OUT = os.path.join(HERE, "..")

INK = (10, 9, 8)
RED = (227, 18, 27)
HOT = (255, 59, 63)
WHITE = (244, 244, 242)
MUTED = (170, 164, 158)
AMBER = (255, 176, 32)

SHOP = {
    "name": "Joe's Auto Garage",
    "phone": "(406) 577-6663",
    "street": "2810 N Cooke St",
    "city": "Helena, MT 59601",
    "email": "joesautogarage406@gmail.com",
    "web": "joes-garage-self.vercel.app",
    "hours": [("MON – FRI", "8 AM – 5 PM"), ("SAT – SUN", "Closed")],
    "badge": "ASE MASTER CERTIFIED",
}


def font(kind, size):
    if kind == "mega":
        f = ImageFont.truetype(f"{FONTS}/BigShoulders.ttf", size)
        f.set_variation_by_name("Black")
    elif kind == "italic":
        f = ImageFont.truetype(f"{FONTS}/Kanit-BlackItalic.ttf", size)
    elif kind == "bold":
        f = ImageFont.truetype(f"{FONTS}/Jakarta.ttf", size)
        f.set_variation_by_name("ExtraBold")
    else:
        f = ImageFont.truetype(f"{FONTS}/Jakarta.ttf", size)
        f.set_variation_by_name("Medium")
    return f


def fit(kind, text, width, start):
    size = start
    while size > 8 and font(kind, size).getlength(text) > width:
        size -= 2
    return font(kind, size)


def pose(name, height):
    fn = "joe.webp" if name == "base" else f"joe-{name}.webp"
    im = Image.open(f"{POSES}/{fn}").convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 30 else 0).getbbox())
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def rim(im, color=(255, 255, 255), radius=3, alpha=150):
    """Soft light outline so the navy shirt reads on black."""
    a = im.getchannel("A").filter(ImageFilter.MaxFilter(radius * 2 + 1)).filter(ImageFilter.GaussianBlur(radius))
    glow = Image.new("RGBA", im.size, color + (0,))
    glow.putalpha(a.point(lambda v: v * alpha // 255))
    glow.alpha_composite(im)
    return glow


def backdrop(w, h, glow_at=(0.72, 0.55), glow_r=0.55):
    bg = Image.new("RGBA", (w, h), INK + (255,))
    g = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(g)
    cx, cy, r = w * glow_at[0], h * glow_at[1], max(w, h) * glow_r
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=120)
    g = g.filter(ImageFilter.GaussianBlur(r * 0.45))
    red = Image.new("RGBA", (w, h), RED + (0,))
    red.putalpha(g)
    bg.alpha_composite(red)
    # faint diagonal hatch, like the site's section backgrounds
    hatch = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hatch)
    for x in range(-h, w, 26):
        hd.line([(x, h), (x + h, 0)], fill=(255, 255, 255, 7), width=2)
    bg.alpha_composite(hatch)
    return bg


def text(img, xy, s, f, fill, anchor="la", glow=None):
    if glow:
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).text(xy, s, font=f, fill=glow + (190,), anchor=anchor)
        img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(f.size * 0.08)))
    ImageDraw.Draw(img).text(xy, s, font=f, fill=fill, anchor=anchor)


def place(img, im, x, bottom):
    img.alpha_composite(rim(im), (round(x), round(bottom - im.height)))


def badge(img, x, y, s, size):
    f = font("bold", size)
    w = f.getlength(s)
    d = ImageDraw.Draw(img)
    pad = size * 0.8
    d.rounded_rectangle((x, y, x + w + pad * 2 + size, y + size * 2.1), radius=size * 1.05, outline=RED + (255,), width=max(2, size // 8), fill=(20, 8, 8, 255))
    d.ellipse((x + pad, y + size * 0.8, x + pad + size * 0.5, y + size * 1.3), fill=HOT)
    d.text((x + pad + size, y + size * 1.05), s, font=f, fill=HOT, anchor="lm")


def save(img, name, dpi=None):
    os.makedirs(os.path.dirname(f"{OUT}/{name}"), exist_ok=True)
    img = img.convert("RGB") if not name.startswith("stickers/") else img
    img.save(f"{OUT}/{name}", dpi=(dpi, dpi) if dpi else None, optimize=True)
    print(name, img.size)


def post(name, joe, kicker, lines, sub):
    """1080x1080 Facebook / Instagram feed post."""
    W = H = 1080
    img = backdrop(W, H, (0.74, 0.6))
    j = pose(joe, 930)
    place(img, j, W - j.width - 10 + (60 if j.width > 520 else 0), H - 40)
    x, y = 70, 90
    badge(img, x, y, kicker, 28)
    y += 110
    for i, line in enumerate(lines):
        f = fit("mega", line, 600, 190)
        text(img, (x, y), line, f, (RED if i == len(lines) - 1 else WHITE), glow=RED if i == len(lines) - 1 else None)
        y += f.size * 0.92
    y += 30
    for s in sub:
        text(img, (x, y), s, font("body", 40), MUTED)
        y += 56
    # footer bar
    d = ImageDraw.Draw(img)
    d.rectangle((0, H - 120, W, H), fill=(0, 0, 0, 210))
    text(img, (70, H - 60), SHOP["name"].upper(), font("italic", 46), WHITE, "lm")
    text(img, (W - 60, H - 60), SHOP["phone"], font("bold", 44), HOT, "rm")
    save(img, f"facebook/{name}.png")


def cover():
    """Facebook cover: 1640x624 (shows ~1640x624 on desktop, centre ~1640x360 crop on mobile)."""
    W, H = 1640, 624
    img = backdrop(W, H, (0.2, 0.5), 0.45)
    j = pose("point", 580)
    place(img, j, 230, H - 10)
    x = 800
    text(img, (x, 120), "JOE'S", fit("italic", "JOE'S", 520, 150), RED, glow=RED)
    text(img, (x, 255), "AUTO GARAGE", fit("italic", "AUTO GARAGE", 640, 120), WHITE)
    text(img, (x + 4, 385), "Honest auto repair, done right the first time.", font("body", 34), MUTED)
    badge(img, x, 440, SHOP["badge"] + "  ·  HELENA, MONTANA", 20)
    text(img, (x, 530), SHOP["phone"], font("bold", 44), HOT, "lm")
    text(img, (x, 580), SHOP["street"] + ", " + SHOP["city"], font("body", 28), WHITE, "lm")
    save(img, "facebook/facebook-cover.png")


def sticker(name, joe):
    """Die-cut sticker: thick white border, transparent background, 1200px tall (4in at 300dpi)."""
    j = pose(joe, 1100)
    pad = 60
    canvas = Image.new("RGBA", (j.width + pad * 2, j.height + pad * 2), (0, 0, 0, 0))
    canvas.alpha_composite(j, (pad, pad))
    a = canvas.getchannel("A").point(lambda v: 255 if v > 60 else 0)
    border = a.filter(ImageFilter.MaxFilter(45)).filter(ImageFilter.GaussianBlur(3)).point(lambda v: 255 if v > 128 else 0)
    shadow = border.filter(ImageFilter.GaussianBlur(10)).point(lambda v: v * 70 // 255)
    out = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh.putalpha(shadow)
    out.alpha_composite(sh, (0, 6))
    white = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    white.putalpha(border)
    out.alpha_composite(white)
    out.alpha_composite(canvas)
    out = out.crop(out.getchannel("A").getbbox())
    save(out, f"stickers/sticker-{name}.png", 300)
    return out


def sticker_sheet(stickers):
    """US Letter (8.5x11in @300dpi) sheet of all stickers, for home or print-shop printing."""
    W, H = 2550, 3300
    sheet = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    cols, rows = 3, 2
    cw, ch = W // cols, (H - 300) // rows
    for i, s in enumerate(stickers):
        s = s.copy()
        s.thumbnail((cw - 120, ch - 120), Image.LANCZOS)
        cx, cy = (i % cols) * cw + cw // 2, 150 + (i // cols) * ch + ch // 2
        sheet.alpha_composite(s, (cx - s.width // 2, cy - s.height // 2))
    save(sheet, "stickers/sticker-sheet-letter.png", 300)
    sheet.convert("RGB").save(f"{OUT}/stickers/sticker-sheet-letter.pdf", resolution=300)


def card_front():
    """3.5x2in + 1/8in bleed @300dpi = 1125x675. Keep text inside the 0.25in safe area."""
    W, H = 1125, 675
    img = backdrop(W, H, (0.8, 0.55), 0.5)
    j = pose("cap", 620)
    j = j.crop((0, 0, j.width, round(j.height * 0.78)))
    img.alpha_composite(rim(j), (W - j.width - 40, H - j.height))
    x = 112
    text(img, (x, 150), "JOE'S", fit("italic", "JOE'S", 430, 150), RED, glow=RED)
    text(img, (x, 290), "AUTO GARAGE", fit("italic", "AUTO GARAGE", 470, 90), WHITE)
    text(img, (x + 2, 410), "Honest auto repair,", font("body", 30), MUTED)
    text(img, (x + 2, 450), "done right the first time.", font("body", 30), MUTED)
    badge(img, x, 510, SHOP["badge"], 16)
    return img


def card_back():
    W, H = 1125, 675
    img = Image.new("RGBA", (W, H), INK + (255,))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 26, H), fill=RED)
    x = 112
    text(img, (x, 110), "CALL OR TEXT", font("bold", 24), HOT)
    text(img, (x, 150), SHOP["phone"], fit("mega", SHOP["phone"], 620, 120), WHITE)
    y = 300
    for s in (SHOP["street"], SHOP["city"], SHOP["email"], SHOP["web"]):
        text(img, (x, y), s, font("body", 30), WHITE if s != SHOP["web"] else HOT)
        y += 46
    hx = 760
    text(img, (hx, 300), "HOURS", font("bold", 24), HOT)
    for i, (days, hrs) in enumerate(SHOP["hours"]):
        text(img, (hx, 340 + i * 80), days, font("bold", 26), WHITE)
        text(img, (hx, 374 + i * 80), hrs, font("body", 26), MUTED)
    text(img, (W - 112, 588), "JOE'S AUTO GARAGE", font("italic", 30), RED, "rd")
    return img


if __name__ == "__main__":
    post("post-honest-repair", "thumb", "HELENA, MONTANA", ["HONEST", "REPAIR."], ["Done right the first time.", "ASE Master Certified."])
    post("post-squeal", "ears", "WHAT'S THAT NOISE?", ["HEAR A", "SQUEAL?"], ["Brakes shouldn't sing.", "Bring it to Joe."])
    post("post-brakes", "rotor", "BRAKE REPAIR", ["BRAKES", "FEEL OFF?"], ["Pads, rotors, calipers.", "Same-day quotes."])
    post("post-open", "wave", "COME ON BY", ["WE'RE", "OPEN."], ["Mon – Fri  8 AM – 5 PM", SHOP["street"] + ", Helena"])
    post("post-booked", "jig-a", "BOOK ONLINE", ["YOU'RE", "BOOKED!"], ["Thanks for trusting us", "with your ride."])
    cover()
    stickers = [sticker(n, p) for n, p in [("wave", "wave"), ("thumbs-up", "thumb"), ("cap-tip", "cap"), ("happy-dance", "jig-a"), ("brake-rotor", "rotor"), ("covering-ears", "ears")]]
    sticker_sheet(stickers)
    front, back = card_front(), card_back()
    save(front, "business-card/business-card-front.png", 300)
    save(back, "business-card/business-card-back.png", 300)
    front.convert("RGB").save(f"{OUT}/business-card/business-card-print.pdf", save_all=True, append_images=[back.convert("RGB")], resolution=300)
    print("pdf ok")
