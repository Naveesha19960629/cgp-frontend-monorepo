import { Clock2Icon } from 'lucide-react';

import type { KeyboardEvent, ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { createDateClearHandler } from '@cgp/ui-kit/lib/keyboard-actions';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';

interface CalendarWithTimeProps {
  /**
   * The selected date in ISO format (YYYY-MM-DD)
   */
  dateValue: string;

  /**
   * Callback when date changes - receives ISO format (YYYY-MM-DD)
   */
  onDateChange: (date: string) => void;

  /**
   * The selected time in HH:mm:ss format (e.g., "10:30:00")
   */
  timeValue: string;

  /**
   * Callback when time changes - receives time in HH:mm:ss format
   */
  onTimeChange: (time: string) => void;

  /**
   * Label for the time input (e.g., "Schedule Time" or "Expiration Time")
   */
  timeLabel: string;

  /**
   * Placeholder text for the date button
   */
  dateButtonPlaceholder: string;

  /**
   * Placeholder text for the time input
   */
  timeInputPlaceholder?: string;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Function to determine which dates should be disabled
   */
  disabledDates?: (date: Date) => boolean;

  /**
   * Error message to display (if any)
   */
  error?: string;

  /**
   * Whether the component is disabled
   */
  disabled?: boolean;

  /**
   * Optional custom icon for the time input addon (defaults to Clock2Icon)
   */
  icon?: ReactNode;

  /**
   * Whether to show days outside the month
   */
  showOutsideDays?: boolean;

  /**
   * Start month for the calendar
   */
  startMonth?: Date;

  /**
   * End month for the calendar
   */
  endMonth?: Date;

  /**
   * Formatted date display string (e.g., "10 Jan 2025")
   * If provided, this will be shown on the button instead of the raw dateValue
   */
  formattedDateDisplay?: string;

  /**
   * NFR-024 (ATS): clears both the date and the time. When set, Backspace or
   * Delete on the focused field, or anywhere in the open popover except the
   * time input (which keeps normal editing), calls it and closes the popover.
   */
  onClear?: () => void;
}

/**
 * Normalize a time string to the 24-hour "HH:mm:ss" form required by the native
 * <input type="time"> control. Accepts 12-hour "hh:mm[:ss] AM/PM" (as produced
 * when the value is hydrated from the API/display format) and 24-hour
 * "HH:mm[:ss]" (as emitted by the input itself). Without this, a 12-hour value
 * like "01:00:00 PM" was truncated to "01:00:00" and shown as 1 AM.
 */
function toTimeInputValue(time: string): string {
  if (!time) return '';
  const trimmed = time.trim();

  const twelveHour = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(
    trimmed
  );
  if (twelveHour) {
    let hours = Number.parseInt(twelveHour[1], 10) % 12;
    if (twelveHour[4].toUpperCase() === 'PM') hours += 12;
    const minutes = twelveHour[2];
    const seconds = twelveHour[3] ?? '00';
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
  }

  const twentyFourHour = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (twentyFourHour) {
    return `${twentyFourHour[1]}:${twentyFourHour[2]}:${twentyFourHour[3] ?? '00'}`;
  }

  return trimmed.substring(0, 8);
}

export function CalendarWithTime({
  dateValue,
  onDateChange,
  timeValue,
  onTimeChange,
  timeLabel,
  dateButtonPlaceholder,
  timeInputPlaceholder,
  className,
  disabledDates,
  error,
  disabled = false,
  icon = <Clock2Icon className="text-muted-foreground" size={18} />,
  showOutsideDays = true,
  startMonth = new Date(),
  endMonth = new Date(new Date().getFullYear() + 100, 11),
  formattedDateDisplay,
  onClear,
}: Readonly<CalendarWithTimeProps>) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const hasValue = Boolean(dateValue || timeValue);

  const clear = () => {
    onClear?.();
    setIsOpen(false);
  };

  // The calendar clears a selected date itself (its deselect lands in
  // handleDateSelect); this catches the rest of the popover, e.g. a time set
  // without a date, but never the time input.
  const handlePopoverKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClear || !hasValue || event.defaultPrevented) return;
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    if (event.target instanceof HTMLInputElement) return;
    event.preventDefault();
    clear();
  };

  const selectedDate = dateValue ? new Date(dateValue) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    // Deselecting the day (click again, or Backspace/Delete) clears the
    // whole value when the caller allows it; otherwise the date stays.
    if (!date) {
      if (onClear) clear();
      return;
    }
    // Convert to ISO string (YYYY-MM-DD format)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onDateChange(`${year}-${month}-${day}`);
  };

  // The native <input type="time"> only accepts 24-hour "HH:mm:ss"; convert so a
  // hydrated 12-hour PM value doesn't render as AM (step="1" requires seconds).
  const timeInputValue = toTimeInputValue(timeValue);

  // Handle time input change — step="1" gives HH:mm:ss directly
  const handleTimeChange = (newTime: string) => {
    if (newTime) {
      const parts = newTime.split(':');
      const normalized = parts.length >= 3 ? newTime : `${newTime}:00`;
      onTimeChange(normalized);
      return;
    }

    if (!timeValue) {
      onTimeChange('');
      return;
    }

    // The native <input type="time"> reports an empty value while a segment
    // is mid-edit and briefly out of range (e.g. typing "0" over the hour of
    // an already-set "10:00:00 PM" isn't a valid 12-hour hour) — not just
    // when the user actually clears the field. Ignoring it here keeps the
    // previously valid time (the controlled `value` below reasserts it on
    // the input) instead of wiping the field and surfacing a spurious
    // "required" error.
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover modal open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onKeyDown={
              onClear
                ? createDateClearHandler({ hasValue, isOpen, onClear: clear })
                : undefined
            }
            className={cn(
              'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
              !dateValue && 'text-slate-500',
              dateValue && 'text-zinc-800',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              error
                ? 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border-destructive'
                : 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
              'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
              applyTypography('body-medium'),
              'shadow-none!'
            )}
          >
            <span>
              {formattedDateDisplay || dateValue || dateButtonPlaceholder}
            </span>
            <svg
              className="text-zinc-800"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          aria-label={t('common.a11y.chooseDateTime')}
          className="w-auto p-0"
          align="start"
          onKeyDown={handlePopoverKeyDown}
        >
          <div className="bg-background">
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate || startMonth}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              showOutsideDays={showOutsideDays}
              captionLayout="dropdown"
              startMonth={startMonth}
              endMonth={endMonth}
            />
            <div className="bg-popover border-t px-4 py-3">
              <Label
                htmlFor="calendar-time"
                className="mb-2 block text-sm font-medium"
              >
                {timeLabel}
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
                  {icon}
                </div>
                <Input
                  id="calendar-time"
                  type="time"
                  step="1"
                  value={timeInputValue}
                  onChange={e => handleTimeChange(e.target.value)}
                  placeholder={timeInputPlaceholder}
                  disabled={disabled}
                  className={cn(
                    'h-10 w-full pr-3 pl-9 text-sm',
                    'appearance-none [&::-webkit-calendar-picker-indicator]:hidden'
                  )}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
