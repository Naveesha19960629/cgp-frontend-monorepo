import { Loader2 } from 'lucide-react';

import { ArrowLeft2 } from 'iconsax-reactjs';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  VacancyLiveUpdateDialog,
  VacancyOnholdUpdateDialog,
} from '@/views/vacancies/components';
import SimpleConfirmDialog from '@/views/vacancies/components/simple-confirm-dialog';
import VacancyNoRescheduleConfirmDialog from '@/views/vacancies/components/vacancy-no-reschedule-confirm-dialog';
import VacancyRescheduleConfirmDialog from '@/views/vacancies/components/vacancy-reschedule-confirm-dialog';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  type ScheduleVacancyFormValues,
  from24Hour,
  toScheduleVacancyPayload,
  useCreateVacancyMutation,
  useNotifyApplicantsMutation,
  useScheduleVacancyForm,
  useUpdateVacancyMutation,
} from '@/views/vacancies/hooks';
import type {
  ApplicationFormChanges,
  StepProps,
} from '@/views/vacancies/types';
import {
  detectApplicationFormChanges,
  formatDisplayDateTime,
  hasPublishDateChanged,
  hasScheduleChanged,
  to24HourTime,
} from '@/views/vacancies/utils';
import { getHundredYearDateBoundaries } from '@/views/vacancies/utils/date-timezone-safe';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { CalendarWithTime } from '@cgp/ui-kit/components/ui/calendar-with-time';
import { Label } from '@cgp/ui-kit/components/ui/label';
import { startOfToday } from 'date-fns';

// Both the publish and expiration dates must fall within [today, today + 100
// years] — selecting anything further out is not a valid schedule.
const { today: TODAY, maxDate: HUNDRED_YEARS_FROM_NOW } =
  getHundredYearDateBoundaries();

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
    originalFormRef,
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

  const isScheduleChanged = useMemo(
    () =>
      hasScheduleChanged(form.schedule, {
        schedulePublishDate: publishDate,
        schedulePublishTime: publishTime,
        expirationDate,
        expirationTime,
      }),
    [publishDate, publishTime, expirationDate, expirationTime, form.schedule]
  );

  const isPublishDateChanged = useMemo(
    () =>
      hasPublishDateChanged(form.schedule, {
        schedulePublishDate: publishDate,
        schedulePublishTime: publishTime,
      }),
    [publishDate, publishTime, form.schedule]
  );

  const hasPastScheduleDateTime = useMemo(() => {
    if (form.status === 'expired') return false;

    // A changed schedule can never resolve to a past date/time (mirrors the
    // onValid submit check below) — but an unchanged schedule is never
    // blocked here, even for an on-hold vacancy, so the recruiter can still
    // save edits to other sections without being forced to reschedule.
    if (!isScheduleChanged) {
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
  const { mutateAsync: notifyApplicants } = useNotifyApplicantsMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCreateAction =
    !id || form.status === 'new' || form.status === 'draft';

  const isOnholdVacancy = form.status === 'on_hold';
  const isOnholdWithApplicants =
    isOnholdVacancy && (form.applicantCount ?? 0) > 0;

  // The schedule-to-onhold toggle flow already collected its own
  // confirmation (VacancyToggleStatusDialog) before navigating here, so a
  // Live vacancy reached that way must skip this step's confirmation dialogs.
  const isLiveVacancy = form.status === 'live' && !scheduleToOnhold;
  const isLiveWithApplicants = isLiveVacancy && (form.applicantCount ?? 0) > 0;

  const [confirmDialog, setConfirmDialog] = useState<
    'reschedule' | 'noReschedule' | null
  >(null);
  const [showOnholdDialog, setShowOnholdDialog] = useState(false);
  // DQCGP-3611: Live-without-applicants uses its own 4-variant-shaped dialog
  // (only 2 variants have copy for now), mirroring the Onhold flow. The
  // with-applicants Live path keeps using the existing SimpleConfirmDialog
  // below (CGP-2550, separate story).
  const [showLiveUpdateDialog, setShowLiveUpdateDialog] = useState(false);
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
    existingStatusOverride?: string,
    successNotification?: { titleKey: string; messageKey: string }
  ): Promise<boolean> => {
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
        let fallbackStatus: string;
        if (scheduleToOnhold) {
          fallbackStatus = 'on_hold';
        } else if (isCreateAction) {
          fallbackStatus = targetStatus;
        } else {
          fallbackStatus = form.status;
        }
        const existingStatus = existingStatusOverride ?? fallbackStatus;
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
          successNotification?.titleKey ??
            (isCreateAction
              ? 'scheduleVacancy.notifications.successTitle'
              : 'scheduleVacancy.notifications.updateSuccessTitle')
        ),
        description: t(
          successNotification?.messageKey ??
            (isCreateAction
              ? 'scheduleVacancy.notifications.successMessage'
              : 'scheduleVacancy.notifications.updateSuccessMessage')
        ),
      });
      onSubmit();
      void navigate('/dashboard/ats/vacancies');
      return true;
    } catch {
      ErrorToast({
        title: t('scheduleVacancy.notifications.apiErrorTitle'),
        description: t('scheduleVacancy.notifications.apiErrorMessage'),
      });
      return false;
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
    const now = new Date();

    // A changed schedule can never resolve to a past date/time, regardless
    // of the vacancy's current status.
    if (isScheduleChanged && (publishAt < now || expirationAt < now)) {
      ErrorToast({
        title: t('scheduleVacancy.notifications.validationErrorTitle'),
        description: t('scheduleVacancy.notifications.pastDateTimeMessage'),
      });
      return;
    }

    // Expired and Live vacancies share the same Reschedule/No-reschedule
    // confirmation split, driven only by whether the publish date/time changed.
    const confirmDialogKind = isPublishDateChanged
      ? 'reschedule'
      : 'noReschedule';

    if (form.status === 'expired') {
      setPendingValues(values);
      setConfirmDialog(confirmDialogKind);
      return;
    }

    // For a Live vacancy, the confirmation copy — and whether it moves to
    // On Hold — depends only on whether the publish date/time changed.
    // DQCGP-3611: a Live vacancy with no applicants gets its own 4-variant-
    // shaped dialog (mirroring Onhold); the with-applicants case (CGP-2550)
    // keeps using the existing reschedule/no-reschedule SimpleConfirmDialog.
    if (!isCreateAction && isLiveVacancy) {
      setPendingValues(values);
      if (isLiveWithApplicants) {
        setConfirmDialog(confirmDialogKind);
      } else {
        setShowLiveUpdateDialog(true);
      }
      return;
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

  /**
   * Shared by the Onhold and Live confirm flows: notifies past applicants of
   * the changes only once the update has already succeeded, and only when
   * the application form (customizable questions or preferred values)
   * actually changed — a failed notify call must never resurface as an
   * error on an already-completed save.
   */
  const notifyApplicantsOfChanges = async (
    changes: ApplicationFormChanges | null,
    publishDateTime: string
  ) => {
    if (!changes?.changedSections.length || !id) return;
    try {
      await notifyApplicants({
        vacancyId: id,
        changedSections: changes.changedSections,
        changedFields: changes.changedFields,
        publishDateTime,
      });
    } catch {
      // Non-blocking: the vacancy update already succeeded and was
      // reported to the recruiter — a failed notify call must not
      // resurface as an error on an already-completed save.
    }
  };

  const handleOnholdConfirm = async () => {
    if (!pendingValues) return;
    setShowOnholdDialog(false);

    // Only an Onhold vacancy with applicants whose publish date is actually
    // changing needs to notify past applicants — capture the diff against the
    // pre-edit snapshot before the update mutates local form state.
    const shouldCheckApplicationChanges =
      isOnholdWithApplicants && isPublishDateChanged;
    const applicationChanges = shouldCheckApplicationChanges
      ? detectApplicationFormChanges(originalFormRef.current ?? form, form)
      : null;

    const updateSucceeded = await executeUpdate(pendingValues);

    if (updateSucceeded) {
      await notifyApplicantsOfChanges(
        applicationChanges,
        toScheduleVacancyPayload(pendingValues).schedulePublishAt
      );
    }

    setPendingValues(null);
  };

  const handleLiveConfirm = async () => {
    if (!pendingValues) return;
    const isReschedule = confirmDialog === 'reschedule';
    setConfirmDialog(null);

    // A Live vacancy with applicants always needs the change diff, whether
    // it's rescheduling to On Hold or staying Live — unlike the Onhold flow,
    // both Live scenarios can trigger an applicant notification.
    const applicationChanges = isLiveWithApplicants
      ? detectApplicationFormChanges(originalFormRef.current ?? form, form)
      : null;

    const updateSucceeded = await executeUpdate(
      pendingValues,
      isReschedule ? 'on_hold' : undefined,
      isReschedule
        ? {
            titleKey:
              'scheduleVacancy.notifications.liveRescheduleSuccessTitle',
            messageKey:
              'scheduleVacancy.notifications.liveRescheduleSuccessMessage',
          }
        : {
            titleKey:
              'scheduleVacancy.notifications.liveNoRescheduleSuccessTitle',
            messageKey:
              'scheduleVacancy.notifications.liveNoRescheduleSuccessMessage',
          }
    );

    if (updateSucceeded) {
      await notifyApplicantsOfChanges(
        applicationChanges,
        toScheduleVacancyPayload(pendingValues).schedulePublishAt
      );
    }

    setPendingValues(null);
  };

  // DQCGP-3611: Live vacancy, no applicants — mirrors handleOnholdConfirm's
  // without-applicants behavior: no application-change diff and no applicant
  // notification, since there are no past applicants to notify.
  const handleLiveUpdateConfirm = async () => {
    if (!pendingValues) return;
    const isReschedule = isPublishDateChanged;
    setShowLiveUpdateDialog(false);

    await executeUpdate(
      pendingValues,
      isReschedule ? 'on_hold' : undefined,
      isReschedule
        ? {
            titleKey:
              'scheduleVacancy.notifications.liveRescheduleSuccessTitle',
            messageKey:
              'scheduleVacancy.notifications.liveRescheduleSuccessMessage',
          }
        : {
            titleKey:
              'scheduleVacancy.notifications.liveNoRescheduleSuccessTitle',
            messageKey:
              'scheduleVacancy.notifications.liveNoRescheduleSuccessMessage',
          }
    );

    setPendingValues(null);
  };

  const handleBack = () => {
    persistScheduleToContext();
    onBack();
  };

  return (
    <div
      data-testid="scheduleVacancy-section-form"
      className="flex min-h-full flex-1 flex-col"
    >
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
        <h2
          data-testid="scheduleVacancy-header-label"
          className="text-xl font-bold tracking-tight text-slate-900"
        >
          {t('scheduleVacancy.title')}
        </h2>
        {(() => {
          const displayStatus = scheduleToOnhold ? 'on_hold' : form.status;
          return displayStatus ? (
            <VacancyStatusBadge
              status={displayStatus}
              applicantCount={form.applicantCount}
            />
          ) : null;
        })()}
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-7 pb-6">
        <div className="flex flex-wrap gap-4">
          {/* ── Scheduled Publish Date & Time ── */}
          <div className="flex w-76 flex-col gap-1">
            <Label
              data-testid="scheduleVacancy-publishDateLabel-label"
              className="text-sm font-semibold text-slate-700"
            >
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
                      disabledDates={date =>
                        date < startOfToday() || date > HUNDRED_YEARS_FROM_NOW
                      }
                      startMonth={TODAY}
                      endMonth={HUNDRED_YEARS_FROM_NOW}
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
            <Label
              data-testid="scheduleVacancy-expirationDateLabel-label"
              className="text-sm font-semibold text-slate-700"
            >
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
                          date > HUNDRED_YEARS_FROM_NOW ||
                          (publishDate ? localStr < publishDate : false)
                        );
                      }}
                      startMonth={TODAY}
                      endMonth={HUNDRED_YEARS_FROM_NOW}
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
      <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
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
        open={form.status === 'expired' && confirmDialog === 'reschedule'}
        onOpenChange={open => {
          if (!open) setConfirmDialog(null);
        }}
        onConfirm={() => {
          handleConfirmUpdate().catch(() => {});
        }}
        isConfirming={isSubmitting || isPending || isUpdating}
      />

      <VacancyNoRescheduleConfirmDialog
        open={form.status === 'expired' && confirmDialog === 'noReschedule'}
        onOpenChange={open => {
          if (!open) setConfirmDialog(null);
        }}
        onConfirm={() => {
          handleConfirmUpdate().catch(() => {});
        }}
        isConfirming={isSubmitting || isPending || isUpdating}
      />

      {/* ── Live vacancy (with applicants) update confirmation dialogs ─
          CGP-2550, unchanged by DQCGP-3611 — gated to isLiveWithApplicants
          so the without-applicants case below never opens these. ────── */}
      <SimpleConfirmDialog
        open={
          isLiveVacancy &&
          isLiveWithApplicants &&
          confirmDialog === 'reschedule'
        }
        onOpenChange={open => {
          if (!open) setConfirmDialog(null);
        }}
        onConfirm={() => {
          handleLiveConfirm().catch(() => {});
        }}
        isConfirming={isSubmitting || isPending || isUpdating}
        titleKey="scheduleVacancy.liveRescheduleConfirmDialog.title"
        descriptionKey="scheduleVacancy.liveRescheduleConfirmDialog.description"
        cancelLabelKey="scheduleVacancy.liveRescheduleConfirmDialog.noButton"
        confirmLabelKey="scheduleVacancy.liveRescheduleConfirmDialog.yesButton"
      />

      <SimpleConfirmDialog
        open={
          isLiveVacancy &&
          isLiveWithApplicants &&
          confirmDialog === 'noReschedule'
        }
        onOpenChange={open => {
          if (!open) setConfirmDialog(null);
        }}
        onConfirm={() => {
          handleLiveConfirm().catch(() => {});
        }}
        isConfirming={isSubmitting || isPending || isUpdating}
        titleKey="scheduleVacancy.liveUpdateConfirmDialog.title"
        descriptionKey="scheduleVacancy.liveUpdateConfirmDialog.description"
        cancelLabelKey="scheduleVacancy.liveUpdateConfirmDialog.noButton"
        confirmLabelKey="scheduleVacancy.liveUpdateConfirmDialog.yesButton"
      />

      {/* ── Live vacancy (without applicants) update confirmation dialog ──
          DQCGP-3611 — Notif 2.28.3 / 2.28.4. ─────────────────────────── */}
      <VacancyLiveUpdateDialog
        open={showLiveUpdateDialog}
        onOpenChange={setShowLiveUpdateDialog}
        onConfirm={() => {
          handleLiveUpdateConfirm().catch(() => {});
        }}
        isPublishDateChanged={isPublishDateChanged}
        hasApplicants={false}
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
