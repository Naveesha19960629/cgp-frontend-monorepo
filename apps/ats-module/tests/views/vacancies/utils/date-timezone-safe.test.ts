import { describe, expect, it } from 'vitest';

import {
  compareDates,
  formatLocalDate,
  parseLocalDate,
} from '@/views/vacancies/utils/date-timezone-safe';

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
