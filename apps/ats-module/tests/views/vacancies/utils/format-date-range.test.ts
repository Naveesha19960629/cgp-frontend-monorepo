import {
  formatChangeValue,
  formatDateRange,
} from '@/views/vacancies/utils/format-date-range';

describe('formatDateRange', () => {
  // CR-10: Recruiter - View Empty Fields Based on Data Availability.
  it('formats both dates as a range when both are present', () => {
    expect(formatDateRange('2022-01-02', '2023-06-15')).toBe(
      '2nd Jan 2022 - 15th Jun 2023'
    );
  });

  it('shows "N/A" for the end date when only startDate is present', () => {
    expect(formatDateRange('2022-03-05', undefined)).toBe('5th Mar 2022 - N/A');
  });

  it('shows "N/A" for the start date when only endDate is present', () => {
    expect(formatDateRange(undefined, '2024-11-01')).toBe('N/A - 1st Nov 2024');
  });

  it('returns an empty string when both dates are missing', () => {
    expect(formatDateRange(undefined, undefined)).toBe('');
    expect(formatDateRange('', '')).toBe('');
  });
});

describe('formatChangeValue', () => {
  it('flattens a JSON-object-shaped change value into a readable, comma-joined line', () => {
    // Real reported shape: an award/license's "Represented Organization" is
    // captured as one composite value, JSON-stringified, rather than a real
    // object-array item — rendering it as-is showed raw JSON to the
    // recruiter instead of a readable line.
    const raw =
      '{"organization":"OXO Labs","organizationLocation":"Colombo, Western Province, Sri Lanka"}';

    expect(formatChangeValue(raw)).toBe(
      'OXO Labs, Colombo, Western Province, Sri Lanka'
    );
  });

  it('preserves the JSON object key order when flattening', () => {
    expect(formatChangeValue('{"b":"second","a":"first"}')).toBe(
      'second, first'
    );
  });

  it('drops null/undefined/empty-string members when flattening', () => {
    expect(
      formatChangeValue(
        '{"organization":"OXO Labs","organizationLocation":null}'
      )
    ).toBe('OXO Labs');
  });

  it('leaves plain non-JSON text untouched', () => {
    expect(formatChangeValue('President')).toBe('President');
  });

  it('leaves a JSON array untouched (only flattens plain objects)', () => {
    expect(formatChangeValue('["a","b"]')).toBe('["a","b"]');
  });

  it('leaves malformed/incomplete JSON-looking text untouched', () => {
    expect(formatChangeValue('{not valid json')).toBe('{not valid json');
  });

  it('still formats an ISO date string for display', () => {
    expect(formatChangeValue('2026-07-07')).toBe('7th Jul 2026');
  });

  it('still formats an ISO date-time string for display', () => {
    expect(formatChangeValue('2026-07-07T20:07:10')).toBe(
      '7th Jul 2026, 8:07 PM'
    );
  });
});
