import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';

import { z } from 'zod';

import type { ScheduleVacancy } from '@/views/vacancies/types';
import { TWELVE_HOUR_TIME_REGEX } from '@/views/vacancies/utils/constants';

const scheduleVacancySchema = z
  .object({
    schedulePublishDate: z
      .string()
      .min(1, 'scheduleVacancy.validation.publishDateRequired'),
    schedulePublishTime: z
      .string()
      .min(1, 'scheduleVacancy.validation.publishDateRequired'),
    expirationDate: z
      .string()
      .min(1, 'scheduleVacancy.validation.expirationDateRequired'),
    expirationTime: z
      .string()
      .min(1, 'scheduleVacancy.validation.expirationDateRequired'),
  })
  .superRefine((data, ctx) => {
    if (
      data.schedulePublishDate &&
      data.schedulePublishTime &&
      data.expirationDate &&
      data.expirationTime
    ) {
      const publish = new Date(
        `${data.schedulePublishDate}T${to24Hour(data.schedulePublishTime)}`
      );
      const expiration = new Date(
        `${data.expirationDate}T${to24Hour(data.expirationTime)}`
      );
      if (
        !Number.isNaN(publish.getTime()) &&
        !Number.isNaN(expiration.getTime())
      ) {
        if (expiration <= publish) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'scheduleVacancy.validation.expirationAfterPublish',
            path: ['expirationDate'],
          });
        }
      }
    }
  });

/**
 * Convert "HH:mm:ss" (24-hour) to "HH:mm:ss" (passthrough for 24-hour format).
 * Also handles "hh:mm[:ss] AM/PM" to "HH:mm:ss" for backward compatibility.
 */
function to24Hour(time: string): string {
  // Already in 24-hour format (HH:mm:ss)
  if (/^\d{2}:\d{2}:\d{2}$/.test(time.trim())) {
    return time;
  }
  // Also handle HH:mm format
  if (/^\d{2}:\d{2}$/.test(time.trim())) {
    return `${time}:00`;
  }
  // Handle AM/PM format for backward compatibility
  const match = TWELVE_HOUR_TIME_REGEX.exec(time.trim());
  if (!match) return time; // unrecognised — pass through
  let hours = Number.parseInt(match[1], 10);
  const minutes = match[2];
  const seconds = match[3] ?? '00';
  const period = match[4].toUpperCase();
  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;
  return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
}

/**
 * Parse backend datetime strings into separate date and time strings for the
 * form. Handles both 24-hour ISO (from API) and 12-hour AM/PM (legacy).
 *
 * Accepted inputs:
 *   "2026-06-24T10:00:00"         (24-hour ISO — primary API format)
 *   "2026-06-24T10:00:00.000"     (24-hour ISO with ms)
 *   "2026-06-25T05:27:10 PM"      (12-hour with T separator)
 *   "2026-06-25 05:27:10 PM"      (12-hour with space separator)
 */
function parseBackendDatetime(value: string): { date: string; time: string } {
  const trimmed = value.trim();

  // 1. 12-hour AM/PM format (e.g. "2026-06-25T05:27:10 PM", "2026-06-25 05:27 PM")
  const twelveHourMatch =
    /^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}:\d{2}(?::\d{2})?)(?:\.\d+)?\s*(AM|PM)$/i.exec(
      trimmed
    );
  if (twelveHourMatch) {
    return {
      date: twelveHourMatch[1],
      time: `${twelveHourMatch[2]} ${twelveHourMatch[3].toUpperCase()}`,
    };
  }

  // 2. 24-hour format (e.g. "2026-06-24T01:00:00", "2026-06-24 01:00:00")
  const twentyFourHourMatch =
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?$/i.exec(
      trimmed
    );
  if (twentyFourHourMatch) {
    const date = twentyFourHourMatch[1];
    const time24 = twentyFourHourMatch[2];
    const parts = time24.split(':');
    const hours24 = Number.parseInt(parts[0], 10);
    const minutes = parts[1];
    const seconds = parts[2] ?? '00';

    const period = hours24 >= 12 ? 'PM' : 'AM';
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;

    return {
      date,
      time: `${String(hours12).padStart(2, '0')}:${minutes}:${seconds} ${period}`,
    };
  }

  // Fallback: return whatever is before the separator as the date
  return { date: trimmed.split(/[T ]/)[0] ?? '', time: '' };
}

type ScheduleVacancyFormValues = z.infer<typeof scheduleVacancySchema>;

/**
 * Convert "HH:mm:ss" (24-hour) to "hh:mm:ss AM/PM" (12-hour) for backend API.
 * If already in AM/PM format, normalize to always include seconds.
 */
function from24Hour(time: string): string {
  if (!time) return '';
  const trimmedTime = time.trim();

  // Already in AM/PM format - normalize and ensure seconds are included
  const twelveHourMatch = TWELVE_HOUR_TIME_REGEX.exec(trimmedTime);
  if (twelveHourMatch) {
    const [, hours, minutes, seconds = '00', period] = twelveHourMatch;
    return `${String(Number.parseInt(hours, 10)).padStart(2, '0')}:${minutes}:${seconds} ${period.toUpperCase()}`;
  }

  const [hours, minutes, seconds = '00'] = trimmedTime.split(':');
  const hour24 = Number.parseInt(hours, 10);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, '0')}:${minutes}:${seconds} ${period}`;
}

/**
 * Build the API payload strings in the format the backend expects.
 * Uses the T-separator + seconds variant: "2026-06-25T05:27:10 PM".
 * If the user omits seconds (types "05:27 PM"), that shorter form is sent
 * as-is — the backend also accepts it.
 */
function toScheduleVacancyPayload(
  values: ScheduleVacancyFormValues
): ScheduleVacancy {
  return {
    schedulePublishAt: `${values.schedulePublishDate}T${from24Hour(values.schedulePublishTime.trim())}`,
    expirationAt: `${values.expirationDate}T${from24Hour(values.expirationTime.trim())}`,
  };
}

function useScheduleVacancyForm(defaults?: Partial<ScheduleVacancy>) {
  const publish = defaults?.schedulePublishAt
    ? parseBackendDatetime(defaults.schedulePublishAt)
    : null;
  const expiration = defaults?.expirationAt
    ? parseBackendDatetime(defaults.expirationAt)
    : null;

  return useForm<ScheduleVacancyFormValues>({
    resolver: zodResolver(scheduleVacancySchema),
    mode: 'onChange',
    defaultValues: {
      schedulePublishDate: publish?.date ?? '',
      schedulePublishTime: publish?.time ?? '',
      expirationDate: expiration?.date ?? '',
      expirationTime: expiration?.time ?? '',
    },
  });
}

export {
  useScheduleVacancyForm,
  toScheduleVacancyPayload,
  to24Hour,
  from24Hour,
  parseBackendDatetime,
};
export type { ScheduleVacancyFormValues };
