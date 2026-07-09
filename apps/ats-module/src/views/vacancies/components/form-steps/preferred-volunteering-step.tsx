import { ChevronUpIcon, Loader2, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

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
  useCausesQuery,
  useCreateCauseMutation,
  useCreateOrganizationMutation,
  useLocationsQuery,
  useOrganizationsQuery,
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
  onOrganizationsSearch,
  onLocationsSearch,
  onCausesSearch,
  onRequestAddOrganization,
  fieldsDisabled,
  organizations,
  isOrganizationsLoading,
  causes,
  isCausesLoading,
  locationOptions,
  isLocationsLoading,
  orgSelectorKey,
}: Readonly<{
  orgSelectorKey: number;
  index: number;
  entry: VolunteeringEntry;
  onUpdate: (index: number, updates: Partial<VolunteeringEntry>) => void;
  onOrganizationsSearch: (value: string) => void;
  onLocationsSearch: (value: string) => void;
  onCausesSearch: (value: string) => void;
  onRequestAddOrganization: (index: number, name: string) => void;
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
  const { t } = useTranslation('ats');
  const isFieldVisible = useTemplateFieldVisible('volunteering');
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
            {t('preferredVolunteering.cardTitle', {
              number: String(index + 1).padStart(2, '0'),
            })}
          </span>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-slate-400 transition-colors hover:text-slate-600"
              aria-label={
                entry.isOpen
                  ? t('preferredVolunteering.collapse')
                  : t('preferredVolunteering.expand')
              }
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
              {isFieldVisible('organization') && (
                <div className="flex flex-col gap-1">
                  <div className="flex h-5 items-center">
                    <Label>
                      {t('preferredVolunteering.labels.organizationName')}
                    </Label>
                  </div>
                  <MultipleSelector
                    key={orgSelectorKey}
                    value={entry.organizationName}
                    onChange={options => {
                      const newItem = options.find(o => o.value === o.label);
                      if (newItem) {
                        onRequestAddOrganization(index, newItem.label);
                      } else {
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
                    placeholder={t(
                      'preferredVolunteering.placeholders.organizationName'
                    )}
                    emptyIndicator={
                      <p className="px-3 pb-3 text-left text-sm text-slate-500">
                        {t('preferredVolunteering.empty.organizations')}
                      </p>
                    }
                  />
                </div>
              )}

              {isFieldVisible('organizationLocations') && (
                <div className="flex flex-col gap-1">
                  <div className="flex h-5 items-center">
                    <Label
                      className={
                        locationsError ? 'text-destructive' : undefined
                      }
                    >
                      {t('preferredVolunteering.labels.organizationLocation')}
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
                    errorMessage={t(
                      'preferredVolunteering.errors.maxSelections'
                    )}
                    onErrorStateChange={setLocationsError}
                    disabled={fieldsDisabled}
                    loading={isLocationsLoading}
                    placeholder={t(
                      'preferredVolunteering.placeholders.organizationLocation'
                    )}
                    emptyIndicator={
                      <p className="px-3 pb-3 text-left text-sm text-slate-500">
                        {t('preferredVolunteering.empty.locations')}
                      </p>
                    }
                  />
                </div>
              )}
            </div>

            {/* Row 2: Cause (half width) */}
            <div className="grid grid-cols-2 gap-4">
              {isFieldVisible('cause') && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Label>{t('preferredVolunteering.labels.cause')}</Label>
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
                      onCausesSearch(value);
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
                    placeholder={t('preferredVolunteering.placeholders.cause')}
                    emptyIndicator={
                      <p className="px-3 pb-3 text-left text-sm text-slate-500">
                        {t('preferredVolunteering.empty.causes')}
                      </p>
                    }
                  />
                </div>
              )}
            </div>

            {/* Row 3: Position / Role | Start Date | End Date */}
            <div className="grid grid-cols-4 gap-4">
              {isFieldVisible('positionRole') && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Label>{t('preferredVolunteering.labels.position')}</Label>
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
                    placeholder={t(
                      'preferredVolunteering.placeholders.position'
                    )}
                    className="h-11"
                  />
                </div>
              )}

              {isFieldVisible('startDate') && (
                <div className="flex flex-col gap-1">
                  <div className="flex h-5 items-center">
                    <Label>{t('preferredVolunteering.labels.startDate')}</Label>
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
                          : t('preferredVolunteering.placeholders.startDate')}
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
                          onUpdate(index, { openDatePopover: null });

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
              )}

              {isFieldVisible('endDate') && (
                <div className="flex flex-col gap-1">
                  <div className="flex h-5 items-center">
                    <Label>{t('preferredVolunteering.labels.endDate')}</Label>
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
                          : t('preferredVolunteering.placeholders.endDate')}
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
                          onUpdate(index, { openDatePopover: null });
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
              )}
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
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: contextForm, onCancel } = useVacancyForm();
  const savedVolunteering = contextForm.preferredVolunteering;
  const vacancyStatus = contextForm.status;

  const { mutateAsync: createCause } = useCreateCauseMutation();
  const { mutateAsync: createOrganization } = useCreateOrganizationMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEnabled, setIsEnabled] = useState(
    savedVolunteering?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    savedVolunteering?.dataTakenFromCandidate ?? false
  );
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);
  const [confirmTakeFromCandidateOpen, setConfirmTakeFromCandidateOpen] =
    useState(false);
  const [organizationsSearchQuery, setOrganizationsSearchQuery] = useState('');
  const [locationsSearchQuery, setLocationsSearchQuery] = useState('');
  const [causesSearchQuery, setCausesSearchQuery] = useState('');

  // Organization dialog state
  const [showAddOrganizationDialog, setShowAddOrganizationDialog] =
    useState(false);
  const [pendingOrganizationName, setPendingOrganizationName] = useState('');
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [orgSelectorKey, setOrgSelectorKey] = useState(0);

  const [entries, setEntries] = useState<VolunteeringEntry[]>(
    savedVolunteering?.volunteering && savedVolunteering.volunteering.length > 0
      ? savedVolunteering.volunteering
      : [createEmptyEntry('1')]
  );

  const hasVolunteeringData = entries.some(
    e =>
      e.organizationName.length > 0 ||
      e.organizationLocations.length > 0 ||
      e.cause.length > 0 ||
      e.position.trim().length > 0 ||
      e.startDate != null ||
      e.endDate != null
  );

  const handleNext = async () => {
    const isEmptyEnabledSection =
      isEnabled && !dataTakenFromCandidate && !hasVolunteeringData;

    if (isEmptyEnabledSection) {
      setEmptyDisableOpen(true);
      return;
    }

    // Resolve user-created causes & organizations
    const allCauses = entries.flatMap(e => e.cause);
    const hasUserCreatedCauses = allCauses.some(
      c => c.source === 'USER_CREATED'
    );
    const allOrgs = entries.flatMap(e => e.organizationName);
    const hasUserCreatedOrgs = allOrgs.some(o => o.source === 'USER_CREATED');

    let resolvedEntries = entries;

    if (hasUserCreatedCauses || hasUserCreatedOrgs) {
      setIsSubmitting(true);
      try {
        let causeResultMap = new Map();
        if (hasUserCreatedCauses) {
          const uniqueUserCreatedCauses = Array.from(
            new Map(
              allCauses
                .filter(c => c.source === 'USER_CREATED')
                .map(c => [c.label, c])
            ).values()
          );
          const cResults = await Promise.all(
            uniqueUserCreatedCauses.map(c => createCause(c.label))
          );
          causeResultMap = new Map(
            uniqueUserCreatedCauses.map((c, idx) => [c.label, cResults[idx]])
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

        resolvedEntries = entries.map(entry => ({
          ...entry,
          cause: entry.cause.map(c => {
            if (c.source === 'USER_CREATED') {
              const res = causeResultMap.get(c.label);
              if (res) {
                return {
                  value: res.pendingId,
                  label: res.value,
                  source: res.status,
                };
              }
            }
            return c;
          }),
          organizationName: entry.organizationName.map(o => {
            if (o.source === 'USER_CREATED') {
              const res = orgResultMap.get(o.label);
              if (res) {
                return {
                  value: res.pendingId,
                  label: res.value,
                  source: res.status,
                };
              }
            }
            return o;
          }),
        }));

        setEntries(resolvedEntries);
      } catch (err) {
        console.error(err);
        return; // Stop execution on error
      } finally {
        setIsSubmitting(false);
      }
    }

    onNext({
      preferredVolunteering: {
        isEnabled,
        dataTakenFromCandidate,
        volunteering: resolvedEntries,
      },
    });
  };

  const {
    setForm,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();
  const _volunteeringRef = useRef<() => void>(() => {});
  useEffect(() => {
    _volunteeringRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredVolunteering: {
          isEnabled,
          dataTakenFromCandidate,
          volunteering: entries,
        },
      }));
    };
  }, [isEnabled, dataTakenFromCandidate, entries, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _volunteeringRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredVolunteering: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          volunteering: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  useStepGuard(isEnabled && !dataTakenFromCandidate && !hasVolunteeringData);

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;
  const canNavigate =
    !isEnabled || dataTakenFromCandidate || hasVolunteeringData;

  // Organizations API
  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizationsQuery(
      organizationsSearchQuery,
      isEnabled && !dataTakenFromCandidate
    );

  // Causes API
  const { data: causesData, isLoading: isCausesLoading } =
    useCausesQuery(causesSearchQuery);

  // Locations API
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery(
      locationsSearchQuery,
      isEnabled && !dataTakenFromCandidate
    );

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

  const applyTakeFromCandidate = () => {
    setDataTakenFromCandidate(true);
    setEntries([createEmptyEntry('1')]);
  };

  // Checking "data taken from candidate" clears all added data. Confirm first
  // when there is data to lose; apply directly otherwise. Unchecking is safe.
  const handleTakeFromCandidateChange = (checked: boolean) => {
    if (!checked) {
      setDataTakenFromCandidate(false);
      return;
    }
    if (hasVolunteeringData) {
      setConfirmTakeFromCandidateOpen(true);
      return;
    }
    applyTakeFromCandidate();
  };

  const handleConfirmTakeFromCandidate = () => {
    applyTakeFromCandidate();
    setConfirmTakeFromCandidateOpen(false);
  };

  const handleDisable = () => {
    setEntries([createEmptyEntry('1')]);
    setDataTakenFromCandidate(false);
    setIsEnabled(false);
    removeCompletedStep(currentStepIndex);
    setConfirmDisableOpen(false);
    SuccessToast({
      title: t('preferredVolunteering.notifications.disable.title'),
      description: t('preferredVolunteering.notifications.disable.message'),
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
            t('preferredVolunteering.fieldList.organization'),
            t('preferredVolunteering.fieldList.position'),
            t('preferredVolunteering.fieldList.cause'),
            t('preferredVolunteering.fieldList.startDate'),
            t('preferredVolunteering.fieldList.endDate'),
          ]}
        />

        {/* ── Section header: back arrow + title + toggle ───────────────── */}
        <div className="flex items-center justify-between px-7 py-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t('preferredVolunteering.back')}
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
              {t('preferredVolunteering.title')}
            </h2>
            {mode === 'edit' && vacancyStatus ? (
              <VacancyStatusBadge status={vacancyStatus} />
            ) : null}
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
            onCheckedChange={value => handleTakeFromCandidateChange(!!value)}
            className="mt-0.5"
          />
          <Label
            htmlFor="volunteeringDataTakenFromCandidate"
            className="cursor-pointer text-sm leading-snug font-medium text-slate-900"
          >
            {t('preferredVolunteering.dataTakenFromCandidate')}
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
              onOrganizationsSearch={setOrganizationsSearchQuery}
              onLocationsSearch={setLocationsSearchQuery}
              onCausesSearch={setCausesSearchQuery}
              onRequestAddOrganization={(cardIndex, name) => {
                setActiveCardIndex(cardIndex);
                setPendingOrganizationName(name);
                setShowAddOrganizationDialog(true);
              }}
              fieldsDisabled={fieldsDisabled}
              organizations={organizations}
              isOrganizationsLoading={isOrganizationsLoading}
              causes={causes}
              isCausesLoading={isCausesLoading}
              locationOptions={locationOptions}
              isLocationsLoading={isLocationsLoading}
              orgSelectorKey={orgSelectorKey}
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
            aria-label={t('preferredVolunteering.addEntry')}
            className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
            disabled
            onClick={addEntry}
          >
            <PlusIcon className="size-4 text-neutral-600!" />
          </Button>
        </div>

        {/* ── Step footer ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
          <Button
            variant="secondary"
            className="h-12 w-48"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {t('preferredVolunteering.cancel')}
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
              t('preferredVolunteering.next')
            )}
          </Button>
        </div>
      </div>

      {/* ── Add Organization dialog ──────────────────────────────────────── */}
      <AddOrganizationFormDialog
        open={showAddOrganizationDialog}
        onOpenChange={open => {
          if (!open) setOrgSelectorKey(k => k + 1);
          setShowAddOrganizationDialog(open);
        }}
        organizationName={pendingOrganizationName}
        onOrganizationAdded={org => {
          if (activeCardIndex !== null) {
            const existing = entries[activeCardIndex]?.organizationName ?? [];
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
            updateEntry(activeCardIndex, {
              organizationName: [
                ...existing,
                { value: org.id, label: org.name, source: org.source },
              ],
            });
          }
          setOrgSelectorKey(k => k + 1);
          setShowAddOrganizationDialog(false);
        }}
      />

      {/* ── Disable Confirmation Dialog ───────────────────────────────────── */}
      <DisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        title={t('preferredVolunteering.confirmDisableDialog.title')}
        message={t('preferredVolunteering.confirmDisableDialog.message')}
        cancelLabel={t('preferredVolunteering.confirmDisableDialog.cancel')}
        disableLabel={t('preferredVolunteering.confirmDisableDialog.disable')}
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={handleDisable}
      />

      {/* ── Take-from-candidate Confirmation Dialog ───────────────────────── */}
      <DisableDialog
        open={confirmTakeFromCandidateOpen}
        onOpenChange={open => {
          if (!open) setConfirmTakeFromCandidateOpen(false);
        }}
        title={t('preferredVolunteering.confirmDisableDialog.title')}
        message={t('preferredVolunteering.confirmDisableDialog.message')}
        cancelLabel={t('preferredVolunteering.confirmDisableDialog.cancel')}
        disableLabel={t('preferredVolunteering.confirmDisableDialog.disable')}
        onCancel={() => setConfirmTakeFromCandidateOpen(false)}
        onDisable={handleConfirmTakeFromCandidate}
      />

      <StepDisableDialog
        open={emptyDisableOpen}
        onOpenChange={setEmptyDisableOpen}
        onConfirm={() => {
          setIsEnabled(false);
          setDataTakenFromCandidate(false);
          setEmptyDisableOpen(false);
          onNext({
            preferredVolunteering: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              volunteering: [],
            },
          });
        }}
        title={t('preferredVolunteering.emptyDisableDialog.title')}
        description={t('preferredVolunteering.emptyDisableDialog.message')}
        cancelLabel={t('preferredVolunteering.emptyDisableDialog.cancel')}
        confirmLabel={t('preferredVolunteering.emptyDisableDialog.disable')}
      />
    </>
  );
}
