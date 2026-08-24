import { describe, expect, it } from 'vitest';

import {
  formatDisplayDateTime,
  isDateTimeBeyondMaxBoundary,
  isDateTimeInPast,
  to24HourTime,
} from '@/views/vacancies/utils';
import { getHundredYearDateBoundaries } from '@/views/vacancies/utils/date-timezone-safe';

describe('formatDisplayDateTime', () => {
  it('returns undefined when date is missing', () => {
    expect(formatDisplayDateTime(undefined, '10:30:00')).toBeUndefined();
  });

  it('returns only formatted date when time is missing', () => {
    expect(formatDisplayDateTime('2026-06-25', '')).toBe('25th Jun 2026');
  });

  it('formats 24-hour time to 12-hour with seconds', () => {
    expect(formatDisplayDateTime('2026-06-25', '17:27:10')).toBe(
      '25th Jun 2026 05:27:10 PM'
    );
  });

  it('formats 24-hour HH:mm to include seconds', () => {
    expect(formatDisplayDateTime('2026-06-25', '10:30')).toBe(
      '25th Jun 2026 10:30:00 AM'
    );
  });

  it('normalizes 12-hour input to include leading hour and seconds', () => {
    expect(formatDisplayDateTime('2026-06-25', '5:27 PM')).toBe(
      '25th Jun 2026 05:27:00 PM'
    );
  });

  it('returns date only when time format is unrecognized', () => {
    expect(formatDisplayDateTime('2026-06-25', 'invalid')).toBe(
      '25th Jun 2026'
    );
  });

  it('formats 24-hour midnight correctly', () => {
    expect(formatDisplayDateTime('2026-06-25', '00:00:00')).toBe(
      '25th Jun 2026 12:00:00 AM'
    );
  });

  it('formats 24-hour noon correctly', () => {
    expect(formatDisplayDateTime('2026-06-25', '12:00:00')).toBe(
      '25th Jun 2026 12:00:00 PM'
    );
  });

  it('normalizes lowercase am/pm input', () => {
    expect(formatDisplayDateTime('2026-06-25', '5:27 pm')).toBe(
      '25th Jun 2026 05:27:00 PM'
    );
  });
});

describe('to24HourTime', () => {
  it('keeps HH:mm:ss values unchanged', () => {
    expect(to24HourTime('17:27:10')).toBe('17:27:10');
  });

  it('normalizes HH:mm values to include seconds', () => {
    expect(to24HourTime('10:30')).toBe('10:30:00');
  });

  it('converts 12-hour PM input to 24-hour', () => {
    expect(to24HourTime('5:27 PM')).toBe('17:27:00');
  });

  it('converts 12 AM to 00-hour', () => {
    expect(to24HourTime('12:00 AM')).toBe('00:00:00');
  });

  it('keeps unrecognized input unchanged', () => {
    expect(to24HourTime('invalid')).toBe('invalid');
  });
});

describe('isDateTimeInPast', () => {
  const toLocalDateTimeParts = (value: Date) => ({
    date: [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-'),
    time: [
      String(value.getHours()).padStart(2, '0'),
      String(value.getMinutes()).padStart(2, '0'),
      String(value.getSeconds()).padStart(2, '0'),
    ].join(':'),
  });

  it('returns true for a date/time an hour before now', () => {
    const { date, time } = toLocalDateTimeParts(
      new Date(Date.now() - 60 * 60 * 1000)
    );
    expect(isDateTimeInPast(date, time)).toBe(true);
  });

  it('returns false for a date/time an hour after now', () => {
    const { date, time } = toLocalDateTimeParts(
      new Date(Date.now() + 60 * 60 * 1000)
    );
    expect(isDateTimeInPast(date, time)).toBe(false);
  });

  it('returns false for an unparseable date/time', () => {
    expect(isDateTimeInPast('not-a-date', 'not-a-time')).toBe(false);
  });
});

describe('isDateTimeBeyondMaxBoundary', () => {
  // The exact-day boundary (today + 100 years) is inclusive of the day
  // itself — 23:59:59 on that day always falls after "now + 100 years",
  // and 00:00:00 always falls at or before it, regardless of what time
  // "now" actually is.
  const boundaryDate = () => {
    const { maxDate } = getHundredYearDateBoundaries();
    return [
      maxDate.getFullYear(),
      String(maxDate.getMonth() + 1).padStart(2, '0'),
      String(maxDate.getDate()).padStart(2, '0'),
    ].join('-');
  };

  it('returns true for a time later than now on the boundary day', () => {
    expect(isDateTimeBeyondMaxBoundary(boundaryDate(), '23:59:59')).toBe(true);
  });

  it('returns false for a time not later than now on the boundary day', () => {
    expect(isDateTimeBeyondMaxBoundary(boundaryDate(), '00:00:00')).toBe(false);
  });

  it('returns false for a near-future date well within the boundary', () => {
    expect(isDateTimeBeyondMaxBoundary('2099-12-25', '10:00:00')).toBe(false);
  });

  it('returns false for an unparseable date/time', () => {
    expect(isDateTimeBeyondMaxBoundary('not-a-date', 'not-a-time')).toBe(false);
  });
});
