import { ChevronUpIcon, Loader2, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/app/components/message-box';
import { AddOrganizationFormDialog } from '@/views/vacancies/components/dialogs';
import {
  useCreateIndustryMutation,
  useIndustriesQuery,
  useLocationsQuery,
  useOrganizationsQuery,
} from '@/views/vacancies/hooks';
import type {
  LocationOption,
  OrganizationOption,
} from '@/views/vacancies/services';
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
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';

const MAX_SELECTIONS = 10;

interface OrganizationValue {
  id: string;
  name: string;
  location?: string;
  organizationWebSite?: string;
  source?: 'MASTER' | 'PENDING' | 'USER_CREATED';
}

interface ProjectEntry {
  id: string;
  isOpen: boolean;
  startDate?: string;
  endDate?: string;
  relatedIndustry: Array<{ value: string; label: string; source: string }>;
  organizationLocation?: { id: string; label: string };
  organization?: OrganizationValue;
}

function ProjectCard({
  index,
  project,
  onUpdate,
  fieldsDisabled,
  industries,
  isIndustriesLoading,
  locationOptions,
  isLocationsLoading,
  organizationOptions,
  isOrganizationsLoading,
  locationsData,
  organizationsData,
  onOpenAddOrganizationDialog,
}: Readonly<{
  index: number;
  project: ProjectEntry;
  onUpdate: (index: number, updates: Partial<ProjectEntry>) => void;
  fieldsDisabled: boolean;
  industries: Array<{ id: string; label: string; source: string }>;
  isIndustriesLoading: boolean;
  locationOptions: Array<{ value: string; label: string }>;
  isLocationsLoading: boolean;
  organizationOptions: Array<{ value: string; label: string }>;
  isOrganizationsLoading: boolean;
  locationsData: LocationOption[];
  organizationsData: OrganizationOption[];
  onOpenAddOrganizationDialog: (name: string, projectIndex: number) => void;
}>) {
  const { t } = useTranslation('ats');
  const [hasMaxError, setHasMaxError] = useState(false);
  const [industriesSearch, setIndustriesSearch] = useState('');

  return (
    <Collapsible
      open={project.isOpen}
      onOpenChange={open => onUpdate(index, { isOpen: open })}
    >
      <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-base font-bold text-slate-900">
            {t('projectsRequirements.projectCard', {
              number: String(index + 1).padStart(2, '0'),
            })}
          </span>
          <div className="flex items-center gap-3">
            {/* <button
              type="button"
              onClick={onRemove}
              className="text-slate-400 transition-colors hover:text-red-500"
              aria-label="Remove project"
            >
              <Trash2 className="size-5" />
            </button> */}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                aria-label={project.isOpen ? 'Collapse' : 'Expand'}
              >
                <ChevronUpIcon
                  className={cn(
                    'size-5 transition-transform',
                    !project.isOpen && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Collapsible body */}
        <CollapsibleContent>
          <div
            className={cn(
              'flex flex-col gap-5 border-t border-slate-200 px-6 py-5',
              fieldsDisabled && 'pointer-events-none opacity-60'
            )}
          >
            {/* Row 1: Start Date | End Date | Related Industry */}
            <div className="grid grid-cols-[1fr_1fr_2fr] gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>{t('projectsRequirements.startDate')}</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-11 w-full justify-between text-left font-normal',
                        !project.startDate && 'text-slate-500'
                      )}
                    >
                      {project.startDate
                        ? formatDate(project.startDate)
                        : t('projectsRequirements.placeholders.startDate')}
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
                        project.startDate
                          ? new Date(project.startDate)
                          : undefined
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
                  <Label>{t('projectsRequirements.endDate')}</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-11 w-full justify-between text-left font-normal',
                        !project.endDate && 'text-slate-500'
                      )}
                    >
                      {project.endDate
                        ? formatDate(project.endDate)
                        : t('projectsRequirements.placeholders.endDate')}
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
                        project.endDate ? new Date(project.endDate) : undefined
                      }
                      onSelect={date =>
                        onUpdate(index, {
                          endDate: date ? date.toISOString() : undefined,
                        })
                      }
                      disabled={date =>
                        project.startDate
                          ? date <= new Date(project.startDate)
                          : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label
                    className={hasMaxError ? 'text-destructive' : undefined}
                  >
                    {t('projectsRequirements.relatedIndustry')}
                  </Label>
                  <CharacterCount
                    currentLength={industriesSearch.length}
                    maxLength={100}
                  />
                </div>
                <MultipleSelector
                  value={project.relatedIndustry.map(i => ({
                    value: i.value,
                    label: i.label,
                    source: i.source,
                  }))}
                  errorMessage={t('projectsRequirements.errors.maxIndustries')}
                  onErrorStateChange={setHasMaxError}
                  onChange={options => {
                    onUpdate(index, {
                      relatedIndustry: options
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
                  options={industries.map(i => ({
                    value: i.id,
                    label: i.label,
                    source: i.source,
                  }))}
                  onSearchSync={value => {
                    setIndustriesSearch(value);
                    return industries.map(i => ({
                      value: i.id,
                      label: i.label,
                      source: i.source,
                    }));
                  }}
                  keepSelectedInList
                  creatable
                  triggerSearchOnFocus
                  hideClearAllButton
                  maxSelected={MAX_SELECTIONS}
                  disabled={fieldsDisabled}
                  inputProps={{
                    maxLength: 100,
                  }}
                  loading={isIndustriesLoading}
                  placeholder={t(
                    'projectsRequirements.placeholders.relatedIndustry'
                  )}
                  loadingIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      {t('projectsRequirements.industrySearch.loading', {
                        defaultValue: 'Searching...',
                      })}
                    </p>
                  }
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      {t(
                        'projectsRequirements.industrySearch.noDataDescription'
                      )}
                    </p>
                  }
                />
              </div>
            </div>

            {/* Row 2: Organization Location | Organization Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>
                    {t('projectsRequirements.organizationLocation')}
                  </Label>
                </div>
                <Combobox
                  options={locationOptions}
                  value={project.organizationLocation?.id ?? ''}
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
                  placeholder={t(
                    'projectsRequirements.placeholders.organizationLocation'
                  )}
                  searchPlaceholder={t(
                    'projectsRequirements.placeholders.searchLocation'
                  )}
                  hideAddNew
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>{t('projectsRequirements.organizationName')}</Label>
                </div>
                <Combobox
                  options={organizationOptions}
                  value={project.organization?.id ?? ''}
                  onValueChange={value => {
                    const found = organizationsData.find(o => o.id === value);
                    if (found) {
                      onUpdate(index, {
                        organization: {
                          id: found.id,
                          name: found.name || found.label || '',
                          location: found.location,
                          organizationWebSite: found.organizationWebSite,
                          source: found.source,
                        },
                      });
                      const locationId = found.location;
                      if (locationId) {
                        const matchingLocation = locationsData.find(
                          l => l.id === locationId
                        );
                        if (matchingLocation) {
                          onUpdate(index, {
                            organizationLocation: {
                              id: matchingLocation.id,
                              label: matchingLocation.label,
                            },
                          });
                        }
                      }
                    }
                  }}
                  onSearchChange={() => {}}
                  loading={isOrganizationsLoading}
                  onAddNew={value => {
                    const existing = organizationsData.find(
                      o =>
                        (o.name || o.label || '').toLowerCase() ===
                        value.toLowerCase()
                    );
                    if (existing) {
                      onUpdate(index, {
                        organization: {
                          id: existing.id,
                          name: existing.name || existing.label || '',
                          location: existing.location,
                          organizationWebSite: existing.organizationWebSite,
                          source: existing.source,
                        },
                      });
                      return;
                    }
                    onOpenAddOrganizationDialog(value, index);
                  }}
                  placeholder={t(
                    'projectsRequirements.placeholders.organizationName'
                  )}
                  searchPlaceholder={t(
                    'projectsRequirements.placeholders.searchOrganization'
                  )}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function ProjectsRequirementsStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');

  const [isEnabled, setIsEnabled] = useState(false);
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  const [projects, setProjects] = useState<ProjectEntry[]>([
    {
      id: '1',
      isOpen: true,
      startDate: undefined,
      endDate: undefined,
      relatedIndustry: [],
      organizationLocation: undefined,
      organization: undefined,
    },
  ]);

  // Industry search (searchable, backed by industries API)
  const { data: industriesData, isLoading: isIndustriesLoading } =
    useIndustriesQuery('');
  const { mutateAsync: createIndustry } = useCreateIndustryMutation();

  // Organization Location combobox (searchable, backed by locations API)
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery('', isEnabled && !dataTakenFromCandidate);

  // Organization Name combobox (searchable + add-new opens dialog)
  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizationsQuery('', isEnabled && !dataTakenFromCandidate);
  const [showAddOrganizationDialog, setShowAddOrganizationDialog] =
    useState(false);
  const [pendingOrganizationName, setPendingOrganizationName] = useState('');
  const [pendingProjectIndex, setPendingProjectIndex] = useState<number>(0);

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  const handleToggle = () => {
    if (isEnabled) {
      setConfirmDisableOpen(true);
    } else {
      setIsEnabled(true);
    }
  };

  const industries = useMemo(
    () => industriesData?.data?.items?.content ?? [],
    [industriesData]
  );

  const locationOptions = useMemo(
    () =>
      (locationsData ?? []).map(loc => ({ value: loc.id, label: loc.label })),
    [locationsData]
  );

  const organizationOptions = useMemo(
    () =>
      (organizationsData ?? []).map(o => ({
        value: o.id,
        label: o.name || o.label || '',
      })),
    [organizationsData]
  );

  const updateProject = (index: number, updates: Partial<ProjectEntry>) => {
    setProjects(prev =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  const addProject = () => {
    const newId = String(Date.now());
    setProjects(prev => [
      ...prev,
      {
        id: newId,
        isOpen: true,
        startDate: undefined,
        endDate: undefined,
        relatedIndustry: [],
        organizationLocation: undefined,
        organization: undefined,
      },
    ]);
  };

  const handleDisable = () => {
    setProjects([
      {
        id: '1',
        isOpen: true,
        startDate: undefined,
        endDate: undefined,
        relatedIndustry: [],
        organizationLocation: undefined,
        organization: undefined,
      },
    ]);
    setDataTakenFromCandidate(false);
    setIsEnabled(false);
    setConfirmDisableOpen(false);
    SuccessToast({
      title: 'Section Disabled',
      description:
        'Projects Requirements section has been disabled successfully.',
    });
  };

  const handleNext = async () => {
    // Check if any industries in any project are user-created
    const allIndustries = projects.flatMap(p => p.relatedIndustry);
    const hasUserCreated = allIndustries.some(i => i.source === 'USER_CREATED');

    if (hasUserCreated) {
      setIsSubmitting(true);
      try {
        // Get unique user-created industries
        const uniqueUserCreated = Array.from(
          new Map(
            allIndustries
              .filter(i => i.source === 'USER_CREATED')
              .map(i => [i.label, i])
          ).values()
        );

        // Create all user-created industries
        const results = await Promise.all(
          uniqueUserCreated.map(i => createIndustry(i.label))
        );

        // Create a map of label -> result
        const resultMap = new Map(
          uniqueUserCreated.map((i, idx) => [i.label, results[idx]])
        );

        // Update all projects with the resolved industry IDs
        setProjects(prevProjects =>
          prevProjects.map(project => ({
            ...project,
            relatedIndustry: project.relatedIndustry.map(industry => {
              if (industry.source === 'USER_CREATED') {
                const result = resultMap.get(industry.label);
                if (result) {
                  return {
                    // fix the build failure
                    value: result.pendingId,
                    label: result.value,
                    source: result.status,
                  };
                }
              }
              return industry;
            }),
          }))
        );
      } finally {
        setIsSubmitting(false);
      }
    }

    onNext();
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* ── Informational Banner ────────────────────────────────────────── */}
      <div className="px-6">
        <MessageBox
          title={t('projectsRequirements.bannerTitle')}
          message={
            <>
              <span className="text-brand-primary-500 font-bold">
                {t('projectsRequirements.bannerMessageHighlight')}
              </span>{' '}
              {t('projectsRequirements.bannerMessageRest')}
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
          {t('projectsRequirements.title')}
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
              id="projectsDataTakenFromCandidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={value => setDataTakenFromCandidate(!!value)}
              className="mt-0.5"
            />
            <Label
              htmlFor="projectsDataTakenFromCandidate"
              className="cursor-pointer leading-snug"
            >
              {t('projectsRequirements.dataTakenFromCandidate')}
            </Label>
          </div>
        </div>

        {/* ── Project Cards ──────────────────────────────────────────── */}
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            index={index}
            project={project}
            onUpdate={updateProject}
            fieldsDisabled={fieldsDisabled}
            industries={industries}
            isIndustriesLoading={isIndustriesLoading}
            locationOptions={locationOptions}
            isLocationsLoading={isLocationsLoading}
            organizationOptions={organizationOptions}
            isOrganizationsLoading={isOrganizationsLoading}
            locationsData={locationsData ?? []}
            organizationsData={organizationsData ?? []}
            onOpenAddOrganizationDialog={(name, projectIdx) => {
              setPendingOrganizationName(name);
              setPendingProjectIndex(projectIdx);
              setShowAddOrganizationDialog(true);
            }}
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
            onClick={addProject}
          >
            <PlusIcon className="size-4 text-neutral-600!" />
          </Button>
        </div>
      </div>

      {/* ── Add Organization dialog ─────────────────────────────────────── */}
      <AddOrganizationFormDialog
        open={showAddOrganizationDialog}
        onOpenChange={setShowAddOrganizationDialog}
        organizationName={pendingOrganizationName}
        onOrganizationAdded={org => {
          updateProject(pendingProjectIndex, {
            organization: org,
          });
          const matchingLocation = (locationsData ?? []).find(
            l => l.id === org.location
          );
          if (matchingLocation) {
            updateProject(pendingProjectIndex, {
              organizationLocation: {
                id: matchingLocation.id,
                label: matchingLocation.label,
              },
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
        title="Are you sure?"
        message="Are you sure you want to disable this section? Disabling this section will permanently remove all added data. This action cannot be undone"
        cancelLabel="Cancel"
        disableLabel="Disable"
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={handleDisable}
      />

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="mt-auto flex justify-end gap-4 border-t border-slate-200 px-6 pt-4">
        <Button variant="secondary" className="h-12 w-44" onClick={onBack}>
          {t('projectsRequirements.cancel')}
        </Button>
        <Button
          className="h-12 w-44"
          onClick={() => {
            void handleNext();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            t('projectsRequirements.next')
          )}
        </Button>
      </div>
    </div>
  );
}
