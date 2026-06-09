import { describe, expect, it } from 'vitest';

import { formatDisplayDateTime } from '@/views/vacancies/utils';

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
