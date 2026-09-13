# DARK Games CSS architecture — v5.6.3

The stylesheet is now modular. Do not append new version-wide override blocks to `public/styles.css`.
That file is only a compatibility stub.

Load order (also the cascade order):

1. `public/styles/foundation.css` — tokens, themes, reset, global primitives.
2. `public/styles/layout.css` — header, mobile drawer, application/page shell.
3. `public/styles/sections.css` — base Home, article, Lore, Rules/Contact section layouts.
4. `public/styles/components.css` — buttons, forms, account, auth, admin, footer, toast.
5. `public/styles/responsive.css` — base responsive rules and onboarding/home sequence rules.
6. `public/styles/editorial.css` — news/banner CMS variants.
7. `public/styles/portal-theme.css` — current portal visual theme and Home presentation.
8. `public/styles/pages.css` — current interior-page styling.
9. `public/styles/motion.css` — shared scenic background, header behavior, transition/stability fixes.

## Editing rule

Change the existing selector in the module that owns it. Avoid adding another copy of the same selector at the bottom of a different file just to override it. If a component needs a new state, add that state next to the component itself.

The order above intentionally preserves the cascade of the previous working build. `foundation.css` through `responsive.css` are an exact ordered split of the former base stylesheet; the later theme/page/motion modules remain in the same order.
