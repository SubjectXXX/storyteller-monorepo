# Storyteller shared design system

CSS custom properties, type-safe token module, and Tailwind/CVA helpers.
Consumed by `application/web` and `application/admin` only.

## Layers

- `tokens.css` — design-token CSS variables (light + dark, prefers-reduced-motion overrides).
- `reset.css` — minimal CSS reset used by every Storyteller product page.
- `tokens.ts` — typed JS lookup of every token.
- `cva.ts` — Tailwind-merge + CVA-based class composer.
- `index.ts` — public entry point.

## Usage

```css
/* in a global stylesheet */
@import "@storyteller/design-system/tokens.css";
@import "@storyteller/design-system/reset.css";
```

```tsx
import { cx, cva, color } from "@storyteller/design-system";

const button = cva(
  "inline-flex items-center justify-center font-medium transition",
  {
    variants: {
      intent: {
        primary: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
        muted: "bg-[var(--color-surface-muted)] text-[var(--color-foreground)]",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-[var(--radius-sm)]",
        md: "h-10 px-4 text-base rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: { intent: "primary", size: "md" },
  },
);
```

## Versioning policy

Breaking token changes require a new major version of the package and a coordinated UI audit in both `web` and `admin`. A toggle in `tokens.css` can introduce new tokens alongside the old ones for one release before deprecation.

## Testing

- `npm test` runs Vitest unit tests for token layout and runtime helpers.
- Visual regression is handled in the consuming apps using Playwright snapshots taken from the same viewport matrix the Impeccable agent uses (390 / 768 / 1440 / 1920).
