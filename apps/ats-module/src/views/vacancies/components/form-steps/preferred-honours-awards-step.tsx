import { ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';

import { ArrowLeft2, Calendar as CalenderIcon } from 'iconsax-reactjs';

import { useEffect, useMemo, useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getApiErrorMessage } from '@/app/utils/api-error';
import MessageBox from '@/components/message-box';
import { StepDisableDialog } from '@/views/vacancies';
import { AddOrganizationFormDialog } from '@/views/vacancies/components/dialogs';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import {
  useTemplateFieldVisible,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import {
  useCreateOrganizationMutation,
  useLocationsQuery,
  useOrganizationsQuery,
  usePreferredHonoursAwardsForm,
  useStepGuard,
} from '@/views/vacancies/hooks';
import type {
  PreferredHonoursAwardsSchema,
  StepProps,
} from '@/views/vacancies/types';
import { resolveUserCreatedOrganizations } from '@/views/vacancies/utils';
import {
  DATE_DISPLAY_FORMAT,
  DATE_POPOVER,
} from '@/views/vacancies/utils/constants';
import { computeRowStartCodes } from '@/views/vacancies/utils/field-grid-layout';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import type { Option } from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cgp/ui-kit/components/ui/collapsible';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cgp/ui-kit/components/ui/form';
import { Input } from '@cgp/ui-kit/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { createDateClearHandler } from '@cgp/ui-kit/lib/keyboard-actions';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn, removeEmoji } from '@cgp/ui-kit/lib/utils';
import { format } from 'date-fns';

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

/**
 * Field codes that make up the Honours & Awards entry. In the Use Template flow
 * the whole entry cards list (and its add button) is hidden when none of these
 * are enabled by the template — see `hasAnyVisibleField`.
 */
const HONOURS_FIELD_CODES = [
  'title',
  'issuedBy',
  'issuedFromDate',
  'issuedToDate',
  'associatedOrganizations',
  'organizationLocations',
] as const;

/**
 * Field codes in render order with their column spans at the WIDE tier
 * (`quad-honours`, ≥1700px), used by `computeRowStartCodes` to decide which
 * half-width fields must wrap to a fresh row (`quad-honours:col-start-1`).
 */
const HONOURS_GRID_FIELDS = [
  { code: 'title', span: 1 },
  { code: 'issuedBy', span: 1 },
  { code: 'issuedFromDate', span: 1 },
  { code: 'issuedToDate', span: 1 },
  { code: 'associatedOrganizations', span: 2 },
  { code: 'organizationLocations', span: 2 },
] as const;

/**
 * Same fields with their MID-tier spans (`xl`–1700px): Title/Issued By are
 * half-width there, so the free-flow/straddle placement differs from the wide
 * tier. Drives `xl:col-start-1` — e.g. it lets Associated Organization pack
 * onto the same row as the two quarter-width date fields.
 */
const HONOURS_GRID_FIELDS_MID = [
  { code: 'title', span: 2 },
  { code: 'issuedBy', span: 2 },
  { code: 'issuedFromDate', span: 1 },
  { code: 'issuedToDate', span: 1 },
  { code: 'associatedOrganizations', span: 2 },
  { code: 'organizationLocations', span: 2 },
] as const;

function hasHonoursData(data: PreferredHonoursAwardsSchema): boolean {
  return data.honoursAndAwards.some(
    honour =>
      honour.title.trim().length > 0 ||
      honour.issuedBy.trim().length > 0 ||
      honour.issuedDateFrom != null ||
      honour.issuedDateTo != null ||
      honour.associatedOrganizations.length > 0 ||
      honour.organizationLocations.length > 0
  );
}

interface HonoursAndAwardsCardProps {
  index: number;
  form: UseFormReturn<PreferredHonoursAwardsSchema>;
  onRemove: () => void;
  onOpenAddOrganizationDialog: (name: string, honorIndex: number) => void;
}

function HonoursAndAwardsCard({
  index,
  form,
  onRemove,
  onOpenAddOrganizationDialog,
}: Readonly<HonoursAndAwardsCardProps>) {
  const { t } = useTranslation('ats');
  const isFieldVisible = useTemplateFieldVisible('honoursAndAwards');
  // Straddle-guard row starts, computed per tier because Title/Issued By have
  // different spans at each: wide (`quad-honours`) → `quad-honours:col-start-1`,
  // mid (`xl`) → `xl:col-start-1`. Free-flow otherwise, so a half field packs
  // beside preceding quarters (e.g. Associated Org next to the dates) unless it
  // would straddle the row midline.
  const rowStartCodes = computeRowStartCodes(
    HONOURS_GRID_FIELDS,
    isFieldVisible
  );
  const rowStartCodesMid = computeRowStartCodes(
    HONOURS_GRID_FIELDS_MID,
    isFieldVisible
  );
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const hundredYearsAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 100);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const hundredYearsFromNow = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 100);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const [hasOrganizationMaxError, setHasOrganizationMaxError] = useState(false);
  const [hasLocationMaxError, setHasLocationMaxError] = useState(false);
  const [organizationSearch, setOrganizationSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [openDatePopover, setOpenDatePopover] = useState<
    'issuedDateFrom' | 'issuedDateTo' | null
  >(null);

  const isEnabled = form.watch('isEnabled');
  const dataTakenFromCandidate = form.watch('dataTakenFromCandidate');
  const isFieldDisabled = !isEnabled || dataTakenFromCandidate;

  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizationsQuery(organizationSearch, isEnabled);
  const { data: locationsData, isLoading: isLocationsLoading } =
    useLocationsQuery(locationSearch, isEnabled);

  const isOpen = form.watch(`honoursAndAwards.${index}.isOpen`);

  return (
    <Collapsible
      // release with hardcoded "true" with isOpen when multiple entry allowed
      open={true}
      onOpenChange={open =>
        form.setValue(`honoursAndAwards.${index}.isOpen`, open)
      }
    >
      <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-5">
          <span
            data-testid="preferredHonoursAwards-honourTitle-label"
            className="text-base font-bold text-slate-900"
          >
            {t('preferredHonoursAwards.honourTitle', {
              number: String(index + 1).padStart(2, '0'),
            })}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRemove}
              // remove disabled = true and hidden from UI when multiple entry allowed
              disabled={true}
              className="hidden text-slate-400 transition-colors hover:text-red-500"
              aria-label={t('preferredHonoursAwards.removeHonour')}
            >
              <Trash2 className="size-5" />
            </button>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                aria-label={
                  isOpen
                    ? t('preferredHonoursAwards.collapse')
                    : t('preferredHonoursAwards.expand')
                }
              >
                <ChevronUp
                  className={cn(
                    'size-5 transition-transform',
                    !isOpen && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Collapsible body */}
        <CollapsibleContent>
          <div className="grid grid-cols-1 gap-4 px-5 pb-5 xl:grid-cols-4">
            {isFieldVisible('title') && (
              <FormField
                control={form.control}
                name={`honoursAndAwards.${index}.title`}
                render={({ field }) => (
                  <FormItem className="quad-honours:col-span-1 flex flex-col gap-1.5 space-y-0 xl:col-span-2">
                    <FormLabel
                      data-testid="preferredHonoursAwards-titleOfHonourOrAward-label"
                      className={cn(
                        'flex justify-between',
                        isFieldDisabled && 'opacity-50'
                      )}
                    >
                      <span>
                        {t('preferredHonoursAwards.titleOfHonourOrAward')}
                      </span>
                      <CharacterCount
                        maxLength={250}
                        currentLength={field.value.length}
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'preferredHonoursAwards.titleOfHonourOrAwardPlaceholder'
                        )}
                        maxLength={250}
                        disabled={isFieldDisabled}
                        className="h-11 shadow-none"
                        {...field}
                        onChange={e => {
                          field.onChange(
                            removeEmoji(e.target.value.trimStart())
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isFieldVisible('issuedBy') && (
              <FormField
                control={form.control}
                name={`honoursAndAwards.${index}.issuedBy`}
                render={({ field }) => (
                  <FormItem className="quad-honours:col-span-1 flex flex-col gap-1.5 space-y-0 xl:col-span-2">
                    <FormLabel
                      data-testid="preferredHonoursAwards-issuedBy-label"
                      className={cn(
                        'flex justify-between',
                        isFieldDisabled && 'opacity-50'
                      )}
                    >
                      <span>{t('preferredHonoursAwards.issuedBy')}</span>
                      <CharacterCount
                        maxLength={100}
                        currentLength={field.value.length}
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'preferredHonoursAwards.issuedByPlaceholder'
                        )}
                        maxLength={100}
                        disabled={isFieldDisabled}
                        className="h-11 shadow-none"
                        {...field}
                        onChange={e => {
                          field.onChange(
                            removeEmoji(e.target.value.trimStart())
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isFieldVisible('issuedFromDate') && (
              <FormField
                control={form.control}
                name={`honoursAndAwards.${index}.issuedDateFrom`}
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col gap-1 space-y-0 xl:col-span-1">
                    <FormLabel
                      data-testid="preferredHonoursAwards-issuedDateFrom-label"
                      className={cn(
                        'text-sm font-semibold text-slate-900',
                        isFieldDisabled && 'opacity-50'
                      )}
                    >
                      {t('preferredHonoursAwards.issuedDateFrom')}
                    </FormLabel>
                    <Popover
                      modal
                      open={openDatePopover === DATE_POPOVER.issuedDateFrom}
                      onOpenChange={open =>
                        setOpenDatePopover(
                          !isFieldDisabled && open
                            ? DATE_POPOVER.issuedDateFrom
                            : null
                        )
                      }
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            onKeyDown={createDateClearHandler({
                              hasValue: !!field.value,
                              isOpen:
                                openDatePopover === DATE_POPOVER.issuedDateFrom,
                              onClear: () => field.onChange(null),
                            })}
                            type="button"
                            variant="outline"
                            disabled={isFieldDisabled}
                            className={cn(
                              'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                              !field.value && 'text-slate-500',
                              field.value && 'text-zinc-800',
                              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                              'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                              'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                              applyTypography('body-medium'),
                              'shadow-none!',
                              'min-w-0'
                            )}
                          >
                            <span className="mr-2 truncate">
                              {field.value
                                ? format(field.value, DATE_DISPLAY_FORMAT)
                                : t(
                                    'preferredHonoursAwards.issuedDateFromPlaceholder'
                                  )}
                            </span>
                            <CalenderIcon
                              variant="Linear"
                              size={20}
                              className="shrink-0 text-zinc-800"
                            />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        aria-label={t('common.a11y.chooseDate')}
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          defaultMonth={field.value ?? new Date()}
                          onSelect={date => {
                            // Deselecting the day clears to null, not undefined (DQCGP-4212).
                            field.onChange(date ?? null);
                            setOpenDatePopover(null);
                            const issuedDateTo = form.getValues(
                              `honoursAndAwards.${index}.issuedDateTo`
                            );
                            if (issuedDateTo && date && issuedDateTo < date) {
                              form.setValue(
                                `honoursAndAwards.${index}.issuedDateTo`,
                                null
                              );
                            }
                          }}
                          disabled={date =>
                            date > today || date < hundredYearsAgo
                          }
                          captionLayout="dropdown"
                          startMonth={hundredYearsAgo}
                          endMonth={today}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isFieldVisible('issuedToDate') && (
              <FormField
                control={form.control}
                name={`honoursAndAwards.${index}.issuedDateTo`}
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col gap-1 space-y-0 xl:col-span-1">
                    <FormLabel
                      data-testid="preferredHonoursAwards-issuedDateTo-label"
                      className={cn(
                        'text-sm font-semibold text-slate-900',
                        isFieldDisabled && 'opacity-50'
                      )}
                    >
                      {t('preferredHonoursAwards.issuedDateTo')}
                    </FormLabel>
                    <Popover
                      modal
                      open={openDatePopover === DATE_POPOVER.issuedDateTo}
                      onOpenChange={open =>
                        setOpenDatePopover(
                          !isFieldDisabled && open
                            ? DATE_POPOVER.issuedDateTo
                            : null
                        )
                      }
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            onKeyDown={createDateClearHandler({
                              hasValue: !!field.value,
                              isOpen:
                                openDatePopover === DATE_POPOVER.issuedDateTo,
                              onClear: () => field.onChange(null),
                            })}
                            type="button"
                            variant="outline"
                            disabled={isFieldDisabled}
                            className={cn(
                              'border-input flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                              !field.value && 'text-slate-500',
                              field.value && 'text-zinc-800',
                              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                              'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                              'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                              applyTypography('body-medium'),
                              'shadow-none!',
                              'min-w-0'
                            )}
                          >
                            <span className="mr-2 truncate">
                              {field.value
                                ? format(field.value, DATE_DISPLAY_FORMAT)
                                : t(
                                    'preferredHonoursAwards.issuedDateToPlaceholder'
                                  )}
                            </span>
                            <CalenderIcon
                              variant="Linear"
                              size={20}
                              className="shrink-0 text-zinc-800"
                            />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        aria-label={t('common.a11y.chooseDate')}
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          defaultMonth={field.value ?? new Date()}
                          onSelect={date => {
                            // Deselecting the day clears to null, not undefined (DQCGP-4212).
                            field.onChange(date ?? null);
                            setOpenDatePopover(null);
                          }}
                          disabled={date => {
                            const issuedDateFrom = form.getValues(
                              `honoursAndAwards.${index}.issuedDateFrom`
                            );
                            return (
                              date < hundredYearsAgo ||
                              date > hundredYearsFromNow ||
                              (issuedDateFrom != null && date < issuedDateFrom)
                            );
                          }}
                          captionLayout="dropdown"
                          startMonth={hundredYearsAgo}
                          endMonth={hundredYearsFromNow}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isFieldVisible('associatedOrganizations') && (
              <FormField
                control={form.control}
                name={`honoursAndAwards.${index}.associatedOrganizations`}
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      'flex flex-col gap-1.5 space-y-0 xl:col-span-2',
                      rowStartCodesMid.has('associatedOrganizations') &&
                        'xl:col-start-1',
                      rowStartCodes.has('associatedOrganizations')
                        ? 'quad-honours:col-start-1'
                        : rowStartCodesMid.has('associatedOrganizations') &&
                            'quad-honours:col-start-auto'
                    )}
                  >
                    <FormLabel
                      data-testid="preferredHonoursAwards-associatedOrganization-label"
                      className={cn(
                        'text-sm font-semibold text-slate-900',
                        hasOrganizationMaxError && 'text-destructive',
                        isFieldDisabled && 'opacity-50'
                      )}
                    >
                      {t('preferredHonoursAwards.associatedOrganization')}
                    </FormLabel>
                    <FormControl>
                      <MultipleSelector
                        alwaysShowCreatable
                        value={
                          field.value?.map(organization => ({
                            value: organization.value,
                            label: organization.label,
                            source: organization.source,
                          })) ?? []
                        }
                        errorMessage={t(
                          'preferredHonoursAwards.validation.maxExceeded',
                          {
                            max: 10,
                          }
                        )}
                        onErrorStateChange={setHasOrganizationMaxError}
                        onChange={options => {
                          const validOrganizations = options
                            .map(option => {
                              const isNew = option.value === option.label;
                              if (isNew) {
                                onOpenAddOrganizationDialog(
                                  option.label,
                                  index
                                );
                                return null;
                              }
                              return {
                                value: option.value,
                                label: option.label,
                                source:
                                  (option.source as string) ?? 'USER_CREATED',
                              };
                            })
                            .filter(
                              (org): org is NonNullable<typeof org> =>
                                org !== null
                            );

                          // Always commit the cleaned list. When a new org is
                          // detected it is excluded here and instead added (with
                          // its location) once the dialog completes, so the raw
                          // typed value never lingers as a partial entry.
                          field.onChange(validOrganizations);
                        }}
                        options={organizationsData.map(organization => ({
                          value: organization.id,
                          label: organization.name ?? organization.label ?? '',
                          source: organization.source ?? 'MASTER',
                        }))}
                        onSearchSync={value => {
                          setOrganizationSearch(value);
                          return organizationsData.map(organization => ({
                            value: organization.id,
                            label:
                              organization.name ?? organization.label ?? '',
                            source: organization.source ?? 'MASTER',
                          }));
                        }}
                        keepSelectedInList
                        creatable
                        triggerSearchOnFocus
                        hideClearAllButton
                        maxSelected={10}
                        disabled={isFieldDisabled}
                        loading={isOrganizationsLoading}
                        placeholder={t(
                          'preferredHonoursAwards.associatedOrganizationPlaceholder'
                        )}
                        loadingIndicator={
                          <p className="px-3 pb-3 text-left">
                            {t('common.loading')}
                          </p>
                        }
                        emptyIndicator={
                          <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                            <div className="flex flex-col items-start">
                              <img
                                src={multiSelectInfoAvatar}
                                alt={t('common.noData')}
                              />
                              <div className="mt-3 w-61 text-left">
                                <p className="font-bold text-slate-900">
                                  {t('common.noDataTitle')}
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                  {t('common.noDataDescription')}
                                </p>
                              </div>
                            </div>
                          </div>
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isFieldVisible('organizationLocations') && (
              <FormField
                control={form.control}
                name={`honoursAndAwards.${index}.organizationLocations`}
                render={({ field }) => {
                  const locationOptions: Option[] = locationsData.map(
                    location => ({
                      value: location.id,
                      label: location.label,
                    })
                  );

                  return (
                    <FormItem
                      className={cn(
                        'flex flex-col gap-1.5 space-y-0 xl:col-span-2',
                        rowStartCodesMid.has('organizationLocations') &&
                          'xl:col-start-1',
                        rowStartCodes.has('organizationLocations')
                          ? 'quad-honours:col-start-1'
                          : rowStartCodesMid.has('organizationLocations') &&
                              'quad-honours:col-start-auto'
                      )}
                    >
                      <FormLabel
                        data-testid="preferredHonoursAwards-organizationLocation-label"
                        className={cn(
                          'text-sm font-semibold text-slate-900',
                          hasLocationMaxError && 'text-destructive',
                          isFieldDisabled && 'opacity-50'
                        )}
                      >
                        {t('preferredHonoursAwards.organizationLocation')}
                      </FormLabel>
                      <FormControl>
                        <MultipleSelector
                          value={
                            field.value?.map(location => ({
                              value: location.value,
                              label: location.label,
                            })) ?? []
                          }
                          errorMessage={t(
                            'preferredHonoursAwards.validation.maxExceeded',
                            {
                              max: 10,
                            }
                          )}
                          onErrorStateChange={setHasLocationMaxError}
                          onChange={options => {
                            field.onChange(
                              options.map(option => ({
                                value: option.value,
                                label: option.label,
                              }))
                            );
                          }}
                          options={locationOptions}
                          onSearchSync={value => {
                            setLocationSearch(value);
                            return locationOptions;
                          }}
                          showArrow
                          keepSelectedInList
                          hideClearAllButton
                          maxSelected={10}
                          disabled={isFieldDisabled}
                          loading={isLocationsLoading}
                          placeholder={t(
                            'preferredHonoursAwards.organizationLocationPlaceholder'
                          )}
                          loadingIndicator={
                            <p className="px-3 pb-3 text-left">
                              {t('common.loading')}
                            </p>
                          }
                          emptyIndicator={
                            <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                              <div className="flex flex-col items-start">
                                <img
                                  src={multiSelectInfoAvatar}
                                  alt={t('common.noData')}
                                />
                                <div className="mt-3 w-61 text-left">
                                  <p className="font-bold text-slate-900">
                                    {t('common.noDataTitle')}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {t('common.noDataDescription')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function PreferredHonoursAwardsStep({
  onNext,
  onBack,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const isFieldVisible = useTemplateFieldVisible('honoursAndAwards');
  const hasAnyVisibleField = HONOURS_FIELD_CODES.some(code =>
    isFieldVisible(code)
  );

  const {
    form: contextForm,
    setForm,
    onCancel,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();
  const { form, fields, append, remove, replace } =
    usePreferredHonoursAwardsForm(contextForm.preferredHonoursAwards);

  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddOrganizationDialog, setShowAddOrganizationDialog] =
    useState(false);
  const [pendingOrganizationName, setPendingOrganizationName] = useState('');
  const [pendingHonorIndex, setPendingHonorIndex] = useState<number>(0);

  const { mutateAsync: createOrganization } = useCreateOrganizationMutation();

  const isEnabled = form.watch('isEnabled');
  const dataTakenFromCandidate = form.watch('dataTakenFromCandidate');
  // Watch honoursAndAwards to trigger re-renders when form data changes
  form.watch('honoursAndAwards');

  useStepGuard(
    isEnabled && !dataTakenFromCandidate && !hasHonoursData(form.getValues())
  );
  useEffect(() => {
    stepPersistRef.current = () => {
      const values = form.getValues();
      setForm(prev => ({
        ...prev,
        preferredHonoursAwards: {
          isEnabled: values.isEnabled,
          dataTakenFromCandidate: values.dataTakenFromCandidate,
          honoursAndAwards: values.honoursAndAwards ?? [],
        },
      }));
    };
    return () => {
      stepPersistRef.current = null;
    };
  }, [form, setForm, stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredHonoursAwards: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          honoursAndAwards: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  const canNavigate =
    !isEnabled || dataTakenFromCandidate || hasHonoursData(form.getValues());

  const persistCurrentStepData = (data: PreferredHonoursAwardsSchema) => {
    setForm(prev => ({
      ...prev,
      preferredHonoursAwards: {
        isEnabled: data.isEnabled,
        dataTakenFromCandidate: data.dataTakenFromCandidate,
        honoursAndAwards: data.honoursAndAwards,
      },
    }));
  };

  const handleConfirmDisable = () => {
    form.setValue('isEnabled', false);
    form.setValue('dataTakenFromCandidate', false);
    replace([
      {
        title: '',
        issuedBy: '',
        issuedDateFrom: null,
        issuedDateTo: null,
        associatedOrganizations: [],
        organizationLocations: [],
        isOpen: true,
      },
    ]);
    removeCompletedStep(currentStepIndex);
    setShowDisableConfirm(false);
    SuccessToast({
      title: t('preferredHonoursAwards.notifications.disable.title'),
      description: t('preferredHonoursAwards.notifications.disable.message'),
    });
  };

  const handleConfirmEmptyData = () => {
    replace([
      {
        title: '',
        issuedBy: '',
        issuedDateFrom: null,
        issuedDateTo: null,
        associatedOrganizations: [],
        organizationLocations: [],
        isOpen: true,
      },
    ]);
    setShowEmptyConfirm(false);
    onNext({
      preferredHonoursAwards: {
        isEnabled: false,
        dataTakenFromCandidate: form.getValues('dataTakenFromCandidate'),
        honoursAndAwards: [],
      },
    });
  };

  const handleSubmit = async (data: PreferredHonoursAwardsSchema) => {
    if (
      data.isEnabled &&
      !data.dataTakenFromCandidate &&
      !hasHonoursData(data)
    ) {
      setShowEmptyConfirm(true);
      return;
    }

    const hasUserCreatedOrganization = data.honoursAndAwards
      .flatMap(honour => honour.associatedOrganizations)
      .some(organization => organization.source === 'USER_CREATED');

    if (hasUserCreatedOrganization) {
      setIsSubmitting(true);
      try {
        const updatedHonours = await resolveUserCreatedOrganizations(
          data.honoursAndAwards,
          createOrganization
        );

        form.setValue('honoursAndAwards', updatedHonours);
        onNext({
          preferredHonoursAwards: {
            isEnabled: data.isEnabled,
            dataTakenFromCandidate: data.dataTakenFromCandidate,
            honoursAndAwards: updatedHonours,
          },
        });
        return;
      } catch (err) {
        ErrorToast({
          title: t('common.errorTitle'),
          description: getApiErrorMessage(err),
        });
      } finally {
        setIsSubmitting(false);
      }
    }

    onNext({
      preferredHonoursAwards: {
        isEnabled: data.isEnabled,
        dataTakenFromCandidate: data.dataTakenFromCandidate,
        honoursAndAwards: data.honoursAndAwards,
      },
    });
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleBack = () => {
    if (!canNavigate || isSubmitting) {
      return;
    }

    persistCurrentStepData(form.getValues());
    onBack();
  };

  const handleDataTakenFromCandidateChange = (checked: boolean) => {
    if (checked) {
      replace([
        {
          title: '',
          issuedBy: '',
          issuedDateFrom: null,
          issuedDateTo: null,
          associatedOrganizations: [],
          organizationLocations: [],
          isOpen: true,
        },
      ]);
    }
    form.setValue('dataTakenFromCandidate', checked);
  };

  return (
    <>
      <Form {...form}>
        <form
          data-testid="preferredHonoursAwards-section-form"
          onSubmit={e => {
            void form.handleSubmit(handleSubmit)(e);
          }}
          className="flex flex-1 flex-col"
        >
          <MessageBox
            fields={[
              t('preferredHonoursAwards.fieldList.titleOfHonourOrAward'),
              t('preferredHonoursAwards.fieldList.associatedOrganization'),
              t('preferredHonoursAwards.fieldList.issuedDate'),
            ]}
          />

          {/* Section header: back arrow + title + toggle */}
          <div className="flex items-center justify-between px-7 py-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={!canNavigate || isSubmitting}
                className={cn(
                  'cursor-pointer text-slate-700 transition-colors hover:text-slate-900',
                  (!canNavigate || isSubmitting) &&
                    'cursor-not-allowed opacity-40 hover:text-slate-700'
                )}
                aria-label={t('preferredHonoursAwards.back')}
              >
                <ArrowLeft2 size={24} />
              </button>
              <h2
                data-testid="preferredHonoursAwards-header-label"
                className="text-xl font-bold tracking-tight text-slate-900"
              >
                {t('preferredHonoursAwards.title')}
              </h2>
              {mode === 'edit' && contextForm.status ? (
                <VacancyStatusBadge
                  status={contextForm.status}
                  applicantCount={contextForm.applicantCount}
                />
              ) : null}
            </div>

            {/* Toggle switch */}
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  size="lg"
                  data-testid="toggle-on-off-switch"
                  onCheckedChange={checked => {
                    if (!checked) {
                      const hasChecked = form.getValues(
                        'dataTakenFromCandidate'
                      );
                      const hasData = hasHonoursData(form.getValues());

                      if (hasData || hasChecked) {
                        setShowDisableConfirm(true);
                      } else {
                        field.onChange(false);
                      }
                    } else {
                      field.onChange(true);
                    }
                  }}
                />
              )}
            />
          </div>

          {/* Checkbox: data from candidate profile */}
          <div className="flex items-center gap-3 px-7 pb-8">
            <FormField
              control={form.control}
              name="dataTakenFromCandidate"
              render={({ field }) => (
                <>
                  <Checkbox
                    id="data-from-candidate"
                    checked={field.value}
                    disabled={!isEnabled}
                    onCheckedChange={checked => {
                      handleDataTakenFromCandidateChange(checked === true);
                    }}
                  />
                  <label
                    htmlFor="data-from-candidate"
                    className={cn(
                      'text-sm font-medium text-slate-900',
                      isEnabled
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {t('preferredHonoursAwards.dataTakenFromCandidate')}
                  </label>
                </>
              )}
            />
          </div>

          {hasAnyVisibleField && (
            <>
              {/* Honour cards */}
              <div className="flex flex-col gap-4 px-6">
                {fields.map((field, index) => (
                  <HonoursAndAwardsCard
                    key={field.id}
                    index={index}
                    form={form}
                    onRemove={() => remove(index)}
                    onOpenAddOrganizationDialog={(name, honorIdx) => {
                      setPendingOrganizationName(name);
                      setPendingHonorIndex(honorIdx);
                      setShowAddOrganizationDialog(true);
                    }}
                  />
                ))}
              </div>

              {/* Add honour button */}
              <div className="flex justify-end px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled
                  className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
                  onClick={() =>
                    append({
                      title: '',
                      issuedBy: '',
                      issuedDateFrom: undefined,
                      issuedDateTo: undefined,
                      associatedOrganizations: [],
                      organizationLocations: [],
                      isOpen: true,
                    })
                  }
                >
                  <Plus className="size-4 text-neutral-600!" />
                </Button>
              </div>
            </>
          )}

          {/* Footer: Cancel + Next */}
          <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-48"
              onClick={handleCancel}
            >
              {t('preferredHonoursAwards.cancelButton')}
            </Button>
            <Button
              type="submit"
              className="h-12 w-48"
              disabled={!canNavigate || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('preferredHonoursAwards.nextButton')
              )}
            </Button>
          </div>
        </form>
      </Form>

      <StepDisableDialog
        open={showDisableConfirm}
        onOpenChange={setShowDisableConfirm}
        onConfirm={handleConfirmDisable}
        title={t('preferredHonoursAwards.disableDialog.title')}
        description={t('preferredHonoursAwards.disableDialog.description')}
        confirmLabel={t('preferredHonoursAwards.disableDialog.confirmButton')}
      />

      <StepDisableDialog
        open={showEmptyConfirm}
        onOpenChange={setShowEmptyConfirm}
        onConfirm={handleConfirmEmptyData}
        title={t('preferredHonoursAwards.emptyDisableDialog.title')}
        description={t('preferredHonoursAwards.emptyDisableDialog.message')}
        confirmLabel={t('preferredHonoursAwards.emptyDisableDialog.disable')}
      />

      <AddOrganizationFormDialog
        open={showAddOrganizationDialog}
        onOpenChange={setShowAddOrganizationDialog}
        organizationName={pendingOrganizationName}
        onOrganizationAdded={org => {
          const currentOrganizations = form.getValues(
            `honoursAndAwards.${pendingHonorIndex}.associatedOrganizations`
          );

          const isDuplicate = currentOrganizations?.some(
            o => o.label.toLowerCase().trim() === org.name.toLowerCase().trim()
          );

          if (isDuplicate) {
            setShowAddOrganizationDialog(false);
            return false;
          }

          form.setValue(
            `honoursAndAwards.${pendingHonorIndex}.associatedOrganizations`,
            [
              ...(currentOrganizations ?? []),
              {
                value: org.id,
                label: org.name,
                source: 'USER_CREATED',
              },
            ]
          );
          setShowAddOrganizationDialog(false);
          return true;
        }}
      />
    </>
  );
}
