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
  useCreateOrganizationMutation,
  useCreateSportLevelMutation,
  useCreateSportMutation,
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
  getHundredYearDateBoundaries,
  isBeforeMinDate,
  parseLocalDate,
} from '@/views/vacancies/utils/date-timezone-safe';
import {
  computeRowStartCodes,
  rowStartClass,
} from '@/views/vacancies/utils/field-grid-layout';

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
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';
import { isAfter, isBefore, startOfDay } from 'date-fns';

import DisableDialog from './disable-dialog';

const MAX_SPORT_NAME_LENGTH = 100;
const MAX_POSITION_LENGTH = 100;
const MAX_SELECTIONS = 10;

// Template field-visibility codes for the Sports section. When a template
// marks this section as "data taken from candidate", the backend forces every
// flag false, so none of these entry fields render.
const SPORT_FIELD_CODES = [
  'nameOfSport',
  'representedOrganization',
  'organizationLocations',
  'levelRepresented',
  'positionRoleHeld',
  'startDate',
  'endDate',
] as const;

// Field grid layout spec (source order + column span) used to compute which
// fields must start a fresh row (`quad-pub-sports:col-start-1`) as visibility changes.
const SPORT_GRID_FIELDS = [
  { code: 'nameOfSport', span: 2 },
  { code: 'organizationLocations', span: 2 },
  { code: 'levelRepresented', span: 2 },
  { code: 'representedOrganization', span: 2 },
  { code: 'positionRoleHeld', span: 1 },
  { code: 'startDate', span: 1 },
  { code: 'endDate', span: 1 },
] as const;
const {
  today: TODAY,
  minDate: HUNDRED_YEARS_AGO,
  maxDate: HUNDRED_YEARS_FROM_NOW,
} = getHundredYearDateBoundaries();

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
  orgSelectorKey,
}: Readonly<{
  orgSelectorKey: number;
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
  const { t } = useTranslation('ats');
  const isFieldVisible = useTemplateFieldVisible('sports');
  const rowStartCodes = computeRowStartCodes(SPORT_GRID_FIELDS, isFieldVisible);
  const [openDatePopover, setOpenDatePopover] = useState<
    'startDate' | 'endDate' | null
  >(null);
  const [locationsError, setLocationsError] = useState(false);
  const [sportsError, setSportsError] = useState(false);
  const [organizationsError, setOrganizationsError] = useState(false);
  const [levelsError, setLevelsError] = useState(false);

  return (
    <Collapsible
      open={entry.isOpen}
      onOpenChange={open => onUpdate(index, { isOpen: open })}
    >
      <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span
            data-testid="preferredSports-cardTitle-label"
            className="text-base font-bold text-slate-900"
          >
            {t('preferredSports.cardTitle', {
              number: String(index + 1).padStart(2, '0'),
            })}
          </span>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-slate-400 transition-colors hover:text-slate-600"
              aria-label={
                entry.isOpen
                  ? t('preferredSports.collapse')
                  : t('preferredSports.expand')
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
            <div className="quad-pub-sports:grid-cols-4 grid grid-cols-1 gap-4">
              {isFieldVisible('nameOfSport') && (
                <div
                  className={cn(
                    'quad-pub-sports:col-span-2 flex flex-col gap-1',
                    rowStartClass(
                      rowStartCodes,
                      'nameOfSport',
                      'quad-pub-sports:col-start-1'
                    )
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Label
                      data-testid="preferredSports-sport-label"
                      className={sportsError ? 'text-destructive' : undefined}
                    >
                      {t('preferredSports.labels.sport')}
                    </Label>
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
                          .map(opt => {
                            const source =
                              (opt.source as string) ?? 'USER_CREATED';
                            const isCreatable =
                              source === 'USER_CREATED' ||
                              opt.value === opt.label;

                            return {
                              value: isCreatable
                                ? opt.value.slice(0, MAX_SPORT_NAME_LENGTH)
                                : opt.value,
                              label: isCreatable
                                ? opt.label.slice(0, MAX_SPORT_NAME_LENGTH)
                                : opt.label,
                              source,
                            };
                          }),
                      });
                    }}
                    options={sports.map(s => ({
                      value: s.id,
                      label: s.name || s.label || '',
                      source: s.source,
                    }))}
                    onSearchSync={value => {
                      const limitedSearch = value.slice(
                        0,
                        MAX_SPORT_NAME_LENGTH
                      );
                      onUpdate(index, { sportSearch: limitedSearch });
                      onSportsSearch(limitedSearch);
                      return sports.map(s => ({
                        value: s.id,
                        label: s.name || s.label || '',
                        source: s.source,
                      }));
                    }}
                    keepSelectedInList
                    inputProps={{
                      maxLength: MAX_SPORT_NAME_LENGTH,
                    }}
                    creatable
                    triggerSearchOnFocus
                    hideClearAllButton
                    maxSelected={MAX_SELECTIONS}
                    errorMessage={t('preferredSports.errors.maxSelections')}
                    onErrorStateChange={setSportsError}
                    disabled={fieldsDisabled}
                    loading={isSportsLoading}
                    placeholder={t('preferredSports.placeholders.sport')}
                    emptyIndicator={
                      <p className="px-3 pb-3 text-left text-sm text-slate-500">
                        {t('preferredSports.empty.sports')}
                      </p>
                    }
                  />
                </div>
              )}

              {isFieldVisible('organizationLocations') && (
                <div
                  className={cn(
                    'quad-pub-sports:col-span-2 flex flex-col gap-1',
                    rowStartClass(
                      rowStartCodes,
                      'organizationLocations',
                      'quad-pub-sports:col-start-1'
                    )
                  )}
                >
                  <div className="flex h-5 items-center">
                    <Label
                      data-testid="preferredSports-organizationLocation-label"
                      className={
                        locationsError ? 'text-destructive' : undefined
                      }
                    >
                      {t('preferredSports.labels.organizationLocation')}
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
                    errorMessage={t('preferredSports.errors.maxSelections')}
                    onErrorStateChange={setLocationsError}
                    disabled={fieldsDisabled}
                    loading={isLocationsLoading}
                    placeholder={t(
                      'preferredSports.placeholders.organizationLocation'
                    )}
                    emptyIndicator={
                      <p className="px-3 pb-3 text-left text-sm text-slate-500">
                        {t('preferredSports.empty.locations')}
                      </p>
                    }
                  />
                </div>
              )}
              {isFieldVisible('levelRepresented') && (
                <div
                  className={cn(
                    'quad-pub-sports:col-span-2 flex flex-col gap-1',
                    rowStartClass(
                      rowStartCodes,
                      'levelRepresented',
                      'quad-pub-sports:col-start-1'
                    )
                  )}
                >
                  <div className="flex h-5 items-center">
                    <Label
                      data-testid="preferredSports-levelRepresented-label"
                      className={levelsError ? 'text-destructive' : undefined}
                    >
                      {t('preferredSports.labels.levelRepresented')}
                    </Label>
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
                    options={levelRepresentedOptions}
                    onSearchSync={value => {
                      onLevelRepresentedSearch(value);
                      return levelRepresentedOptions;
                    }}
                    showArrow
                    keepSelectedInList
                    triggerSearchOnFocus
                    hideClearAllButton
                    maxSelected={MAX_SELECTIONS}
                    errorMessage={t('preferredSports.errors.maxSelections')}
                    onErrorStateChange={setLevelsError}
                    disabled={fieldsDisabled}
                    loading={isLevelsLoading}
                    placeholder={t(
                      'preferredSports.placeholders.levelRepresented'
                    )}
                    emptyIndicator={
                      <p className="px-3 pb-3 text-left text-sm text-slate-500">
                        {t('preferredSports.empty.levels')}
                      </p>
                    }
                  />
                </div>
              )}

              {isFieldVisible('representedOrganization') && (
                <div
                  className={cn(
                    'quad-pub-sports:col-span-2 flex flex-col gap-1',
                    rowStartClass(
                      rowStartCodes,
                      'representedOrganization',
                      'quad-pub-sports:col-start-1'
                    )
                  )}
                >
                  <div className="flex h-5 items-center">
                    <Label
                      data-testid="preferredSports-representedOrganization-label"
                      className={
                        organizationsError ? 'text-destructive' : undefined
                      }
                    >
                      {t('preferredSports.labels.representedOrganization')}
                    </Label>
                  </div>
                  <MultipleSelector
                    key={orgSelectorKey}
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
                    errorMessage={t('preferredSports.errors.maxSelections')}
                    onErrorStateChange={setOrganizationsError}
                    disabled={fieldsDisabled}
                    loading={isOrganizationsLoading}
                    placeholder={t(
                      'preferredSports.placeholders.representedOrganization'
                    )}
                    emptyIndicator={
                      <p className="px-3 pb-3 text-left text-sm text-slate-500">
                        {t('preferredSports.empty.organizations')}
                      </p>
                    }
                  />
                </div>
              )}
              {isFieldVisible('positionRoleHeld') && (
                <div className="quad-pub-sports:col-span-1 flex min-w-0 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label data-testid="preferredSports-position-label">
                      {t('preferredSports.labels.position')}
                    </Label>
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
                    placeholder={t('preferredSports.placeholders.position')}
                    className="h-11"
                  />
                </div>
              )}

              {isFieldVisible('startDate') && (
                <div className="quad-pub-sports:col-span-1 flex min-w-0 flex-col gap-1">
                  <div className="flex min-h-5 items-center">
                    <Label data-testid="preferredSports-startDate-label">
                      {t('preferredSports.labels.startDate')}
                    </Label>
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
                          'border-input flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                          !entry.startDate && 'text-slate-500',
                          entry.startDate && 'text-zinc-800',
                          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                          'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                          applyTypography('body-medium'),
                          'shadow-none!'
                        )}
                      >
                        <span className="min-w-0 truncate text-left">
                          {entry.startDate
                            ? formatDate(entry.startDate)
                            : t('preferredSports.placeholders.startDate')}
                        </span>
                        <CalendarIcon
                          variant="Linear"
                          size={20}
                          className="shrink-0 text-zinc-800"
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
              )}

              {isFieldVisible('endDate') && (
                <div className="quad-pub-sports:col-span-1 flex min-w-0 flex-col gap-1">
                  <div className="flex min-h-5 items-center">
                    <Label data-testid="preferredSports-endDate-label">
                      {t('preferredSports.labels.endDate')}
                    </Label>
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
                          'border-input flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                          !entry.endDate && 'text-slate-500',
                          entry.endDate && 'text-zinc-800',
                          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                          'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                          applyTypography('body-medium'),
                          'shadow-none!'
                        )}
                      >
                        <span className="min-w-0 truncate text-left">
                          {entry.endDate
                            ? formatDate(entry.endDate)
                            : t('preferredSports.placeholders.endDate')}
                        </span>
                        <CalendarIcon
                          variant="Linear"
                          size={20}
                          className="shrink-0 text-zinc-800"
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
                          const day = startOfDay(date);
                          const startDate = parseLocalDate(entry.startDate);
                          return (
                            isBeforeMinDate(date, HUNDRED_YEARS_AGO) ||
                            isAfter(day, HUNDRED_YEARS_FROM_NOW) ||
                            (startDate != null &&
                              isBefore(day, startOfDay(startDate)))
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

export default function PreferredSportsStep({
  onNext,

  onBack,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: contextForm, onCancel } = useVacancyForm();
  const savedSports = contextForm.preferredSports;
  const vacancyStatus = contextForm.status;
  const isFieldVisible = useTemplateFieldVisible('sports');
  const hasAnyVisibleField = SPORT_FIELD_CODES.some(code =>
    isFieldVisible(code)
  );

  const { mutateAsync: createSport } = useCreateSportMutation();
  const { mutateAsync: createSportLevel } = useCreateSportLevelMutation();
  const { mutateAsync: createOrganization } = useCreateOrganizationMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [orgSelectorKey, setOrgSelectorKey] = useState(0);

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

  const handleNext = async () => {
    const isEmptyEnabledSection =
      isEnabled && !dataTakenFromCandidate && !hasSportsData;

    if (isEmptyEnabledSection) {
      setEmptyDisableOpen(true);
      return;
    }

    // Resolve user-created sports, levels & organizations
    const allSports = entries.flatMap(e => e.sport);
    const hasUserCreatedSports = allSports.some(
      s => s.source === 'USER_CREATED'
    );
    const allLevels = entries.flatMap(e => e.levelRepresented);
    const hasUserCreatedLevels = allLevels.some(
      lvl => lvl.source === 'USER_CREATED'
    );
    const allOrgs = entries.flatMap(e => e.representedOrganization);
    const hasUserCreatedOrgs = allOrgs.some(o => o.source === 'USER_CREATED');

    let resolvedEntries = entries;

    if (hasUserCreatedSports || hasUserCreatedLevels || hasUserCreatedOrgs) {
      setIsSubmitting(true);
      try {
        let sportResultMap = new Map();
        if (hasUserCreatedSports) {
          const uniqueUserCreatedSports = Array.from(
            new Map(
              allSports
                .filter(s => s.source === 'USER_CREATED')
                .map(s => [s.label, s])
            ).values()
          );
          const sResults = await Promise.all(
            uniqueUserCreatedSports.map(s => createSport(s.label))
          );
          sportResultMap = new Map(
            uniqueUserCreatedSports.map((s, idx) => [s.label, sResults[idx]])
          );
        }

        let levelResultMap = new Map();
        if (hasUserCreatedLevels) {
          const uniqueUserCreatedLevels = Array.from(
            new Map(
              allLevels
                .filter(lvl => lvl.source === 'USER_CREATED')
                .map(lvl => [lvl.label, lvl])
            ).values()
          );
          const lvlResults = await Promise.all(
            uniqueUserCreatedLevels.map(lvl => createSportLevel(lvl.label))
          );
          levelResultMap = new Map(
            uniqueUserCreatedLevels.map((lvl, idx) => [
              lvl.label,
              lvlResults[idx],
            ])
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
          sport: entry.sport.map(s => {
            if (s.source === 'USER_CREATED') {
              const res = sportResultMap.get(s.label);
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
          levelRepresented: entry.levelRepresented.map(lvl => {
            if (lvl.source === 'USER_CREATED') {
              const res = levelResultMap.get(lvl.label);
              if (res) {
                return {
                  value: res.pendingId,
                  label: res.value,
                  source: res.status,
                };
              }
            }
            return lvl;
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
      preferredSports: {
        isEnabled,
        dataTakenFromCandidate,
        sports: resolvedEntries,
      },
    });
  };

  useStepGuard(isEnabled && !dataTakenFromCandidate && !hasSportsData);

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;
  const canNavigate = !isEnabled || dataTakenFromCandidate || hasSportsData;

  // The direct-disable path (toggling off with no committed data) doesn't
  // otherwise clear a row's uncommitted search text, which also drives the
  // character counter next to the Sport label (DQCGP-2866). Adjusted during
  // render (not an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect.
  const [prevFieldsDisabled, setPrevFieldsDisabled] = useState(fieldsDisabled);
  if (fieldsDisabled !== prevFieldsDisabled) {
    setPrevFieldsDisabled(fieldsDisabled);
    if (fieldsDisabled) {
      setEntries(prev =>
        prev.some(e => e.sportSearch)
          ? prev.map(e => ({ ...e, sportSearch: '' }))
          : prev
      );
    }
  }

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
      if (canNavigate) {
        setConfirmDisableOpen(true);
      } else {
        setIsEnabled(false);
      }
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

  const handleTakeFromCandidateChange = (checked: boolean) => {
    setDataTakenFromCandidate(checked);
    if (checked) {
      setEntries([createEmptyEntry('1')]);
    }
  };

  const handleDisable = () => {
    setEntries([createEmptyEntry('1')]);
    setDataTakenFromCandidate(false);
    setIsEnabled(false);
    removeCompletedStep(currentStepIndex);
    setConfirmDisableOpen(false);
    SuccessToast({
      title: t('preferredSports.notifications.disable.title'),
      description: t('preferredSports.notifications.disable.message'),
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
      <div
        data-testid="preferredSports-section-form"
        className="flex flex-1 flex-col"
      >
        {/* ── Informational Banner ──────────────────────────────────────── */}
        <MessageBox
          fields={[
            t('preferredSports.fieldList.sport'),
            t('preferredSports.fieldList.levelRepresented'),
            t('preferredSports.fieldList.position'),
            t('preferredSports.fieldList.startDate'),
            t('preferredSports.fieldList.endDate'),
          ]}
        />

        {/* ── Section header: back arrow + title + toggle ───────────────── */}
        <div className="flex items-center justify-between px-7 py-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t('preferredSports.back')}
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
              data-testid="preferredSports-header-label"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              {t('preferredSports.title')}
            </h2>
            {mode === 'edit' && vacancyStatus ? (
              <VacancyStatusBadge status={vacancyStatus} />
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
            'flex items-start gap-3 px-7 pb-8',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Checkbox
            id="sportsDataTakenFromCandidate"
            checked={dataTakenFromCandidate}
            onCheckedChange={value => handleTakeFromCandidateChange(!!value)}
            className="mt-0.5"
          />
          <Label
            htmlFor="sportsDataTakenFromCandidate"
            data-testid="preferredSports-dataTakenFromCandidate-label"
            className="cursor-pointer text-sm leading-snug font-medium text-slate-900"
          >
            {t('preferredSports.dataTakenFromCandidate')}
          </Label>
        </div>

        {hasAnyVisibleField && (
          <>
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
                aria-label={t('preferredSports.addEntry')}
                className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
                disabled
                onClick={addEntry}
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
            {t('preferredSports.cancel')}
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
              t('preferredSports.next')
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
            const existing =
              entries[activeCardIndex]?.representedOrganization ?? [];
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
              representedOrganization: [
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
