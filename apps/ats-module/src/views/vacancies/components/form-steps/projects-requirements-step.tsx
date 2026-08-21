import { ChevronUpIcon, Loader2, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { AddOrganizationFormDialog } from '@/views/vacancies/components/dialogs';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import {
  useTemplateFieldVisible,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import {
  useCreateIndustryMutation,
  useCreateOrganizationMutation,
  useIndustriesQuery,
  useLocationsQuery,
  useOrganizationsQuery,
  useStepGuard,
} from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { formatDate } from '@/views/vacancies/utils';
import {
  formatLocalDate,
  getHundredYearDateBoundaries,
  isBeforeMinDate,
  parseLocalDate,
} from '@/views/vacancies/utils/date-timezone-safe';
import { computeRowStartCodes } from '@/views/vacancies/utils/field-grid-layout';

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
import { isAfter, isBefore, startOfDay } from 'date-fns';

import DisableDialog from './disable-dialog';

const MAX_SELECTIONS = 10;
const {
  today: TODAY,
  minDate: HUNDRED_YEARS_AGO,
  maxDate: HUNDRED_YEARS_FROM_NOW,
} = getHundredYearDateBoundaries();

// Field codes for the Projects section; used to hide the entry content region
// entirely when the template forces every field's visibility to false.
const PROJECT_FIELD_CODES = [
  'relatedIndustry',
  'organization',
  'organizationLocations',
  'startDate',
  'endDate',
] as const;

// Grid layout order + column spans, used to compute which half fields must
// wrap to a fresh row (`xl:col-start-1`) based on the visible field packing.
const PROJECT_GRID_FIELDS = [
  { code: 'startDate', span: 1 },
  { code: 'endDate', span: 1 },
  { code: 'relatedIndustry', span: 2 },
  { code: 'organizationLocations', span: 2 },
  { code: 'organization', span: 2 },
] as const;

interface ProjectEntry {
  id: string;
  isOpen: boolean;
  startDate?: string;
  endDate?: string;
  relatedIndustry: Array<{ value: string; label: string; source: string }>;
  organizationLocations: Array<{ value: string; label: string }>;
  organizations: Array<{ value: string; label: string; source: string }>;
}

/** Shared button/trigger styling for the two date-picker fields below. */
const DATE_TRIGGER_CLASSNAME = cn(
  'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  applyTypography('body-medium'),
  'shadow-none!'
);

function ProjectStartDateField({
  index,
  project,
  fieldsDisabled,
  isOpen,
  onOpenChange,
  onUpdate,
  t,
}: Readonly<{
  index: number;
  project: ProjectEntry;
  fieldsDisabled: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (index: number, updates: Partial<ProjectEntry>) => void;
  t: (key: string) => string;
}>) {
  const handleSelect = (date: Date | undefined) => {
    onUpdate(index, { startDate: date ? formatLocalDate(date) : undefined });
    onOpenChange(false);

    const currentEndDate =
      date && project.endDate ? parseLocalDate(project.endDate) : null;
    if (currentEndDate != null && date != null && currentEndDate < date) {
      onUpdate(index, { endDate: undefined });
    }
  };

  return (
    <div className="flex flex-col gap-1 xl:col-span-1">
      <div className="flex h-5 items-center">
        <Label data-testid={`projectsRequirements-startDate-${index}-label`}>
          {t('projectsRequirements.startDate')}
        </Label>
      </div>
      <Popover
        modal
        open={isOpen}
        onOpenChange={open => onOpenChange(!fieldsDisabled && open)}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={fieldsDisabled}
            className={cn(
              DATE_TRIGGER_CLASSNAME,
              !project.startDate && 'text-slate-500',
              project.startDate && 'text-zinc-800'
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
            onSelect={handleSelect}
            disabled={date =>
              isAfter(startOfDay(date), TODAY) ||
              isBeforeMinDate(date, HUNDRED_YEARS_AGO)
            }
            captionLayout="dropdown"
            startMonth={HUNDRED_YEARS_AGO}
            endMonth={TODAY}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ProjectEndDateField({
  index,
  project,
  fieldsDisabled,
  isOpen,
  onOpenChange,
  onUpdate,
  t,
}: Readonly<{
  index: number;
  project: ProjectEntry;
  fieldsDisabled: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (index: number, updates: Partial<ProjectEntry>) => void;
  t: (key: string) => string;
}>) {
  const startDate = parseLocalDate(project.startDate);

  const handleSelect = (date: Date | undefined) => {
    onUpdate(index, { endDate: date ? formatLocalDate(date) : undefined });
    onOpenChange(false);
  };

  const isDateDisabled = (date: Date) => {
    const day = startOfDay(date);
    return (
      isBeforeMinDate(date, HUNDRED_YEARS_AGO) ||
      isAfter(day, HUNDRED_YEARS_FROM_NOW) ||
      (startDate != null && isBefore(day, startOfDay(startDate)))
    );
  };

  return (
    <div className="flex flex-col gap-1 xl:col-span-1">
      <div className="flex h-5 items-center">
        <Label data-testid={`projectsRequirements-endDate-${index}-label`}>
          {t('projectsRequirements.endDate')}
        </Label>
      </div>
      <Popover
        modal
        open={isOpen}
        onOpenChange={open => onOpenChange(!fieldsDisabled && open)}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={fieldsDisabled}
            className={cn(
              DATE_TRIGGER_CLASSNAME,
              !project.endDate && 'text-slate-500',
              project.endDate && 'text-zinc-800'
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
            onSelect={handleSelect}
            disabled={isDateDisabled}
            captionLayout="dropdown"
            startMonth={HUNDRED_YEARS_AGO}
            endMonth={HUNDRED_YEARS_FROM_NOW}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ProjectCard({
  index,
  project,
  onUpdate,
  onIndustriesSearch,
  onLocationsSearch,
  onOrganizationsSearch,
  onRequestAddOrganization,
  orgSelectorKey,
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
  onRequestAddOrganization: (index: number, name: string) => void;
  orgSelectorKey?: number;
  fieldsDisabled: boolean;
  industries: Array<{ id: string; label: string; source: string }>;
  isIndustriesLoading: boolean;
  locationOptions: Array<{ value: string; label: string }>;
  isLocationsLoading: boolean;
  organizationOptions: Array<{ value: string; label: string; source?: string }>;
  isOrganizationsLoading: boolean;
}>) {
  const { t } = useTranslation('ats');
  const isFieldVisible = useTemplateFieldVisible('projects');
  const rowStartCodes = computeRowStartCodes(
    PROJECT_GRID_FIELDS,
    isFieldVisible
  );
  const [hasMaxError, setHasMaxError] = useState(false);
  const [locationsError, setLocationsError] = useState(false);
  const [organizationsError, setOrganizationsError] = useState(false);
  const [industriesSearch, setIndustriesSearch] = useState('');
  const [openDatePopover, setOpenDatePopover] = useState<
    'startDate' | 'endDate' | null
  >(null);

  // Mirrors the combobox's own clear-on-disable behaviour (DQCGP-2866) for
  // this row's separate search-text state, which also drives the character
  // counter next to the Industries label. Adjusted during render (not an
  // effect) per https://react.dev/learn/you-might-not-need-an-effect.
  const [prevFieldsDisabled, setPrevFieldsDisabled] = useState(fieldsDisabled);
  if (fieldsDisabled !== prevFieldsDisabled) {
    setPrevFieldsDisabled(fieldsDisabled);
    if (fieldsDisabled) {
      setIndustriesSearch('');
    }
  }

  return (
    <Collapsible
      open={project.isOpen}
      onOpenChange={open => onUpdate(index, { isOpen: open })}
    >
      <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span
            data-testid={`projectsRequirements-projectCard-${index}-label`}
            className="text-base font-bold text-slate-900"
          >
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
                aria-label={
                  project.isOpen
                    ? t('projectsRequirements.collapse')
                    : t('projectsRequirements.expand')
                }
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
            {/* Fields (dense grid so hidden fields repack with no gaps) */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              {isFieldVisible('startDate') && (
                <ProjectStartDateField
                  index={index}
                  project={project}
                  fieldsDisabled={fieldsDisabled}
                  isOpen={openDatePopover === 'startDate'}
                  onOpenChange={open =>
                    setOpenDatePopover(open ? 'startDate' : null)
                  }
                  onUpdate={onUpdate}
                  t={t}
                />
              )}

              {isFieldVisible('endDate') && (
                <ProjectEndDateField
                  index={index}
                  project={project}
                  fieldsDisabled={fieldsDisabled}
                  isOpen={openDatePopover === 'endDate'}
                  onOpenChange={open =>
                    setOpenDatePopover(open ? 'endDate' : null)
                  }
                  onUpdate={onUpdate}
                  t={t}
                />
              )}

              {isFieldVisible('relatedIndustry') && (
                <div
                  className={cn(
                    'flex flex-col gap-1 xl:col-span-2',
                    rowStartCodes.has('relatedIndustry') && 'xl:col-start-1'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Label
                      data-testid={`projectsRequirements-relatedIndustry-${index}-label`}
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
                    errorMessage={t(
                      'projectsRequirements.errors.maxIndustries'
                    )}
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
              )}

              {isFieldVisible('organizationLocations') && (
                <div
                  className={cn(
                    'flex flex-col gap-1 xl:col-span-2',
                    rowStartCodes.has('organizationLocations') &&
                      'xl:col-start-1'
                  )}
                >
                  <div className="flex h-5 items-center">
                    <Label
                      data-testid={`projectsRequirements-organizationLocation-${index}-label`}
                      className={
                        locationsError ? 'text-destructive' : undefined
                      }
                    >
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
                    errorMessage={t(
                      'projectsRequirements.errors.maxSelections'
                    )}
                    onErrorStateChange={setLocationsError}
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
              )}

              {isFieldVisible('organization') && (
                <div
                  className={cn(
                    'flex flex-col gap-1 xl:col-span-2',
                    rowStartCodes.has('organization') && 'xl:col-start-1'
                  )}
                >
                  <div className="flex h-5 items-center">
                    <Label
                      data-testid={`projectsRequirements-organizationName-${index}-label`}
                      className={
                        organizationsError ? 'text-destructive' : undefined
                      }
                    >
                      {t('projectsRequirements.organizationName')}
                    </Label>
                  </div>
                  <MultipleSelector
                    key={orgSelectorKey}
                    value={project.organizations}
                    onChange={options => {
                      const newItem = options.find(o => o.value === o.label);
                      if (newItem) {
                        onRequestAddOrganization(index, newItem.label);
                      } else {
                        onUpdate(index, {
                          organizations: options.map(opt => ({
                            value: opt.value,
                            label: opt.label,
                            source: (opt.source as string) ?? 'USER_CREATED',
                          })),
                        });
                      }
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
                    errorMessage={t(
                      'projectsRequirements.errors.maxSelections'
                    )}
                    onErrorStateChange={setOrganizationsError}
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
              )}
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
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: contextForm, onCancel } = useVacancyForm();
  const isFieldVisible = useTemplateFieldVisible('projects');
  const hasAnyVisibleField = PROJECT_FIELD_CODES.some(code =>
    isFieldVisible(code)
  );
  const savedProjects = contextForm.projectsRequirements;
  const vacancyStatus = contextForm.status;

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

  // Organization dialog state
  const [showAddOrganizationDialog, setShowAddOrganizationDialog] =
    useState(false);
  const [pendingOrganizationName, setPendingOrganizationName] = useState('');
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [orgSelectorKey, setOrgSelectorKey] = useState(0);

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
  const { mutateAsync: createOrganization } = useCreateOrganizationMutation();

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
      if (canNavigate) {
        setConfirmDisableOpen(true);
      } else {
        setIsEnabled(false);
      }
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

  const handleTakeFromCandidateChange = (checked: boolean) => {
    setDataTakenFromCandidate(checked);
    if (checked) {
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
    }
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
      title: t('projectsRequirements.notifications.disable.title'),
      description: t('projectsRequirements.notifications.disable.message'),
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

    // Check if any industries or organizations in any project are user-created
    const allIndustries = projects.flatMap(p => p.relatedIndustry);
    const hasUserCreatedIndustries = allIndustries.some(
      i => i.source === 'USER_CREATED'
    );
    const allOrgs = projects.flatMap(p => p.organizations);
    const hasUserCreatedOrgs = allOrgs.some(o => o.source === 'USER_CREATED');

    let resolvedProjects = projects;

    if (hasUserCreatedIndustries || hasUserCreatedOrgs) {
      setIsSubmitting(true);
      try {
        let industryResultMap = new Map();
        if (hasUserCreatedIndustries) {
          const uniqueUserCreated = Array.from(
            new Map(
              allIndustries
                .filter(i => i.source === 'USER_CREATED')
                .map(i => [i.label, i])
            ).values()
          );
          const results = await Promise.all(
            uniqueUserCreated.map(i => createIndustry(i.label))
          );
          industryResultMap = new Map(
            uniqueUserCreated.map((i, idx) => [i.label, results[idx]])
          );
        }

        let orgResultMap = new Map();
        if (hasUserCreatedOrgs) {
          const uniqueUserCreatedOrgs = Array.from(
            new Map(
              allOrgs
                .filter(o => o.source === 'USER_CREATED')
                .map(o => [o.label, o])
            ).values()
          );
          const oResults = await Promise.all(
            uniqueUserCreatedOrgs.map(o => createOrganization(o.label))
          );
          orgResultMap = new Map(
            uniqueUserCreatedOrgs.map((o, idx) => [o.label, oResults[idx]])
          );
        }

        resolvedProjects = projects.map(project => ({
          ...project,
          relatedIndustry: project.relatedIndustry.map(industry => {
            if (industry.source === 'USER_CREATED') {
              const result = industryResultMap.get(industry.label);
              if (result) {
                return {
                  value: result.pendingId,
                  label: result.value,
                  source: result.status,
                };
              }
            }
            return industry;
          }),
          organizations: project.organizations.map(org => {
            if (org.source === 'USER_CREATED') {
              const result = orgResultMap.get(org.label);
              if (result) {
                return {
                  value: result.pendingId,
                  label: result.value,
                  source: result.status,
                };
              }
            }
            return org;
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
      <div
        data-testid="projectsRequirements-section-form"
        className="flex flex-1 flex-col"
      >
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
              aria-label={t('projectsRequirements.back')}
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
            <h2
              data-testid="projectsRequirements-header-label"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              {t('projectsRequirements.title')}
            </h2>
            {mode === 'edit' && vacancyStatus ? (
              <VacancyStatusBadge
                status={vacancyStatus}
                applicantCount={contextForm.applicantCount}
              />
            ) : null}
          </div>

          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            size="lg"
            data-testid="toggle-on-off-switch"
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
            disabled={!isEnabled}
            onCheckedChange={value => handleTakeFromCandidateChange(!!value)}
          />
          <Label
            htmlFor="projectsDataTakenFromCandidate"
            data-testid="projectsRequirements-dataTakenFromCandidate-label"
            className="cursor-pointer text-sm font-medium text-slate-900"
          >
            {t('projectsRequirements.dataTakenFromCandidate')}
          </Label>
        </div>

        {hasAnyVisibleField && (
          <>
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
                  onRequestAddOrganization={(cardIndex, name) => {
                    setActiveCardIndex(cardIndex);
                    setPendingOrganizationName(name);
                    setShowAddOrganizationDialog(true);
                  }}
                  orgSelectorKey={orgSelectorKey}
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
          </>
        )}

        {/* ── Step footer ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
          <Button
            variant="secondary"
            className="h-12 w-48"
            disabled={isSubmitting}
            onClick={onCancel}
          >
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

      {/* ── Add Organization dialog ──────────────────────────────────────── */}
      <AddOrganizationFormDialog
        open={showAddOrganizationDialog}
        onOpenChange={open => {
          if (!open) setOrgSelectorKey(k => k + 1); // reset selector on cancel
          setShowAddOrganizationDialog(open);
        }}
        organizationName={pendingOrganizationName}
        onOrganizationAdded={org => {
          if (activeCardIndex !== null) {
            const existing = projects[activeCardIndex]?.organizations ?? [];
            // Duplicate = same name + location (org.name already combines
            // both, e.g. "OXO Labs, Colombo, Western Province, Sri Lanka").
            // Case-insensitive so re-typing the same value keeps the existing
            // selection instead of adding a new entry.
            const normalizedNewLabel = org.name.trim().toLowerCase();
            const isDuplicate = existing.some(
              o => o.label.trim().toLowerCase() === normalizedNewLabel
            );
            if (isDuplicate) {
              setOrgSelectorKey(k => k + 1);
              setShowAddOrganizationDialog(false);
              return false;
            }
            updateProject(activeCardIndex, {
              organizations: [
                ...existing,
                { value: org.id, label: org.name, source: org.source },
              ],
            });
          }
          setOrgSelectorKey(k => k + 1); // reset selector after adding
          setShowAddOrganizationDialog(false);
        }}
      />

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
