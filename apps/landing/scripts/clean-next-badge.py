#!/usr/bin/env python3
"""
Removes the Next.js dev indicator ('N' badge) from bottom-left of desktop screenshots
in public/screenshots/ by cleanly patching from the surrounding uniform background.
Automatically backs up original files to public/screenshots/.backup/ first.
"""
import shutil
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow belum terpasang. Jalankan: pip3 install pillow")
    raise SystemExit(1)

SS_DIR = Path(__file__).resolve().parent.parent / "public" / "screenshots"
BACKUP_DIR = SS_DIR / ".backup"
BACKUP_DIR.mkdir(exist_ok=True)

DESKTOP_FILES = [
    "01-login.png",
    "02-pos.png",
    "03-kds.png",
    "04-dashboard.png",
    "05-menu.png",
    "06-tables.png",
    "07-stock.png",
    "08-rbac.png",
    "09-settings.png",
]

for name in DESKTOP_FILES:
    path = SS_DIR / name
    if not path.exists():
        continue

    backup_path = BACKUP_DIR / name
    if not backup_path.exists():
        shutil.copy2(path, backup_path)

    img = Image.open(path).convert("RGBA")
    w, h = img.size

    # Next.js dev badge sits in the bottom-left corner (~8% width x 11% height max)
    patch_w = int(w * 0.065)
    patch_h = int(h * 0.105)
    y_start = h - patch_h

    # Copy a clean horizontal strip directly above the badge and stretch/tile vertically
    src_y = max(0, y_start - patch_h)
    clean_patch = img.crop((0, src_y, patch_w, src_y + patch_h))
    img.paste(clean_patch, (0, y_start))
    img.save(path)
    print(f"Cleaned: {name} ({w}x{h})")

print("Selesai! Backup asli tersimpan di public/screenshots/.backup/")
print("Catatan: Untuk 10-pos-mobile.png, sebaiknya capture ulang dari build production (next build && next start)")
print("atau upload hasil capture baru melalui /admin -> Media & Showcase.")
