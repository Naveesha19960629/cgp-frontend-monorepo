import { ChevronUpIcon, Plus } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { AddOrganizationFormDialog } from '@/views/vacancies/components/dialogs';
import { AddLicenseCertDialog } from '@/views/vacancies/components/form-steps/add-license-certificate-dialog';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useAddLicenseCertificateMutation,
  useLicenseCertificatesForm,
  useLicenseCertificatesSearch,
  useOrganizationsQuery,
  useStepGuard,
  useTertiaryAwardingBodyLocationsSearch,
} from '@/views/vacancies/hooks';
import type { LicenseCertType, StepProps } from '@/views/vacancies/types';
import {
  formatDate,
  toLicenseCertificatesPayload,
} from '@/views/vacancies/utils';
import { formatLocalDate } from '@/views/vacancies/utils/date-timezone-safe';

import { Combobox } from '@cgp/ui-kit/components/combobox';
import { ErrorToast } from '@cgp/ui-kit/components/custom-toast';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@cgp/ui-kit/components/ui/form';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_SELECTIONS = 10;

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function LicenseCertificatesStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const {
    form: vacancyForm,
    setForm,
    stepPersistRef,
    stepDisableRef,
  } = useVacancyForm();

  const form = useLicenseCertificatesForm(vacancyForm.licenseCertificates);
  const { control, watch, handleSubmit, setValue, getValues } = form;

  const isEnabled = watch('isEnabled');
  const dataTakenFromCandidate = watch('dataTakenFromCandidate');
  const entryValue = watch('entry');

  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  // ── Disable confirmation ─────────────────────────────────────────────────
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  const clearEntryData = () => {
    setValue('entry.nameOfLicenseCert', []);
    setValue('entry.issuingOrganization', undefined);
    setValue('entry.organizationLocations', []);
    setValue('entry.internationallyAccepted', false);
    setValue('entry.issueDate', undefined);
    setValue('entry.expirationDate', undefined);
  };

  const hasEntryData = (): boolean => {
    const e = getValues('entry');
    return Boolean(
      e.nameOfLicenseCert.length > 0 ||
      e.issuingOrganization != null ||
      e.organizationLocations.length > 0 ||
      e.internationallyAccepted === true ||
      !!e.issueDate ||
      !!e.expirationDate
    );
  };

  const checkHasFilledData = (): boolean => {
    return hasEntryData() || getValues('dataTakenFromCandidate') === true;
  };

  useStepGuard(isEnabled && !dataTakenFromCandidate && !hasEntryData());
  useEffect(() => {
    stepPersistRef.current = () => {
      setForm(prev => ({
        ...prev,
        licenseCertificates: toLicenseCertificatesPayload(getValues()),
      }));
    };
    return () => {
      stepPersistRef.current = null;
    };
  }, [getValues, setForm, stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        licenseCertificates: [
          { isEnabled: false, dataTakenFromCandidate: false, content: [] },
        ],
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  // ── Add License/Cert dialog state ────────────────────────────────────────
  const licenseCertValue = entryValue.nameOfLicenseCert;
  const addLicenseCertMutation = useAddLicenseCertificateMutation();
  const pendingLicenseCertsDataRef = useRef<
    Map<string, { displayValue: string; certType: LicenseCertType }>
  >(new Map());
  const licenseCertsSnapshotRef = useRef<
    { value: string; label: string; source: string; certType?: string }[]
  >([]);
  const [addLicenseCertDialogOpen, setAddLicenseCertDialogOpen] =
    useState(false);
  const [pendingLicenseCertLabel, setPendingLicenseCertLabel] = useState('');
  const [licenseCertSelectorKey, setLicenseCertSelectorKey] = useState(0);

  // ── Date popover ─────────────────────────────────────────────────────────
  const [openDatePopover, setOpenDatePopover] = useState<
    'issueDate' | 'expirationDate' | null
  >(null);

  const issueDateValue = entryValue.issueDate;

  // ── Max-selection tracking ───────────────────────────────────────────────
  const [maxReachedFields, setMaxReachedFields] = useState<Set<string>>(
    new Set()
  );
  const setMax = (field: string) =>
    setMaxReachedFields(prev => new Set([...prev, field]));
  const clearMax = (field: string) =>
    setMaxReachedFields(prev => {
      const s = new Set(prev);
      s.delete(field);
      return s;
    });

  // ── Organization query (Combobox) ─────────────────────────────────────
  const { data: organizationsData, isLoading: isOrganizationsLoading } =
    useOrganizationsQuery('', isEnabled && !dataTakenFromCandidate);
  const organizationOptions = useMemo(
    () =>
      organizationsData.map(o => ({
        value: o.id,
        label: o.name || o.label || '',
      })),
    [organizationsData]
  );
  const [showAddOrganizationDialog, setShowAddOrganizationDialog] =
    useState(false);
  const [pendingOrganizationName, setPendingOrganizationName] = useState('');

  // ── Async search hooks ───────────────────────────────────────────────────
  const searchLicenseCerts = useLicenseCertificatesSearch();
  const searchLocations = useTertiaryAwardingBodyLocationsSearch();

  // ── Resolve pending license/cert and advance ─────────────────────────────
  const resolveAndCommitLicenseCerts = async () => {
    const current = getValues('entry.nameOfLicenseCert');
    const resolved: {
      value: string;
      label: string;
      source: string;
      certType?: string;
    }[] = [];
    for (const item of current) {
      if (item.source === 'PENDING_TEMP') {
        const pendingData = pendingLicenseCertsDataRef.current.get(item.value);
        if (pendingData) {
          try {
            const result = await addLicenseCertMutation.mutateAsync({
              type: pendingData.certType,
              displayValue: pendingData.displayValue,
            });
            resolved.push({
              value: result.data.pendingId,
              label: item.label,
              source: 'PENDING',
              certType: pendingData.certType,
            });
            pendingLicenseCertsDataRef.current.delete(item.value);
          } catch (error) {
            ErrorToast({
              title: t(
                error instanceof TypeError
                  ? 'notifications.networkError.title'
                  : 'notifications.apiError.save.title'
              ),
              description: t(
                error instanceof TypeError
                  ? 'notifications.networkError.message'
                  : 'notifications.apiError.save.message'
              ),
            });
          }
        }
      } else {
        resolved.push(item);
      }
    }
    setValue('entry.nameOfLicenseCert', resolved);
  };

  const handleNext = async () => {
    if (isEnabled && !dataTakenFromCandidate && !hasEntryData()) {
      setEmptyDisableOpen(true);
      return;
    }

    await resolveAndCommitLicenseCerts();
    void handleSubmit(values => {
      onNext({ licenseCertificates: toLicenseCertificatesPayload(values) });
    })();
  };

  return (
    <Form {...form}>
      <div className="flex flex-col">
        {/* ── Informational Banner ─────────────────────────────────────────── */}
        <MessageBox
          fields={[
            t('licenseCertificates.nameOfLicenseCert'),
            t('licenseCertificates.issuingOrganization'),
            t('licenseCertificates.organizationLocations'),
            t('licenseCertificates.issueDate'),
            t('licenseCertificates.expirationDate'),
            t('licenseCertificates.internationallyAccepted'),
          ]}
        />

        {/* ── Section Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-7 py-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t('licenseCertificates.back')}
              className="text-slate-700 transition-colors hover:text-slate-900"
              onClick={onBack}
            >
              <ArrowLeft2 size={24} />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {t('licenseCertificates.title')}
            </h2>
          </div>
          <Controller
            control={control}
            name="isEnabled"
            render={({ field }) => (
              <Switch
                checked={field.value}
                size="lg"
                onCheckedChange={newValue => {
                  if (!newValue && checkHasFilledData()) {
                    setConfirmDisableOpen(true);
                  } else {
                    field.onChange(newValue);
                  }
                }}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-4 px-6">
          {/* dataTakenFromCandidate */}
          <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
            <div className="flex items-start gap-2">
              <Controller
                control={control}
                name="dataTakenFromCandidate"
                render={({ field }) => (
                  <Checkbox
                    id="licenseCertDataTakenFromCandidate"
                    checked={field.value}
                    onCheckedChange={newValue => {
                      const checked = newValue === true;
                      if (checked) clearEntryData();
                      field.onChange(checked);
                    }}
                    className="mt-0.5"
                  />
                )}
              />
              <Label
                htmlFor="licenseCertDataTakenFromCandidate"
                className="cursor-pointer leading-snug wrap-break-word"
              >
                {t('licenseCertificates.collectFromCandidates')}
              </Label>
            </div>
          </div>

          {/* ── License and Certificate Card ─────────────────────────────── */}
          <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-5">
              <h3 className="text-sm font-semibold text-slate-900">
                {t('licenseCertificates.sectionTitle')} 01
              </h3>
              <ChevronUpIcon className="h-5 w-5 text-slate-300" />
            </div>

            {/* Card body */}
            <div
              className={cn(
                'flex flex-col gap-5 px-6 py-5',
                fieldsDisabled && 'pointer-events-none opacity-60'
              )}
            >
              {/* Row 1: Name of License/Cert | Issuing Organization */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex h-5 items-center">
                    <Label className="truncate">
                      {t('licenseCertificates.nameOfLicenseCert')}
                    </Label>
                  </div>
                  <Controller
                    control={control}
                    name="entry.nameOfLicenseCert"
                    render={({ field }) => (
                      <MultipleSelector
                        key={licenseCertSelectorKey}
                        value={field.value}
                        onSearch={searchLicenseCerts}
                        onChange={options => {
                          if (options.length < MAX_SELECTIONS)
                            clearMax('nameOfLicenseCert');
                          const newItem = options.find(
                            o => o.value === o.label
                          );
                          if (newItem) {
                            licenseCertsSnapshotRef.current = getValues(
                              'entry.nameOfLicenseCert'
                            );
                            setPendingLicenseCertLabel(newItem.label);
                            setAddLicenseCertDialogOpen(true);
                          } else {
                            field.onChange(options);
                          }
                        }}
                        maxSelected={MAX_SELECTIONS}
                        onMaxSelected={() => setMax('nameOfLicenseCert')}
                        errorMessage={
                          maxReachedFields.has('nameOfLicenseCert')
                            ? t('licenseCertificates.errors.maxSelections')
                            : undefined
                        }
                        creatable
                        hideClearAllButton
                        triggerSearchOnFocus
                        keepSelectedInList
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
                        placeholder={t(
                          'licenseCertificates.placeholders.nameOfLicenseCert'
                        )}
                      />
                    )}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex h-5 items-center">
                    <Label className="truncate">
                      {t('licenseCertificates.issuingOrganization')}
                    </Label>
                  </div>
                  <Controller
                    control={control}
                    name="entry.issuingOrganization"
                    render={({ field }) => (
                      <Combobox
                        options={organizationOptions}
                        value={field.value?.value ?? ''}
                        onValueChange={value => {
                          const found = organizationsData.find(
                            o => o.id === value
                          );
                          if (found) {
                            field.onChange({
                              value: found.id,
                              label: found.name || found.label || '',
                              source: found.source ?? 'MASTER',
                            });
                          }
                        }}
                        onSearchChange={() => {}}
                        loading={isOrganizationsLoading}
                        onAddNew={name => {
                          const existing = organizationsData.find(
                            o =>
                              (o.name || o.label || '').toLowerCase() ===
                              name.toLowerCase()
                          );
                          if (existing) {
                            field.onChange({
                              value: existing.id,
                              label: existing.name || existing.label || '',
                              source: existing.source ?? 'MASTER',
                            });
                            return;
                          }
                          setPendingOrganizationName(name);
                          setShowAddOrganizationDialog(true);
                        }}
                        placeholder={t(
                          'licenseCertificates.placeholders.issuingOrganization'
                        )}
                        searchPlaceholder={t(
                          'licenseCertificates.placeholders.searchOrganization'
                        )}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Row 2: Organization Location | Issue Date | Expiration Date */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex h-5 items-center">
                    <Label className="truncate">
                      {t('licenseCertificates.organizationLocations')}
                    </Label>
                  </div>
                  <Controller
                    control={control}
                    name="entry.organizationLocations"
                    render={({ field }) => (
                      <MultipleSelector
                        value={field.value}
                        onSearch={searchLocations}
                        onChange={options => {
                          if (options.length < MAX_SELECTIONS)
                            clearMax('organizationLocations');
                          field.onChange(options);
                        }}
                        maxSelected={MAX_SELECTIONS}
                        onMaxSelected={() => setMax('organizationLocations')}
                        errorMessage={
                          maxReachedFields.has('organizationLocations')
                            ? t('licenseCertificates.errors.maxSelections')
                            : undefined
                        }
                        triggerSearchOnFocus
                        keepSelectedInList
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
                        placeholder={t(
                          'licenseCertificates.placeholders.organizationLocations'
                        )}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Issue Date */}
                  <FormField
                    control={control}
                    name="entry.issueDate"
                    render={({ field }) => (
                      <FormItem className="flex w-full flex-col gap-1 space-y-0">
                        <div className="flex h-5 items-center">
                          <FormLabel>
                            {t('licenseCertificates.issueDate')}
                          </FormLabel>
                        </div>
                        <Popover
                          modal
                          open={openDatePopover === 'issueDate'}
                          onOpenChange={open =>
                            setOpenDatePopover(
                              !fieldsDisabled && open ? 'issueDate' : null
                            )
                          }
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={fieldsDisabled}
                                className={cn(
                                  'border-input flex h-11 w-full min-w-0 items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                                  !field.value && 'text-slate-500',
                                  field.value && 'text-zinc-800',
                                  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                                  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                                  'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                                  applyTypography('body-medium'),
                                  'shadow-none!'
                                )}
                              >
                                {field.value ? (
                                  <span className="truncate pr-2">
                                    {formatDate(field.value)}
                                  </span>
                                ) : (
                                  <span className="truncate pr-2">
                                    {t(
                                      'licenseCertificates.placeholders.issueDate'
                                    )}
                                  </span>
                                )}
                                <CalendarIcon
                                  variant="Linear"
                                  size={20}
                                  className="shrink-0 text-zinc-800"
                                />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              defaultMonth={
                                field.value ? new Date(field.value) : new Date()
                              }
                              onSelect={date => {
                                field.onChange(
                                  date ? formatLocalDate(date) : undefined
                                );
                                setOpenDatePopover(null);
                                const expDate = getValues(
                                  'entry.expirationDate'
                                );
                                if (
                                  expDate &&
                                  date &&
                                  new Date(expDate) < date
                                ) {
                                  setValue('entry.expirationDate', undefined);
                                }
                              }}
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />

                  {/* Expiration Date */}
                  <FormField
                    control={control}
                    name="entry.expirationDate"
                    render={({ field }) => (
                      <FormItem className="flex w-full flex-col gap-1 space-y-0">
                        <div className="flex h-5 items-center">
                          <FormLabel>
                            {t('licenseCertificates.expirationDate')}
                          </FormLabel>
                        </div>
                        <Popover
                          modal
                          open={openDatePopover === 'expirationDate'}
                          onOpenChange={open =>
                            setOpenDatePopover(
                              !fieldsDisabled && open ? 'expirationDate' : null
                            )
                          }
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={fieldsDisabled}
                                className={cn(
                                  'border-input flex h-11 w-full min-w-0 items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
                                  !field.value && 'text-slate-500',
                                  field.value && 'text-zinc-800',
                                  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                                  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                                  'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                                  applyTypography('body-medium'),
                                  'shadow-none!'
                                )}
                              >
                                {field.value ? (
                                  <span className="truncate pr-2">
                                    {formatDate(field.value)}
                                  </span>
                                ) : (
                                  <span className="truncate pr-2">
                                    {t(
                                      'licenseCertificates.placeholders.expirationDate'
                                    )}
                                  </span>
                                )}
                                <CalendarIcon
                                  variant="Linear"
                                  size={20}
                                  className="shrink-0 text-zinc-800"
                                />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              defaultMonth={
                                field.value
                                  ? new Date(field.value)
                                  : issueDateValue
                                    ? new Date(issueDateValue)
                                    : new Date()
                              }
                              onSelect={date => {
                                field.onChange(
                                  date ? formatLocalDate(date) : undefined
                                );
                                setOpenDatePopover(null);
                              }}
                              disabled={date =>
                                issueDateValue
                                  ? date < new Date(issueDateValue)
                                  : false
                              }
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Row 3: Internationally accepted (full width) */}
              <div className="flex items-start gap-2">
                <Controller
                  control={control}
                  name="entry.internationallyAccepted"
                  render={({ field }) => (
                    <Checkbox
                      id="internationallyAccepted"
                      checked={field.value}
                      onCheckedChange={val => field.onChange(val === true)}
                      className="mt-0.5"
                    />
                  )}
                />
                <Label
                  htmlFor="internationallyAccepted"
                  className="cursor-pointer leading-snug wrap-break-word"
                >
                  {t('licenseCertificates.internationallyAccepted')}
                </Label>
              </div>
            </div>
          </div>

          {/* ── Add Entry button (disabled — Phase 1) ─────────────────────── */}
          <div
            className={cn(
              'flex justify-end py-4',
              !isEnabled && 'pointer-events-none opacity-60'
            )}
          >
            <Button
              type="button"
              variant="secondary"
              disabled
              className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
            >
              <Plus className="size-4 text-neutral-600!" />
            </Button>
          </div>
        </div>

        {/* ── Add Organization dialog ──────────────────────────────────────── */}
        <AddOrganizationFormDialog
          open={showAddOrganizationDialog}
          onOpenChange={setShowAddOrganizationDialog}
          organizationName={pendingOrganizationName}
          onOrganizationAdded={org => {
            setValue('entry.issuingOrganization', {
              value: org.id,
              label: org.name,
              source: org.source,
            });
          }}
        />

        {/* ── Add License/Cert dialog ──────────────────────────────────────── */}
        <AddLicenseCertDialog
          open={addLicenseCertDialogOpen}
          initialName={pendingLicenseCertLabel}
          onClose={() => {
            setLicenseCertSelectorKey(k => k + 1);
            setAddLicenseCertDialogOpen(false);
          }}
          onAdded={option => {
            pendingLicenseCertsDataRef.current.set(option.value, {
              displayValue: option.label,
              certType: option.certType,
            });
            setValue('entry.nameOfLicenseCert', [
              ...licenseCertValue,
              {
                value: option.value,
                label: option.label,
                source: option.source,
                certType: option.certType,
              },
            ]);
            setAddLicenseCertDialogOpen(false);
          }}
        />

        <StepDisableDialog
          open={confirmDisableOpen}
          onOpenChange={setConfirmDisableOpen}
          title={t('licenseCertificates.confirmDisableDialog.title')}
          description={t('licenseCertificates.confirmDisableDialog.message')}
          confirmLabel={t('licenseCertificates.confirmDisableDialog.disable')}
          onConfirm={() => {
            clearEntryData();
            setValue('dataTakenFromCandidate', false);
            setValue('isEnabled', false);
            setLicenseCertSelectorKey(k => k + 1);
            setConfirmDisableOpen(false);
          }}
        />

        <StepDisableDialog
          open={emptyDisableOpen}
          onOpenChange={setEmptyDisableOpen}
          title={t('licenseCertificates.emptyDisableDialog.title')}
          description={t('licenseCertificates.emptyDisableDialog.message')}
          confirmLabel={t('licenseCertificates.emptyDisableDialog.disable')}
          onConfirm={() => {
            clearEntryData();
            setValue('dataTakenFromCandidate', false);
            setValue('isEnabled', false);
            setLicenseCertSelectorKey(k => k + 1);
            setEmptyDisableOpen(false);
            void handleSubmit(values => {
              onNext({
                licenseCertificates: toLicenseCertificatesPayload(values),
              });
            })();
          }}
        />

        {/* ── Step footer ───────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
          <Button variant="secondary" className="h-12 w-48" onClick={onBack}>
            {t('licenseCertificates.cancel')}
          </Button>
          <Button className="h-12 w-48" onClick={() => void handleNext()}>
            {t('licenseCertificates.next')}
          </Button>
        </div>
      </div>
    </Form>
  );
}
