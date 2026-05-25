import { ChevronLeftIcon, ChevronUpIcon, PlusIcon } from 'lucide-react';

import { Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useMemo, useState } from 'react';

import MessageBox from '@/app/components/message-box';
import { AddOrganizationFormDialog } from '@/views/vacancies/components/dialogs';
import { useLocationsQuery } from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Combobox } from '@cgp/ui-kit/components/combobox';
import MultipleSelector from '@cgp/ui-kit/components/multiple-selector';
import type { Option } from '@cgp/ui-kit/components/multiple-selector';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_SELECTIONS = 10;

interface OrganizationValue {
  id: string;
  name: string;
  location?: string;
  organizationWebSite?: string;
  source?: 'MASTER' | 'PENDING' | 'USER_CREATED';
}

export default function ProjectsRequirementsStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(false);

  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [relatedIndustry, setRelatedIndustry] = useState<Option[]>([]);
  const [organizationLocation, setOrganizationLocation] = useState<
    { id: string; label: string } | undefined
  >(undefined);
  const [organization, setOrganization] = useState<
    OrganizationValue | undefined
  >(undefined);

  const [industryInput, setIndustryInput] = useState('');

  // Organization Location combobox (searchable, backed by locations API)
  const [locationsSearch, setLocationsSearch] = useState('');
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery(locationsSearch, isEnabled && !dataTakenFromCandidate);

  // Organization Name combobox (searchable + add-new opens dialog)
  const [organizationsSearch, setOrganizationsSearch] = useState('');
  const [userCreatedOrganizations, setUserCreatedOrganizations] = useState<
    OrganizationValue[]
  >([]);
  const [showAddOrganizationDialog, setShowAddOrganizationDialog] =
    useState(false);
  const [pendingOrganizationName, setPendingOrganizationName] = useState('');

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  const locationOptions = useMemo(
    () =>
      (locationsData ?? []).map(loc => ({ value: loc.id, label: loc.label })),
    [locationsData]
  );

  const organizationOptions = useMemo(
    () =>
      userCreatedOrganizations
        .filter(o =>
          organizationsSearch.trim()
            ? o.name
                .toLowerCase()
                .includes(organizationsSearch.trim().toLowerCase())
            : true
        )
        .map(o => ({ value: o.id, label: o.name })),
    [userCreatedOrganizations, organizationsSearch]
  );

  const noopSearch = async (): Promise<Option[]> => [];

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
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
          onClick={onBack}
        >
          <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="flex-1 text-xl font-bold text-slate-900">
          Preferred Projects
        </h2>
        <SwitchPrimitive.Root
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
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
              id="projectsDataTakenFromCandidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={value => setDataTakenFromCandidate(!!value)}
              className="mt-0.5"
            />
            <Label
              htmlFor="projectsDataTakenFromCandidate"
              className="cursor-pointer leading-snug"
            >
              If selected, no manual input is required, and data will be taken
              from the candidate profile
            </Label>
          </div>
        </div>

        {/* ── Project Card ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-slate-200 bg-white">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Project 01</h3>
            <ChevronUpIcon className="h-5 w-5 text-slate-300" />
          </div>

          {/* Card body */}
          <div
            className={cn(
              'flex flex-col gap-5 border-t border-slate-200 px-6 py-5',
              fieldsDisabled && 'pointer-events-none opacity-60'
            )}
          >
            {/* Row 1: Start Date | End Date | Related Industry */}
            <div className="grid grid-cols-3 gap-4">
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
                        !startDate && 'text-slate-500'
                      )}
                    >
                      {startDate ? formatDate(startDate) : 'Select start date'}
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
                      selected={startDate ? new Date(startDate) : undefined}
                      onSelect={date =>
                        setStartDate(date ? date.toISOString() : undefined)
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
                        !endDate && 'text-slate-500'
                      )}
                    >
                      {endDate ? formatDate(endDate) : 'Select end date'}
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
                      selected={endDate ? new Date(endDate) : undefined}
                      onSelect={date =>
                        setEndDate(date ? date.toISOString() : undefined)
                      }
                      disabled={date =>
                        startDate ? date <= new Date(startDate) : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Related Industry</Label>
                  <CharacterCount
                    currentLength={industryInput.length}
                    maxLength={100}
                  />
                </div>
                <MultipleSelector
                  value={relatedIndustry}
                  onSearch={noopSearch}
                  onChange={options => {
                    setIndustryInput('');
                    setRelatedIndustry(options);
                  }}
                  maxSelected={MAX_SELECTIONS}
                  creatable
                  triggerSearchOnFocus
                  inputProps={{
                    maxLength: 100,
                    onValueChange: val => setIndustryInput(val),
                  }}
                  placeholder="Select or add related industry"
                />
              </div>
            </div>

            {/* Row 2: Organization Location | Organization Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Organization Location</Label>
                </div>
                <Combobox
                  options={locationOptions}
                  value={organizationLocation?.id ?? ''}
                  onValueChange={value => {
                    const found = (locationsData ?? []).find(
                      l => l.id === value
                    );
                    if (found) {
                      setOrganizationLocation({
                        id: found.id,
                        label: found.label,
                      });
                    }
                  }}
                  onSearchChange={setLocationsSearch}
                  loading={isLocationsLoading}
                  placeholder="Select location"
                  searchPlaceholder="Search location"
                  hideAddNew
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>Organization Name</Label>
                </div>
                <Combobox
                  options={organizationOptions}
                  value={organization?.id ?? ''}
                  onValueChange={value => {
                    const found = userCreatedOrganizations.find(
                      o => o.id === value
                    );
                    if (found) {
                      setOrganization(found);
                      const locationId = found.location;
                      if (locationId) {
                        const matchingLocation = (locationsData ?? []).find(
                          l => l.id === locationId
                        );
                        if (matchingLocation) {
                          setOrganizationLocation({
                            id: matchingLocation.id,
                            label: matchingLocation.label,
                          });
                        }
                      }
                    }
                  }}
                  onSearchChange={setOrganizationsSearch}
                  onAddNew={value => {
                    const existing = userCreatedOrganizations.find(
                      o => o.name.toLowerCase() === value.toLowerCase()
                    );
                    if (existing) {
                      setOrganization(existing);
                      return;
                    }
                    setPendingOrganizationName(value);
                    setShowAddOrganizationDialog(true);
                  }}
                  placeholder="Select or add organization name"
                  searchPlaceholder="Search organization"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Add Entry button (outside card, bottom-right) ─────────── */}
        <div
          className={cn(
            'flex justify-end',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Button
            variant="outline"
            size="icon"
            aria-label="Add entry"
            className="h-9 w-9 rounded-md text-slate-400"
            disabled
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Add Organization dialog ─────────────────────────────────────── */}
      <AddOrganizationFormDialog
        open={showAddOrganizationDialog}
        onOpenChange={setShowAddOrganizationDialog}
        organizationName={pendingOrganizationName}
        onOrganizationAdded={org => {
          setUserCreatedOrganizations(prev => [...prev, org]);
          setOrganization(org);
          const matchingLocation = (locationsData ?? []).find(
            l => l.id === org.location
          );
          if (matchingLocation) {
            setOrganizationLocation({
              id: matchingLocation.id,
              label: matchingLocation.label,
            });
          }
          setShowAddOrganizationDialog(false);
        }}
      />

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="mt-auto flex justify-end gap-4 border-t border-slate-200 px-6 pt-4">
        <Button variant="secondary" className="h-12 w-44" onClick={onBack}>
          Cancel
        </Button>
        <Button className="h-12 w-44" onClick={() => onNext()}>
          Next
        </Button>
      </div>
    </div>
  );
}
