# Design sync notes

- 2026-07-18: Imported the "WickdAlgo Design System" Claude Design project
  (fc858be6-88be-4792-a0ae-d84528192ba4) INTO this repo (reverse direction:
  design → code). Tokens live in `src/app/globals.css` as Tailwind v4 `@theme`
  + semantic `:root` aliases; components ported 1:1 from the project's
  `components/**.jsx` to typed TSX in `src/components/ui/`.
- Fonts: the project ships Archivo + Inter variable TTFs; this repo loads the
  same faces via `next/font/google` instead (exposed as `--font-archivo` /
  `--font-inter`, consumed by `--font-display` / `--font-ui`).
- Logos copied to `public/logo.svg` (light, primary) and `public/logo-dark.svg`
  (reserved for dark contexts).
- Not imported: `guidelines/` specimen cards, `_ds_bundle.js` (design-tool
  runtime artifacts, not app code).
- 2026-07-18 (2nd pass): `ui_kits/` ported as real routes — website kit →
  `/` (home), `/engine`, `/pricing` under `src/app/(site)/` (shared NavBar +
  Footer layout); platform kit → `/platform` (left-rail dashboard, views in
  `src/components/platform/`). Component showcase moved to `/design`.
