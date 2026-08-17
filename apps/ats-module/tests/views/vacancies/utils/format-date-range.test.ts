import { formatChangeValue } from '@/views/vacancies/utils/format-date-range';

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
