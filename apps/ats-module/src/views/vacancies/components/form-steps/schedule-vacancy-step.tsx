import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  type ScheduleVacancyFormValues,
  toScheduleVacancyPayload,
  useCreateVacancyMutation,
  useScheduleVacancyForm,
} from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate } from '@/views/vacancies/utils';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';
import { format, startOfToday } from 'date-fns';

type DateField = 'publishDate' | 'expirationDate';

export default function ScheduleVacancyStep({
  onBack,
  onSubmit,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form } = useVacancyForm();
  const [openPopover, setOpenPopover] = useState<DateField | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useScheduleVacancyForm(form.schedule);

  const publishDate = watch('schedulePublishDate');

  const { mutateAsync: createVacancy, isPending } = useCreateVacancyMutation();

  const onValid = async (values: ScheduleVacancyFormValues) => {
    try {
      await createVacancy(toScheduleVacancyPayload(values));
      SuccessToast({
        title: t('scheduleVacancy.notifications.successTitle'),
        description: t('scheduleVacancy.notifications.successMessage'),
      });
      onSubmit();
    } catch {
      ErrorToast({
        title: t('scheduleVacancy.notifications.apiErrorTitle'),
        description: t('scheduleVacancy.notifications.apiErrorMessage'),
      });
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-7 py-8">
        <button
          type="button"
          aria-label={t('common.back')}
          className="text-slate-700 transition-colors hover:text-slate-900"
          onClick={onBack}
        >
          <ArrowLeft2 size={24} />
        </button>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {t('scheduleVacancy.title')}
        </h2>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-7 pb-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ── Scheduled Publish Date & Time ── */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-semibold text-slate-700">
              {t('scheduleVacancy.publishDateLabel')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="schedulePublishDate"
              render={({ field }) => (
                <Popover
                  modal
                  open={openPopover === 'publishDate'}
                  onOpenChange={open =>
                    setOpenPopover(open ? 'publishDate' : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                        !field.value && 'text-slate-500',
                        field.value && 'text-zinc-800',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                        'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                        applyTypography('body-medium'),
                        'shadow-none!'
                      )}
                    >
                      {field.value ? (
                        formatDate(field.value)
                      ) : (
                        <span>
                          {t('scheduleVacancy.publishDatePlaceholder')}
                        </span>
                      )}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-zinc-800"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      defaultMonth={
                        field.value ? new Date(field.value) : new Date()
                      }
                      onSelect={date => {
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                        setOpenPopover(null);
                      }}
                      disabled={date => date < startOfToday()}
                      captionLayout="dropdown"
                      startMonth={new Date()}
                      endMonth={new Date(new Date().getFullYear() + 100, 11)}
                    />
                    <div className="border-t px-3 py-3">
                      <Label className="mb-1 block text-xs text-slate-600">
                        {t('scheduleVacancy.timeLabel')}
                      </Label>
                      <Controller
                        control={control}
                        name="schedulePublishTime"
                        render={({ field: timeField }) => (
                          <Input
                            {...timeField}
                            placeholder={t('scheduleVacancy.timePlaceholder')}
                            className="h-9 text-sm"
                          />
                        )}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
            {(errors.schedulePublishDate ?? errors.schedulePublishTime) && (
              <p className="text-destructive mt-1 text-sm">
                {t(
                  errors.schedulePublishDate?.message ??
                    errors.schedulePublishTime?.message ??
                    ''
                )}
              </p>
            )}
          </div>

          {/* ── Expiration Date & Time ── */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-semibold text-slate-700">
              {t('scheduleVacancy.expirationDateLabel')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="expirationDate"
              render={({ field }) => (
                <Popover
                  modal
                  open={openPopover === 'expirationDate'}
                  onOpenChange={open =>
                    setOpenPopover(open ? 'expirationDate' : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                        !field.value && 'text-slate-500',
                        field.value && 'text-zinc-800',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                        'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                        applyTypography('body-medium'),
                        'shadow-none!'
                      )}
                    >
                      {field.value ? (
                        formatDate(field.value)
                      ) : (
                        <span>
                          {t('scheduleVacancy.expirationDatePlaceholder')}
                        </span>
                      )}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-zinc-800"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      defaultMonth={
                        field.value ? new Date(field.value) : new Date()
                      }
                      onSelect={date => {
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                        setOpenPopover(null);
                      }}
                      disabled={date =>
                        date < startOfToday() ||
                        (publishDate ? date < new Date(publishDate) : false)
                      }
                      captionLayout="dropdown"
                      startMonth={new Date()}
                      endMonth={new Date(new Date().getFullYear() + 100, 11)}
                    />
                    <div className="border-t px-3 py-3">
                      <Label className="mb-1 block text-xs text-slate-600">
                        {t('scheduleVacancy.timeLabel')}
                      </Label>
                      <Controller
                        control={control}
                        name="expirationTime"
                        render={({ field: timeField }) => (
                          <Input
                            {...timeField}
                            placeholder={t('scheduleVacancy.timePlaceholder')}
                            className="h-9 text-sm"
                          />
                        )}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
            {(errors.expirationDate ?? errors.expirationTime) && (
              <p className="text-destructive mt-1 text-sm">
                {t(
                  errors.expirationDate?.message ??
                    errors.expirationTime?.message ??
                    ''
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button
          variant="secondary"
          className="h-12 w-48"
          type="button"
          onClick={onBack}
        >
          {t('scheduleVacancy.cancel')}
        </Button>
        <Button
          className="h-12 w-48"
          type="button"
          disabled={isPending}
          onClick={() => {
            handleSubmit(onValid)().catch(() => {});
          }}
        >
          {t('scheduleVacancy.create')}
        </Button>
      </div>
    </div>
  );
}
