import { ChevronUpIcon, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { AddOrganizationFormDialog } from '@/views/vacancies/components/dialogs';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useLocationsQuery,
  useOrganizationsQuery,
  useSocietiesQuery,
  useStepGuard,
} from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate } from '@/views/vacancies/utils';
import {
  formatLocalDate,
  parseLocalDate,
} from '@/views/vacancies/utils/date-timezone-safe';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cgp/ui-kit/components/ui/collapsible';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';

const MAX_POSITION_LENGTH = 250;
const MAX_SELECTIONS = 10;

/**
 * Sanitizes text input to plain text only.
 * Removes emojis, special Unicode characters, and non-ASCII characters.
 * Keeps only: letters, numbers, spaces, and common punctuation (hyphens, dots, commas, apostrophes, parentheses).
 */
function sanitizeText(value: string): string {
  return value
    .replace(/[^\w\s.,()'/&-]/g, '') // Remove special characters except common punctuation
    .replace(/[\u0080-\uFFFF]/g, ''); // Remove non-ASCII (covers emojis and special Unicode)
}

interface ClubSocietyEntry {
  id: string;
  isOpen: boolean;

  clubSociety: Array<{ value: string; label: string; source: string }>;
  startDate?: string;
  endDate?: string;
  representedOrganization: Array<{
    value: string;
    label: string;
    source: string;
  }>;
  organizationLocations: Array<{ value: string; label: string }>;
  position: string;
}

function ClubSocietyCard({
  index,
  entry,
  onUpdate,
  onSocietiesSearch,
  onOrganizationsSearch,
  onLocationsSearch,
  onRequestAddOrganization,
  fieldsDisabled,
  societies,
  isSocietiesLoading,
  organizations,
  isOrganizationsLoading,
  locationOptions,
  isLocationsLoading,
}: Readonly<{
  index: number;
  entry: ClubSocietyEntry;
  onUpdate: (index: number, updates: Partial<ClubSocietyEntry>) => void;
  onSocietiesSearch: (value: string) => void;
  onOrganizationsSearch: (value: string) => void;
  onLocationsSearch: (value: string) => void;
  onRequestAddOrganization: (index: number, name: string) => void;
  fieldsDisabled: boolean;
  societies: Array<{
    id: string;
    name?: string;
    label?: string;
    source: string;
  }>;
  isSocietiesLoading: boolean;
  organizations: Array<{
    id: string;
    name?: string;
    label?: string;
    source?: string;
  }>;
  isOrganizationsLoading: boolean;
  locationOptions: Array<{ value: string; label: string }>;
  isLocationsLoading: boolean;
}>) {
  const [locationsError, setLocationsError] = useState(false);

  return (
    <Collapsible
      open={entry.isOpen}
      onOpenChange={open => onUpdate(index, { isOpen: open })}
    >
      <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-base font-bold text-slate-900">
            Clubs and societies {String(index + 1).padStart(2, '0')}
          </span>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-slate-400 transition-colors hover:text-slate-600"
              aria-label={entry.isOpen ? 'Collapse' : 'Expand'}
            >
              <ChevronUpIcon
                className={cn(
                  'size-5 transition-transform',
                  !entry.isOpen && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>
        </div>

        {/* Collapsible body */}
        <CollapsibleContent>
          <div
            className={cn(
              'flex flex-col gap-5 px-5 pb-5',
              fieldsDisabled && 'pointer-events-none opacity-60'
            )}
          >
            {/* Row 1: Club / Society | Start Date | End Date */}
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Club / Society</Label>
                </div>
                <MultipleSelector
                  value={entry.clubSociety}
                  onChange={options => {
                    onUpdate(index, {
                      clubSociety: options
                        .filter(
                          opt =>
                            typeof opt.value === 'string' &&
                            opt.value.length > 0
                        )
                        .map(opt => ({
                          value: opt.value,
                          label: opt.label,
                          source: (opt.source as string) ?? 'USER_CREATED',
                        })),
                    });
                  }}
                  options={societies.map(s => ({
                    value: s.id,
                    label: s.name || s.label || '',
                    source: s.source,
                  }))}
                  onSearchSync={value => {
                    onSocietiesSearch(value);
                    return societies.map(s => ({
                      value: s.id,
                      label: s.name || s.label || '',
                      source: s.source,
                    }));
                  }}
                  keepSelectedInList
                  creatable
                  triggerSearchOnFocus
                  hideClearAllButton
                  maxSelected={MAX_SELECTIONS}
                  disabled={fieldsDisabled}
                  loading={isSocietiesLoading}
                  placeholder="Select or add club or society"
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      No societies found
                    </p>
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Start Date</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={fieldsDisabled}
                      className={cn(
                        'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                        !entry.startDate && 'text-slate-500',
                        entry.startDate && 'text-zinc-800',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                        'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                        applyTypography('body-medium'),
                        'shadow-none!'
                      )}
                    >
                      {entry.startDate
                        ? formatDate(entry.startDate)
                        : 'Select start date'}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-zinc-800"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseLocalDate(entry.startDate) ?? undefined}
                      onSelect={date =>
                        onUpdate(index, {
                          startDate: date ? formatLocalDate(date) : undefined,
                        })
                      }
                      disabled={date => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>End Date</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={fieldsDisabled}
                      className={cn(
                        'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                        !entry.endDate && 'text-slate-500',
                        entry.endDate && 'text-zinc-800',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                        'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                        applyTypography('body-medium'),
                        'shadow-none!'
                      )}
                    >
                      {entry.endDate
                        ? formatDate(entry.endDate)
                        : 'Select end date'}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-zinc-800"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseLocalDate(entry.endDate) ?? undefined}
                      onSelect={date =>
                        onUpdate(index, {
                          endDate: date ? formatLocalDate(date) : undefined,
                        })
                      }
                      disabled={date =>
                        entry.startDate
                          ? date <= (parseLocalDate(entry.startDate) ?? date)
                          : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Row 2: Represented Organization | Organization Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Represented Organization</Label>
                </div>
                <MultipleSelector
                  value={entry.representedOrganization}
                  onChange={options => {
                    // Detect newly typed item (value === label means creatable)
                    const newItem = options.find(o => o.value === o.label);
                    if (newItem) {
                      onRequestAddOrganization(index, newItem.label);
                      // Don't add yet — dialog will handle it
                    } else {
                      onUpdate(index, {
                        representedOrganization: options
                          .filter(
                            opt =>
                              typeof opt.value === 'string' &&
                              opt.value.length > 0
                          )
                          .map(opt => ({
                            value: opt.value,
                            label: opt.label,
                            source: (opt.source as string) ?? 'USER_CREATED',
                          })),
                      });
                    }
                  }}
                  options={organizations.map(o => ({
                    value: o.id,
                    label: o.name || o.label || '',
                    source: o.source || 'MASTER',
                  }))}
                  onSearchSync={value => {
                    onOrganizationsSearch(value);
                    return organizations.map(o => ({
                      value: o.id,
                      label: o.name || o.label || '',
                      source: o.source || 'MASTER',
                    }));
                  }}
                  keepSelectedInList
                  creatable
                  triggerSearchOnFocus
                  hideClearAllButton
                  maxSelected={MAX_SELECTIONS}
                  disabled={fieldsDisabled}
                  loading={isOrganizationsLoading}
                  placeholder="Select or add represented organization"
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      No organizations found
                    </p>
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label
                    className={locationsError ? 'text-destructive' : undefined}
                  >
                    Organization Location
                  </Label>
                </div>
                <MultipleSelector
                  value={entry.organizationLocations}
                  onChange={options => {
                    onUpdate(index, {
                      organizationLocations: options.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                      })),
                    });
                  }}
                  options={locationOptions}
                  onSearchSync={value => {
                    onLocationsSearch(value);
                    return locationOptions;
                  }}
                  showArrow
                  keepSelectedInList
                  hideClearAllButton
                  maxSelected={MAX_SELECTIONS}
                  errorMessage="Exceeded maximum of 10 selections"
                  onErrorStateChange={setLocationsError}
                  disabled={fieldsDisabled}
                  loading={isLocationsLoading}
                  placeholder="Select location"
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      No locations found
                    </p>
                  }
                />
              </div>
            </div>

            {/* Row 3: Position / Role Held */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Position / Role Held</Label>
                  <CharacterCount
                    currentLength={entry.position.length}
                    maxLength={MAX_POSITION_LENGTH}
                  />
                </div>
                <Input
                  value={entry.position}
                  onChange={e => {
                    const sanitized = sanitizeText(e.target.value);
                    onUpdate(index, { position: sanitized.trimStart() });
                  }}
                  maxLength={MAX_POSITION_LENGTH}
                  placeholder="Enter position or role held"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function PreferredClubSocietiesStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: contextForm, onCancel } = useVacancyForm();
  const savedClubSocieties = contextForm.preferredClubSocieties;

  const [isEnabled, setIsEnabled] = useState(
    savedClubSocieties?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    savedClubSocieties?.dataTakenFromCandidate ?? false
  );
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);
  const [societiesSearchQuery, setSocietiesSearchQuery] = useState('');
  const [organizationsSearchQuery, setOrganizationsSearchQuery] = useState('');
  const [locationsSearchQuery, setLocationsSearchQuery] = useState('');

  // Organization dialog state
  const [showAddOrganizationDialog, setShowAddOrganizationDialog] =
    useState(false);
  const [pendingOrganizationName, setPendingOrganizationName] = useState('');
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  const [entries, setEntries] = useState<ClubSocietyEntry[]>(
    savedClubSocieties?.clubSocieties &&
      savedClubSocieties.clubSocieties.length > 0
      ? savedClubSocieties.clubSocieties
      : [
          {
            id: '1',
            isOpen: true,
            clubSociety: [],
            startDate: undefined,
            endDate: undefined,
            representedOrganization: [],
            organizationLocations: [],
            position: '',
          },
        ]
  );

  const {
    setForm,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();
  const _clubRef = useRef<() => void>(() => {});
  useEffect(() => {
    _clubRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredClubSocieties: {
          isEnabled,
          dataTakenFromCandidate,
          clubSocieties: entries,
        },
      }));
    };
  }, [isEnabled, dataTakenFromCandidate, entries, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _clubRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredClubSocieties: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          clubSocieties: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  const hasClubSocietyData = entries.some(
    e =>
      e.clubSociety.length > 0 ||
      e.representedOrganization.length > 0 ||
      e.organizationLocations.length > 0 ||
      e.position.trim().length > 0 ||
      e.startDate != null ||
      e.endDate != null
  );

  const handleNext = () => {
    const isEmptyEnabledSection =
      isEnabled && !dataTakenFromCandidate && !hasClubSocietyData;

    if (isEmptyEnabledSection) {
      setEmptyDisableOpen(true);
      return;
    }

    onNext({
      preferredClubSocieties: {
        isEnabled,
        dataTakenFromCandidate,
        clubSocieties: entries,
      },
    });
  };

  useStepGuard(isEnabled && !dataTakenFromCandidate && !hasClubSocietyData);

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;
  const canNavigate =
    !isEnabled || dataTakenFromCandidate || hasClubSocietyData;

  // Societies API
  const { data: societiesData, isLoading: isSocietiesLoading } =
    useSocietiesQuery(
      societiesSearchQuery,
      isEnabled && !dataTakenFromCandidate
    );

  // Organizations API
  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizationsQuery(
      organizationsSearchQuery,
      isEnabled && !dataTakenFromCandidate
    );

  // Locations API
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery(
      locationsSearchQuery,
      isEnabled && !dataTakenFromCandidate
    );

  const societies = useMemo(
    () => societiesData?.data?.items?.content ?? [],
    [societiesData]
  );

  const organizations = useMemo(
    () => organizationsData ?? [],
    [organizationsData]
  );

  const locationOptions = useMemo(
    () =>
      (locationsData ?? []).map(loc => ({ value: loc.id, label: loc.label })),
    [locationsData]
  );

  const handleToggle = () => {
    if (isEnabled) {
      setConfirmDisableOpen(true);
    } else {
      setIsEnabled(true);
    }
  };

  const updateEntry = (index: number, updates: Partial<ClubSocietyEntry>) => {
    setEntries(prev =>
      prev.map((e, i) => (i === index ? { ...e, ...updates } : e))
    );
  };

  const addEntry = () => {
    const newId = String(Date.now());
    setEntries(prev => [
      ...prev,
      {
        id: newId,
        isOpen: true,
        clubSociety: [],
        startDate: undefined,
        endDate: undefined,
        representedOrganization: [],
        organizationLocations: [],
        position: '',
      },
    ]);
  };

  const handleDisable = () => {
    setEntries([
      {
        id: '1',
        isOpen: true,
        clubSociety: [],
        startDate: undefined,
        endDate: undefined,
        representedOrganization: [],
        organizationLocations: [],
        position: '',
      },
    ]);
    setDataTakenFromCandidate(false);
    setIsEnabled(false);
    removeCompletedStep(currentStepIndex);
    setConfirmDisableOpen(false);
    SuccessToast({
      title: 'Section Disabled',
      description:
        'Preferred Clubs and Societies section has been disabled successfully.',
    });
  };

  const handleBack = () => {
    if (!canNavigate) {
      return;
    }

    stepPersistRef.current?.();
    onBack();
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        {/* ── Informational Banner ──────────────────────────────────────── */}
        <MessageBox
          fields={[
            t('preferredClubSocieties.fieldList.clubSociety'),
            t('preferredClubSocieties.fieldList.position'),
            t('preferredClubSocieties.fieldList.representedOrganization'),
            t('preferredClubSocieties.fieldList.startDate'),
          ]}
        />

        {/* ── Section header: back arrow + title + toggle ───────────────── */}
        <div className="flex items-center justify-between px-7 py-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Back"
              className={cn(
                'cursor-pointer text-slate-700 transition-colors hover:text-slate-900',
                !canNavigate &&
                  'cursor-not-allowed opacity-40 hover:text-slate-700'
              )}
              onClick={handleBack}
              disabled={!canNavigate}
            >
              <ArrowLeft2 size={24} />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Preferred Clubs and Societies
            </h2>
          </div>
          <SwitchPrimitive.Root
            checked={isEnabled}
            onCheckedChange={handleToggle}
            className={cn(
              'focus-visible:ring-ring/50 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
              isEnabled ? 'bg-brand-primary-500' : 'bg-slate-300'
            )}
          >
            <SwitchPrimitive.Thumb
              className={cn(
                'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </SwitchPrimitive.Root>
        </div>

        {/* ── Checkbox: data from candidate profile ─────────────────────── */}
        <div
          className={cn(
            'flex items-start gap-3 px-7 pb-8',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Checkbox
            id="clubSocietiesDataTakenFromCandidate"
            checked={dataTakenFromCandidate}
            onCheckedChange={value => {
              const checked = !!value;
              setDataTakenFromCandidate(checked);
              if (checked) {
                setEntries([
                  {
                    id: '1',
                    isOpen: true,
                    clubSociety: [],
                    startDate: undefined,
                    endDate: undefined,
                    representedOrganization: [],
                    organizationLocations: [],
                    position: '',
                  },
                ]);
              }
            }}
            className="mt-0.5"
          />
          <Label
            htmlFor="clubSocietiesDataTakenFromCandidate"
            className="cursor-pointer text-sm leading-snug font-medium text-slate-900"
          >
            If selected, no manual input is required, and data will be taken
            from the candidate profile
          </Label>
        </div>

        {/* ── Club Society cards ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 px-6">
          {entries.map((entry, index) => (
            <ClubSocietyCard
              key={entry.id}
              index={index}
              entry={entry}
              onUpdate={updateEntry}
              onSocietiesSearch={setSocietiesSearchQuery}
              onOrganizationsSearch={setOrganizationsSearchQuery}
              onLocationsSearch={setLocationsSearchQuery}
              onRequestAddOrganization={(cardIndex, name) => {
                setActiveCardIndex(cardIndex);
                setPendingOrganizationName(name);
                setShowAddOrganizationDialog(true);
              }}
              fieldsDisabled={fieldsDisabled}
              societies={societies}
              isSocietiesLoading={isSocietiesLoading}
              organizations={organizations}
              isOrganizationsLoading={isOrganizationsLoading}
              locationOptions={locationOptions}
              isLocationsLoading={isLocationsLoading}
            />
          ))}
        </div>

        {/* ── Add entry button ──────────────────────────────────────────── */}
        <div
          className={cn(
            'flex justify-end px-6 py-4',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            aria-label="Add entry"
            className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
            disabled
            onClick={addEntry}
          >
            <PlusIcon className="size-4 text-neutral-600!" />
          </Button>
        </div>

        {/* ── Step footer ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
          <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="h-12 w-48"
            onClick={handleNext}
            disabled={!canNavigate}
          >
            Next
          </Button>
        </div>
      </div>

      {/* ── Add Organization dialog ──────────────────────────────────────── */}
      <AddOrganizationFormDialog
        open={showAddOrganizationDialog}
        onOpenChange={setShowAddOrganizationDialog}
        organizationName={pendingOrganizationName}
        onOrganizationAdded={org => {
          if (activeCardIndex !== null) {
            updateEntry(activeCardIndex, {
              representedOrganization: [
                ...(entries[activeCardIndex]?.representedOrganization ?? []),
                { value: org.id, label: org.name, source: org.source },
              ],
            });
          }
          setShowAddOrganizationDialog(false);
        }}
      />

      {/* ── Disable Confirmation Dialog ───────────────────────────────────── */}
      <DisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        title={t('preferredClubSocieties.confirmDisableDialog.title')}
        message={t('preferredClubSocieties.confirmDisableDialog.message')}
        cancelLabel={t('preferredClubSocieties.confirmDisableDialog.cancel')}
        disableLabel={t('preferredClubSocieties.confirmDisableDialog.disable')}
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={handleDisable}
      />

      <StepDisableDialog
        open={emptyDisableOpen}
        onOpenChange={setEmptyDisableOpen}
        onConfirm={() => {
          setIsEnabled(false);
          setDataTakenFromCandidate(false);
          setEmptyDisableOpen(false);
          onNext({
            preferredClubSocieties: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              clubSocieties: [],
            },
          });
        }}
        title={t('preferredClubSocieties.emptyDisableDialog.title')}
        description={t('preferredClubSocieties.emptyDisableDialog.message')}
        cancelLabel={t('preferredClubSocieties.emptyDisableDialog.cancel')}
        confirmLabel={t('preferredClubSocieties.emptyDisableDialog.disable')}
      />
    </>
  );
}
