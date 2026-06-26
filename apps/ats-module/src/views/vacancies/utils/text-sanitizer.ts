const SANITIZE_NON_ASCII_REGEX = /[\u0080-\uFFFF]/g;
const SANITIZE_PLAIN_TEXT_DISALLOWED_REGEX = /[^\w\s.,()'/&-]/g;
const SANITIZE_POSTAL_CODE_DISALLOWED_REGEX = /[^\w\s.-]/g;

function sanitizeWithRegex(value: string, disallowedRegex: RegExp): string {
  return value
    .replace(disallowedRegex, '')
    .replace(SANITIZE_NON_ASCII_REGEX, '');
}

export function sanitizePlainText(value: string): string {
  return sanitizeWithRegex(value, SANITIZE_PLAIN_TEXT_DISALLOWED_REGEX);
}

export function sanitizePostalCodeText(value: string): string {
  return sanitizeWithRegex(value, SANITIZE_POSTAL_CODE_DISALLOWED_REGEX);
}
