import { Plus, X } from 'lucide-react';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCausesQuery,
  useCreateCauseMutation,
  useDisableSuccessToast,
} from '@/views/vacancies/hooks';
import { causeService } from '@/views/vacancies/services';
import type { CauseEntry, CauseItem, StepProps } from '@/views/vacancies/types';
import { resolveUserCreatedEntries } from '@/views/vacancies/utils';

import { Badge } from '@cgp/ui-kit/components/ui/badge';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';
import StepFooter from './step-footer';
import StepHeader from './step-header';

const MAX_CAUSES = 10;
const MAX_CAUSE_CHARS = 100;

export default function PreferredCausesStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const { form } = useVacancyForm();

  const [isEnabled, setIsEnabled] = useState(
    form.preferredCauses?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredCauses?.dataTakenFromCandidate ?? false
  );
  const [selectedCauses, setSelectedCauses] = useState<CauseEntry[]>(
    form.preferredCauses?.causes ?? []
  );

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

  const atMax = selectedCauses.length >= MAX_CAUSES;
  const [showMaxError, setShowMaxError] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleCause = (id: string, label: string) => {
    const alreadySelected = selectedCauses.some(c => c.id === id);
    if (alreadySelected) {
      setSelectedCauses(prev => prev.filter(c => c.id !== id));
      setShowMaxError(false);
    } else {
      if (atMax) {
        setShowMaxError(true);
        return;
      }
      setSelectedCauses(prev => [...prev, { id, label, source: 'MASTER' }]);
    }
  };

  const handleAddCustom = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Prevent duplicate by label (case-insensitive)
    const alreadySelected = selectedCauses.some(
      c => c.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadySelected) return;
    if (atMax) {
      setShowMaxError(true);
      return;
    }

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

    setSelectedCauses(prev => [
      ...prev,
      { id: newId, label: trimmed, source: 'USER_CREATED' },
    ]);
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
      <StepHeader
        title={t('preferredCauses.title')}
        isEnabled={isEnabled}
        onBack={onBack}
        onToggle={() => {
          if (isEnabled) {
            if (selectedCauses.length > 0 || dataTakenFromCandidate) {
              setConfirmDisableOpen(true);
            } else {
              setIsEnabled(false);
            }
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
                disabled={dataTakenFromCandidate}
                placeholder={t('preferredCauses.input.placeholder')}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />

              {/* Dropdown */}
              {isDropdownOpen && !dataTakenFromCandidate && (
                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md">
                  {/* Add new (custom) option */}
                  {causeSearch.trim() &&
                    !causes.some(
                      c =>
                        c.label.toLowerCase() ===
                        causeSearch.trim().toLowerCase()
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
                    const isChecked = selectedCauses.some(
                      c => c.id === cause.id
                    );
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
            {showMaxError && (
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
      </div>

      <DisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        title={t('preferredCauses.confirmDisableDialog.title')}
        message={t('preferredCauses.confirmDisableDialog.message')}
        cancelLabel={t('preferredCauses.confirmDisableDialog.cancel')}
        disableLabel={t('preferredCauses.confirmDisableDialog.disable')}
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={() => {
          setSelectedCauses([]);
          setUserEnteredCauses([]);
          setDataTakenFromCandidate(false);
          setIsEnabled(false);
          setConfirmDisableOpen(false);
          showDisableToast(t('preferredCauses.title'));
        }}
      />

      <DisableDialog
        open={emptyDisableOpen}
        onOpenChange={open => {
          if (!open) setEmptyDisableOpen(false);
        }}
        title={t('preferredCauses.emptyDisableDialog.title')}
        message={t('preferredCauses.emptyDisableDialog.message')}
        cancelLabel={t('preferredCauses.emptyDisableDialog.cancel')}
        disableLabel={t('preferredCauses.emptyDisableDialog.disable')}
        onCancel={() => setEmptyDisableOpen(false)}
        onDisable={() => {
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
      />

      <StepFooter onNext={() => void handleNext()} onCancel={onBack} />
    </div>
  );
}
