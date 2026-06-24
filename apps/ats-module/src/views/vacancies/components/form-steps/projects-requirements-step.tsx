import { ChevronUpIcon, Loader2, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCreateIndustryMutation,
  useIndustriesQuery,
  useLocationsQuery,
  useOrganizationsQuery,
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
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';

const MAX_SELECTIONS = 10;
const HUNDRED_YEARS_AGO = new Date(new Date().getFullYear() - 100, 0, 1);
const HUNDRED_YEARS_FROM_NOW = new Date(new Date().getFullYear() + 100, 11, 31);

interface ProjectEntry {
  id: string;
  isOpen: boolean;
  startDate?: string;
  endDate?: string;
  relatedIndustry: Array<{ value: string; label: string; source: string }>;
  organizationLocations: Array<{ value: string; label: string }>;
  organizations: Array<{ value: string; label: string; source: string }>;
}

function ProjectCard({
  index,
  project,
  onUpdate,
  onIndustriesSearch,
  onLocationsSearch,
  onOrganizationsSearch,
  fieldsDisabled,
  industries,
  isIndustriesLoading,
  locationOptions,
  isLocationsLoading,
  organizationOptions,
  isOrganizationsLoading,
}: Readonly<{
  index: number;
  project: ProjectEntry;
  onUpdate: (index: number, updates: Partial<ProjectEntry>) => void;
  onIndustriesSearch: (value: string) => void;
  onLocationsSearch: (value: string) => void;
  onOrganizationsSearch: (value: string) => void;
  fieldsDisabled: boolean;
  industries: Array<{ id: string; label: string; source: string }>;
  isIndustriesLoading: boolean;
  locationOptions: Array<{ value: string; label: string }>;
  isLocationsLoading: boolean;
  organizationOptions: Array<{ value: string; label: string; source?: string }>;
  isOrganizationsLoading: boolean;
}>) {
  const { t } = useTranslation('ats');
  const [hasMaxError, setHasMaxError] = useState(false);
  const [industriesSearch, setIndustriesSearch] = useState('');
  const [openDatePopover, setOpenDatePopover] = useState<
    'startDate' | 'endDate' | null
  >(null);

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
              'flex flex-col gap-5 px-5 pb-5',
              fieldsDisabled && 'pointer-events-none opacity-60'
            )}
          >
            {/* Row 1: Start Date | End Date | Related Industry */}
            <div className="grid grid-cols-[1fr_1fr_2fr] gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>{t('projectsRequirements.startDate')}</Label>
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
                        !project.startDate && 'text-slate-500',
                        project.startDate && 'text-zinc-800',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                        'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                        applyTypography('body-medium'),
                        'shadow-none!'
                      )}
                    >
                      {project.startDate
                        ? formatDate(project.startDate)
                        : t('projectsRequirements.placeholders.startDate')}
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
                      selected={parseLocalDate(project.startDate) ?? undefined}
                      defaultMonth={
                        parseLocalDate(project.startDate) ||
                        parseLocalDate(project.endDate) ||
                        new Date()
                      }
                      onSelect={date => {
                        onUpdate(index, {
                          startDate: date ? formatLocalDate(date) : undefined,
                        });
                        setOpenDatePopover(null);

                        if (project.endDate && date) {
                          const endDate = parseLocalDate(project.endDate);
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
                  <Label>{t('projectsRequirements.endDate')}</Label>
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
                        !project.endDate && 'text-slate-500',
                        project.endDate && 'text-zinc-800',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                        'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                        applyTypography('body-medium'),
                        'shadow-none!'
                      )}
                    >
                      {project.endDate
                        ? formatDate(project.endDate)
                        : t('projectsRequirements.placeholders.endDate')}
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
                      selected={parseLocalDate(project.endDate) ?? undefined}
                      defaultMonth={
                        parseLocalDate(project.endDate) ||
                        parseLocalDate(project.startDate) ||
                        new Date()
                      }
                      onSelect={date => {
                        onUpdate(index, {
                          endDate: date ? formatLocalDate(date) : undefined,
                        });
                        setOpenDatePopover(null);
                      }}
                      disabled={date => {
                        const startDate = parseLocalDate(project.startDate);
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
                    onIndustriesSearch(value);
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
                <MultipleSelector
                  value={project.organizationLocations}
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
                  maxSelected={10}
                  disabled={fieldsDisabled}
                  loading={isLocationsLoading}
                  placeholder={t(
                    'projectsRequirements.placeholders.organizationLocation'
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

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>{t('projectsRequirements.organizationName')}</Label>
                </div>
                <MultipleSelector
                  value={project.organizations}
                  onChange={options => {
                    onUpdate(index, {
                      organizations: options.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        source: (opt.source as string) ?? 'USER_CREATED',
                      })),
                    });
                  }}
                  options={organizationOptions}
                  onSearchSync={value => {
                    onOrganizationsSearch(value);
                    return organizationOptions;
                  }}
                  creatable
                  keepSelectedInList
                  triggerSearchOnFocus
                  hideClearAllButton
                  maxSelected={10}
                  disabled={fieldsDisabled}
                  loading={isOrganizationsLoading}
                  placeholder={t(
                    'projectsRequirements.placeholders.organizationName'
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
  const { form: contextForm, onCancel } = useVacancyForm();
  const savedProjects = contextForm.projectsRequirements;

  const [isEnabled, setIsEnabled] = useState(savedProjects?.isEnabled ?? false);
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    savedProjects?.dataTakenFromCandidate ?? false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);
  const [industrySearchQuery, setIndustrySearchQuery] = useState('');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [organizationSearchQuery, setOrganizationSearchQuery] = useState('');

  const [projects, setProjects] = useState<ProjectEntry[]>(
    savedProjects?.projects && savedProjects.projects.length > 0
      ? savedProjects.projects
      : [
          {
            id: '1',
            isOpen: true,
            startDate: undefined,
            endDate: undefined,
            relatedIndustry: [],
            organizationLocations: [],
            organizations: [],
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
  const _projectsRef = useRef<() => void>(() => {});
  useEffect(() => {
    _projectsRef.current = () => {
      setForm(prev => ({
        ...prev,
        projectsRequirements: { isEnabled, dataTakenFromCandidate, projects },
      }));
    };
  }, [isEnabled, dataTakenFromCandidate, projects, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _projectsRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        projectsRequirements: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          projects: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  useStepGuard(
    isEnabled &&
      !dataTakenFromCandidate &&
      !projects.some(
        p =>
          p.relatedIndustry.length > 0 ||
          p.organizations.length > 0 ||
          p.organizationLocations.length > 0 ||
          p.startDate != null ||
          p.endDate != null
      )
  );

  // Industry search (searchable, backed by industries API)
  const { data: industriesData, isLoading: isIndustriesLoading } =
    useIndustriesQuery(industrySearchQuery);
  const { mutateAsync: createIndustry } = useCreateIndustryMutation();

  // Organization Location combobox (searchable, backed by locations API)
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery(
      locationSearchQuery,
      isEnabled && !dataTakenFromCandidate
    );

  // Organization Name multi-select (searchable, backed by organizations API)
  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizationsQuery(
      organizationSearchQuery,
      isEnabled && !dataTakenFromCandidate
    );

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;
  const canNavigate =
    !isEnabled ||
    dataTakenFromCandidate ||
    projects.some(
      p =>
        p.relatedIndustry.length > 0 ||
        p.organizations.length > 0 ||
        p.organizationLocations.length > 0 ||
        p.startDate != null ||
        p.endDate != null
    );

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
        source: o.source,
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
        organizationLocations: [],
        organizations: [],
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
        organizationLocations: [],
        organizations: [],
      },
    ]);
    setDataTakenFromCandidate(false);
    setIsEnabled(false);
    removeCompletedStep(currentStepIndex);
    setConfirmDisableOpen(false);
    SuccessToast({
      title: 'Section Disabled',
      description:
        'Projects Requirements section has been disabled successfully.',
    });
  };

  const handleBack = () => {
    if (!canNavigate || isSubmitting) {
      return;
    }

    stepPersistRef.current?.();
    onBack();
  };

  const handleNext = async () => {
    const isEmptyEnabledSection =
      isEnabled &&
      !dataTakenFromCandidate &&
      !projects.some(
        p =>
          p.relatedIndustry.length > 0 ||
          p.organizations.length > 0 ||
          p.organizationLocations.length > 0 ||
          p.startDate != null ||
          p.endDate != null
      );

    if (isEmptyEnabledSection) {
      setEmptyDisableOpen(true);
      return;
    }

    // Check if any industries in any project are user-created
    const allIndustries = projects.flatMap(p => p.relatedIndustry);
    const hasUserCreated = allIndustries.some(i => i.source === 'USER_CREATED');

    let resolvedProjects = projects;

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
        resolvedProjects = projects.map(project => ({
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
        }));

        setProjects(resolvedProjects);
      } finally {
        setIsSubmitting(false);
      }
    }

    onNext({
      projectsRequirements: {
        isEnabled,
        dataTakenFromCandidate,
        projects: resolvedProjects,
      },
    });
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        {/* ── Informational Banner ──────────────────────────────────────── */}
        <MessageBox
          fields={[
            t('projectsRequirements.fieldList.projectName'),
            t('projectsRequirements.fieldList.relatedIndustry'),
            t('projectsRequirements.fieldList.organization'),
            t('projectsRequirements.fieldList.startDate'),
            t('projectsRequirements.fieldList.endDate'),
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
                (!canNavigate || isSubmitting) &&
                  'cursor-not-allowed opacity-40 hover:text-slate-700'
              )}
              onClick={handleBack}
              disabled={!canNavigate || isSubmitting}
            >
              <ArrowLeft2 size={24} />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {t('projectsRequirements.title')}
            </h2>
          </div>

          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            size="lg"
          />
        </div>

        {/* ── Checkbox: data from candidate profile ─────────────────────── */}
        <div
          className={cn(
            'flex items-center gap-3 px-7 pb-8',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Checkbox
            id="projectsDataTakenFromCandidate"
            checked={dataTakenFromCandidate}
            onCheckedChange={value => setDataTakenFromCandidate(!!value)}
          />
          <Label
            htmlFor="projectsDataTakenFromCandidate"
            className="cursor-pointer text-sm font-medium text-slate-900"
          >
            {t('projectsRequirements.dataTakenFromCandidate')}
          </Label>
        </div>

        {/* ── Project cards ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 px-6">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              index={index}
              project={project}
              onUpdate={updateProject}
              onIndustriesSearch={setIndustrySearchQuery}
              onLocationsSearch={setLocationSearchQuery}
              onOrganizationsSearch={setOrganizationSearchQuery}
              fieldsDisabled={fieldsDisabled}
              industries={industries}
              isIndustriesLoading={isIndustriesLoading}
              locationOptions={locationOptions}
              isLocationsLoading={isLocationsLoading}
              organizationOptions={organizationOptions}
              isOrganizationsLoading={isOrganizationsLoading}
            />
          ))}
        </div>

        {/* ── Add project button ────────────────────────────────────────── */}
        <div className="flex justify-end px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            disabled
            className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
            onClick={addProject}
          >
            <PlusIcon className="size-4 text-neutral-600!" />
          </Button>
        </div>

        {/* ── Step footer ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
          <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
            {t('projectsRequirements.cancel')}
          </Button>
          <Button
            className="h-12 w-48"
            onClick={() => {
              void handleNext();
            }}
            disabled={!canNavigate || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t('projectsRequirements.next')
            )}
          </Button>
        </div>
      </div>

      {/* ── Disable Confirmation Dialog ───────────────────────────────────── */}
      <DisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        title={t('projectsRequirements.confirmDisableDialog.title')}
        message={t('projectsRequirements.confirmDisableDialog.message')}
        cancelLabel={t('projectsRequirements.confirmDisableDialog.cancel')}
        disableLabel={t('projectsRequirements.confirmDisableDialog.disable')}
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
            projectsRequirements: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              projects: [],
            },
          });
        }}
        title={t('projectsRequirements.emptyDisableDialog.title')}
        description={t('projectsRequirements.emptyDisableDialog.message')}
        cancelLabel={t('projectsRequirements.emptyDisableDialog.cancel')}
        confirmLabel={t('projectsRequirements.emptyDisableDialog.disable')}
      />
    </>
  );
}
