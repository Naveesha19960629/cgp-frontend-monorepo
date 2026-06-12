import { ArrowLeft2 } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCreateLanguageMutation,
  useDisableSuccessToast,
  useLanguagesQuery,
  useStepGuard,
} from '@/views/vacancies/hooks';
import { languageService } from '@/views/vacancies/services';
import type { LanguageEntry, StepProps } from '@/views/vacancies/types';
import { resolveUserCreatedEntries } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';

const MAX_LANGUAGES = 10;
const MAX_LANG_CHARS = 100;

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function PreferredLanguagesStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const { form, setForm, stepPersistRef, stepDisableRef } = useVacancyForm();

  const [isEnabled, setIsEnabled] = useState(
    form.preferredLanguages?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredLanguages?.dataTakenFromCandidate ?? false
  );
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageEntry[]>(
    form.preferredLanguages?.languages ?? []
  );

  useStepGuard(
    isEnabled && !dataTakenFromCandidate && selectedLanguages.length === 0
  );

  const _languagesRef = useRef<() => void>(() => {});
  useEffect(() => {
    _languagesRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredLanguages: {
          isEnabled,
          dataTakenFromCandidate,
          languages: selectedLanguages,
        },
      }));
    };
  }, [isEnabled, dataTakenFromCandidate, selectedLanguages, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _languagesRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredLanguages: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          languages: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  // Language search state for the query
  const [langSearch, setLangSearch] = useState('');
  const [hasMaxError, setHasMaxError] = useState(false);

  // Query
  const { data: languagesData, isLoading: isLanguagesLoading } =
    useLanguagesQuery(langSearch);

  const apiLanguages = languagesData?.data?.items?.content ?? [];

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const { mutateAsync: createLanguage } = useCreateLanguageMutation();

  const handleNext = async () => {
    if (
      isEnabled &&
      selectedLanguages.length === 0 &&
      !dataTakenFromCandidate
    ) {
      setEmptyDisableOpen(true);
      return;
    }

    let resolvedLanguages: LanguageEntry[] = selectedLanguages;
    const hasUserCreated = selectedLanguages.some(
      l => l.source === 'USER_CREATED'
    );
    if (hasUserCreated) {
      resolvedLanguages = await resolveUserCreatedEntries(
        selectedLanguages,
        createLanguage,
        (search: string) => languageService.getAllLanguages(search)
      );
      setSelectedLanguages(resolvedLanguages);
    }

    onNext({
      preferredLanguages: {
        isEnabled,
        dataTakenFromCandidate,
        languages: resolvedLanguages,
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
            {t('preferredLanguages.title')}
          </h2>
        </div>
        <SwitchPrimitive.Root
          checked={isEnabled}
          onCheckedChange={newValue => {
            if (!newValue) {
              if (selectedLanguages.length > 0 || dataTakenFromCandidate) {
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
              id="lang-data-from-candidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={checked =>
                setDataTakenFromCandidate(checked === true)
              }
              className="mt-0.5"
            />
            <label
              htmlFor="lang-data-from-candidate"
              className="cursor-pointer text-sm text-slate-600"
            >
              {t('preferredLanguages.dataTakenFromCandidate')}
            </label>
          </div>

          {/* Section: Languages */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  'text-sm font-semibold text-slate-700',
                  hasMaxError && 'text-destructive'
                )}
              >
                {t('preferredLanguages.sectionLabel')}
              </span>
              <CharacterCount
                maxLength={MAX_LANG_CHARS}
                currentLength={langSearch.length}
              />
            </div>

            <MultipleSelector
              value={selectedLanguages.map(l => ({
                value: l.id,
                label: l.label,
                source: l.source,
              }))}
              errorMessage={t('preferredLanguages.validation.maxLanguages', {
                max: MAX_LANGUAGES,
              })}
              onErrorStateChange={setHasMaxError}
              onChange={options => {
                const entries: LanguageEntry[] = options.map(opt => ({
                  id: opt.value,
                  label: opt.label,
                  source: (opt.source as string) ?? 'USER_CREATED',
                }));
                setSelectedLanguages(entries);
              }}
              options={apiLanguages.map(l => ({
                value: l.id,
                label: l.label,
                source: 'MASTER',
              }))}
              onSearchSync={value => {
                setLangSearch(value);
                return apiLanguages.map(l => ({
                  value: l.id,
                  label: l.label,
                  source: 'MASTER',
                }));
              }}
              keepSelectedInList
              creatable
              triggerSearchOnFocus
              hideClearAllButton
              maxSelected={MAX_LANGUAGES}
              disabled={!isEnabled || dataTakenFromCandidate}
              inputProps={{ maxLength: MAX_LANG_CHARS }}
              loading={isLanguagesLoading}
              placeholder={t('preferredLanguages.input.placeholder')}
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

      <DisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        title={t('preferredLanguages.confirmDisableDialog.title')}
        message={t('preferredLanguages.confirmDisableDialog.message')}
        cancelLabel={t('preferredLanguages.confirmDisableDialog.cancel')}
        disableLabel={t('preferredLanguages.confirmDisableDialog.disable')}
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={() => {
          setSelectedLanguages([]);
          setDataTakenFromCandidate(false);
          setIsEnabled(false);
          setConfirmDisableOpen(false);
          showDisableToast(t('preferredLanguages.title'));
        }}
      />

      <DisableDialog
        open={emptyDisableOpen}
        onOpenChange={open => {
          if (!open) setEmptyDisableOpen(false);
        }}
        title={t('preferredLanguages.emptyDisableDialog.title')}
        message={t('preferredLanguages.emptyDisableDialog.message')}
        cancelLabel={t('preferredLanguages.emptyDisableDialog.cancel')}
        disableLabel={t('preferredLanguages.emptyDisableDialog.disable')}
        onCancel={() => setEmptyDisableOpen(false)}
        onDisable={() => {
          setIsEnabled(false);
          setEmptyDisableOpen(false);
          showDisableToast(t('preferredLanguages.title'));
          onNext({
            preferredLanguages: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              languages: [],
            },
          });
        }}
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
