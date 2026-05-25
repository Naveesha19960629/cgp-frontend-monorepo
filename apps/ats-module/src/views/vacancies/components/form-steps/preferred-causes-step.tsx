import { ChevronLeft, Plus, X } from 'lucide-react';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCausesQuery } from '@/views/vacancies/hooks';
import type { CauseEntry, CauseItem, StepProps } from '@/views/vacancies/types';

import { Badge } from '@cgp/ui-kit/components/ui/badge';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_CAUSES = 10;
const MAX_CAUSE_CHARS = 100;

export default function PreferredCausesStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');

  const [isEnabled, setIsEnabled] = useState(true);
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(false);
  const [selectedCauses, setSelectedCauses] = useState<CauseEntry[]>([]);

  // Cause search / dropdown
  const [causeSearch, setCauseSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Accumulates user-typed causes for the current session
  const [userEnteredCauses, setUserEnteredCauses] = useState<CauseItem[]>([]);

  // Query
  const { data: causesData } = useCausesQuery(causeSearch);

  const apiCauses: CauseItem[] = causesData?.data?.items?.content ?? [];
  // Merge user-entered (at top) with API results, deduped
  const causes: CauseItem[] = [
    ...userEnteredCauses,
    ...apiCauses.filter(
      api =>
        !userEnteredCauses.some(
          u => u.label.toLowerCase() === api.label.toLowerCase()
        )
    ),
  ];

  const exceedsMax = selectedCauses.length >= MAX_CAUSES;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleCause = (id: string, label: string) => {
    const alreadySelected = selectedCauses.some(c => c.id === id);
    if (alreadySelected) {
      setSelectedCauses(prev => prev.filter(c => c.id !== id));
    } else {
      if (exceedsMax) return;
      setSelectedCauses(prev => [...prev, { id, label }]);
    }
  };

  const handleAddCustom = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Prevent duplicate by label (case-insensitive)
    const alreadySelected = selectedCauses.some(
      c => c.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadySelected || exceedsMax) return;

    const existsInList = causes.some(
      c => c.label.toLowerCase() === trimmed.toLowerCase()
    );
    const newId = existsInList
      ? (causes.find(c => c.label.toLowerCase() === trimmed.toLowerCase())
          ?.id ?? crypto.randomUUID())
      : crypto.randomUUID();

    if (!existsInList) {
      setUserEnteredCauses(prev => [{ id: newId, label: trimmed }, ...prev]);
    }

    setSelectedCauses(prev => [...prev, { id: newId, label: trimmed }]);
    setCauseSearch('');
  };

  const handleRemoveCause = (id: string) => {
    setSelectedCauses(prev => prev.filter(c => c.id !== id));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleNext = () => {
    onNext({
      preferredCauses: {
        isEnabled,
        dataTakenFromCandidate,
        causes: selectedCauses,
      },
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex size-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
            aria-label={t('common.back')}
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">
            {t('preferredCauses.title')}
          </h2>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => setIsEnabled(prev => !prev)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            isEnabled ? 'bg-teal-600' : 'bg-slate-200'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Body */}
      <div className="px-8 py-6">
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
            <span className="text-sm font-semibold text-slate-700">
              {t('preferredCauses.sectionLabel')}
            </span>
            <span className="text-sm font-semibold">
              <span className="text-slate-900">{causeSearch.length}</span>
              <span className="text-slate-400">/{MAX_CAUSE_CHARS}</span>
            </span>
          </div>

          {/* Cause search input */}
          <div className="relative">
            <input
              type="text"
              value={causeSearch}
              onChange={e => {
                if (e.target.value.length <= MAX_CAUSE_CHARS) {
                  setCauseSearch(e.target.value);
                  setIsDropdownOpen(true);
                }
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onClick={() => setIsDropdownOpen(true)}
              onKeyDown={handleInputKeyDown}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              disabled={dataTakenFromCandidate || exceedsMax}
              placeholder={t('preferredCauses.input.placeholder')}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />

            {/* Dropdown */}
            {isDropdownOpen && !dataTakenFromCandidate && !exceedsMax && (
              <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md">
                {/* Add new (custom) option */}
                {causeSearch.trim() &&
                  !causes.some(
                    c =>
                      c.label.toLowerCase() === causeSearch.trim().toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        handleAddCustom(causeSearch.trim());
                        setIsDropdownOpen(false);
                      }}
                      className="m-3 flex w-[calc(100%-24px)] cursor-pointer items-center gap-1 overflow-hidden rounded bg-neutral-200 px-2 py-2.5 text-left text-sm font-medium text-slate-900 hover:bg-neutral-300"
                    >
                      <Plus className="size-4 shrink-0" />
                      {t('preferredCauses.input.addNew', {
                        value: causeSearch.trim(),
                      })}
                    </button>
                  )}

                {/* API + user-entered cause list with checkboxes */}
                {causes.map(cause => {
                  const isChecked = selectedCauses.some(c => c.id === cause.id);
                  return (
                    <button
                      key={cause.id}
                      type="button"
                      aria-pressed={isChecked}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleToggleCause(cause.id, cause.label)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50',
                        isChecked && 'bg-slate-50'
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        className="pointer-events-none"
                      />
                      {cause.label}
                    </button>
                  );
                })}

                {causes.length === 0 && !causeSearch.trim() && (
                  <p className="px-3 py-2 text-sm text-slate-400">
                    {t('preferredCauses.input.typeToSearch')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Exceeded max error */}
          {exceedsMax && (
            <p className="mt-1.5 text-xs text-red-500">
              {t('preferredCauses.validation.maxCauses', {
                max: MAX_CAUSES,
              })}
            </p>
          )}

          {/* Selected cause chips */}
          {selectedCauses.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {selectedCauses.map(entry => (
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
                    onClick={() => handleRemoveCause(entry.id)}
                    className="flex size-4 shrink-0 items-center justify-center text-slate-400 hover:text-slate-600"
                    aria-label={t('preferredCauses.chip.remove', {
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

      {/* Footer */}
      <div className="sticky bottom-0 z-20 flex justify-end gap-4 border-t border-slate-200 bg-white px-8 py-5">
        <Button variant="secondary" className="h-12 w-44">
          {t('common.cancel')}
        </Button>
        <Button
          className="h-12 w-44 bg-teal-700 hover:bg-teal-800"
          onClick={handleNext}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
