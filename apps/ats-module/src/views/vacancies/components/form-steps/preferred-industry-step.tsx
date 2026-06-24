import { ArrowLeft2 } from 'iconsax-reactjs';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCreateIndustryMutation,
  useDisableSuccessToast,
  useIndustriesQuery,
  useStepGuard,
} from '@/views/vacancies/hooks';
import { industryService } from '@/views/vacancies/services';
import type { IndustryEntry, StepProps } from '@/views/vacancies/types';
import { resolveUserCreatedEntries } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_INDUSTRIES = 10;
const MAX_INDUSTRY_CHARS = 100;

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function PreferredIndustryStep({
  onNext,
  onBack,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const {
    form,
    setForm,
    onCancel,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();

  const preferredIndustries = form.preferredIndustries ?? {
    isEnabled: false,
    dataTakenFromCandidate: false,
    industries: [],
  };
  const isEnabled = preferredIndustries.isEnabled;
  const dataTakenFromCandidate = preferredIndustries.dataTakenFromCandidate;
  const selectedIndustries = preferredIndustries.industries;

  const updatePreferredIndustries = (
    patch: Partial<{
      isEnabled: boolean;
      dataTakenFromCandidate: boolean;
      industries: IndustryEntry[];
    }>
  ) => {
    setForm(prev => ({
      ...prev,
      preferredIndustries: {
        isEnabled,
        dataTakenFromCandidate,
        industries: selectedIndustries,
        ...patch,
      },
    }));
  };

  const shouldDisableNavigation =
    isEnabled && !dataTakenFromCandidate && selectedIndustries.length === 0;

  useStepGuard(shouldDisableNavigation);

  useEffect(() => {
    stepPersistRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredIndustries: {
          isEnabled,
          dataTakenFromCandidate,
          industries: selectedIndustries,
        },
      }));
    };

    return () => {
      stepPersistRef.current = null;
    };
  }, [
    dataTakenFromCandidate,
    isEnabled,
    selectedIndustries,
    setForm,
    stepPersistRef,
  ]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredIndustries: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          industries: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  const [industrySearch, setIndustrySearch] = useState('');
  const [hasMaxError, setHasMaxError] = useState(false);

  const { data: industriesData, isLoading: isIndustriesLoading } =
    useIndustriesQuery(industrySearch);

  const apiIndustries = industriesData?.data?.items?.content ?? [];

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  const { mutateAsync: createIndustry } = useCreateIndustryMutation();

  const handleNext = async () => {
    if (
      isEnabled &&
      selectedIndustries.length === 0 &&
      !dataTakenFromCandidate
    ) {
      setEmptyDisableOpen(true);
      return;
    }

    let resolvedIndustries: IndustryEntry[] = selectedIndustries;
    const hasUserCreated = selectedIndustries.some(
      i => i.source === 'USER_CREATED'
    );
    if (hasUserCreated) {
      resolvedIndustries = await resolveUserCreatedEntries(
        selectedIndustries,
        createIndustry,
        (search: string) => industryService.getIndustries(search)
      );
      updatePreferredIndustries({ industries: resolvedIndustries });
    }

    onNext({
      preferredIndustries: {
        isEnabled,
        dataTakenFromCandidate,
        industries: resolvedIndustries,
      },
    });
  };

  const handleBack = () => {
    setForm(prev => ({
      ...prev,
      preferredIndustries: {
        isEnabled,
        dataTakenFromCandidate,
        industries: selectedIndustries,
      },
    }));
    onBack();
  };

  return (
    <div>
      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-7 py-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('common.back')}
            disabled={shouldDisableNavigation}
            className="text-slate-700 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleBack}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t('preferredIndustries.title')}
          </h2>
          {mode === 'edit' && form.status ? (
            <VacancyStatusBadge status={form.status} />
          ) : null}
        </div>
        <Switch
          checked={isEnabled}
          size="lg"
          onCheckedChange={newValue => {
            if (!newValue) {
              if (selectedIndustries.length > 0 || dataTakenFromCandidate) {
                setConfirmDisableOpen(true);
              } else {
                updatePreferredIndustries({ isEnabled: false });
              }
            } else {
              updatePreferredIndustries({ isEnabled: true });
            }
          }}
        />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 px-6">
        <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
          {/* Checkbox */}
          <div className="mb-6 flex items-start gap-2">
            <Checkbox
              id="industries-data-from-candidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={checked => {
                if (checked) {
                  updatePreferredIndustries({
                    industries: [],
                    dataTakenFromCandidate: true,
                  });
                  setHasMaxError(false);
                  return;
                }
                updatePreferredIndustries({
                  dataTakenFromCandidate: false,
                });
              }}
              className="mt-0.5"
            />
            <label
              htmlFor="industries-data-from-candidate"
              className="cursor-pointer text-sm leading-snug wrap-break-word text-slate-600"
            >
              {t('preferredIndustries.dataTakenFromCandidate')}
            </label>
          </div>

          {/* Section: Industries */}
          <div>
            <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
              <span
                className={cn(
                  'min-w-0 truncate pr-2 text-sm font-semibold text-slate-700',
                  hasMaxError && 'text-destructive'
                )}
              >
                {t('preferredIndustries.sectionLabel')}
              </span>
              <CharacterCount
                maxLength={MAX_INDUSTRY_CHARS}
                currentLength={industrySearch.length}
              />
            </div>

            <MultipleSelector
              value={selectedIndustries.map(i => ({
                value: i.id,
                label: i.label,
                source: i.source,
              }))}
              errorMessage={t('preferredIndustries.validation.maxIndustries', {
                max: MAX_INDUSTRIES,
              })}
              onErrorStateChange={setHasMaxError}
              onChange={options => {
                const dedupedByLabel = new Map<string, IndustryEntry>();

                for (const opt of options) {
                  const normalizedLabel = opt.label.trim().toLowerCase();
                  if (!normalizedLabel || dedupedByLabel.has(normalizedLabel)) {
                    continue;
                  }

                  dedupedByLabel.set(normalizedLabel, {
                    id: opt.value,
                    label: opt.label,
                    source: (opt.source as string) ?? 'USER_CREATED',
                  });
                }

                const entries = Array.from(dedupedByLabel.values());
                updatePreferredIndustries({ industries: entries });
              }}
              options={apiIndustries.map(i => ({
                value: i.id,
                label: i.label,
                source: i.source ?? 'MASTER',
              }))}
              onSearchSync={value => {
                setIndustrySearch(value);
                return apiIndustries.map(i => ({
                  value: i.id,
                  label: i.label,
                  source: i.source ?? 'MASTER',
                }));
              }}
              keepSelectedInList
              creatable
              triggerSearchOnFocus
              hideClearAllButton
              maxSelected={MAX_INDUSTRIES}
              disabled={!isEnabled || dataTakenFromCandidate}
              inputProps={{ maxLength: MAX_INDUSTRY_CHARS }}
              loading={isIndustriesLoading}
              placeholder={t('preferredIndustries.input.placeholder')}
              loadingIndicator={
                <p className="px-3 pb-3 text-left">{t('common.loading')}</p>
              }
              emptyIndicator={
                <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                  <div className="flex flex-col items-start">
                    <img src={multiSelectInfoAvatar} alt={t('common.noData')} />
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

          {/* Bottom padding so dropdowns are never clipped */}
          <div className="h-64" />
        </div>
      </div>

      <StepDisableDialog
        open={confirmDisableOpen}
        onOpenChange={setConfirmDisableOpen}
        title={t('preferredIndustries.confirmDisableDialog.title')}
        description={t('preferredIndustries.confirmDisableDialog.message')}
        confirmLabel={t('preferredIndustries.confirmDisableDialog.disable')}
        onConfirm={() => {
          updatePreferredIndustries({
            industries: [],
            dataTakenFromCandidate: false,
            isEnabled: false,
          });
          removeCompletedStep?.(currentStepIndex ?? 0);
          setConfirmDisableOpen(false);
          showDisableToast(t('preferredIndustries.title'));
        }}
      />

      <StepDisableDialog
        open={emptyDisableOpen}
        onOpenChange={setEmptyDisableOpen}
        title={t('preferredIndustries.emptyDisableDialog.title')}
        description={t('preferredIndustries.emptyDisableDialog.message')}
        confirmLabel={t('preferredIndustries.emptyDisableDialog.disable')}
        onConfirm={() => {
          updatePreferredIndustries({ isEnabled: false });
          setEmptyDisableOpen(false);
          showDisableToast(t('preferredIndustries.title'));
          onNext({
            preferredIndustries: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              industries: [],
            },
          });
        }}
      />

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          className="h-12 w-48"
          disabled={shouldDisableNavigation}
          onClick={() => void handleNext()}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
