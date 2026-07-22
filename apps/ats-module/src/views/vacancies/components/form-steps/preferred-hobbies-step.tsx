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
  useCreateHobbyMutation,
  useDisableSuccessToast,
  useHobbiesQuery,
  useStepGuard,
} from '@/views/vacancies/hooks';
import { hobbyService } from '@/views/vacancies/services';
import type { HobbyEntry, StepProps } from '@/views/vacancies/types';
import { resolveUserCreatedEntries } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_HOBBIES = 10;
const MAX_HOBBY_CHARS = 100;

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function PreferredHobbiesStep({
  onNext,
  onBack,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const isFieldVisible = useTemplateFieldVisible('hobbyList');
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
    form.preferredHobbies?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredHobbies?.dataTakenFromCandidate ?? false
  );
  const [selectedHobbies, setSelectedHobbies] = useState<HobbyEntry[]>(
    form.preferredHobbies?.hobbies ?? []
  );

  useStepGuard(
    isEnabled && !dataTakenFromCandidate && selectedHobbies.length === 0
  );

  const _hobbiesRef = useRef<() => void>(() => {});
  useEffect(() => {
    _hobbiesRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredHobbies: {
          isEnabled,
          dataTakenFromCandidate,
          hobbies: selectedHobbies,
        },
      }));
    };
  }, [isEnabled, dataTakenFromCandidate, selectedHobbies, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _hobbiesRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredHobbies: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          hobbies: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  // Hobby search state for the query
  const [hobbySearch, setHobbySearch] = useState('');

  // Query
  const { data: hobbiesData, isLoading: isHobbiesLoading } =
    useHobbiesQuery(hobbySearch);

  const apiHobbies = hobbiesData?.data?.items?.content ?? [];

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const { mutateAsync: createHobby } = useCreateHobbyMutation();

  const handleNext = async () => {
    if (isEnabled && selectedHobbies.length === 0 && !dataTakenFromCandidate) {
      setEmptyDisableOpen(true);
      return;
    }

    let resolvedHobbies: HobbyEntry[] = selectedHobbies;
    const hasUserCreated = selectedHobbies.some(
      h => h.source === 'USER_CREATED'
    );
    if (hasUserCreated) {
      resolvedHobbies = await resolveUserCreatedEntries(
        selectedHobbies,
        createHobby,
        (search: string) => hobbyService.getAllHobbies(search)
      );
      setSelectedHobbies(resolvedHobbies);
    }

    onNext({
      preferredHobbies: {
        isEnabled,
        dataTakenFromCandidate,
        hobbies: resolvedHobbies,
      },
    });
  };

  const isStepActionDisabled =
    isEnabled && !dataTakenFromCandidate && selectedHobbies.length === 0;

  // Persist the current step's data to the shared form context before navigating
  // back, so edits made on this step are not lost (matches the Next flow).
  const handleBack = () => {
    stepPersistRef.current?.();
    onBack();
  };

  return (
    <div
      className="flex min-h-full flex-1 flex-col"
      data-testid="preferredHobbies-section-form"
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
            data-testid="preferredHobbies-header-label"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            {t('preferredHobbies.title')}
          </h2>
          {mode === 'edit' && vacancyStatus ? (
            <VacancyStatusBadge status={vacancyStatus} />
          ) : null}
        </div>
        <Switch
          checked={isEnabled}
          data-testid="toggle-on-off-switch"
          onCheckedChange={newValue => {
            if (!newValue) {
              if (selectedHobbies.length > 0 || dataTakenFromCandidate) {
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
              id="hobbies-data-from-candidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={checked => {
                if (checked) {
                  setSelectedHobbies([]);
                  setDataTakenFromCandidate(true);
                } else {
                  setDataTakenFromCandidate(false);
                }
              }}
              className="mt-0.5"
            />
            <label
              htmlFor="hobbies-data-from-candidate"
              data-testid="preferredHobbies-dataTakenFromCandidate-label"
              className="cursor-pointer text-sm text-slate-600"
            >
              {t('preferredHobbies.dataTakenFromCandidate')}
            </label>
          </div>

          {/* Section: Hobbies */}
          {isFieldVisible('hobby') && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span
                  data-testid="preferredHobbies-sectionLabel-label"
                  className="text-sm font-semibold text-slate-700"
                >
                  {t('preferredHobbies.sectionLabel')}
                </span>
                <CharacterCount
                  maxLength={MAX_HOBBY_CHARS}
                  currentLength={hobbySearch.length}
                />
              </div>

              <MultipleSelector
                value={selectedHobbies.map(h => ({
                  value: h.id,
                  label: h.label,
                  source: h.source,
                }))}
                errorMessage={t('preferredHobbies.validation.maxHobbies', {
                  max: MAX_HOBBIES,
                })}
                onChange={options => {
                  const entries: HobbyEntry[] = options.map(opt => ({
                    id: opt.value,
                    label: opt.label,
                    source: (opt.source as string) ?? 'USER_CREATED',
                  }));
                  setSelectedHobbies(entries);
                }}
                options={apiHobbies.map(h => ({
                  value: h.id,
                  label: h.label,
                  source: h.source ?? 'MASTER',
                }))}
                onSearchSync={value => {
                  setHobbySearch(value);
                  return apiHobbies.map(h => ({
                    value: h.id,
                    label: h.label,
                    source: h.source ?? 'MASTER',
                  }));
                }}
                keepSelectedInList
                creatable
                triggerSearchOnFocus
                hideClearAllButton
                maxSelected={MAX_HOBBIES}
                disabled={!isEnabled || dataTakenFromCandidate}
                inputProps={{ maxLength: MAX_HOBBY_CHARS }}
                loading={isHobbiesLoading}
                placeholder={t('preferredHobbies.input.placeholder')}
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
          setSelectedHobbies([]);
          setDataTakenFromCandidate(false);
          setIsEnabled(false);
          removeCompletedStep(currentStepIndex);
          setConfirmDisableOpen(false);
          showDisableToast(t('preferredHobbies.title'));
        }}
        title={t('preferredHobbies.confirmDisableDialog.title')}
        description={t('preferredHobbies.confirmDisableDialog.message')}
        cancelLabel={t('preferredHobbies.confirmDisableDialog.cancel')}
        confirmLabel={t('preferredHobbies.confirmDisableDialog.disable')}
      />

      <StepDisableDialog
        open={emptyDisableOpen}
        onOpenChange={open => {
          if (!open) setEmptyDisableOpen(false);
        }}
        onConfirm={() => {
          setIsEnabled(false);
          setEmptyDisableOpen(false);
          showDisableToast(t('preferredHobbies.title'));
          onNext({
            preferredHobbies: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              hobbies: [],
            },
          });
        }}
        title={t('preferredHobbies.emptyDisableDialog.title')}
        description={t('preferredHobbies.emptyDisableDialog.message')}
        cancelLabel={t('preferredHobbies.emptyDisableDialog.cancel')}
        confirmLabel={t('preferredHobbies.emptyDisableDialog.disable')}
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
