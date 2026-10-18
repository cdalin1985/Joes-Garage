# Joe's social media kit

Ready-made images of Joe for Facebook, stickers and business cards. They use the site's fonts, colours and shop details. Everything here is built from the photo poses in `public/joe/` by `source/kit.py`.

| Folder | File | Size | Use |
|---|---|---|---|
| `facebook/` | `post-honest-repair.png`, `post-squeal.png`, `post-brakes.png`, `post-open.png`, `post-booked.png` | 1080×1080 | Feed posts (Facebook and Instagram) |
| `facebook/` | `facebook-cover.png` | 1640×624 | Page cover photo. Keep the profile picture on the left, where Joe is. |
| `stickers/` | `sticker-*.png` (wave, thumbs-up, cap-tip, happy-dance, brake-rotor, covering-ears) | ~4 in tall at 300 dpi | Die-cut stickers with a transparent background and white border |
| `stickers/` | `sticker-sheet-letter.png` / `.pdf` | US Letter at 300 dpi | All six stickers on one sheet, for home or print-shop printing |
| `business-card/` | `business-card-front.png`, `business-card-back.png`, `business-card-print.pdf` | 3.5×2 in + ⅛ in bleed at 300 dpi (1125×675) | Send the PDF to any printer (Vistaprint, a local shop and so on). Text stays inside the ¼ in safe area. |

## Changing the details
Shop name, phone, address, email, web address and hours are in `SHOP` at the top of `source/kit.py`. The web address is currently the Vercel one, so update it once the shop has its own domain. Post headlines are in the `__main__` block at the bottom.

```bash
pip install pillow
python3 marketing/joe-kit/source/kit.py   # rewrites the images in this folder
```

The fonts in `source/fonts/` are Big Shoulders Display, Kanit and Plus Jakarta Sans. They come from Google Fonts under the SIL Open Font License.
