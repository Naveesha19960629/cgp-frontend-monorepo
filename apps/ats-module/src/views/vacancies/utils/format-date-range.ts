import { DATE_DISPLAY_FORMAT } from '@/views/vacancies/utils/constants';
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
 * Format a start/end date pair as a display range:
 * - both  -> "12th Jan 2022 - 13th Feb 2023"
 * - start -> "12th Jan 2022 - Present"
 * - end   -> "Until 13th Feb 2023"
 */
function formatDateRange(startDate?: string, endDate?: string): string {
  const start = formatDisplayDate(startDate);
  const end = formatDisplayDate(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - Present`;
  if (end) return `Until ${end}`;
  return '';
}

export { formatDisplayDate, formatDateRange };
