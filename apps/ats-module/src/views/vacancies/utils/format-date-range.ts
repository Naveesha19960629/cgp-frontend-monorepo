import {
  CHANGE_VALUE_DATE_TIME_FORMAT,
  DATE_DISPLAY_FORMAT,
  ISO_DATE_LIKE_PATTERN,
  PDF_DATE_TIME_DISPLAY_FORMAT,
  PDF_SIDEBAR_DATE_FORMAT,
  TIME_DISPLAY_FORMAT,
} from '@/views/vacancies/utils/constants';
import { parseLocalDate } from '@/views/vacancies/utils/date-timezone-safe';

import { format } from 'date-fns';

/**
 * Format a single date string for display using the shared display format
 * (e.g. "12th Jan 2022"). Returns '' for empty/invalid input.
 */
function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  if (!d) return '';
  return format(d, DATE_DISPLAY_FORMAT);
}

/**
 * Format a single date string for display with a time component (e.g.
 * "12th Jan 2022, 8:32 PM"). Returns the raw string for empty/invalid input
 * (matching the Version History PDF's fallback behavior).
 */
function formatIsoDateTimeForDisplay(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return format(d, PDF_DATE_TIME_DISPLAY_FORMAT);
}

/**
 * Format a start/end date pair as a display range (CR-10):
 * - both    -> "12th Jan 2022 - 13th Feb 2023"
 * - start   -> "12th Jan 2022 - N/A"
 * - end     -> "N/A - 13th Feb 2023"
 * - neither -> '' (caller should not render the field at all)
 */
function formatDateRange(startDate?: string, endDate?: string): string {
  const start = formatDisplayDate(startDate);
  const end = formatDisplayDate(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - N/A`;
  if (end) return `N/A - ${end}`;
  return '';
}

/**
 * The date half of an Activity Log timestamp (e.g. "12th Oct 2026"). Figma
 * draws the date and time as two separate text nodes with a small vector dot
 * between them, so they are formatted separately rather than joined into one
 * string. Returns the raw input for empty/invalid values.
 */
function formatIsoDateForDisplay(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return format(d, DATE_DISPLAY_FORMAT);
}

/** The time half of an Activity Log timestamp (e.g. "2:20 PM"). */
function formatIsoTimeForDisplay(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return format(d, TIME_DISPLAY_FORMAT);
}

/**
 * The uppercase date shown on the right of each version-list row
 * (e.g. "OCT 24, 2026").
 */
function formatVersionListDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return format(d, PDF_SIDEBAR_DATE_FORMAT).toUpperCase();
}

/**
 * Some fields (e.g. an award/license's "Represented Organization", captured
 * as one composite value rather than a real object-array item like School)
 * arrive JSON-stringified — `{"organization":"OXO Labs","organizationLocation":
 * "Colombo, Western Province, Sri Lanka"}` — instead of as a plain string.
 * Rendered as-is that reads as raw JSON to the recruiter, so it is parsed and
 * its values joined into one readable line ("OXO Labs, Colombo, Western
 * Province, Sri Lanka"), in the same key order the API sent them. Returns
 * null for anything that isn't a JSON *object* string (arrays/primitives —
 * and non-JSON text, via the try/catch) so the caller's own handling for
 * those is unaffected.
 */
function formatJsonObjectChangeValue(value: string): string | null {
  if (!value.startsWith('{') || !value.endsWith('}')) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    const parts = Object.values(parsed)
      .filter(part => part !== null && part !== undefined && part !== '')
      .map(String);
    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}

/**
 * Present one version-history change value. The API hands these over as
 * opaque strings with no type hint, so date-shaped values are detected by
 * shape and formatted for display ("2026-07-07T20:07:10" -> "7th Jul 2026,
 * 8:07 PM"); JSON-object-shaped values are flattened to a readable line (see
 * formatJsonObjectChangeValue); anything else is passed through untouched.
 */
function formatChangeValue(value: string): string {
  const trimmed = value.trim();
  const jsonFormatted = formatJsonObjectChangeValue(trimmed);
  if (jsonFormatted !== null) return jsonFormatted;
  if (!ISO_DATE_LIKE_PATTERN.test(trimmed)) return value;
  const d = parseLocalDate(trimmed);
  if (!d) return value;
  const hasTime = /[T ]\d{2}:\d{2}/.test(trimmed);
  return format(
    d,
    hasTime ? CHANGE_VALUE_DATE_TIME_FORMAT : DATE_DISPLAY_FORMAT
  );
}

export {
  formatDisplayDate,
  formatIsoDateTimeForDisplay,
  formatIsoDateForDisplay,
  formatIsoTimeForDisplay,
  formatVersionListDate,
  formatChangeValue,
  formatDateRange,
};
