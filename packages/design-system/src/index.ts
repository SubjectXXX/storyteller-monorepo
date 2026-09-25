/**
 * Storyteller design-system public API.
 *
 * Re-exports tokens, helpers, and CSS file paths so consuming apps can
 * import from a single entry point: `@storyteller/design-system`.
 */

import { motion, space, text, type ColorToken, type RadiusToken, type SpaceToken } from './tokens';

export * from './tokens';
export { cx, cva } from './cva';
export type { VariantProps } from 'class-variance-authority';

/**
 * Inline-style helpers \u2014 every component author should prefer Tailwind
 * tokens, but for dynamic runtime values (e.g. typewriter ms-per-char)
 * these functions give type-safe lookups.
 */
export function fontSize(size: keyof typeof text.size): string {
  return `var(--text-${size})`;
}

export function spacing(level: SpaceToken): string {
  return space[level];
}

export function durationMs(level: keyof typeof motion.duration): string {
  const value = motion.duration[level];
  if (level === 'instant') return '0ms';
  return `${value}ms`;
}

/**
 * Storyteller visual metaphor constants. Consumers can use these as
 * a way to keep tone aligned with the Lantern & Ink language without
 * re-deriving CSS variable names. See design/stitch/DESIGN.md.
 */
export const STORYTELLER_THEME = {
  name: 'Lantern & Ink',
  roundness: 'round-8',
  fonts: {
    headline: text.serif,
    body: text.sans,
    mono: text.mono,
  },
} as const;

export type { ColorToken, RadiusToken };
