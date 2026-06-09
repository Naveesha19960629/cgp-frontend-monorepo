import { describe, expect, it } from 'vitest';

import {
  to24Hour,
  toScheduleVacancyPayload,
} from '@/views/vacancies/hooks/use-schedule-vacancy-form';

describe('use-schedule-vacancy-form helpers', () => {
  describe('to24Hour', () => {
    it('converts 12-hour AM format to 24-hour format', () => {
      expect(to24Hour('09:30 AM')).toBe('09:30:00');
      expect(to24Hour('12:00 AM')).toBe('00:00:00');
    });

    it('converts 12-hour PM format to 24-hour format', () => {
      expect(to24Hour('05:27 PM')).toBe('17:27:00');
      expect(to24Hour('12:00 PM')).toBe('12:00:00');
    });

    it('handles formats with seconds', () => {
      expect(to24Hour('05:27:10 PM')).toBe('17:27:10');
      expect(to24Hour('09:30:45 AM')).toBe('09:30:45');
    });

    it('handles single-digit hour', () => {
      expect(to24Hour('5:27 PM')).toBe('17:27:00');
      expect(to24Hour('9:30 AM')).toBe('09:30:00');
    });

    it('is case-insensitive for AM/PM', () => {
      expect(to24Hour('05:27 pm')).toBe('17:27:00');
      expect(to24Hour('05:27 Pm')).toBe('17:27:00');
    });

    it('returns original string if format is unrecognised', () => {
      expect(to24Hour('invalid')).toBe('invalid');
      expect(to24Hour('not a time')).toBe('not a time');
    });

    it('converts even invalid hour/minute values that match the pattern', () => {
      // The function only validates pattern, not value ranges
      // 99:99 PM matches the pattern and becomes 99+12:99:00 = 111:99:00
      expect(to24Hour('99:99 PM')).toBe('111:99:00');
    });
  });

  describe('toScheduleVacancyPayload', () => {
    it('combines date and time with T separator', () => {
      const values = {
        schedulePublishDate: '2026-06-25',
        schedulePublishTime: '10:30:00',
        expirationDate: '2026-06-30',
        expirationTime: '17:27:10',
      };
      const result = toScheduleVacancyPayload(values);
      expect(result).toEqual({
        schedulePublishAt: '2026-06-25T10:30:00 AM',
        expirationAt: '2026-06-30T05:27:10 PM',
      });
    });

    it('trims whitespace from time strings', () => {
      const values = {
        schedulePublishDate: '2026-06-25',
        schedulePublishTime: '  10:30:00  ',
        expirationDate: '2026-06-30',
        expirationTime: '  17:27:10  ',
      };
      const result = toScheduleVacancyPayload(values);
      expect(result.schedulePublishAt).toBe('2026-06-25T10:30:00 AM');
      expect(result.expirationAt).toBe('2026-06-30T05:27:10 PM');
    });

    it('handles short time format without seconds', () => {
      const values = {
        schedulePublishDate: '2026-06-25',
        schedulePublishTime: '10:30',
        expirationDate: '2026-06-30',
        expirationTime: '17:27',
      };
      const result = toScheduleVacancyPayload(values);
      expect(result).toEqual({
        schedulePublishAt: '2026-06-25T10:30:00 AM',
        expirationAt: '2026-06-30T05:27:00 PM',
      });
    });

    it('normalizes AM/PM format without seconds', () => {
      const values = {
        schedulePublishDate: '2026-06-25',
        schedulePublishTime: '12:30 AM',
        expirationDate: '2026-06-30',
        expirationTime: '05:27 PM',
      };
      const result = toScheduleVacancyPayload(values);
      expect(result).toEqual({
        schedulePublishAt: '2026-06-25T12:30:00 AM',
        expirationAt: '2026-06-30T05:27:00 PM',
      });
    });
  });
});
