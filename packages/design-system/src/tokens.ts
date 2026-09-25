/**
 * Storyteller design tokens.
 *
 * Authoritative source for every colour, spacing, type, motion, and
 * z-index value exposed to product UI. Consuming apps (web, admin)
 * import the matching constants or the generated CSS custom properties.
 *
 * The CVA helpers in ./cva.ts translate these tokens into Tailwind/
 * className-friendly strings at runtime, so production code can never
 * drift from the canonical values.
 *
 * Storyteller "Lantern & Ink" — Stage 1. Mirror of
 * design/tokens/tokens.json in the storyteller monorepo; re-synced via
 * scripts/sync-design-tokens.mjs (S2-T02).
 */

export const color = {
  // Brand
  primary: 'var(--color-primary)',
  primaryFg: 'var(--color-primary-foreground)',
  accent: 'var(--color-accent)',
  accentFg: 'var(--color-accent-foreground)',
  secondary: 'var(--color-secondary)',
  tertiary: 'var(--color-tertiary)',

  // Surfaces
  bg: 'var(--color-background)',
  surface: 'var(--color-surface)',
  surfaceMuted: 'var(--color-surface-muted)',
  surfaceElevated: 'var(--color-surface-elevated)',
  border: 'var(--color-border)',
  ring: 'var(--color-ring)',

  // Text
  fg: 'var(--color-foreground)',
  fgMuted: 'var(--color-foreground-muted)',
  fgSubtle: 'var(--color-foreground-subtle)',
  neutral: 'var(--color-neutral)',

  // Status
  success: 'var(--color-success)',
  successFg: 'var(--color-success-foreground)',
  warning: 'var(--color-warning)',
  warningFg: 'var(--color-warning-foreground)',
  danger: 'var(--color-danger)',
  dangerFg: 'var(--color-danger-foreground)',
  info: 'var(--color-info)',
  infoFg: 'var(--color-info-foreground)',

  // Storyline semantic palette (used in NPC/mood accents)
  romance: 'var(--color-storyline-romance)',
  conflict: 'var(--color-storyline-conflict)',
  mystery: 'var(--color-storyline-mystery)',
  hope: 'var(--color-storyline-hope)',
} as const;

export const space = {
  px: 'var(--space-px)',
  0: 'var(--space-0)',
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  8: 'var(--space-8)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
  16: 'var(--space-16)',
  20: 'var(--space-20)',
  24: 'var(--space-24)',
  32: 'var(--space-32)',
  40: 'var(--space-40)',
  48: 'var(--space-48)',
  56: 'var(--space-56)',
  64: 'var(--space-64)',
} as const;

export const radius = {
  none: 'var(--radius-none)',
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
} as const;

export const text = {
  // Type families: the loader sets these from <link rel="preconnect">
  sans: 'var(--font-sans)',
  serif: 'var(--font-serif)',
  mono: 'var(--font-mono)',

  // Sizes (px-relative)
  size: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    base: 'var(--text-base)',
    md: 'var(--text-md)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)',
    '2xl': 'var(--text-2xl)',
    '3xl': 'var(--text-3xl)',
    '4xl': 'var(--text-4xl)',
  },

  // Weights
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  leading: {
    tight: 'var(--leading-tight)',
    snug: 'var(--leading-snug)',
    normal: 'var(--leading-normal)',
    relaxed: 'var(--leading-relaxed)',
  },
} as const;

export const motion = {
  // Durations in ms
  duration: {
    instant: 0,
    fast: 120,
    normal: 220,
    slow: 360,
    glacial: 600,
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
    emphasized: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',
  },
  // Honoured by PlaySurface reading-typography controls
  reading: {
    typewriterDefaultMsPerChar: 18,
    typewriterFastMsPerChar: 4,
  },
} as const;

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
} as const;

export const breakpoint = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Returns `true` when a viewport width falls into a breakpoint band.
 * The consuming app supplies its own media-query list to honour the
 * Storyteller S1 viewport matrix (390 / 768 / 1440 / 1920).
 */
export function breakpointAt(width: number): keyof typeof breakpoint {
  if (width >= breakpoint['2xl']) return '2xl';
  if (width >= breakpoint.xl) return 'xl';
  if (width >= breakpoint.lg) return 'lg';
  if (width >= breakpoint.md) return 'md';
  return 'sm';
}

/**
 * Storyteller viewport matrix — Stage 1 visual coverage. The S1 gate
 * (QUALITY_GATES.md §Stage S1) requires playwright screenshots at each
 * of these widths.
 */
export const viewportMatrix = {
  mobile: 390,
  tablet: 768,
  desktop: 1440,
  wide: 1920,
} as const;

export const tokens = {
  color,
  space,
  radius,
  text,
  motion,
  zIndex,
  breakpoint,
} as const;

export type Tokens = typeof tokens;
export type ColorToken = keyof typeof color;
export type SpaceToken = keyof typeof space;
export type RadiusToken = keyof typeof radius;
export type TextSizeToken = keyof typeof text.size;
