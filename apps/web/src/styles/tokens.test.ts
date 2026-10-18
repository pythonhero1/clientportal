import { describe, it, expect } from 'vitest';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Design System Tokens WCAG AA Compliance', () => {
  describe('Dark Theme Tokens', () => {
    const darkCanvas = '#070B12';
    const darkSurface = '#0B1320';
    const darkText = '#F5F7FB';
    const darkMutedText = '#919DB0';
    const darkPrimaryLink = '#4C91FF';
    const darkSuccessText = '#24D7A1';

    it('text on canvas meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(darkCanvas, darkText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('text on surface meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(darkSurface, darkText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('muted text on canvas meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(darkCanvas, darkMutedText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('primary text link on canvas meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(darkCanvas, darkPrimaryLink);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('success text on canvas meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(darkCanvas, darkSuccessText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Light Theme Tokens', () => {
    const lightCanvas = '#F7F9FC';
    const lightSurface = '#FFFFFF';
    const lightText = '#111827';
    const lightMutedText = '#475569';
    const lightPrimary = '#1D4ED8';
    const lightSuccessText = '#047857';

    it('text on canvas meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(lightCanvas, lightText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('text on surface meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(lightSurface, lightText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('muted text on canvas meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(lightCanvas, lightMutedText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('primary action text on canvas meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(lightCanvas, lightPrimary);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('success text on canvas meets WCAG AA normal text threshold (>= 4.5:1)', () => {
      const ratio = contrastRatio(lightCanvas, lightSuccessText);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
