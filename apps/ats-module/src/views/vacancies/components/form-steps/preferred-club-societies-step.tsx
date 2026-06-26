import { ChevronUpIcon, Loader2, PlusIcon } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { AddOrganizationFormDialog } from '@/views/vacancies/components/dialogs';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCreateOrganizationMutation,
  useCreateSocietyMutation,
  useLocationsQuery,
  useOrganizationsQuery,
  useSocietiesQuery,
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

const MAX_POSITION_LENGTH = 250;
const MAX_CLUB_SOCIETY_LENGTH = 250;
const MAX_SELECTIONS = 10;
const HUNDRED_YEARS_AGO = new Date(new Date().getFullYear() - 100, 0, 1);
const HUNDRED_YEARS_FROM_NOW = new Date(new Date().getFullYear() + 100, 11, 31);

interface ClubSocietyEntry {
  id: string;
  isOpen: boolean;

  clubSociety: Array<{ value: string; label: string; source: string }>;
  clubSocietySearch: string;
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
  orgSelectorKey,
}: Readonly<{
  orgSelectorKey: number;
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
  const { t } = useTranslation('ats');
  const [locationsError, setLocationsError] = useState(false);
  const [societiesError, setSocietiesError] = useState(false);
  const [organizationsError, setOrganizationsError] = useState(false);
  const [societiesCharLimitError, setSocietiesCharLimitError] = useState(false);
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
            {t('preferredClubSocieties.cardTitle', {
              number: String(index + 1).padStart(2, '0'),
            })}
          </span>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-slate-400 transition-colors hover:text-slate-600"
              aria-label={
                entry.isOpen
                  ? t('preferredClubSocieties.collapse')
                  : t('preferredClubSocieties.expand')
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
            {/* Row 1: Club / Society | Start Date | End Date */}
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label
                    className={societiesError ? 'text-destructive' : undefined}
                  >
                    {t('preferredClubSocieties.labels.clubSociety')}
                  </Label>
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
                        .map(opt => {
                          const source =
                            (opt.source as string) ?? 'USER_CREATED';
                          const isCreatable =
                            source === 'USER_CREATED' ||
                            opt.value === opt.label;

                          return {
                            value: isCreatable
                              ? opt.value.slice(0, MAX_CLUB_SOCIETY_LENGTH)
                              : opt.value,
                            label: isCreatable
                              ? opt.label.slice(0, MAX_CLUB_SOCIETY_LENGTH)
                              : opt.label,
                            source,
                          };
                        }),
                    });
                  }}
                  options={societies.map(s => ({
                    value: s.id,
                    label: s.name || s.label || '',
                    source: s.source,
                  }))}
                  onSearchSync={value => {
                    const limitedSearch = value.slice(
                      0,
                      MAX_CLUB_SOCIETY_LENGTH
                    );

                    setSocietiesCharLimitError(
                      value.length >= MAX_CLUB_SOCIETY_LENGTH
                    );
                    onUpdate(index, { clubSocietySearch: limitedSearch });
                    onSocietiesSearch(limitedSearch);
                    return societies.map(s => ({
                      value: s.id,
                      label: s.name || s.label || '',
                      source: s.source,
                    }));
                  }}
                  keepSelectedInList
                  inputProps={{
                    maxLength: MAX_CLUB_SOCIETY_LENGTH,
                  }}
                  creatable
                  triggerSearchOnFocus
                  hideClearAllButton
                  maxSelected={MAX_SELECTIONS}
                  errorMessage={t(
                    'preferredClubSocieties.errors.maxSelections'
                  )}
                  onErrorStateChange={setSocietiesError}
                  disabled={fieldsDisabled}
                  loading={isSocietiesLoading}
                  placeholder={t(
                    'preferredClubSocieties.placeholders.clubSociety'
                  )}
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      {t('preferredClubSocieties.empty.societies')}
                    </p>
                  }
                />
                {societiesCharLimitError && (
                  <p className="text-destructive text-xs">
                    {t('preferredClubSocieties.errors.maxCharacters')}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>{t('preferredClubSocieties.labels.startDate')}</Label>
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
                        : t('preferredClubSocieties.placeholders.startDate')}
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
                  <Label>{t('preferredClubSocieties.labels.endDate')}</Label>
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
                        : t('preferredClubSocieties.placeholders.endDate')}
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

            {/* Row 2: Represented Organization | Organization Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label
                    className={
                      organizationsError ? 'text-destructive' : undefined
                    }
                  >
                    {t('preferredClubSocieties.labels.representedOrganization')}
                  </Label>
                </div>
                <MultipleSelector
                  key={orgSelectorKey}
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
                  errorMessage={t(
                    'preferredClubSocieties.errors.maxSelections'
                  )}
                  onErrorStateChange={setOrganizationsError}
                  disabled={fieldsDisabled}
                  loading={isOrganizationsLoading}
                  placeholder={t(
                    'preferredClubSocieties.placeholders.representedOrganization'
                  )}
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      {t('preferredClubSocieties.empty.organizations')}
                    </p>
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label
                    className={locationsError ? 'text-destructive' : undefined}
                  >
                    {t('preferredClubSocieties.labels.organizationLocation')}
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
                    'preferredClubSocieties.errors.maxSelections'
                  )}
                  onErrorStateChange={setLocationsError}
                  disabled={fieldsDisabled}
                  loading={isLocationsLoading}
                  placeholder={t(
                    'preferredClubSocieties.placeholders.organizationLocation'
                  )}
                  emptyIndicator={
                    <p className="px-3 pb-3 text-left text-sm text-slate-500">
                      {t('preferredClubSocieties.empty.locations')}
                    </p>
                  }
                />
              </div>
            </div>

            {/* Row 3: Position / Role Held */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('preferredClubSocieties.labels.position')}</Label>
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
                    'preferredClubSocieties.placeholders.position'
                  )}
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

  const { mutateAsync: createSociety } = useCreateSocietyMutation();
  const { mutateAsync: createOrganization } = useCreateOrganizationMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [orgSelectorKey, setOrgSelectorKey] = useState(0);

  const [entries, setEntries] = useState<ClubSocietyEntry[]>(
    savedClubSocieties?.clubSocieties &&
      savedClubSocieties.clubSocieties.length > 0
      ? savedClubSocieties.clubSocieties.map(e => ({
          ...e,
          clubSocietySearch: e.clubSocietySearch ?? '',
        }))
      : [
          {
            id: '1',
            isOpen: true,
            clubSociety: [],
            clubSocietySearch: '',
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

  const handleNext = async () => {
    const isEmptyEnabledSection =
      isEnabled && !dataTakenFromCandidate && !hasClubSocietyData;

    if (isEmptyEnabledSection) {
      setEmptyDisableOpen(true);
      return;
    }

    // Resolve user-created club/societies & organizations
    const allSocieties = entries.flatMap(e => e.clubSociety);
    const hasUserCreatedSocieties = allSocieties.some(
      s => s.source === 'USER_CREATED'
    );
    const allOrgs = entries.flatMap(e => e.representedOrganization);
    const hasUserCreatedOrgs = allOrgs.some(o => o.source === 'USER_CREATED');

    let resolvedEntries = entries;

    if (hasUserCreatedSocieties || hasUserCreatedOrgs) {
      setIsSubmitting(true);
      try {
        let societyResultMap = new Map();
        if (hasUserCreatedSocieties) {
          const uniqueUserCreatedSocieties = Array.from(
            new Map(
              allSocieties
                .filter(s => s.source === 'USER_CREATED')
                .map(s => [s.label, s])
            ).values()
          );
          const sResults = await Promise.all(
            uniqueUserCreatedSocieties.map(s => createSociety(s.label))
          );
          societyResultMap = new Map(
            uniqueUserCreatedSocieties.map((s, idx) => [s.label, sResults[idx]])
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
          clubSociety: entry.clubSociety.map(s => {
            if (s.source === 'USER_CREATED') {
              const res = societyResultMap.get(s.label);
              if (res) {
                return {
                  value: res.pendingId,
                  label: res.value,
                  source: res.status,
                };
              }
            }
            return s;
          }),
          representedOrganization: entry.representedOrganization.map(o => {
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
      preferredClubSocieties: {
        isEnabled,
        dataTakenFromCandidate,
        clubSocieties: resolvedEntries,
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
      if (hasClubSocietyData) {
        setConfirmDisableOpen(true);
      } else {
        setIsEnabled(false);
        setDataTakenFromCandidate(false);
        removeCompletedStep(currentStepIndex);
      }
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
        clubSocietySearch: '',
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
        clubSocietySearch: '',
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
      title: t('preferredClubSocieties.notifications.disable.title'),
      description: t('preferredClubSocieties.notifications.disable.message'),
    });
  };

  const handleBack = () => {
    if (!canNavigate || isSubmitting) {
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
            t('preferredClubSocieties.fieldList.representedOrganization'),
            t('preferredClubSocieties.fieldList.position'),
            t('preferredClubSocieties.fieldList.startDate'),
            t('preferredClubSocieties.fieldList.endDate'),
          ]}
        />

        {/* ── Section header: back arrow + title + toggle ───────────────── */}
        <div className="flex items-center justify-between px-7 py-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t('preferredClubSocieties.back')}
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
              {t('preferredClubSocieties.title')}
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
                    clubSocietySearch: '',
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
            {t('preferredClubSocieties.dataTakenFromCandidate')}
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
            aria-label={t('preferredClubSocieties.addEntry')}
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
            {t('preferredClubSocieties.cancel')}
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
              t('preferredClubSocieties.next')
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
            updateEntry(activeCardIndex, {
              representedOrganization: [
                ...(entries[activeCardIndex]?.representedOrganization ?? []),
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
