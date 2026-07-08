import { describe, expect, it } from 'vitest';

import {
  compareDates,
  formatLocalDate,
  getDateYearsAgo,
  getDateYearsFromNow,
  parseLocalDate,
  startOfToday,
} from '@/views/vacancies/utils/date-timezone-safe';

import { addYears, startOfDay, subYears } from 'date-fns';

describe('date-timezone-safe utilities', () => {
  describe('parseLocalDate', () => {
    it('should parse date-only string (YYYY-MM-DD) in local timezone', () => {
      const result = parseLocalDate('2026-06-08');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(result!.getDate()).toBe(8);
    });

    it('should parse ISO date string correctly', () => {
      const result = parseLocalDate('2026-06-08T10:30:00Z');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(5);
    });

    it('should return null for empty or undefined input', () => {
      expect(parseLocalDate(undefined)).toBeNull();
      expect(parseLocalDate('')).toBeNull();
    });

    it('should return null for invalid date strings', () => {
      expect(parseLocalDate('invalid')).toBeNull();
    });
  });

  describe('formatLocalDate', () => {
    it('should format Date object to YYYY-MM-DD string', () => {
      const date = new Date(2026, 5, 8); // June 8, 2026
      const result = formatLocalDate(date);
      expect(result).toBe('2026-06-08');
    });

    it('should format date string to YYYY-MM-DD string', () => {
      const result = formatLocalDate('2026-06-08');
      expect(result).toBe('2026-06-08');
    });

    it('should return empty string for null/undefined/empty input', () => {
      expect(formatLocalDate(undefined)).toBe('');
      expect(formatLocalDate('')).toBe('');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      const result = formatLocalDate(date);
      expect(result).toBe('2026-01-05');
    });
  });

  describe('compareDates', () => {
    it('should return -1 when first date is earlier', () => {
      const result = compareDates('2026-06-08', '2026-06-10');
      expect(result).toBe(-1);
    });

    it('should return 1 when first date is later', () => {
      const result = compareDates('2026-06-10', '2026-06-08');
      expect(result).toBe(1);
    });

    it('should return 0 when dates are equal', () => {
      const result = compareDates('2026-06-08', '2026-06-08');
      expect(result).toBe(0);
    });

    it('should handle Date objects as inputs', () => {
      const date1 = new Date(2026, 5, 8); // June 8
      const date2 = new Date(2026, 5, 10); // June 10
      const result = compareDates(date1, date2);
      expect(result).toBe(-1);
    });

    it('should return 0 if either date is missing', () => {
      expect(compareDates(undefined, '2026-06-08')).toBe(0);
      expect(compareDates('2026-06-08', undefined)).toBe(0);
      expect(compareDates(undefined, undefined)).toBe(0);
    });

    it('should handle mixed string and Date inputs', () => {
      const date = new Date(2026, 5, 10); // June 10
      const result = compareDates('2026-06-08', date);
      expect(result).toBe(-1);
    });
  });

  describe('startOfToday', () => {
    it('should return the current day with the time zeroed out', () => {
      const result = startOfToday();
      const expected = startOfDay(new Date());
      expect(result.getTime()).toBe(expected.getTime());
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('getDateYearsAgo', () => {
    it('should return the exact date 100 years before today (day/month preserved)', () => {
      const today = startOfDay(new Date());
      const result = getDateYearsAgo(100);
      expect(result.getFullYear()).toBe(today.getFullYear() - 100);
      expect(result.getMonth()).toBe(today.getMonth());
      expect(result.getDate()).toBe(today.getDate());
    });

    it('should match date-fns subYears from the start of today', () => {
      const result = getDateYearsAgo(100);
      const expected = subYears(startOfDay(new Date()), 100);
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should not collapse to January 1st of the cutoff year (regression)', () => {
      // The old year-only logic used Jan 1 of (currentYear - 100), which wrongly
      // allowed early-year dates before the exact 100-year cutoff.
      const result = getDateYearsAgo(100);
      const januaryFirst = new Date(result.getFullYear(), 0, 1);
      // Unless today happens to be Jan 1, the exact cutoff is strictly after
      // Jan 1. Fold that edge case into the boundary so the assertion stays
      // unconditional: equal on Jan 1, strictly greater otherwise.
      const isJanuaryFirst = result.getMonth() === 0 && result.getDate() === 1;
      const minTime = isJanuaryFirst
        ? januaryFirst.getTime()
        : januaryFirst.getTime() + 1;
      expect(result.getTime()).toBeGreaterThanOrEqual(minTime);
    });
  });

  describe('getDateYearsFromNow', () => {
    it('should return the exact date 100 years after today (day/month preserved)', () => {
      const today = startOfDay(new Date());
      const result = getDateYearsFromNow(100);
      expect(result.getFullYear()).toBe(today.getFullYear() + 100);
      expect(result.getMonth()).toBe(today.getMonth());
      expect(result.getDate()).toBe(today.getDate());
    });

    it('should match date-fns addYears from the start of today', () => {
      const result = getDateYearsFromNow(100);
      const expected = addYears(startOfDay(new Date()), 100);
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should not collapse to December 31st of the cutoff year (regression)', () => {
      const result = getDateYearsFromNow(100);
      const decemberThirtyFirst = new Date(result.getFullYear(), 11, 31);
      // Unless today happens to be Dec 31, the exact cutoff is strictly before
      // Dec 31. Fold that edge case into the boundary so the assertion stays
      // unconditional: equal on Dec 31, strictly less otherwise.
      const isDecemberThirtyFirst =
        result.getMonth() === 11 && result.getDate() === 31;
      const maxTime = isDecemberThirtyFirst
        ? decemberThirtyFirst.getTime()
        : decemberThirtyFirst.getTime() - 1;
      expect(result.getTime()).toBeLessThanOrEqual(maxTime);
    });
  });

  describe('timezone safety', () => {
    it('should preserve date values when parsing and formatting', () => {
      const original = '2026-06-08';
      const parsed = parseLocalDate(original);
      const formatted = parsed ? formatLocalDate(parsed) : '';
      expect(formatted).toBe(original);
    });

    it('should not apply timezone offset to date-only strings', () => {
      const dateString = '2026-06-08';
      const parsed = parseLocalDate(dateString);
      expect(parsed).not.toBeNull();
      // The date should be exactly what was input, not offset by timezone
      expect(parsed!.getDate()).toBe(8);
      expect(parsed!.getMonth()).toBe(5);
      expect(parsed!.getFullYear()).toBe(2026);
    });
  });
});
