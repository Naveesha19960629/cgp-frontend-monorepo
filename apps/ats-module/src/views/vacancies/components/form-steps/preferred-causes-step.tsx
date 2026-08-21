import { ArrowLeft2 } from 'iconsax-reactjs';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StepDisableDialog } from '@/views/vacancies';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import {
  useTemplateFieldVisible,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import {
  useCausesQuery,
  useCreateCauseMutation,
  useDisableSuccessToast,
  useStepGuard,
} from '@/views/vacancies/hooks';
import { causeService } from '@/views/vacancies/services';
import type { CauseEntry, StepProps } from '@/views/vacancies/types';
import { resolveUserCreatedEntries } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_CAUSES = 10;
const MAX_CAUSE_CHARS = 100;

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function PreferredCausesStep({
  onNext,
  onBack,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const isFieldVisible = useTemplateFieldVisible('causes');
  const {
    form,
    setForm,
    onCancel,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();
  const vacancyStatus = form.status;

  const [isEnabled, setIsEnabled] = useState(
    form.preferredCauses?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredCauses?.dataTakenFromCandidate ?? false
  );
  const [selectedCauses, setSelectedCauses] = useState<CauseEntry[]>(
    form.preferredCauses?.causes ?? []
  );

  useStepGuard(
    isEnabled && !dataTakenFromCandidate && selectedCauses.length === 0
  );

  const _causesRef = useRef<() => void>(() => {});
  useEffect(() => {
    _causesRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredCauses: {
          isEnabled,
          dataTakenFromCandidate,
          causes: selectedCauses,
        },
      }));
    };
  }, [isEnabled, dataTakenFromCandidate, selectedCauses, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _causesRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredCauses: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          causes: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  // Cause search state for the query
  const [causeSearch, setCauseSearch] = useState('');
  const isCausesFieldDisabled = !isEnabled || dataTakenFromCandidate;

  // Mirrors the combobox's own clear-on-disable behaviour (DQCGP-2866) for
  // this step's separate search-text state, which also drives the character
  // counter next to the section label. Adjusted during render (not an
  // effect) per https://react.dev/learn/you-might-not-need-an-effect.
  const [prevCausesFieldDisabled, setPrevCausesFieldDisabled] = useState(
    isCausesFieldDisabled
  );
  if (isCausesFieldDisabled !== prevCausesFieldDisabled) {
    setPrevCausesFieldDisabled(isCausesFieldDisabled);
    if (isCausesFieldDisabled) {
      setCauseSearch('');
    }
  }

  // Query
  const { data: causesData, isLoading: isCausesLoading } =
    useCausesQuery(causeSearch);

  const apiCauses = causesData?.data?.items?.content ?? [];

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const { mutateAsync: createCause } = useCreateCauseMutation();

  const handleNext = async () => {
    if (isEnabled && selectedCauses.length === 0 && !dataTakenFromCandidate) {
      setEmptyDisableOpen(true);
      return;
    }

    let resolvedCauses: CauseEntry[] = selectedCauses;
    const hasUserCreated = selectedCauses.some(
      c => c.source === 'USER_CREATED'
    );
    if (hasUserCreated) {
      resolvedCauses = await resolveUserCreatedEntries(
        selectedCauses,
        createCause,
        (search: string) => causeService.getAllCauses(search)
      );
      setSelectedCauses(resolvedCauses);
    }

    onNext({
      preferredCauses: {
        isEnabled,
        dataTakenFromCandidate,
        causes: resolvedCauses,
      },
    });
  };

  const isStepActionDisabled =
    isEnabled && !dataTakenFromCandidate && selectedCauses.length === 0;

  // Persist the current step's data to the shared form context before navigating
  // back, so edits made on this step are not lost (matches the Next flow).
  const handleBack = () => {
    stepPersistRef.current?.();
    onBack();
  };

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      data-testid="preferredCauses-section-form"
    >
      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-7 py-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('common.back')}
            className={cn(
              'cursor-pointer text-slate-700 transition-colors hover:text-slate-900',
              isStepActionDisabled && 'cursor-not-allowed opacity-50'
            )}
            onClick={handleBack}
            disabled={isStepActionDisabled}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2
            data-testid="preferredCauses-header-label"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            {t('preferredCauses.title')}
          </h2>
          {mode === 'edit' && vacancyStatus ? (
            <VacancyStatusBadge
              status={vacancyStatus}
              applicantCount={form.applicantCount}
            />
          ) : null}
        </div>
        <Switch
          checked={isEnabled}
          data-testid="toggle-on-off-switch"
          onCheckedChange={newValue => {
            if (!newValue) {
              if (selectedCauses.length > 0 || dataTakenFromCandidate) {
                setConfirmDisableOpen(true);
              } else {
                setIsEnabled(false);
              }
            } else {
              setIsEnabled(true);
            }
          }}
          size="lg"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 px-6">
        <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
          {/* Checkbox */}
          <div className="mb-6 flex items-start gap-2">
            <Checkbox
              id="causes-data-from-candidate"
              checked={dataTakenFromCandidate}
              disabled={!isEnabled}
              onCheckedChange={checked => {
                if (checked) {
                  setSelectedCauses([]);
                  setDataTakenFromCandidate(true);
                } else {
                  setDataTakenFromCandidate(false);
                }
              }}
              className="mt-0.5"
            />
            <label
              htmlFor="causes-data-from-candidate"
              data-testid="preferredCauses-dataTakenFromCandidate-label"
              className="cursor-pointer text-sm text-slate-600"
            >
              {t('preferredCauses.dataTakenFromCandidate')}
            </label>
          </div>

          {/* Section: Causes */}
          {isFieldVisible('cause') && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span
                  data-testid="preferredCauses-sectionLabel-label"
                  className="text-sm font-semibold text-slate-700"
                >
                  {t('preferredCauses.sectionLabel')}
                </span>
                <CharacterCount
                  maxLength={MAX_CAUSE_CHARS}
                  currentLength={causeSearch.length}
                />
              </div>

              <MultipleSelector
                value={selectedCauses.map(c => ({
                  value: c.id,
                  label: c.label,
                  source: c.source,
                }))}
                errorMessage={t('preferredCauses.validation.maxCauses', {
                  max: MAX_CAUSES,
                })}
                onChange={options => {
                  const entries: CauseEntry[] = options.map(opt => ({
                    id: opt.value,
                    label: opt.label,
                    source: (opt.source as string) ?? 'USER_CREATED',
                  }));
                  setSelectedCauses(entries);
                }}
                options={apiCauses.map(c => ({
                  value: c.id,
                  label: c.label,
                  source: c.source ?? 'MASTER',
                }))}
                onSearchSync={value => {
                  setCauseSearch(value);
                  return apiCauses.map(c => ({
                    value: c.id,
                    label: c.label,
                    source: c.source ?? 'MASTER',
                  }));
                }}
                keepSelectedInList
                creatable
                triggerSearchOnFocus
                hideClearAllButton
                maxSelected={MAX_CAUSES}
                disabled={!isEnabled || dataTakenFromCandidate}
                inputProps={{ maxLength: MAX_CAUSE_CHARS }}
                loading={isCausesLoading}
                placeholder={t('preferredCauses.input.placeholder')}
                loadingIndicator={
                  <p className="px-3 pb-3 text-left">{t('common.loading')}</p>
                }
                emptyIndicator={
                  <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                    <div className="flex flex-col items-start">
                      <img
                        src={multiSelectInfoAvatar}
                        alt={t('common.noData')}
                      />
                      <div className="mt-3 w-61 text-left">
                        <p className="font-bold text-slate-900">
                          {t('common.noDataTitle')}
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {t('common.noDataDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          )}

          {/* Bottom padding so dropdowns are never clipped */}
          <div className="h-64" />
        </div>
      </div>

      <StepDisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        onConfirm={() => {
          setSelectedCauses([]);
          setDataTakenFromCandidate(false);
          setIsEnabled(false);
          removeCompletedStep(currentStepIndex);
          setConfirmDisableOpen(false);
          showDisableToast(t('preferredCauses.title'));
        }}
        title={t('preferredCauses.confirmDisableDialog.title')}
        description={t('preferredCauses.confirmDisableDialog.message')}
        cancelLabel={t('preferredCauses.confirmDisableDialog.cancel')}
        confirmLabel={t('preferredCauses.confirmDisableDialog.disable')}
      />

      <StepDisableDialog
        open={emptyDisableOpen}
        onOpenChange={open => {
          if (!open) setEmptyDisableOpen(false);
        }}
        onConfirm={() => {
          setIsEnabled(false);
          setEmptyDisableOpen(false);
          showDisableToast(t('preferredCauses.title'));
          onNext({
            preferredCauses: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              causes: [],
            },
          });
        }}
        title={t('preferredCauses.emptyDisableDialog.title')}
        description={t('preferredCauses.emptyDisableDialog.message')}
        cancelLabel={t('preferredCauses.emptyDisableDialog.cancel')}
        confirmLabel={t('preferredCauses.emptyDisableDialog.disable')}
      />

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          className="h-12 w-48"
          onClick={() => void handleNext()}
          disabled={isStepActionDisabled}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
