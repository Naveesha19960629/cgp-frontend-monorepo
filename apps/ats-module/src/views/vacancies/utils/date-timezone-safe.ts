/**
 * Parse a date string in local timezone without UTC offset issues.
 * Handles both date-only (YYYY-MM-DD) and full ISO strings.
 *
 * @param dateString - Date string to parse (e.g., "2026-06-08" or "2026-06-08T10:30:00Z")
 * @returns Date object representing the date in local timezone, or null if invalid
 */
export function parseLocalDate(dateString?: string): Date | null {
  if (!dateString) return null;

  // If it's a date-only string (YYYY-MM-DD), parse it as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Otherwise, use standard Date parsing (handles ISO strings with timezone)
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format a Date object to date-only string (YYYY-MM-DD) in local timezone.
 * Ensures correct date without timezone offset issues.
 *
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatLocalDate(date?: Date | string): string {
  if (!date) return '';

  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  if (!d) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Safe date comparison without timezone offset issues.
 *
 * @param date1 - First date string or Date object
 * @param date2 - Second date string or Date object
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(
  date1?: string | Date,
  date2?: string | Date
): number {
  const d1 = typeof date1 === 'string' ? parseLocalDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseLocalDate(date2) : date2;

  if (!d1 || !d2) return 0;

  const time1 = d1.getTime();
  const time2 = d2.getTime();

  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
}
