import { describe, it, expect } from 'vitest';

describe('Tablet Preview Viewer Multi-Language & Gesture Tests', () => {
  it('should cycle through KO, EN, JA languages sequentially in 3-step loop', () => {
    const cycleNext = (curr: 'ko' | 'en' | 'ja'): 'ko' | 'en' | 'ja' => {
      if (curr === 'ko') return 'en';
      if (curr === 'en') return 'ja';
      return 'ko';
    };

    expect(cycleNext('ko')).toBe('en');
    expect(cycleNext('en')).toBe('ja');
    expect(cycleNext('ja')).toBe('ko');
  });

  it('should compute correct aspect ratio padding for 16:10, 16:9, and 4:3', () => {
    const getPadding = (ratio: '16:10' | '16:9' | '4:3', isLandscape: boolean) => {
      if (ratio === '16:10') return isLandscape ? '62.5%' : '160%';
      if (ratio === '16:9') return isLandscape ? '56.25%' : '177.77%';
      return isLandscape ? '75%' : '133.33%';
    };

    expect(getPadding('16:10', true)).toBe('62.5%');
    expect(getPadding('16:10', false)).toBe('160%');
    expect(getPadding('16:9', true)).toBe('56.25%');
    expect(getPadding('4:3', true)).toBe('75%');
  });

  it('should clamp scale between 1.0x and 5.0x', () => {
    const clampScale = (rawScale: number) => Math.min(Math.max(rawScale, 1.0), 5.0);

    expect(clampScale(0.5)).toBe(1.0);
    expect(clampScale(1.0)).toBe(1.0);
    expect(clampScale(3.2)).toBe(3.2);
    expect(clampScale(7.5)).toBe(5.0);
  });

  it('should determine tap vs drag using movement threshold', () => {
    const isStationaryTap = (dx: number, dy: number, threshold: number = 5) => {
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= threshold;
    };

    expect(isStationaryTap(0, 0)).toBe(true);
    expect(isStationaryTap(2, 3)).toBe(true);
    expect(isStationaryTap(10, 15)).toBe(false);
  });
});
