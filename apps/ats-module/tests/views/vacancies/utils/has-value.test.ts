import { hasValue } from '@/views/vacancies/utils/has-value';

describe('hasValue', () => {
  it('returns false for null and undefined', () => {
    expect(hasValue(null)).toBe(false);
    expect(hasValue(undefined)).toBe(false);
  });

  it('returns false for an empty or whitespace-only string', () => {
    expect(hasValue('')).toBe(false);
    expect(hasValue('   ')).toBe(false);
  });

  it('returns true for a non-empty string', () => {
    expect(hasValue('Colombo')).toBe(true);
  });

  it('returns false for an empty array', () => {
    expect(hasValue([])).toBe(false);
  });

  it('returns true for a non-empty array', () => {
    expect(hasValue(['Engineering'])).toBe(true);
  });

  it('returns true for other truthy values (e.g. booleans, numbers)', () => {
    expect(hasValue(true)).toBe(true);
    expect(hasValue(0)).toBe(true);
  });
});
