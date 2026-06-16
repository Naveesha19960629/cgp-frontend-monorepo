import { ChevronUpIcon, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useEffect, useMemo, useRef, useState } from 'react';

import MessageBox from '@/components/message-box';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useLocationsQuery,
  useOrganizationsQuery,
  useSportsQuery,
  useStepGuard,
} from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate } from '@/views/vacancies/utils';

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

const LEVEL_REPRESENTED_OPTIONS: Array<{
  value: string;
  label: string;
  source: string;
}> = [
  { value: 'MEMBER', label: 'Member', source: 'MASTER' },
  { value: 'LEADER', label: 'Leader', source: 'MASTER' },
  { value: 'CAPTAIN', label: 'Captain', source: 'MASTER' },
  { value: 'VICE_CAPTAIN', label: 'Vice Captain', source: 'MASTER' },
  { value: 'COACH', label: 'Coach', source: 'MASTER' },
  { value: 'PLAYER', label: 'Player', source: 'MASTER' },
];

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
  fieldsDisabled,
  sports,
  isSportsLoading,
  organizations,
  isOrganizationsLoading,
  locationOptions,
  isLocationsLoading,
}: Readonly<{
  index: number;
  entry: SportEntry;
  onUpdate: (index: number, updates: Partial<SportEntry>) => void;
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
  locationOptions: Array<{ value: string; label: string }>;
  isLocationsLoading: boolean;
}>) {
  const [openDatePopover, setOpenDatePopover] = useState<
    'startDate' | 'endDate' | null
  >(null);

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
                  <Label>Organization Location</Label>
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
                  onSearchSync={() => locationOptions}
                  showArrow
                  keepSelectedInList
                  hideClearAllButton
                  maxSelected={MAX_SELECTIONS}
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
                          source: (opt.source as string) ?? 'USER_CREATED',
                        })),
                    });
                  }}
                  options={LEVEL_REPRESENTED_OPTIONS}
                  onSearchSync={() => LEVEL_REPRESENTED_OPTIONS}
                  keepSelectedInList
                  creatable
                  triggerSearchOnFocus
                  hideClearAllButton
                  maxSelected={MAX_SELECTIONS}
                  disabled={fieldsDisabled}
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
                  }}
                  options={organizations.map(o => ({
                    value: o.id,
                    label: o.name || o.label || '',
                    source: o.source || 'MASTER',
                  }))}
                  onSearchSync={() => {
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
                  onChange={e => onUpdate(index, { position: e.target.value })}
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
                      selected={
                        entry.startDate ? new Date(entry.startDate) : undefined
                      }
                      defaultMonth={
                        (entry.startDate && new Date(entry.startDate)) ||
                        (entry.endDate && new Date(entry.endDate)) ||
                        new Date()
                      }
                      onSelect={date => {
                        onUpdate(index, {
                          startDate: date ? date.toISOString() : undefined,
                        });
                        setOpenDatePopover(null);

                        if (entry.endDate && date) {
                          const endDate = new Date(entry.endDate);
                          if (endDate < date) {
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
                      selected={
                        entry.endDate ? new Date(entry.endDate) : undefined
                      }
                      defaultMonth={
                        (entry.endDate && new Date(entry.endDate)) ||
                        (entry.startDate && new Date(entry.startDate)) ||
                        new Date()
                      }
                      onSelect={date => {
                        onUpdate(index, {
                          endDate: date ? date.toISOString() : undefined,
                        });
                        setOpenDatePopover(null);
                      }}
                      disabled={date => {
                        const startDate = entry.startDate
                          ? new Date(entry.startDate)
                          : undefined;
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
  const { form: contextForm, onCancel } = useVacancyForm();
  const savedSports = contextForm.preferredSports;

  const [isEnabled, setIsEnabled] = useState(savedSports?.isEnabled ?? false);
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    savedSports?.dataTakenFromCandidate ?? false
  );
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  const [entries, setEntries] = useState<SportEntry[]>(
    savedSports?.sports && savedSports.sports.length > 0
      ? savedSports.sports
      : [createEmptyEntry('1')]
  );

  const { setForm, stepPersistRef, stepDisableRef } = useVacancyForm();
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

  const handleNext = () => {
    const isEmptyEnabledSection =
      isEnabled &&
      !dataTakenFromCandidate &&
      !entries.some(e => e.sport.length > 0);

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

  useStepGuard(
    isEnabled &&
      !dataTakenFromCandidate &&
      !entries.some(e => e.sport.length > 0)
  );

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  // Sports API
  const { data: sportsData, isLoading: isSportsLoading } = useSportsQuery(
    '',
    isEnabled && !dataTakenFromCandidate
  );

  // Organizations API
  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizationsQuery('', isEnabled && !dataTakenFromCandidate);

  // Locations API
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery('', isEnabled && !dataTakenFromCandidate);

  const sports = useMemo(
    () => sportsData?.data?.items?.content ?? [],
    [sportsData]
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
    setConfirmDisableOpen(false);
    SuccessToast({
      title: 'Section Disabled',
      description: 'Preferred Sports section has been disabled successfully.',
    });
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
              className="text-slate-700 transition-colors hover:text-slate-900"
              onClick={onBack}
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
            onCheckedChange={value => setDataTakenFromCandidate(!!value)}
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
              fieldsDisabled={fieldsDisabled}
              sports={sports}
              isSportsLoading={isSportsLoading}
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
          <Button className="h-12 w-48" onClick={handleNext}>
            Next
          </Button>
        </div>
      </div>

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
