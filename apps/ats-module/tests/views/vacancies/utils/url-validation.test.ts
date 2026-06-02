import {
  isUrlFormatValid,
  isUrlProtocolValid,
} from '@/views/vacancies/utils/url-validation';

describe('isUrlProtocolValid', () => {
  it('returns true for empty string', () => {
    expect(isUrlProtocolValid('')).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isUrlProtocolValid(undefined)).toBe(true);
  });

  it('returns true for http:// URL', () => {
    expect(isUrlProtocolValid('http://example.com')).toBe(true);
  });

  it('returns true for https:// URL', () => {
    expect(isUrlProtocolValid('https://example.com')).toBe(true);
  });

  it('returns true for HTTP:// (case-insensitive)', () => {
    expect(isUrlProtocolValid('HTTP://example.com')).toBe(true);
  });

  it('returns false for ftp:// URL', () => {
    expect(isUrlProtocolValid('ftp://example.com')).toBe(false);
  });

  it('returns false for URL without protocol', () => {
    expect(isUrlProtocolValid('example.com')).toBe(false);
  });

  it('returns false for URL with only text', () => {
    expect(isUrlProtocolValid('notaurl')).toBe(false);
  });
});

describe('isUrlFormatValid', () => {
  it('returns true for empty string', () => {
    expect(isUrlFormatValid('')).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isUrlFormatValid(undefined)).toBe(true);
  });

  it('returns true for valid https URL', () => {
    expect(isUrlFormatValid('https://example.com')).toBe(true);
  });

  it('returns true for valid http URL with path', () => {
    expect(isUrlFormatValid('http://example.com/path/to/page')).toBe(true);
  });

  it('returns true for subdomain URL', () => {
    expect(isUrlFormatValid('https://sub.example.co.uk')).toBe(true);
  });

  it('returns false for URL with spaces', () => {
    expect(isUrlFormatValid('https://exam ple.com')).toBe(false);
  });

  it('returns false for invalid hostname (no TLD)', () => {
    expect(isUrlFormatValid('http://localhost')).toBe(false);
  });

  it('returns false for unparseable string', () => {
    expect(isUrlFormatValid('not a url at all')).toBe(false);
  });

  it('returns false for protocol only', () => {
    expect(isUrlFormatValid('http://')).toBe(false);
  });
});
