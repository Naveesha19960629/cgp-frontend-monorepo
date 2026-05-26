import { Plus, X } from 'lucide-react';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import { useHobbiesQuery } from '@/views/vacancies/hooks';
import type { HobbyEntry, HobbyItem, StepProps } from '@/views/vacancies/types';

import { SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Badge } from '@cgp/ui-kit/components/ui/badge';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';
import StepFooter from './step-footer';
import StepHeader from './step-header';

const MAX_HOBBIES = 10;
const MAX_HOBBY_CHARS = 100;

export default function PreferredHobbiesStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form } = useVacancyForm();

  const [isEnabled, setIsEnabled] = useState(
    form.preferredHobbies?.isEnabled ?? true
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredHobbies?.dataTakenFromCandidate ?? false
  );
  const [selectedHobbies, setSelectedHobbies] = useState<HobbyEntry[]>(
    form.preferredHobbies?.hobbies ?? []
  );

  // Hobby search / dropdown
  const [hobbySearch, setHobbySearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Accumulates user-typed hobbies for the current session
  const [userEnteredHobbies, setUserEnteredHobbies] = useState<HobbyItem[]>([]);

  // Query
  const { data: hobbiesData } = useHobbiesQuery(hobbySearch);

  const apiHobbies: HobbyItem[] = hobbiesData?.data?.items?.content ?? [];
  // Merge user-entered (at top) with API results, deduped
  const hobbies: HobbyItem[] = [
    ...userEnteredHobbies,
    ...apiHobbies.filter(
      api =>
        !userEnteredHobbies.some(
          u => u.label.toLowerCase() === api.label.toLowerCase()
        )
    ),
  ];

  const atMax = selectedHobbies.length >= MAX_HOBBIES;
  const [showMaxError, setShowMaxError] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleHobby = (id: string, label: string) => {
    const alreadySelected = selectedHobbies.some(h => h.id === id);
    if (alreadySelected) {
      setSelectedHobbies(prev => prev.filter(h => h.id !== id));
      setShowMaxError(false);
    } else {
      if (atMax) {
        setShowMaxError(true);
        return;
      }
      setSelectedHobbies(prev => [...prev, { id, label }]);
    }
  };

  const handleAddCustom = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Prevent duplicate by label (case-insensitive)
    const alreadySelected = selectedHobbies.some(
      h => h.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadySelected) return;
    if (atMax) {
      setShowMaxError(true);
      return;
    }

    const existsInList = hobbies.some(
      h => h.label.toLowerCase() === trimmed.toLowerCase()
    );
    const newId = existsInList
      ? (hobbies.find(h => h.label.toLowerCase() === trimmed.toLowerCase())
          ?.id ?? crypto.randomUUID())
      : crypto.randomUUID();

    if (!existsInList) {
      setUserEnteredHobbies(prev => [{ id: newId, label: trimmed }, ...prev]);
    }

    setSelectedHobbies(prev => [...prev, { id: newId, label: trimmed }]);
    setHobbySearch('');
  };

  const handleRemoveHobby = (id: string) => {
    setSelectedHobbies(prev => prev.filter(h => h.id !== id));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleNext = () => {
    if (isEnabled && selectedHobbies.length === 0 && !dataTakenFromCandidate) {
      setEmptyDisableOpen(true);
      return;
    }
    onNext({
      preferredHobbies: {
        isEnabled,
        dataTakenFromCandidate,
        hobbies: selectedHobbies,
      },
    });
  };

  return (
    <div>
      <StepHeader
        title={t('preferredHobbies.title')}
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
              id="hobbies-data-from-candidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={checked =>
                setDataTakenFromCandidate(checked === true)
              }
              className="mt-0.5"
            />
            <label
              htmlFor="hobbies-data-from-candidate"
              className="cursor-pointer text-sm text-slate-600"
            >
              {t('preferredHobbies.dataTakenFromCandidate')}
            </label>
          </div>

          {/* Section: Hobbies */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {t('preferredHobbies.sectionLabel')}
              </span>
              <span className="text-sm font-semibold">
                <span className="text-slate-900">{hobbySearch.length}</span>
                <span className="text-slate-400">/{MAX_HOBBY_CHARS}</span>
              </span>
            </div>

            {/* Hobby search input */}
            <div className="relative">
              <input
                type="text"
                value={hobbySearch}
                onChange={e => {
                  if (e.target.value.length <= MAX_HOBBY_CHARS) {
                    setHobbySearch(e.target.value);
                    setIsDropdownOpen(true);
                  }
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onClick={() => setIsDropdownOpen(true)}
                onKeyDown={handleInputKeyDown}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                disabled={dataTakenFromCandidate}
                placeholder={t('preferredHobbies.input.placeholder')}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />

              {/* Dropdown */}
              {isDropdownOpen && !dataTakenFromCandidate && (
                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md">
                  {/* Add new (custom) option */}
                  {hobbySearch.trim() &&
                    !hobbies.some(
                      h =>
                        h.label.toLowerCase() ===
                        hobbySearch.trim().toLowerCase()
                    ) && (
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          handleAddCustom(hobbySearch.trim());
                          setIsDropdownOpen(false);
                        }}
                        className="m-3 flex w-[calc(100%-24px)] cursor-pointer items-center gap-1 overflow-hidden rounded bg-neutral-200 px-2 py-2.5 text-left text-sm font-medium text-slate-900 hover:bg-neutral-300"
                      >
                        <Plus className="size-4 shrink-0" />
                        {t('preferredHobbies.input.addNew', {
                          value: hobbySearch.trim(),
                        })}
                      </button>
                    )}

                  {/* API + user-entered hobby list with checkboxes */}
                  {hobbies.map(hobby => {
                    const isChecked = selectedHobbies.some(
                      h => h.id === hobby.id
                    );
                    return (
                      <button
                        key={hobby.id}
                        type="button"
                        aria-pressed={isChecked}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleToggleHobby(hobby.id, hobby.label)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50',
                          isChecked && 'bg-slate-50'
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          className="pointer-events-none"
                        />
                        {hobby.label}
                      </button>
                    );
                  })}

                  {hobbies.length === 0 && !hobbySearch.trim() && (
                    <p className="px-3 py-2 text-sm text-slate-400">
                      {t('preferredHobbies.input.typeToSearch')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Exceeded max error */}
            {showMaxError && (
              <p className="mt-1.5 text-xs text-red-500">
                {t('preferredHobbies.validation.maxHobbies', {
                  max: MAX_HOBBIES,
                })}
              </p>
            )}

            {/* Selected hobby chips */}
            {selectedHobbies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {selectedHobbies.map(entry => (
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
                      onClick={() => handleRemoveHobby(entry.id)}
                      className="flex size-4 shrink-0 items-center justify-center text-slate-400 hover:text-slate-600"
                      aria-label={t('preferredHobbies.chip.remove', {
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
        title={t('preferredHobbies.confirmDisableDialog.title')}
        message={t('preferredHobbies.confirmDisableDialog.message')}
        cancelLabel={t('preferredHobbies.confirmDisableDialog.cancel')}
        disableLabel={t('preferredHobbies.confirmDisableDialog.disable')}
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={() => {
          setSelectedHobbies([]);
          setUserEnteredHobbies([]);
          setDataTakenFromCandidate(false);
          setIsEnabled(false);
          setConfirmDisableOpen(false);
          SuccessToast({
            title: t('preferredHobbies.notifications.disable.title'),
            description: t('preferredHobbies.notifications.disable.message'),
          });
        }}
      />

      <DisableDialog
        open={emptyDisableOpen}
        onOpenChange={open => {
          if (!open) setEmptyDisableOpen(false);
        }}
        title={t('preferredHobbies.emptyDisableDialog.title')}
        message={t('preferredHobbies.emptyDisableDialog.message')}
        cancelLabel={t('preferredHobbies.emptyDisableDialog.cancel')}
        disableLabel={t('preferredHobbies.emptyDisableDialog.disable')}
        onCancel={() => setEmptyDisableOpen(false)}
        onDisable={() => {
          setIsEnabled(false);
          setEmptyDisableOpen(false);
          SuccessToast({
            title: t('preferredHobbies.notifications.disable.title'),
            description: t('preferredHobbies.notifications.disable.message'),
          });
          onNext({
            preferredHobbies: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              hobbies: [],
            },
          });
        }}
      />

      <StepFooter onNext={handleNext} onCancel={onBack} />
    </div>
  );
}
