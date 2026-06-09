import { ChevronUpIcon, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useMemo, useState } from 'react';

import MessageBox from '@/app/components/message-box';
import {
  useLocationsQuery,
  useOrganizationsQuery,
  useSocietiesQuery,
} from '@/views/vacancies/hooks';
import type { LocationOption } from '@/views/vacancies/services';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Combobox } from '@cgp/ui-kit/components/combobox';
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
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';

const MAX_POSITION_LENGTH = 250;
const MAX_SELECTIONS = 10;

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
  organizationLocation?: { id: string; label: string };
  position: string;
}

function ClubSocietyCard({
  index,
  entry,
  onUpdate,
  fieldsDisabled,
  societies,
  isSocietiesLoading,
  organizations,
  isOrganizationsLoading,
  locationOptions,
  isLocationsLoading,
  locationsData,
}: Readonly<{
  index: number;
  entry: ClubSocietyEntry;
  onUpdate: (index: number, updates: Partial<ClubSocietyEntry>) => void;
  fieldsDisabled: boolean;
  societies: Array<{ id: string; name: string; source: string }>;
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
  locationsData: LocationOption[];
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
              'flex flex-col gap-5 border-t border-slate-200 px-6 py-5',
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
                    label: s.name,
                    source: s.source,
                  }))}
                  onSearchSync={() => {
                    return societies.map(s => ({
                      value: s.id,
                      label: s.name,
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
                      className={cn(
                        'h-11 w-full justify-between text-left font-normal',
                        !entry.startDate && 'text-slate-500'
                      )}
                    >
                      {entry.startDate
                        ? formatDate(entry.startDate)
                        : 'Select start date'}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-slate-400"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        entry.startDate ? new Date(entry.startDate) : undefined
                      }
                      onSelect={date =>
                        onUpdate(index, {
                          startDate: date ? date.toISOString() : undefined,
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
                      className={cn(
                        'h-11 w-full justify-between text-left font-normal',
                        !entry.endDate && 'text-slate-500'
                      )}
                    >
                      {entry.endDate
                        ? formatDate(entry.endDate)
                        : 'Select end date'}
                      <CalendarIcon
                        variant="Linear"
                        size={20}
                        className="text-slate-400"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        entry.endDate ? new Date(entry.endDate) : undefined
                      }
                      onSelect={date =>
                        onUpdate(index, {
                          endDate: date ? date.toISOString() : undefined,
                        })
                      }
                      disabled={date =>
                        entry.startDate
                          ? date <= new Date(entry.startDate)
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

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Organization Location</Label>
                </div>
                <Combobox
                  options={locationOptions}
                  value={entry.organizationLocation?.id ?? ''}
                  onValueChange={value => {
                    const found = locationsData.find(l => l.id === value);
                    if (found) {
                      onUpdate(index, {
                        organizationLocation: {
                          id: found.id,
                          label: found.label,
                        },
                      });
                    }
                  }}
                  onSearchChange={() => {}}
                  loading={isLocationsLoading}
                  placeholder="Select location"
                  searchPlaceholder="Search location"
                  hideAddNew
                />
              </div>
            </div>

            {/* Row 3: Position / Role Held */}
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
                placeholder="Enter position or role held"
                className="h-11"
              />
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
  const [isEnabled, setIsEnabled] = useState(false);
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  const [entries, setEntries] = useState<ClubSocietyEntry[]>([
    {
      id: '1',
      isOpen: true,
      clubSociety: [],
      startDate: undefined,
      endDate: undefined,
      representedOrganization: [],
      organizationLocation: undefined,
      position: '',
    },
  ]);

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  // Societies API
  const { data: societiesData, isLoading: isSocietiesLoading } =
    useSocietiesQuery('', isEnabled && !dataTakenFromCandidate);

  // Organizations API
  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizationsQuery('', isEnabled && !dataTakenFromCandidate);

  // Locations API
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery('', isEnabled && !dataTakenFromCandidate);

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
        organizationLocation: undefined,
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
        organizationLocation: undefined,
        position: '',
      },
    ]);
    setDataTakenFromCandidate(false);
    setIsEnabled(false);
    setConfirmDisableOpen(false);
    SuccessToast({
      title: 'Section Disabled',
      description:
        'Preferred Clubs and Societies section has been disabled successfully.',
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* ── Informational Banner ────────────────────────────────────────── */}
      <div className="px-6">
        <MessageBox
          title="Build the Application Form"
          message={
            <>
              <span className="text-brand-primary-500 font-bold">
                Certain fields
              </span>{' '}
              in this section are always collected from candidates to support
              consistent candidate profiles. Any fields you don&apos;t select
              won&apos;t be collected
            </>
          }
        />
      </div>

      {/* ── Section Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6">
        <button
          type="button"
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center"
          onClick={onBack}
        >
          <ArrowLeft2 size={24} />
        </button>
        <h2 className="flex-1 text-xl font-bold text-slate-900">
          Preferred Clubs and Societies
        </h2>
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

      <div className="flex flex-col gap-4 px-6">
        {/* dataTakenFromCandidate — grayed when toggle off */}
        <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
          <div className="flex items-start gap-2">
            <Checkbox
              id="clubSocietiesDataTakenFromCandidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={value => setDataTakenFromCandidate(!!value)}
              className="mt-0.5"
            />
            <Label
              htmlFor="clubSocietiesDataTakenFromCandidate"
              className="cursor-pointer leading-snug"
            >
              If selected, no manual input is required, and data will be taken
              from the candidate profile
            </Label>
          </div>
        </div>

        {/* ── Club Society Cards ──────────────────────────────────────────── */}
        {entries.map((entry, index) => (
          <ClubSocietyCard
            key={entry.id}
            index={index}
            entry={entry}
            onUpdate={updateEntry}
            fieldsDisabled={fieldsDisabled}
            societies={societies}
            isSocietiesLoading={isSocietiesLoading}
            organizations={organizations}
            isOrganizationsLoading={isOrganizationsLoading}
            locationOptions={locationOptions}
            isLocationsLoading={isLocationsLoading}
            locationsData={locationsData ?? []}
          />
        ))}

        {/* ── Add Entry button (outside card, bottom-right) ─────────── */}
        <div
          className={cn(
            'flex justify-end',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            aria-label="Add entry"
            className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
            onClick={addEntry}
          >
            <PlusIcon className="size-4 text-neutral-600!" />
          </Button>
        </div>
      </div>

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="mt-auto flex justify-end gap-4 border-t border-slate-200 px-6 pt-4">
        <Button variant="secondary" className="h-12 w-44" onClick={onBack}>
          Cancel
        </Button>
        <Button className="h-12 w-44" onClick={() => onNext()}>
          Next
        </Button>
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
    </div>
  );
}
