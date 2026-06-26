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
  useSportLevelsQuery,
  useSportsQuery,
  useStepGuard,
} from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate, sanitizePlainText } from '@/views/vacancies/utils';
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

const MAX_SPORT_NAME_LENGTH = 100;
const MAX_POSITION_LENGTH = 100;
const MAX_SELECTIONS = 10;
const HUNDRED_YEARS_AGO = new Date(new Date().getFullYear() - 100, 0, 1);
const HUNDRED_YEARS_FROM_NOW = new Date(new Date().getFullYear() + 100, 11, 31);

interface SportEntry {
  id: string;
  isOpen: boolean;
  sport: Array<{ value: string; label: string; source: string }>;
  sportSearch: string;
  levelRepresented: Array<{ value: string; label: string; source: string }>;
  representedOrganization: Array<{
    value: string;
    label: string;
    source: string;
  }>;
  organizationLocations: Array<{ value: string; label: string }>;
  position: string;
  startDate?: string;
  endDate?: string;
}

function createEmptyEntry(id: string): SportEntry {
  return {
    id,
    isOpen: true,
    sport: [],
    sportSearch: '',
    levelRepresented: [],
    representedOrganization: [],
    organizationLocations: [],
    position: '',
    startDate: undefined,
    endDate: undefined,
  };
}

function SportCard({
  index,
  entry,
  onUpdate,
  onSportsSearch,
  onOrganizationsSearch,
  onLocationsSearch,
  onLevelRepresentedSearch,
  onRequestAddOrganization,
  fieldsDisabled,
  sports,
  isSportsLoading,
  organizations,
  isOrganizationsLoading,
  levelRepresentedOptions,
  isLevelsLoading,
  locationOptions,
  isLocationsLoading,
}: Readonly<{
  index: number;
  entry: SportEntry;
  onUpdate: (index: number, updates: Partial<SportEntry>) => void;
  onSportsSearch: (value: string) => void;
  onOrganizationsSearch: (value: string) => void;
  onLocationsSearch: (value: string) => void;
  onLevelRepresentedSearch: (value: string) => void;
  onRequestAddOrganization: (index: number, name: string) => void;
  fieldsDisabled: boolean;
  sports: Array<{
    id: string;
    name?: string;
    label?: string;
    source: string;
  }>;
  isSportsLoading: boolean;
  organizations: Array<{
    id: string;
    name?: string;
    label?: string;
    source?: string;
  }>;
  isOrganizationsLoading: boolean;
  levelRepresentedOptions: Array<{
    value: string;
    label: string;
    source: string;
  }>;
  isLevelsLoading: boolean;
  locationOptions: Array<{ value: string; label: string }>;
  isLocationsLoading: boolean;
}>) {
  const [openDatePopover, setOpenDatePopover] = useState<
    'startDate' | 'endDate' | null
  >(null);
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
            Sports {String(index + 1).padStart(2, '0')}
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
            {/* Row 1: Name of the Sport | Organization Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Name of the Sport</Label>
                  <CharacterCount
                    currentLength={entry.sportSearch.length}
                    maxLength={MAX_SPORT_NAME_LENGTH}
                  />
                </div>
                <MultipleSelector
                  value={entry.sport}
                  onChange={options => {
                    onUpdate(index, {
                      sport: options
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
                  options={sports.map(s => ({
                    value: s.id,
                    label: s.name || s.label || '',
                    source: s.source,
                  }))}
                  onSearchSync={value => {
                    onUpdate(index, { sportSearch: value });
                    onSportsSearch(value);
                    return sports.map(s => ({
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
                  loading={isSportsLoading}
                  placeholder="Select or add sport name"
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      No sports found
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

            {/* Row 2: Level Represented | Represented Organization */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Level Represented</Label>
                </div>
                <MultipleSelector
                  value={entry.levelRepresented}
                  onChange={options => {
                    onUpdate(index, {
                      levelRepresented: options
                        .filter(
                          opt =>
                            typeof opt.value === 'string' &&
                            opt.value.length > 0
                        )
                        .map(opt => ({
                          value: opt.value,
                          label: opt.label,
                          source: (opt.source as string) ?? 'MASTER',
                        })),
                    });
                  }}
                  options={levelRepresentedOptions}
                  onSearchSync={value => {
                    onLevelRepresentedSearch(value);
                    return levelRepresentedOptions;
                  }}
                  keepSelectedInList
                  triggerSearchOnFocus
                  hideClearAllButton
                  maxSelected={MAX_SELECTIONS}
                  disabled={fieldsDisabled}
                  loading={isLevelsLoading}
                  placeholder="Select level represented"
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      No levels found
                    </p>
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Represented Organization</Label>
                </div>
                <MultipleSelector
                  value={entry.representedOrganization}
                  onChange={options => {
                    const newItem = options.find(o => o.value === o.label);
                    if (newItem) {
                      onRequestAddOrganization(index, newItem.label);
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
            </div>

            {/* Row 3: Position / Role Held | Start Date | End Date */}
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
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
                    const sanitized = sanitizePlainText(e.target.value);
                    onUpdate(index, { position: sanitized.trimStart() });
                  }}
                  maxLength={MAX_POSITION_LENGTH}
                  placeholder="Enter position"
                  className="h-11"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Start Date</Label>
                </div>
                <Popover
                  modal
                  open={openDatePopover === 'startDate'}
                  onOpenChange={open =>
                    setOpenDatePopover(
                      !fieldsDisabled && open ? 'startDate' : null
                    )
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
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
                      defaultMonth={
                        parseLocalDate(entry.startDate) ||
                        parseLocalDate(entry.endDate) ||
                        new Date()
                      }
                      onSelect={date => {
                        onUpdate(index, {
                          startDate: date ? formatLocalDate(date) : undefined,
                        });
                        setOpenDatePopover(null);

                        if (entry.endDate && date) {
                          const endDate = parseLocalDate(entry.endDate);
                          if (endDate != null && endDate < date) {
                            onUpdate(index, { endDate: undefined });
                          }
                        }
                      }}
                      disabled={date =>
                        date > new Date() || date < HUNDRED_YEARS_AGO
                      }
                      captionLayout="dropdown"
                      startMonth={HUNDRED_YEARS_AGO}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>End Date</Label>
                </div>
                <Popover
                  modal
                  open={openDatePopover === 'endDate'}
                  onOpenChange={open =>
                    setOpenDatePopover(
                      !fieldsDisabled && open ? 'endDate' : null
                    )
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
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
                      defaultMonth={
                        parseLocalDate(entry.endDate) ||
                        parseLocalDate(entry.startDate) ||
                        new Date()
                      }
                      onSelect={date => {
                        onUpdate(index, {
                          endDate: date ? formatLocalDate(date) : undefined,
                        });
                        setOpenDatePopover(null);
                      }}
                      disabled={date => {
                        const startDate = parseLocalDate(entry.startDate);
                        return (
                          date < HUNDRED_YEARS_AGO ||
                          date > HUNDRED_YEARS_FROM_NOW ||
                          (startDate != null && date < startDate)
                        );
                      }}
                      captionLayout="dropdown"
                      startMonth={HUNDRED_YEARS_AGO}
                      endMonth={HUNDRED_YEARS_FROM_NOW}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function PreferredSportsStep({
  onNext,

  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: contextForm, onCancel } = useVacancyForm();
  const savedSports = contextForm.preferredSports;

  const [isEnabled, setIsEnabled] = useState(savedSports?.isEnabled ?? false);
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    savedSports?.dataTakenFromCandidate ?? false
  );
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);
  const [sportsSearchQuery, setSportsSearchQuery] = useState('');
  const [organizationsSearchQuery, setOrganizationsSearchQuery] = useState('');
  const [locationsSearchQuery, setLocationsSearchQuery] = useState('');
  const [levelRepresentedSearchQuery, setLevelRepresentedSearchQuery] =
    useState('');

  // Organization dialog state
  const [showAddOrganizationDialog, setShowAddOrganizationDialog] =
    useState(false);
  const [pendingOrganizationName, setPendingOrganizationName] = useState('');
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  const [entries, setEntries] = useState<SportEntry[]>(
    savedSports?.sports && savedSports.sports.length > 0
      ? savedSports.sports
      : [createEmptyEntry('1')]
  );

  const {
    setForm,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();
  const _sportsRef = useRef<() => void>(() => {});
  useEffect(() => {
    _sportsRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredSports: { isEnabled, dataTakenFromCandidate, sports: entries },
      }));
    };
  }, [isEnabled, dataTakenFromCandidate, entries, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _sportsRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredSports: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          sports: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  const hasSportsData = entries.some(
    e =>
      e.sport.length > 0 ||
      e.levelRepresented.length > 0 ||
      e.representedOrganization.length > 0 ||
      e.organizationLocations.length > 0 ||
      e.position.trim().length > 0 ||
      e.startDate != null ||
      e.endDate != null
  );

  const handleNext = () => {
    const isEmptyEnabledSection =
      isEnabled && !dataTakenFromCandidate && !hasSportsData;

    if (isEmptyEnabledSection) {
      setEmptyDisableOpen(true);
      return;
    }

    onNext({
      preferredSports: {
        isEnabled,
        dataTakenFromCandidate,
        sports: entries,
      },
    });
  };

  useStepGuard(isEnabled && !dataTakenFromCandidate && !hasSportsData);

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;
  const canNavigate = !isEnabled || dataTakenFromCandidate || hasSportsData;

  // Sports API
  const { data: sportsData, isLoading: isSportsLoading } = useSportsQuery(
    sportsSearchQuery,
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

  // Levels API (/v1/sport-levels)
  const { data: levelsData, isLoading: isLevelsLoading } =
    useSportLevelsQuery();

  const sports = sportsData;

  const organizations = useMemo(
    () => organizationsData ?? [],
    [organizationsData]
  );

  const locationOptions = useMemo(
    () =>
      (locationsData ?? []).map(loc => ({ value: loc.id, label: loc.label })),
    [locationsData]
  );

  const fetchedLevelOptions = useMemo(
    () =>
      levelsData.map(level => ({
        value: level.id,
        label: level.label ?? level.name ?? '',
        source: level.source ?? 'MASTER',
      })),
    [levelsData]
  );

  const levelRepresentedOptions = useMemo(() => {
    if (!levelRepresentedSearchQuery) return fetchedLevelOptions;
    const query = levelRepresentedSearchQuery.toLowerCase();
    return fetchedLevelOptions.filter(
      level =>
        level.label.toLowerCase().includes(query) ||
        level.value.toLowerCase().includes(query)
    );
  }, [fetchedLevelOptions, levelRepresentedSearchQuery]);

  const handleToggle = () => {
    if (isEnabled) {
      setConfirmDisableOpen(true);
    } else {
      setIsEnabled(true);
    }
  };

  const updateEntry = (index: number, updates: Partial<SportEntry>) => {
    setEntries(prev =>
      prev.map((e, i) => (i === index ? { ...e, ...updates } : e))
    );
  };

  const addEntry = () => {
    setEntries(prev => [...prev, createEmptyEntry(String(Date.now()))]);
  };

  const handleDisable = () => {
    setEntries([createEmptyEntry('1')]);
    setDataTakenFromCandidate(false);
    setIsEnabled(false);
    removeCompletedStep(currentStepIndex);
    setConfirmDisableOpen(false);
    SuccessToast({
      title: 'Section Disabled',
      description: 'Preferred Sports section has been disabled successfully.',
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
            'Name of the Sport',
            'Level Represented',
            'Represented Organization',
            'Organization Location',
            'Position / Role Held',
            'Start Date',
            'End Date',
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
              Preferred Sports
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
            id="sportsDataTakenFromCandidate"
            checked={dataTakenFromCandidate}
            onCheckedChange={value => {
              const checked = !!value;
              setDataTakenFromCandidate(checked);
              if (checked) {
                setEntries([createEmptyEntry('1')]);
              }
            }}
            className="mt-0.5"
          />
          <Label
            htmlFor="sportsDataTakenFromCandidate"
            className="cursor-pointer text-sm leading-snug font-medium text-slate-900"
          >
            If selected, no manual input is required, and data will be taken
            from the candidate profile
          </Label>
        </div>

        {/* ── Sport cards ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 px-6">
          {entries.map((entry, index) => (
            <SportCard
              key={entry.id}
              index={index}
              entry={entry}
              onUpdate={updateEntry}
              onSportsSearch={setSportsSearchQuery}
              onOrganizationsSearch={setOrganizationsSearchQuery}
              onLocationsSearch={setLocationsSearchQuery}
              onLevelRepresentedSearch={setLevelRepresentedSearchQuery}
              onRequestAddOrganization={(cardIndex, name) => {
                setActiveCardIndex(cardIndex);
                setPendingOrganizationName(name);
                setShowAddOrganizationDialog(true);
              }}
              fieldsDisabled={fieldsDisabled}
              sports={sports}
              isSportsLoading={isSportsLoading}
              organizations={organizations}
              isOrganizationsLoading={isOrganizationsLoading}
              levelRepresentedOptions={levelRepresentedOptions}
              isLevelsLoading={isLevelsLoading}
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
        title={t('preferredSports.confirmDisableDialog.title')}
        message={t('preferredSports.confirmDisableDialog.message')}
        cancelLabel={t('preferredSports.confirmDisableDialog.cancel')}
        disableLabel={t('preferredSports.confirmDisableDialog.disable')}
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
            preferredSports: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              sports: [],
            },
          });
        }}
        title={t('preferredSports.emptyDisableDialog.title')}
        description={t('preferredSports.emptyDisableDialog.message')}
        cancelLabel={t('preferredSports.emptyDisableDialog.cancel')}
        confirmLabel={t('preferredSports.emptyDisableDialog.disable')}
      />
    </>
  );
}
