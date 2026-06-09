import {
  DATE_DISPLAY_FORMAT,
  TWELVE_HOUR_TIME_REGEX,
  TWENTY_FOUR_HOUR_TIME_REGEX,
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

describe('time regex constants', () => {
  it('TWELVE_HOUR_TIME_REGEX matches valid 12-hour times', () => {
    expect(TWELVE_HOUR_TIME_REGEX.test('5:27 PM')).toBe(true);
    expect(TWELVE_HOUR_TIME_REGEX.test('05:27:10 am')).toBe(true);
  });

  it('TWELVE_HOUR_TIME_REGEX rejects invalid 12-hour times without period', () => {
    expect(TWELVE_HOUR_TIME_REGEX.test('05:27:10')).toBe(false);
  });

  it('TWENTY_FOUR_HOUR_TIME_REGEX matches HH:mm and HH:mm:ss', () => {
    expect(TWENTY_FOUR_HOUR_TIME_REGEX.test('10:30')).toBe(true);
    expect(TWENTY_FOUR_HOUR_TIME_REGEX.test('17:27:10')).toBe(true);
  });

  it('TWENTY_FOUR_HOUR_TIME_REGEX rejects 12-hour values with AM/PM suffix', () => {
    expect(TWENTY_FOUR_HOUR_TIME_REGEX.test('05:27 PM')).toBe(false);
  });
});
