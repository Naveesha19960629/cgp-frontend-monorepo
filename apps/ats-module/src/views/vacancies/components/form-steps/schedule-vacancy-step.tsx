import { ArrowLeft2 } from 'iconsax-reactjs';

import { useCallback, useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  type ScheduleVacancyFormValues,
  toScheduleVacancyPayload,
  useCreateVacancyMutation,
  useScheduleVacancyForm,
  useUpdateVacancyMutation,
} from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { formatDisplayDateTime, to24HourTime } from '@/views/vacancies/utils';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { CalendarWithTime } from '@cgp/ui-kit/components/ui/calendar-with-time';
import { Label } from '@cgp/ui-kit/components/ui/label';
import { startOfToday } from 'date-fns';

export default function ScheduleVacancyStep({
  onBack,
  onSubmit,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { id } = useParams<'id'>();
  const navigate = useNavigate();
  const { form, setForm, onCancel, stepPersistRef } = useVacancyForm();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useScheduleVacancyForm(form.schedule);

  const publishDate = watch('schedulePublishDate');
  const publishTime = watch('schedulePublishTime');
  const expirationDate = watch('expirationDate');
  const expirationTime = watch('expirationTime');

  const hasPastScheduleDateTime = useMemo(() => {
    if (!publishDate || !publishTime || !expirationDate || !expirationTime) {
      return false;
    }

    const publishAt = new Date(`${publishDate}T${to24HourTime(publishTime)}`);
    const expirationAt = new Date(
      `${expirationDate}T${to24HourTime(expirationTime)}`
    );

    if (
      Number.isNaN(publishAt.getTime()) ||
      Number.isNaN(expirationAt.getTime())
    ) {
      return false;
    }

    const now = new Date();
    return publishAt < now || expirationAt < now;
  }, [publishDate, publishTime, expirationDate, expirationTime]);

  const { mutateAsync: createVacancy, isPending } = useCreateVacancyMutation();
  const { mutateAsync: updateVacancy, isPending: isUpdating } =
    useUpdateVacancyMutation();

  const persistScheduleToContext = useCallback(
    (values?: ScheduleVacancyFormValues) => {
      const currentValues = values ?? {
        schedulePublishDate: publishDate,
        schedulePublishTime: publishTime,
        expirationDate,
        expirationTime,
      };

      if (
        currentValues.schedulePublishDate &&
        currentValues.schedulePublishTime &&
        currentValues.expirationDate &&
        currentValues.expirationTime
      ) {
        setForm(prev => ({
          ...prev,
          schedule: toScheduleVacancyPayload(currentValues),
        }));
      }
    },
    [publishDate, publishTime, expirationDate, expirationTime, setForm]
  );

  useEffect(() => {
    stepPersistRef.current = () => {
      persistScheduleToContext();
    };

    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef, persistScheduleToContext]);

  const onInvalid = (formErrors: FieldErrors<ScheduleVacancyFormValues>) => {
    const expirationError = formErrors.expirationDate?.message;
    if (
      expirationError === 'scheduleVacancy.validation.expirationAfterPublish'
    ) {
      ErrorToast({
        title: t('scheduleVacancy.notifications.validationErrorTitle'),
        description: t(
          'scheduleVacancy.notifications.expirationLessOrEqualMessage'
        ),
      });
    }
  };

  const onValid = async (values: ScheduleVacancyFormValues) => {
    const publishAt = new Date(
      `${values.schedulePublishDate}T${to24HourTime(values.schedulePublishTime)}`
    );
    const expirationAt = new Date(
      `${values.expirationDate}T${to24HourTime(values.expirationTime)}`
    );
    const now = new Date();

    if (publishAt < now || expirationAt < now) {
      ErrorToast({
        title: t('scheduleVacancy.notifications.validationErrorTitle'),
        description: t('scheduleVacancy.notifications.pastDateTimeMessage'),
      });
      return;
    }

    try {
      const schedule = toScheduleVacancyPayload(values);
      const payloadForm = { ...form, schedule };

      if (id) {
        await updateVacancy({
          id,
          form: payloadForm,
          existingStatus: form.status,
        });
      } else {
        await createVacancy({ form: { ...form, schedule } });
      }
      SuccessToast({
        title: t(
          id
            ? 'scheduleVacancy.notifications.updateSuccessTitle'
            : 'scheduleVacancy.notifications.successTitle'
        ),
        description: t(
          id
            ? 'scheduleVacancy.notifications.updateSuccessMessage'
            : 'scheduleVacancy.notifications.successMessage'
        ),
      });
      onSubmit();
      navigate('/dashboard/ats/vacancies');
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
        {form.status ? <VacancyStatusBadge status={form.status} /> : null}
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-7 pb-6">
        <div className="flex flex-wrap gap-4">
          {/* ── Scheduled Publish Date & Time ── */}
          <div className="flex w-76 flex-col gap-1">
            <Label className="text-sm font-semibold text-slate-700">
              {t('scheduleVacancy.publishDateLabel')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="schedulePublishDate"
              render={({ field: dateField }) => (
                <Controller
                  control={control}
                  name="schedulePublishTime"
                  render={({ field: timeField }) => (
                    <CalendarWithTime
                      dateValue={dateField.value}
                      onDateChange={dateField.onChange}
                      timeValue={timeField.value}
                      onTimeChange={timeField.onChange}
                      timeLabel={t('scheduleVacancy.timeLabel')}
                      dateButtonPlaceholder={t(
                        'scheduleVacancy.publishDatePlaceholder'
                      )}
                      timeInputPlaceholder={t(
                        'scheduleVacancy.timePlaceholder'
                      )}
                      disabledDates={date => date < startOfToday()}
                      formattedDateDisplay={
                        dateField.value
                          ? formatDisplayDateTime(
                              dateField.value,
                              timeField.value
                            )
                          : undefined
                      }
                      error={
                        errors.schedulePublishDate?.message ||
                        errors.schedulePublishTime?.message
                          ? t(
                              errors.schedulePublishDate?.message ||
                                errors.schedulePublishTime?.message ||
                                ''
                            )
                          : undefined
                      }
                    />
                  )}
                />
              )}
            />
          </div>

          {/* ── Expiration Date & Time ── */}
          <div className="flex w-76 flex-col gap-1">
            <Label className="text-sm font-semibold text-slate-700">
              {t('scheduleVacancy.expirationDateLabel')}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="expirationDate"
              render={({ field: dateField }) => (
                <Controller
                  control={control}
                  name="expirationTime"
                  render={({ field: timeField }) => (
                    <CalendarWithTime
                      dateValue={dateField.value}
                      onDateChange={dateField.onChange}
                      timeValue={timeField.value}
                      onTimeChange={timeField.onChange}
                      timeLabel="Expiration Time"
                      dateButtonPlaceholder={t(
                        'scheduleVacancy.expirationDatePlaceholder'
                      )}
                      timeInputPlaceholder={t(
                        'scheduleVacancy.timePlaceholder'
                      )}
                      disabledDates={date => {
                        const localStr = [
                          date.getFullYear(),
                          String(date.getMonth() + 1).padStart(2, '0'),
                          String(date.getDate()).padStart(2, '0'),
                        ].join('-');
                        return (
                          date < startOfToday() ||
                          (publishDate ? localStr < publishDate : false)
                        );
                      }}
                      formattedDateDisplay={
                        dateField.value
                          ? formatDisplayDateTime(
                              dateField.value,
                              timeField.value
                            )
                          : undefined
                      }
                      error={(() => {
                        const msg =
                          errors.expirationDate?.message ||
                          errors.expirationTime?.message;
                        if (
                          !msg ||
                          msg ===
                            'scheduleVacancy.validation.expirationAfterPublish'
                        )
                          return undefined;
                        return t(msg);
                      })()}
                    />
                  )}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button
          variant="secondary"
          className="h-12 w-48"
          type="button"
          onClick={onCancel}
        >
          {t('scheduleVacancy.cancel')}
        </Button>
        <Button
          className="h-12 w-48"
          type="button"
          disabled={
            isPending || isUpdating || !isValid || hasPastScheduleDateTime
          }
          onClick={() => {
            handleSubmit(onValid, onInvalid)().catch(() => {});
          }}
        >
          {id ? t('common.save') : t('scheduleVacancy.create')}
        </Button>
      </div>
    </div>
  );
}
