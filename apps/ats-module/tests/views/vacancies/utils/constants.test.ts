import {
  DATE_DISPLAY_FORMAT,
  URL_PROTOCOL_HTTP,
  URL_PROTOCOL_HTTPS,
} from '@/views/vacancies/utils/constants';

describe('URL protocol constants', () => {
  it('URL_PROTOCOL_HTTP equals "http://"', () => {
    expect(URL_PROTOCOL_HTTP).toBe('http://');
  });

  it('URL_PROTOCOL_HTTPS equals "https://"', () => {
    expect(URL_PROTOCOL_HTTPS).toBe('https://');
  });

  it('URL_PROTOCOL_HTTP and URL_PROTOCOL_HTTPS are distinct', () => {
    expect(URL_PROTOCOL_HTTP).not.toBe(URL_PROTOCOL_HTTPS);
  });
});

describe('DATE_DISPLAY_FORMAT', () => {
  it('equals "do MMM yyyy"', () => {
    expect(DATE_DISPLAY_FORMAT).toBe('do MMM yyyy');
  });
});
