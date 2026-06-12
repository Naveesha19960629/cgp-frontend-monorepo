import { ChevronUpIcon, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCausesQuery,
  useLocationsQuery,
  useOrganizationsQuery,
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

const HUNDRED_YEARS_AGO = new Date(new Date().getFullYear() - 100, 0, 1);
const HUNDRED_YEARS_FROM_NOW = new Date(new Date().getFullYear() + 100, 11, 31);

const MAX_CAUSE_LENGTH = 100;
const MAX_POSITION_LENGTH = 100;
const MAX_SELECTIONS = 10;

interface VolunteeringEntry {
  id: string;
  isOpen: boolean;
  organizationName: Array<{ value: string; label: string; source: string }>;
  organizationLocations: Array<{ value: string; label: string }>;
  cause: Array<{ value: string; label: string; source: string }>;
  causeSearch: string;
  position: string;
  startDate?: string;
  endDate?: string;
  openDatePopover?: 'startDate' | 'endDate' | null;
}

function createEmptyEntry(id: string): VolunteeringEntry {
  return {
    id,
    isOpen: true,
    organizationName: [],
    organizationLocations: [],
    cause: [],
    causeSearch: '',
    position: '',
    startDate: undefined,
    endDate: undefined,
  };
}

function VolunteeringCard({
  index,
  entry,
  onUpdate,
  fieldsDisabled,
  organizations,
  isOrganizationsLoading,
  causes,
  isCausesLoading,
  locationOptions,
  isLocationsLoading,
}: Readonly<{
  index: number;
  entry: VolunteeringEntry;
  onUpdate: (index: number, updates: Partial<VolunteeringEntry>) => void;
  fieldsDisabled: boolean;
  organizations: Array<{
    id: string;
    name?: string;
    label?: string;
    source?: string;
  }>;
  isOrganizationsLoading: boolean;
  causes: Array<{ id: string; label: string; source?: string }>;
  isCausesLoading: boolean;
  locationOptions: Array<{ value: string; label: string }>;
  isLocationsLoading: boolean;
}>) {
  return (
    <Collapsible
      open={entry.isOpen}
      onOpenChange={open => onUpdate(index, { isOpen: open })}
    >
      <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-base font-bold text-slate-900">
            Volunteering {String(index + 1).padStart(2, '0')}
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
            {/* Row 1: Organisation Name | Organization Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Organisation Name</Label>
                </div>
                <MultipleSelector
                  value={entry.organizationName}
                  onChange={options => {
                    onUpdate(index, {
                      organizationName: options
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
                  placeholder="Select or add organization name"
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      No organizations found
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

            {/* Row 2: Cause (half width) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Cause</Label>
                  <CharacterCount
                    currentLength={entry.causeSearch.length}
                    maxLength={MAX_CAUSE_LENGTH}
                  />
                </div>
                <MultipleSelector
                  value={entry.cause}
                  onChange={options => {
                    onUpdate(index, {
                      cause: options
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
                  options={causes.map(c => ({
                    value: c.id,
                    label: c.label,
                    source: c.source ?? 'MASTER',
                  }))}
                  onSearchSync={value => {
                    onUpdate(index, { causeSearch: value });
                    return causes.map(c => ({
                      value: c.id,
                      label: c.label,
                      source: c.source ?? 'MASTER',
                    }));
                  }}
                  keepSelectedInList
                  creatable
                  triggerSearchOnFocus
                  hideClearAllButton
                  maxSelected={MAX_SELECTIONS}
                  disabled={fieldsDisabled}
                  loading={isCausesLoading}
                  placeholder="Select or add cause"
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      No causes found
                    </p>
                  }
                />
              </div>
            </div>

            {/* Row 3: Position / Role | Start Date | End Date */}
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Position / Role</Label>
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
                  open={entry.openDatePopover === 'startDate'}
                  onOpenChange={open =>
                    onUpdate(index, {
                      openDatePopover:
                        !fieldsDisabled && open ? 'startDate' : null,
                    })
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
                        onUpdate(index, { openDatePopover: null });

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
                  open={entry.openDatePopover === 'endDate'}
                  onOpenChange={open =>
                    onUpdate(index, {
                      openDatePopover:
                        !fieldsDisabled && open ? 'endDate' : null,
                    })
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
                        onUpdate(index, { openDatePopover: null });
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

export default function PreferredVolunteeringStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: contextForm, onCancel } = useVacancyForm();
  const savedVolunteering = contextForm.preferredVolunteering;

  const [isEnabled, setIsEnabled] = useState(
    savedVolunteering?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    savedVolunteering?.dataTakenFromCandidate ?? false
  );
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  // TODO: Persist state on tab navigation — not yet wired because VacancyForm
  // has no `preferredVolunteering` field. To activate:
  //   1. Add `preferredVolunteering` to VacancyForm in types.ts
  //   2. Add its default value to DEFAULT_FORM in vacancy-form-context.tsx
  //   3. Uncomment the block below and add to the React import: useEffect, useRef
  //      and add to the file import: useVacancyForm from vacancy-form-context
  //
  // const { setForm, stepPersistRef } = useVacancyForm();
  // const _volunteeringRef = useRef<() => void>(() => {});
  // useEffect(() => {
  //   _volunteeringRef.current = () => {
  //     setForm(prev => ({
  //       ...prev,
  //       preferredVolunteering: { isEnabled, dataTakenFromCandidate, entries },
  //     }));
  //   };
  // }, [isEnabled, dataTakenFromCandidate, entries, setForm]);
  // useEffect(() => {
  //   stepPersistRef.current = () => _volunteeringRef.current();
  //   return () => {
  //     stepPersistRef.current = null;
  //   };
  // }, [stepPersistRef]);

  const [entries, setEntries] = useState<VolunteeringEntry[]>(
    savedVolunteering?.volunteering && savedVolunteering.volunteering.length > 0
      ? savedVolunteering.volunteering
      : [createEmptyEntry('1')]
  );

  const handleNext = () => {
    onNext({
      preferredVolunteering: {
        isEnabled,
        dataTakenFromCandidate,
        volunteering: entries,
      },
    });
  };

  useStepGuard(
    isEnabled &&
      !dataTakenFromCandidate &&
      !entries.some(e => e.organizationName.length > 0 || e.cause.length > 0)
  );

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  // Organizations API
  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizationsQuery('', isEnabled && !dataTakenFromCandidate);

  // Causes API
  const { data: causesData, isLoading: isCausesLoading } = useCausesQuery('');

  // Locations API
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery('', isEnabled && !dataTakenFromCandidate);

  const organizations = useMemo(
    () => organizationsData ?? [],
    [organizationsData]
  );

  const causes = useMemo(
    () => causesData?.data?.items?.content ?? [],
    [causesData]
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

  const updateEntry = (index: number, updates: Partial<VolunteeringEntry>) => {
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
      description:
        'Preferred Volunteering section has been disabled successfully.',
    });
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        {/* ── Informational Banner ──────────────────────────────────────── */}
        <MessageBox
          fields={[
            t('preferredVolunteering.fieldList.organization'),
            t('preferredVolunteering.fieldList.location'),
            t('preferredVolunteering.fieldList.startDate'),
            t('preferredVolunteering.fieldList.endDate'),
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
              Preferred Volunteering
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
            id="volunteeringDataTakenFromCandidate"
            checked={dataTakenFromCandidate}
            onCheckedChange={value => setDataTakenFromCandidate(!!value)}
            className="mt-0.5"
          />
          <Label
            htmlFor="volunteeringDataTakenFromCandidate"
            className="cursor-pointer text-sm leading-snug font-medium text-slate-900"
          >
            If selected, no manual input is required, and data will be taken
            from the candidate profile
          </Label>
        </div>

        {/* ── Volunteering cards ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 px-6">
          {entries.map((entry, index) => (
            <VolunteeringCard
              key={entry.id}
              index={index}
              entry={entry}
              onUpdate={updateEntry}
              fieldsDisabled={fieldsDisabled}
              organizations={organizations}
              isOrganizationsLoading={isOrganizationsLoading}
              causes={causes}
              isCausesLoading={isCausesLoading}
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
        title="Are you sure?"
        message="Are you sure you want to disable this section? Disabling this section will permanently remove all added data. This action cannot be undone"
        cancelLabel="Cancel"
        disableLabel="Disable"
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={handleDisable}
      />
    </>
  );
}
