import { Plus, X } from 'lucide-react';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useDisableSuccessToast,
  useLanguagesQuery,
} from '@/views/vacancies/hooks';
import type {
  LanguageEntry,
  LanguageItem,
  StepProps,
} from '@/views/vacancies/types';

import { Badge } from '@cgp/ui-kit/components/ui/badge';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';
import StepFooter from './step-footer';
import StepHeader from './step-header';

const MAX_LANGUAGES = 10;
const MAX_LANG_CHARS = 100;

export default function PreferredLanguagesStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const { form } = useVacancyForm();

  const [isEnabled, setIsEnabled] = useState(
    form.preferredLanguages?.isEnabled ?? true
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredLanguages?.dataTakenFromCandidate ?? false
  );
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageEntry[]>(
    form.preferredLanguages?.languages ?? []
  );

  // Language search / dropdown
  const [langSearch, setLangSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Accumulates user-typed languages for the current session
  const [userEnteredLanguages, setUserEnteredLanguages] = useState<
    LanguageItem[]
  >([]);

  // Query
  const { data: languagesData } = useLanguagesQuery(langSearch);

  const apiLanguages: LanguageItem[] =
    languagesData?.data?.items?.content ?? [];
  // Merge user-entered (at top) with API results, deduped
  const languages: LanguageItem[] = [
    ...userEnteredLanguages,
    ...apiLanguages.filter(
      api =>
        !userEnteredLanguages.some(
          u => u.label.toLowerCase() === api.label.toLowerCase()
        )
    ),
  ];

  const atMax = selectedLanguages.length >= MAX_LANGUAGES;
  const [showMaxError, setShowMaxError] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleLanguage = (id: string, label: string) => {
    const alreadySelected = selectedLanguages.some(l => l.id === id);
    if (alreadySelected) {
      setSelectedLanguages(prev => prev.filter(l => l.id !== id));
      setShowMaxError(false);
    } else {
      if (atMax) {
        setShowMaxError(true);
        return;
      }
      setSelectedLanguages(prev => [...prev, { id, label }]);
    }
  };

  const handleAddCustom = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Prevent duplicate by label (case-insensitive)
    const alreadySelected = selectedLanguages.some(
      l => l.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadySelected) return;
    if (atMax) {
      setShowMaxError(true);
      return;
    }

    // Register in local list so it shows as checked in dropdown
    const existsInList = languages.some(
      l => l.label.toLowerCase() === trimmed.toLowerCase()
    );
    const newId = existsInList
      ? (languages.find(l => l.label.toLowerCase() === trimmed.toLowerCase())
          ?.id ?? crypto.randomUUID())
      : crypto.randomUUID();

    if (!existsInList) {
      setUserEnteredLanguages(prev => [{ id: newId, label: trimmed }, ...prev]);
    }

    setSelectedLanguages(prev => [...prev, { id: newId, label: trimmed }]);
    setLangSearch('');
  };

  const handleRemoveLanguage = (id: string) => {
    setSelectedLanguages(prev => prev.filter(l => l.id !== id));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleNext = () => {
    if (
      isEnabled &&
      selectedLanguages.length === 0 &&
      !dataTakenFromCandidate
    ) {
      setEmptyDisableOpen(true);
      return;
    }
    onNext({
      preferredLanguages: {
        isEnabled,
        dataTakenFromCandidate,
        languages: selectedLanguages,
      },
    });
  };

  return (
    <div>
      <StepHeader
        title={t('preferredLanguages.title')}
        isEnabled={isEnabled}
        onBack={onBack}
        onToggle={() => {
          if (isEnabled) {
            setConfirmDisableOpen(true);
          } else {
            setIsEnabled(true);
          }
        }}
      />

      {/* Body */}
      <div className="px-8 py-6">
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
              <span className="text-sm font-semibold text-slate-700">
                {t('preferredLanguages.sectionLabel')}
              </span>
              <span className="text-sm font-semibold">
                <span className="text-slate-900">{langSearch.length}</span>
                <span className="text-slate-400">/{MAX_LANG_CHARS}</span>
              </span>
            </div>

            {/* Language search input */}
            <div className="relative">
              <input
                type="text"
                value={langSearch}
                onChange={e => {
                  if (e.target.value.length <= MAX_LANG_CHARS) {
                    setLangSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onClick={() => setIsDropdownOpen(true)}
                onKeyDown={handleInputKeyDown}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                disabled={dataTakenFromCandidate}
                placeholder={t('preferredLanguages.input.placeholder')}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />

              {/* Dropdown */}
              {isDropdownOpen && !dataTakenFromCandidate && (
                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md">
                  {/* Add new (custom) option */}
                  {langSearch.trim() &&
                    !languages.some(
                      l =>
                        l.label.toLowerCase() ===
                        langSearch.trim().toLowerCase()
                    ) && (
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          handleAddCustom(langSearch.trim());
                          setIsDropdownOpen(false);
                        }}
                        className="m-3 flex w-[calc(100%-24px)] cursor-pointer items-center gap-1 overflow-hidden rounded bg-neutral-200 px-2 py-2.5 text-left text-sm font-medium text-slate-900 hover:bg-neutral-300"
                      >
                        <Plus className="size-4 shrink-0" />
                        {t('preferredLanguages.input.addNew', {
                          value: langSearch.trim(),
                        })}
                      </button>
                    )}

                  {/* API + user-entered language list with checkboxes */}
                  {languages.map(lang => {
                    const isChecked = selectedLanguages.some(
                      l => l.id === lang.id
                    );
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        aria-pressed={isChecked}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() =>
                          handleToggleLanguage(lang.id, lang.label)
                        }
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50',
                          isChecked && 'bg-slate-50'
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          className="pointer-events-none"
                        />
                        {lang.label}
                      </button>
                    );
                  })}

                  {languages.length === 0 && !langSearch.trim() && (
                    <p className="px-3 py-2 text-sm text-slate-400">
                      {t('preferredLanguages.input.typeToSearch')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Exceeded max error */}
            {showMaxError && (
              <p className="mt-1.5 text-xs text-red-500">
                {t('preferredLanguages.validation.maxLanguages', {
                  max: MAX_LANGUAGES,
                })}
              </p>
            )}

            {/* Selected language chips */}
            {selectedLanguages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {selectedLanguages.map(entry => (
                  <Badge
                    key={entry.id}
                    variant="chip"
                    className="animate-fadeIn flex max-w-full cursor-default items-center gap-2"
                  >
                    <span className="min-w-0 font-semibold wrap-break-word text-slate-600">
                      {entry.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(entry.id)}
                      className="flex size-4 shrink-0 items-center justify-center text-slate-400 hover:text-slate-600"
                      aria-label={t('preferredLanguages.chip.remove', {
                        name: entry.label,
                      })}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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
          setUserEnteredLanguages([]);
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

      <StepFooter onNext={handleNext} onCancel={onBack} />
    </div>
  );
}
