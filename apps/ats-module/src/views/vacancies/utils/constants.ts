const URL_PROTOCOL_HTTP = 'http://';
const URL_PROTOCOL_HTTPS = 'https://';

const DATE_DISPLAY_FORMAT = 'do MMM yyyy';

const TWELVE_HOUR_TIME_REGEX = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i;
const TWENTY_FOUR_HOUR_TIME_REGEX = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

export {
  URL_PROTOCOL_HTTP,
  URL_PROTOCOL_HTTPS,
  DATE_DISPLAY_FORMAT,
  TWELVE_HOUR_TIME_REGEX,
  TWENTY_FOUR_HOUR_TIME_REGEX,
};
