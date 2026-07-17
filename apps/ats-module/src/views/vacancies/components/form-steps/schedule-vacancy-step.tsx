import { Loader2 } from 'lucide-react';

import { ArrowLeft2 } from 'iconsax-reactjs';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { VacancyOnholdUpdateDialog } from '@/views/vacancies/components';
import VacancyNoRescheduleConfirmDialog from '@/views/vacancies/components/vacancy-no-reschedule-confirm-dialog';
import VacancyRescheduleConfirmDialog from '@/views/vacancies/components/vacancy-reschedule-confirm-dialog';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  type ScheduleVacancyFormValues,
  from24Hour,
  parseBackendDatetime,
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
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { id } = useParams<'id'>();
  const navigate = useNavigate();
  const location = useLocation();
  // Set when the recruiter reached this step via the Active/Inactive toggle's
  // "Schedule" action — the vacancy must be updated as ONHOLD so the backend
  // accepts the reschedule and auto-activates at the configured date.
  const scheduleToOnhold =
    (location.state as { scheduleToOnhold?: boolean } | null)
      ?.scheduleToOnhold ?? false;
  const {
    form,
    setForm,
    onCancel,
    stepPersistRef,
    resolveFormUserCreatedEntries,
    templateId,
  } = useVacancyForm();

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

  // Matches the disabled-until-filled Back behavior used by every other step —
  // this step has no isEnabled toggle, so "the enabled section" is just these
  // four fields.
  const shouldDisableNavigation = !(
    publishDate ||
    publishTime ||
    expirationDate ||
    expirationTime
  );

  const isScheduleChanged = useMemo(() => {
    if (!form.schedule?.schedulePublishAt || !form.schedule?.expirationAt) {
      return true;
    }
    if (!publishDate || !publishTime || !expirationDate || !expirationTime) {
      return true;
    }

    // Compare as timestamps, not raw strings — the stored value may be
    // 24-hour ISO from the API while the form always watches 12-hour AM/PM,
    // so a direct string comparison flags "changed" even with no edits.
    const savedPublish = parseBackendDatetime(form.schedule.schedulePublishAt);
    const savedExpiration = parseBackendDatetime(form.schedule.expirationAt);

    const savedPublishTs = new Date(
      `${savedPublish.date}T${to24HourTime(savedPublish.time)}`
    );
    const savedExpirationTs = new Date(
      `${savedExpiration.date}T${to24HourTime(savedExpiration.time)}`
    );
    const currentPublishTs = new Date(
      `${publishDate}T${to24HourTime(publishTime)}`
    );
    const currentExpirationTs = new Date(
      `${expirationDate}T${to24HourTime(expirationTime)}`
    );

    if (
      Number.isNaN(savedPublishTs.getTime()) ||
      Number.isNaN(savedExpirationTs.getTime()) ||
      Number.isNaN(currentPublishTs.getTime()) ||
      Number.isNaN(currentExpirationTs.getTime())
    ) {
      return true;
    }

    return (
      currentPublishTs.getTime() !== savedPublishTs.getTime() ||
      currentExpirationTs.getTime() !== savedExpirationTs.getTime()
    );
  }, [publishDate, publishTime, expirationDate, expirationTime, form.schedule]);

  const isPublishDateChanged = useMemo(() => {
    if (!form.schedule?.schedulePublishAt) return true;
    if (!publishDate || !publishTime) return false;

    // Compare as timestamps to avoid format mismatches between the stored
    // value (may be 24-hour ISO from the API) and the form's 12-hour AM/PM.
    const saved = parseBackendDatetime(form.schedule.schedulePublishAt);
    const savedTs = new Date(`${saved.date}T${to24HourTime(saved.time)}`);
    const currentTs = new Date(`${publishDate}T${to24HourTime(publishTime)}`);

    if (Number.isNaN(savedTs.getTime()) || Number.isNaN(currentTs.getTime())) {
      return true;
    }

    return currentTs.getTime() !== savedTs.getTime();
  }, [publishDate, publishTime, form.schedule]);

  const hasPastScheduleDateTime = useMemo(() => {
    if (form.status === 'expired') return false;

    // An on-hold vacancy's scheduled date is a promise to publish in the
    // future, so an already-lapsed date is invalid and must be rescheduled —
    // evaluate the past-date check even when the schedule is unchanged. For
    // other statuses (e.g. live/active) an unchanged, already-past publish date
    // is expected, so skip the check to avoid blocking edits to other fields.
    if (!isScheduleChanged && form.status !== 'on_hold') {
      return false;
    }

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
  }, [
    form.status,
    publishDate,
    publishTime,
    expirationDate,
    expirationTime,
    isScheduleChanged,
  ]);

  const { mutateAsync: createVacancy, isPending } = useCreateVacancyMutation();
  const { mutateAsync: updateVacancy, isPending: isUpdating } =
    useUpdateVacancyMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCreateAction =
    !id || form.status === 'new' || form.status === 'draft';

  const isOnholdVacancy = form.status === 'on_hold';
  const isOnholdWithApplicants =
    isOnholdVacancy && (form.applicantCount ?? 0) > 0;

  const [confirmDialog, setConfirmDialog] = useState<
    'reschedule' | 'noReschedule' | null
  >(null);
  const [showOnholdDialog, setShowOnholdDialog] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<ScheduleVacancyFormValues | null>(null);

  const persistScheduleToContext = useCallback(
    (values?: ScheduleVacancyFormValues) => {
      const currentValues = values ?? {
        schedulePublishDate: publishDate,
        schedulePublishTime: publishTime,
        expirationDate,
        expirationTime,
      };

      const hasAny =
        currentValues.schedulePublishDate ||
        currentValues.schedulePublishTime ||
        currentValues.expirationDate ||
        currentValues.expirationTime;

      if (!hasAny) return;

      // All four fields present — use the full payload builder (AM/PM format)
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
        return;
      }

      // Partial data — still send the AM/PM format the backend expects
      // (parseBackendDatetime can recover either format when the user
      // returns to this step).
      const buildPartialAt = (date: string, time: string) =>
        date || time ? `${date}T${from24Hour(time.trim())}` : '';

      setForm(prev => ({
        ...prev,
        schedule: {
          schedulePublishAt: buildPartialAt(
            currentValues.schedulePublishDate,
            currentValues.schedulePublishTime
          ),
          expirationAt: buildPartialAt(
            currentValues.expirationDate,
            currentValues.expirationTime
          ),
        },
      }));
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

  const executeUpdate = async (
    values: ScheduleVacancyFormValues,
    existingStatusOverride?: string
  ) => {
    // LIVE if publish time is now or in the past, UNPUBLISHED if future
    const publishAt = new Date(
      `${values.schedulePublishDate}T${to24HourTime(values.schedulePublishTime)}`
    );
    const targetStatus = publishAt <= new Date() ? 'live' : 'unpublished';
    const targetApiStatus = targetStatus === 'live' ? 'LIVE' : 'UNPUBLISHED';

    setIsSubmitting(true);
    try {
      const schedule = toScheduleVacancyPayload(values);
      const payloadForm = await resolveFormUserCreatedEntries({
        ...form,
        schedule,
      });
      setForm(payloadForm);

      if (id) {
        const existingStatus =
          existingStatusOverride ??
          (scheduleToOnhold
            ? 'on_hold'
            : isCreateAction
              ? targetStatus
              : form.status);
        await updateVacancy({
          id,
          form: payloadForm,
          existingStatus,
        });
      } else {
        await createVacancy({
          form: payloadForm,
          status: targetApiStatus,
          templateId,
        });
      }
      SuccessToast({
        title: t(
          isCreateAction
            ? 'scheduleVacancy.notifications.successTitle'
            : 'scheduleVacancy.notifications.updateSuccessTitle'
        ),
        description: t(
          isCreateAction
            ? 'scheduleVacancy.notifications.successMessage'
            : 'scheduleVacancy.notifications.updateSuccessMessage'
        ),
      });
      onSubmit();
      void navigate('/dashboard/ats/vacancies');
    } catch {
      ErrorToast({
        title: t('scheduleVacancy.notifications.apiErrorTitle'),
        description: t('scheduleVacancy.notifications.apiErrorMessage'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onValid = async (values: ScheduleVacancyFormValues) => {
    const publishAt = new Date(
      `${values.schedulePublishDate}T${to24HourTime(values.schedulePublishTime)}`
    );
    const expirationAt = new Date(
      `${values.expirationDate}T${to24HourTime(values.expirationTime)}`
    );

    if (form.status === 'expired') {
      if (isScheduleChanged) {
        const now = new Date();
        if (publishAt < now || expirationAt < now) {
          ErrorToast({
            title: t('scheduleVacancy.notifications.validationErrorTitle'),
            description: t('scheduleVacancy.notifications.pastDateTimeMessage'),
          });
          return;
        }
      }
      setPendingValues(values);
      setConfirmDialog(isPublishDateChanged ? 'reschedule' : 'noReschedule');
      return;
    }

    if (isScheduleChanged) {
      const now = new Date();

      if (publishAt < now || expirationAt < now) {
        ErrorToast({
          title: t('scheduleVacancy.notifications.validationErrorTitle'),
          description: t('scheduleVacancy.notifications.pastDateTimeMessage'),
        });
        return;
      }
    }

    // For all onhold vacancies, show confirmation dialog first
    if (!isCreateAction && isOnholdVacancy) {
      setPendingValues(values);
      setShowOnholdDialog(true);
      return;
    }

    await executeUpdate(values);
  };

  const handleConfirmUpdate = async () => {
    if (!pendingValues) return;
    const isReschedule = confirmDialog === 'reschedule';
    setConfirmDialog(null);
    await executeUpdate(pendingValues, isReschedule ? 'on_hold' : undefined);
    setPendingValues(null);
  };

  const handleOnholdConfirm = async () => {
    if (!pendingValues) return;
    setShowOnholdDialog(false);
    await executeUpdate(pendingValues);
    setPendingValues(null);
  };

  const handleBack = () => {
    persistScheduleToContext();
    onBack();
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-7 py-8">
        <button
          type="button"
          aria-label={t('common.back')}
          disabled={shouldDisableNavigation}
          className="cursor-pointer text-slate-700 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={handleBack}
        >
          <ArrowLeft2 size={24} />
        </button>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {t('scheduleVacancy.title')}
        </h2>
        {(() => {
          const displayStatus = scheduleToOnhold ? 'on_hold' : form.status;
          return displayStatus ? (
            <VacancyStatusBadge status={displayStatus} />
          ) : null;
        })()}
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
                      timeLabel={t('scheduleVacancy.expirationTimeLabel')}
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
            isSubmitting ||
            isPending ||
            isUpdating ||
            !isValid ||
            hasPastScheduleDateTime
          }
          onClick={() => {
            handleSubmit(onValid, onInvalid)().catch(() => {});
          }}
        >
          {(isSubmitting || isPending || isUpdating) && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {isCreateAction
            ? t('scheduleVacancy.create')
            : t('scheduleVacancy.update')}
        </Button>
      </div>

      <VacancyRescheduleConfirmDialog
        open={confirmDialog === 'reschedule'}
        onOpenChange={open => {
          if (!open) setConfirmDialog(null);
        }}
        onConfirm={() => {
          handleConfirmUpdate().catch(() => {});
        }}
        isConfirming={isSubmitting || isPending || isUpdating}
      />

      <VacancyNoRescheduleConfirmDialog
        open={confirmDialog === 'noReschedule'}
        onOpenChange={open => {
          if (!open) setConfirmDialog(null);
        }}
        onConfirm={() => {
          handleConfirmUpdate().catch(() => {});
        }}
        isConfirming={isSubmitting || isPending || isUpdating}
      />

      {/* ── Onhold update confirmation dialog ───────────────────────── */}
      <VacancyOnholdUpdateDialog
        open={showOnholdDialog}
        onOpenChange={setShowOnholdDialog}
        onConfirm={() => {
          void handleOnholdConfirm();
        }}
        isPublishDateChanged={isPublishDateChanged}
        hasApplicants={isOnholdWithApplicants}
        isConfirming={isSubmitting || isPending || isUpdating}
      />
    </div>
  );
}
