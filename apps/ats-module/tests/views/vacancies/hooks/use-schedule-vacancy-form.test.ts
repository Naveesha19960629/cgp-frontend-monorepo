import { renderHook } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import {
  parseBackendDatetime,
  to24Hour,
  toScheduleVacancyPayload,
  useScheduleVacancyForm,
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

    it('passes through already 24-hour HH:mm:ss format unchanged', () => {
      expect(to24Hour('09:30:45')).toBe('09:30:45');
      expect(to24Hour('17:27:10')).toBe('17:27:10');
      expect(to24Hour('00:00:00')).toBe('00:00:00');
    });

    it('appends :00 to HH:mm 24-hour format', () => {
      expect(to24Hour('09:30')).toBe('09:30:00');
      expect(to24Hour('17:27')).toBe('17:27:00');
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

    it('converts midnight (00:xx) time to 12-hour AM format', () => {
      const values = {
        schedulePublishDate: '2026-06-25',
        schedulePublishTime: '00:00:00',
        expirationDate: '2026-06-30',
        expirationTime: '00:30:00',
      };
      const result = toScheduleVacancyPayload(values);
      expect(result.schedulePublishAt).toBe('2026-06-25T12:00:00 AM');
      expect(result.expirationAt).toBe('2026-06-30T12:30:00 AM');
    });

    it('converts noon (12:xx) time to 12-hour PM format', () => {
      const values = {
        schedulePublishDate: '2026-06-25',
        schedulePublishTime: '12:00:00',
        expirationDate: '2026-06-30',
        expirationTime: '12:30:00',
      };
      const result = toScheduleVacancyPayload(values);
      expect(result.schedulePublishAt).toBe('2026-06-25T12:00:00 PM');
      expect(result.expirationAt).toBe('2026-06-30T12:30:00 PM');
    });
  });

  describe('parseBackendDatetime', () => {
    it('parses 12-hour AM/PM format with seconds', () => {
      expect(parseBackendDatetime('2026-06-25T05:27:10 PM')).toEqual({
        date: '2026-06-25',
        time: '05:27:10 PM',
      });
      expect(parseBackendDatetime('2026-06-25T10:30:00 AM')).toEqual({
        date: '2026-06-25',
        time: '10:30:00 AM',
      });
    });

    it('parses 12-hour AM/PM format without seconds', () => {
      expect(parseBackendDatetime('2026-06-25T5:27 PM')).toEqual({
        date: '2026-06-25',
        time: '5:27 PM',
      });
    });

    it('parses 12-hour AM/PM format with space separator', () => {
      expect(parseBackendDatetime('2026-06-25 05:27:10 PM')).toEqual({
        date: '2026-06-25',
        time: '05:27:10 PM',
      });
    });

    it('normalises AM/PM to uppercase', () => {
      expect(parseBackendDatetime('2026-06-25T10:30:00 am')).toEqual({
        date: '2026-06-25',
        time: '10:30:00 AM',
      });
    });

    it('converts 24-hour format with seconds to 12-hour AM/PM', () => {
      expect(parseBackendDatetime('2026-06-25T14:30:00')).toEqual({
        date: '2026-06-25',
        time: '02:30:00 PM',
      });
    });

    it('converts 24-hour format without seconds to 12-hour AM/PM', () => {
      expect(parseBackendDatetime('2026-06-25T10:30')).toEqual({
        date: '2026-06-25',
        time: '10:30:00 AM',
      });
    });

    it('converts 24-hour format with space separator to 12-hour AM/PM', () => {
      expect(parseBackendDatetime('2026-06-25 14:30:00')).toEqual({
        date: '2026-06-25',
        time: '02:30:00 PM',
      });
    });

    it('falls back to date-only when time is missing (date-only partial)', () => {
      expect(parseBackendDatetime('2026-06-25T')).toEqual({
        date: '2026-06-25',
        time: '',
      });
    });

    it('returns empty strings for an empty input', () => {
      expect(parseBackendDatetime('')).toEqual({ date: '', time: '' });
    });
  });

  describe('useScheduleVacancyForm', () => {
    it('pre-fills correct date and time fields when passed a 12-hour AM/PM backend datetime string', () => {
      const defaults = {
        schedulePublishAt: '2026-06-25T05:27:10 PM',
        expirationAt: '2026-06-30T10:30:00 AM',
      };
      const { result } = renderHook(() => useScheduleVacancyForm(defaults));

      expect(result.current.getValues()).toEqual({
        schedulePublishDate: '2026-06-25',
        schedulePublishTime: '05:27:10 PM',
        expirationDate: '2026-06-30',
        expirationTime: '10:30:00 AM',
      });
    });

    it('pre-fills correct date and time fields when passed a 24-hour ISO backend datetime string', () => {
      const defaults = {
        schedulePublishAt: '2026-06-24T01:00:00',
        expirationAt: '2026-06-26T12:59:59',
      };
      const { result } = renderHook(() => useScheduleVacancyForm(defaults));

      expect(result.current.getValues()).toEqual({
        schedulePublishDate: '2026-06-24',
        schedulePublishTime: '01:00:00 AM',
        expirationDate: '2026-06-26',
        expirationTime: '12:59:59 PM',
      });
    });

    it('returns empty defaultValues when no defaults are provided', () => {
      const { result } = renderHook(() => useScheduleVacancyForm());

      expect(result.current.getValues()).toEqual({
        schedulePublishDate: '',
        schedulePublishTime: '',
        expirationDate: '',
        expirationTime: '',
      });
    });
  });
});
