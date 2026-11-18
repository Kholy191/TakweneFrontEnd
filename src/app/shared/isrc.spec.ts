import { formatIsrc, ISRC_PATTERN } from './isrc';
import { toDateOnly } from './date-only';

describe('shared helpers', () => {
  it('formats a stored ISRC with hyphens', () => {
    expect(formatIsrc('EGTKW2600001')).toBe('EG-TKW-26-00001');
  });

  it('accepts ISRCs with or without hyphens', () => {
    expect(ISRC_PATTERN.test('EG-TKW-26-00001')).toBe(true);
    expect(ISRC_PATTERN.test('egtkw2600001')).toBe(true);
    expect(ISRC_PATTERN.test('EG-TKW-26-0001')).toBe(false);
  });

  it('keeps the picked day when sending a DateOnly', () => {
    expect(toDateOnly(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
