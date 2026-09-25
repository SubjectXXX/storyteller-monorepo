import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva as cvaBase, type VariantProps } from 'class-variance-authority';

/**
 * Tailwind class composer. Tailwind-merge resolves conflicting utility
 * classes so the last-applied variant wins (e.g. `text-sm` overrides
 * `text-xs`), preserving the deterministic design tokens in tokens.css.
 */
export function cx(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Re-export of class-variance-authority with a default-friendly tip for
 * product component authors. Use cva to define multi-variant UI
 * primitives; the resulting strings are merged through cx.
 */
export const cva: typeof cvaBase = cvaBase;

export type { VariantProps };
