import { parseBackendDatetime } from '@/views/vacancies/hooks/use-schedule-vacancy-form';
import type { ScheduleVacancy } from '@/views/vacancies/types';
import { to24HourTime } from '@/views/vacancies/utils/schedule-display-date-time';

interface ScheduleFormValues {
  schedulePublishDate: string;
  schedulePublishTime: string;
  expirationDate: string;
  expirationTime: string;
}

function toTimestamp(date: string, time: string): number {
  return new Date(`${date}T${to24HourTime(time)}`).getTime();
}

/**
 * Compares the vacancy's saved schedule against the values currently in the
 * form, always as Date timestamps — never raw strings. The saved value may
 * be 24-hour ISO from the API while the form always watches 12-hour AM/PM,
 * so a direct string comparison would flag "changed" with no edits made.
 * Missing or unparseable values are treated as "changed" so callers fall
 * back to the safer, confirmation-required path.
 */
function hasScheduleChanged(
  savedSchedule: Partial<ScheduleVacancy> | undefined,
  current: ScheduleFormValues
): boolean {
  if (!savedSchedule?.schedulePublishAt || !savedSchedule?.expirationAt) {
    return true;
  }

  const {
    schedulePublishDate,
    schedulePublishTime,
    expirationDate,
    expirationTime,
  } = current;

  if (
    !schedulePublishDate ||
    !schedulePublishTime ||
    !expirationDate ||
    !expirationTime
  ) {
    return true;
  }

  const savedPublish = parseBackendDatetime(savedSchedule.schedulePublishAt);
  const savedExpiration = parseBackendDatetime(savedSchedule.expirationAt);

  const savedPublishTs = toTimestamp(savedPublish.date, savedPublish.time);
  const savedExpirationTs = toTimestamp(
    savedExpiration.date,
    savedExpiration.time
  );
  const currentPublishTs = toTimestamp(
    schedulePublishDate,
    schedulePublishTime
  );
  const currentExpirationTs = toTimestamp(expirationDate, expirationTime);

  if (
    Number.isNaN(savedPublishTs) ||
    Number.isNaN(savedExpirationTs) ||
    Number.isNaN(currentPublishTs) ||
    Number.isNaN(currentExpirationTs)
  ) {
    return true;
  }

  return (
    currentPublishTs !== savedPublishTs ||
    currentExpirationTs !== savedExpirationTs
  );
}

/**
 * Compares only the scheduled publish date & time (ignoring expiration) —
 * this is what decides Reschedule vs. non-Reschedule confirmation copy for
 * both the Live and Expired vacancy update flows.
 */
function hasPublishDateChanged(
  savedSchedule: Pick<ScheduleVacancy, 'schedulePublishAt'> | undefined,
  current: Pick<
    ScheduleFormValues,
    'schedulePublishDate' | 'schedulePublishTime'
  >
): boolean {
  if (!savedSchedule?.schedulePublishAt) return true;

  const { schedulePublishDate, schedulePublishTime } = current;
  if (!schedulePublishDate || !schedulePublishTime) return false;

  const saved = parseBackendDatetime(savedSchedule.schedulePublishAt);
  const savedTs = toTimestamp(saved.date, saved.time);
  const currentTs = toTimestamp(schedulePublishDate, schedulePublishTime);

  if (Number.isNaN(savedTs) || Number.isNaN(currentTs)) return true;

  return currentTs !== savedTs;
}

export { hasScheduleChanged, hasPublishDateChanged };
export type { ScheduleFormValues };
