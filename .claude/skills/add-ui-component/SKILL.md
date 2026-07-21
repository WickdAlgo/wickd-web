---
name: add-ui-component
description: Add a component to the WickdAlgo design-system library (src/components/ui) following the established pattern — token-backed styling, exported prop types, barrel re-export, validation.
---

# Add UI Component

Prescriptive workflow for adding a component to `src/components/ui/`. Follow the steps in order.

## Steps

1. **Check for prior art.** Read `src/components/ui/index.ts` to confirm the component (or a near-duplicate) doesn't already exist. Prefer extending an existing component with a variant/prop over adding a new file.

2. **Create the file** at `src/components/ui/<kebab-case-name>.tsx` following the library pattern (see `tag.tsx` or `button.tsx` as reference):
   - Named export, never default.
   - Export an explicit `XxxProps` interface extending the appropriate `React.HTMLAttributes<...>` (or element-specific attributes type).
   - Variant/tone unions as exported named types (e.g. `TagTone`), mapped to class strings via a `Record<Union, string>` lookup.
   - Join classes with `cx()` from `@/lib/cx` — always accept and forward `className`, spread `...rest` onto the root element.
   - Add `"use client"` only if the component uses state, effects, or event handlers.

3. **Style with tokens only.** Use semantic utilities from `src/app/globals.css` (`bg-card`, `text-ink`, `border-hairline`, `text-caption`, `rounded-buttons`, chart tones like `bg-bullish`/`text-ic`, …). No hex values, no arbitrary values like `w-[13px]` unless no token fits. Radii convention: structures 0, cards `rounded-cards`, buttons/pills `rounded-buttons`.

4. **Respect reduced motion.** If the component animates, prefix keyframes with `wa-` in `globals.css` and gate JS-driven motion behind `use-reduced-motion.ts`.

5. **Export from the barrel.** Add the component and all its exported types to `src/components/ui/index.ts` under the matching section comment (Core / Forms / Navigation / Data).

6. **Validate.** Run `bash .claude/skills/add-ui-component/scripts/validate.sh <kebab-case-name>` — it checks the barrel export and scans for hardcoded colors. Then run `pnpm lint` and `pnpm build`; both must pass.

7. **Verify visually.** Render the component on the design page (`src/app/(site)/design/page.tsx`) if it belongs in the catalog, and check it in the browser preview.
