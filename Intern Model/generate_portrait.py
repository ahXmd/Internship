from pathlib import Path
from PIL import Image, ImageOps, ImageFilter, ImageDraw

src = Path('images/profile-pic-edited.png')
out = Path('images/portfolio-face-portrait.png')

img = Image.open(src).convert('RGBA')
W, H = 420, 540

# Dark gradient background with a soft glow look.
bg = Image.new('RGBA', (W, H), (8, 10, 18, 255))
for y in range(H):
    t = y / max(H - 1, 1)
    r = int(8 + (32 - 8) * t)
    g = int(14 + (58 - 14) * t)
    b = int(24 + (92 - 24) * t)
    for x in range(W):
        bg.putpixel((x, y), (r, g, b, 255))

# blurred face crop for a soft, polished portrait card
face_crop = ImageOps.fit(img, (W, H), method=Image.Resampling.LANCZOS)
face_crop = face_crop.filter(ImageFilter.GaussianBlur(1.0))
face_crop = Image.blend(face_crop, Image.new('RGBA', (W, H), (0, 0, 0, 0)), 0.15)

# Add a subtle vignette and frame sparkle.
shade = Image.new('L', (W, H), 0)
for y in range(H):
    for x in range(W):
        dx = x - W / 2
        dy = y - H / 2
        dist = (dx * dx + dy * dy) ** 0.5
        maxd = ((W / 2) ** 2 + (H / 2) ** 2) ** 0.5
        v = int(255 * max(0, 1 - dist / maxd * 0.55))
        shade.putpixel((x, y), v)

final = bg.copy()
final = Image.alpha_composite(final, face_crop)
final.putalpha(shade)

frame = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(frame)
d.rounded_rectangle((6, 6, W - 7, H - 7), radius=26, fill=(8, 12, 24, 170), outline=(100, 116, 255, 130), width=2)
final = Image.alpha_composite(final, frame)

out.parent.mkdir(exist_ok=True)
final.save(out)
print(f'SAVED {out} ({final.size[0]}x{final.size[1]})')
