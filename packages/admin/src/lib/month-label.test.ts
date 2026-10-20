import { describe, expect, it } from 'vitest';
import { monthLabel } from './month-label';

describe('monthLabel', () => {
  it('keeps the English abbreviation in English', () => {
    expect(monthLabel('Jan', 'en')).toBe('Jan');
    expect(monthLabel('Sep', 'en')).toBe('Sep');
  });

  it('names the month in the language of the interface', () => {
    expect(monthLabel('Jan', 'cs')).toBe('led');
    expect(monthLabel('Dec', 'cs')).toBe('pro');
  });

  it('gives each of the twelve abbreviations of the server its own name', () => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    expect(new Set(months.map((month) => monthLabel(month, 'sk'))).size).toBe(12);
  });

  it('returns a label that is not a month as it is', () => {
    expect(monthLabel('Q3', 'cs')).toBe('Q3');
  });
});
