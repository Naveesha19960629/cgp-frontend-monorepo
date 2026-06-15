import {
  DATE_DISPLAY_FORMAT,
  TWELVE_HOUR_TIME_REGEX,
  TWENTY_FOUR_HOUR_TIME_REGEX,
} from '@/views/vacancies/utils/constants';

import { format } from 'date-fns';

function to24HourTime(time: string): string {
  const trimmed = time.trim();

  const twentyFourHourMatch = TWENTY_FOUR_HOUR_TIME_REGEX.exec(trimmed);
  if (twentyFourHourMatch) {
    const hours = twentyFourHourMatch[1];
    const minutes = twentyFourHourMatch[2];
    const seconds = twentyFourHourMatch[3] ?? '00';
    return `${hours}:${minutes}:${seconds}`;
  }

  const match = TWELVE_HOUR_TIME_REGEX.exec(trimmed);
  if (!match) return trimmed;

  let hours = Number.parseInt(match[1], 10);
  const minutes = match[2];
  const seconds = match[3] ?? '00';
  const period = match[4].toUpperCase();

  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;

  return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
}

function formatDisplayDateTime(dateValue?: string, timeValue?: string) {
  if (!dateValue) return undefined;

  const formattedDate = format(new Date(dateValue), DATE_DISPLAY_FORMAT);
  if (!timeValue?.trim()) return formattedDate;

  const normalized = timeValue.trim();

  // Already 12-hour format, normalize to HH:mm:ss AM/PM.
  const twelveHourMatch = TWELVE_HOUR_TIME_REGEX.exec(normalized);
  if (twelveHourMatch) {
    const [, h, m, s = '00', period] = twelveHourMatch;
    return `${formattedDate} ${String(Number.parseInt(h, 10)).padStart(2, '0')}:${m}:${s} ${period.toUpperCase()}`;
  }

  // 24-hour input from the picker: HH:mm or HH:mm:ss.
  const twentyFourHourMatch = TWENTY_FOUR_HOUR_TIME_REGEX.exec(normalized);
  if (twentyFourHourMatch) {
    const [, hh, mm, ss = '00'] = twentyFourHourMatch;
    const hour24 = Number.parseInt(hh, 10);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    return `${formattedDate} ${String(hour12).padStart(2, '0')}:${mm}:${ss} ${period}`;
  }

  return formattedDate;
}

export { formatDisplayDateTime, to24HourTime };
