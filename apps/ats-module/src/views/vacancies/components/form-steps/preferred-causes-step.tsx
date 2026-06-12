import { ArrowLeft2 } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StepDisableDialog } from '@/views/vacancies';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
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
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const { form, setForm, stepPersistRef, stepDisableRef } = useVacancyForm();

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
  const [hasMaxError, setHasMaxError] = useState(false);

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

  return (
    <div>
      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-7 py-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('common.back')}
            className="text-slate-700 transition-colors hover:text-slate-900"
            onClick={onBack}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t('preferredCauses.title')}
          </h2>
        </div>
        <SwitchPrimitive.Root
          checked={isEnabled}
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
          className={cn(
            'focus-visible:ring-ring/50 inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
            isEnabled ? 'bg-brand-primary-500' : 'bg-slate-300'
          )}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
              isEnabled ? 'translate-x-6' : 'translate-x-0'
            )}
          />
        </SwitchPrimitive.Root>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 px-6">
        <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
          {/* Checkbox */}
          <div className="mb-6 flex items-start gap-2">
            <Checkbox
              id="causes-data-from-candidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={checked =>
                setDataTakenFromCandidate(checked === true)
              }
              className="mt-0.5"
            />
            <label
              htmlFor="causes-data-from-candidate"
              className="cursor-pointer text-sm text-slate-600"
            >
              {t('preferredCauses.dataTakenFromCandidate')}
            </label>
          </div>

          {/* Section: Causes */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  'text-sm font-semibold text-slate-700',
                  hasMaxError && 'text-destructive'
                )}
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
              onErrorStateChange={setHasMaxError}
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
                source: 'MASTER',
              }))}
              onSearchSync={value => {
                setCauseSearch(value);
                return apiCauses.map(c => ({
                  value: c.id,
                  label: c.label,
                  source: 'MASTER',
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
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        onConfirm={() => {
          setSelectedCauses([]);
          setDataTakenFromCandidate(false);
          setIsEnabled(false);
          setConfirmDisableOpen(false);
          showDisableToast(t('preferredCauses.title'));
        }}
        title={t('preferredCauses.confirmDisableDialog.title')}
        description={t('preferredCauses.confirmDisableDialog.message')}
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
        confirmLabel={t('preferredCauses.emptyDisableDialog.disable')}
      />

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button variant="secondary" className="h-12 w-48" onClick={onBack}>
          {t('common.cancel')}
        </Button>
        <Button className="h-12 w-48" onClick={() => void handleNext()}>
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
