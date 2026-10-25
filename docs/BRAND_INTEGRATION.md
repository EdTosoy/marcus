# Approved brand integration

Phase 2C uses the supplied knight above an open book, without altering the artwork or adding text to the symbol. The current application name, **Quiet Chess**, remains unchanged. Its adjacent navigation label is separate HTML text.

## Provenance and preservation

The requested `/tmp/marcus-brand-input` directory was absent. Repository `assets/` and `marcus-favicon-assets.zip` contained the supplied artwork; all extracted asset files were compared with archive entries and matched byte-for-byte. The original `assets/original.png` (1254 × 1254) remains untouched. Original SHA-256: `6d8fe21930cd03fabae8d1d42ab67c3b4844f324603ea68d1dc58df1a3a91a5d`.

This actual pack includes 192/256/512px icons, 16/32/48px favicons, an ICO and a 180px Apple icon. It does **not** include the described 1024px or transparent derivatives. Pixel statistics confirm opaque artwork, including all-255 alpha in inspected PNGs. No replacement, generated logo, transparency removal or lossy optimization was performed.

## Runtime mapping

| Use                               | Served asset                                                                     | Supplied source               |
| --------------------------------- | -------------------------------------------------------------------------------- | ----------------------------- |
| Navigation, 44px                  | `/brand/icon-192.png`                                                            | `assets/icon-192.png`         |
| Browser tab                       | `/favicon.ico`, `/favicon-16x16.png`, `/favicon-32x32.png`, `/favicon-48x48.png` | Same filenames in `assets/`   |
| Apple home screen                 | `/apple-touch-icon.png`                                                          | `assets/apple-touch-icon.png` |
| Web manifest / Android references | `/brand/icon-192.png`, `/brand/icon-512.png`                                     | Same filenames in `assets/`   |

Browser tests fetch every served file and compare its bytes with the supplied source. The navigation image has fixed dimensions, decorative empty alt text beside the accessible home-link label, and a white badge in both themes. The 192px source is 32,440 bytes and serves directly; the 218,859-byte 512px icon is referenced for installation rather than downloaded for navigation. The large original is never requested by the UI. No image dependency was added.

`src/app/layout.tsx` supplies favicon, Apple, application-name, viewport and theme metadata. `src/app/manifest.ts` supplies `/manifest.webmanifest`, matching application identity, scope, standalone display and **purpose `any`** icons. There is no maskable-icon claim, service worker, offline support or verified installation claim. Manifest configuration alone does not establish installability on every browser.

## Themes and inspection

The existing paper/green palette is refined, with dark tokens for page, feedback, controls and text. Board square/piece colors remain consistent across themes. System/light/dark selection persists under `quiet-chess:theme:v1`; unavailable storage falls back to an in-page choice. A small pre-paint initializer avoids a stored-theme flash; browser-color metadata follows the selected effective theme. The source artwork remains opaque on its deliberate light badge.

The supplied 16/32/48/192px PNGs were displayed unchanged against light and dark backgrounds in `artifacts/phase2c/before-verified/approved-icon-sizes.png`. At 16px fine book detail is limited; the larger sizes preserve the recognizable silhouette. No claim of transparent-edge quality is appropriate for opaque files. Physical home-screen cropping and Safari/Android installation remain pending under the device protocol.

Stitch is excluded at the user's request. No Stitch design was imported or treated as approved.
