import { describe, expect, it } from 'vitest';
import {
  tokens,
  color,
  space,
  breakpointAt,
  durationMs,
  fontSize,
  spacing,
} from './index';

describe('Storyteller design tokens', () => {
  it('exposes a non-empty token bundle', () => {
    expect(Object.keys(tokens)).toEqual(
      expect.arrayContaining(['color', 'space', 'radius', 'text', 'motion', 'zIndex', 'breakpoint']),
    );
  });

  it('maps every colour to a CSS variable reference', () => {
    for (const [name, value] of Object.entries(color)) {
      expect(value, `color ${name}`).toMatch(/^var\(--color-/);
    }
  });

  it('maps every spacing token to a numeric CSS variable', () => {
    for (const [name, value] of Object.entries(space)) {
      expect(value, `space ${name}`).toMatch(/^var\(--space-/);
    }
  });
});

describe('breakpointAt', () => {
  it('returns the smallest band below 640px', () => {
    expect(breakpointAt(390)).toBe('sm');
  });

  it('returns md at tablet width', () => {
    expect(breakpointAt(820)).toBe('md');
  });

  it('returns xl at desktop width', () => {
    expect(breakpointAt(1440)).toBe('xl');
  });

  it('returns 2xl above 1536px', () => {
    expect(breakpointAt(1920)).toBe('2xl');
  });
});

describe('runtime helpers', () => {
  it('durationMs emits a ms-suffixed value', () => {
    expect(durationMs('fast')).toBe('120ms');
    expect(durationMs('instant')).toBe('0ms');
  });

  it('fontSize reads the matching CSS variable', () => {
    expect(fontSize('lg')).toBe('var(--text-lg)');
  });

  it('spacing resolves a typed level', () => {
    expect(spacing(4)).toBe('var(--space-4)');
  });
});
