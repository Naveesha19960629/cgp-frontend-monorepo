import { ChevronUpIcon, Plus } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import { useEffect, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { AddOrganizationFormDialog } from '@/views/vacancies/components/dialogs';
import { AddLicenseCertDialog } from '@/views/vacancies/components/form-steps/add-license-certificate-dialog';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import {
  useTemplateFieldVisible,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import {
  useAddLicenseCertificateMutation,
  useCreateOrganizationMutation,
  useLicenseCertificatesForm,
  useLicenseCertificatesSearch,
  useOrganizationsSearch,
  useStepGuard,
  useTertiaryAwardingBodyLocationsSearch,
} from '@/views/vacancies/hooks';
import type { LicenseCertType, StepProps } from '@/views/vacancies/types';
import {
  formatDate,
  resolveUserCreatedOrganizations,
  toLicenseCertificatesPayload,
} from '@/views/vacancies/utils';
import {
  compareDates,
  formatLocalDate,
  getHundredYearDateBoundaries,
} from '@/views/vacancies/utils/date-timezone-safe';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
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
const {
  today: TODAY,
  minDate: HUNDRED_YEARS_AGO,
  maxDate: HUNDRED_YEARS_FROM_NOW,
} = getHundredYearDateBoundaries();

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function LicenseCertificatesStep({
  onNext,
  onBack,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const isFieldVisible = useTemplateFieldVisible('licensesAndCertifications');
  const {
    form: vacancyForm,
    setForm,
    onCancel,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
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
    setValue('entry.issuingOrganization', []);
    setValue('entry.organizationLocations', []);
    setValue('entry.internationallyAccepted', false);
    setValue('entry.issueDate', '');
    setValue('entry.expirationDate', '');
  };

  const hasEntryData = (): boolean => {
    const e = getValues('entry');
    return Boolean(
      e.nameOfLicenseCert.length > 0 ||
      e.issuingOrganization.length > 0 ||
      e.organizationLocations.length > 0 ||
      e.internationallyAccepted === true ||
      !!e.issueDate ||
      !!e.expirationDate
    );
  };

  const checkHasFilledData = (): boolean => {
    return hasEntryData() || getValues('dataTakenFromCandidate') === true;
  };

  const hasUnresolvedPendingLicenses = (): boolean => {
    return getValues('entry.nameOfLicenseCert').some(item => {
      return (
        item.source === 'PENDING_TEMP' ||
        item.value.startsWith('__pending_license_cert_')
      );
    });
  };

  const extractPendingId = (result: unknown): string => {
    const direct =
      typeof result === 'object' && result !== null && 'pendingId' in result
        ? (result as { pendingId?: unknown }).pendingId
        : undefined;

    if (typeof direct === 'string' && direct.trim().length > 0) {
      return direct;
    }

    const level1 =
      typeof result === 'object' && result !== null && 'data' in result
        ? (result as { data?: unknown }).data
        : undefined;

    const level1Pending =
      typeof level1 === 'object' && level1 !== null && 'pendingId' in level1
        ? (level1 as { pendingId?: unknown }).pendingId
        : undefined;

    if (typeof level1Pending === 'string' && level1Pending.trim().length > 0) {
      return level1Pending;
    }

    const level2 =
      typeof level1 === 'object' && level1 !== null && 'data' in level1
        ? (level1 as { data?: unknown }).data
        : undefined;

    const level2Pending =
      typeof level2 === 'object' && level2 !== null && 'pendingId' in level2
        ? (level2 as { pendingId?: unknown }).pendingId
        : undefined;

    if (typeof level2Pending === 'string' && level2Pending.trim().length > 0) {
      return level2Pending;
    }

    return '';
  };

  const shouldDisableNavigation =
    isEnabled && !dataTakenFromCandidate && !hasEntryData();

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

  // ── Creatable input tracking (for character count) ──────────────────────
  const [nameOfLicenseCertInput, setNameOfLicenseCertInput] = useState('');

  // ── Add License/Cert dialog state ────────────────────────────────────────
  const addLicenseCertMutation = useAddLicenseCertificateMutation();
  const { mutateAsync: createOrganization } = useCreateOrganizationMutation();
  const pendingLicenseCertsDataRef = useRef<
    Map<string, { displayValue: string; certType: LicenseCertType }>
  >(new Map());
  const licenseCertsSnapshotRef = useRef<
    { value: string; label: string; source: string; certType?: string }[]
  >([]);
  const organizationsSnapshotRef = useRef<
    { value: string; label: string; source: string }[]
  >([]);
  const [addLicenseCertDialogOpen, setAddLicenseCertDialogOpen] =
    useState(false);
  const [pendingLicenseCertLabel, setPendingLicenseCertLabel] = useState('');
  const [licenseCertSelectorKey, setLicenseCertSelectorKey] = useState(0);
  const [organizationSelectorKey, setOrganizationSelectorKey] = useState(0);

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

  // ── Organization search ────────────────────────────────────────────────
  const searchOrganizations = useOrganizationsSearch();
  const [showAddOrganizationDialog, setShowAddOrganizationDialog] =
    useState(false);
  const [pendingOrganizationName, setPendingOrganizationName] = useState('');

  // ── Async search hooks ───────────────────────────────────────────────────
  const searchLicenseCerts = useLicenseCertificatesSearch();
  const searchLocations = useTertiaryAwardingBodyLocationsSearch();

  // ── Resolve pending license/cert and advance ─────────────────────────────
  const resolveAndCommitLicenseCerts = async (): Promise<boolean> => {
    const current = getValues('entry.nameOfLicenseCert');
    const resolved: {
      value: string;
      label: string;
      source: string;
      certType?: string;
    }[] = [];
    let hasResolutionError = false;

    for (const item of current) {
      // A newly-added entry needs resolution when it is still marked
      // PENDING_TEMP or still carries a temporary value. The source can be
      // normalized to PENDING when the step is persisted on navigation (see
      // toLicenseCertificatesPayload), so the temp-value prefix is checked too —
      // otherwise a return visit would leave the temp id unresolved and trigger
      // the "changes could not be saved" error on Next.
      const isUnresolvedPending =
        item.source === 'PENDING_TEMP' ||
        item.value.startsWith('__pending_license_cert_');
      if (isUnresolvedPending) {
        const pendingData = pendingLicenseCertsDataRef.current.get(
          item.value
        ) ?? {
          displayValue: item.label,
          certType:
            item.certType === 'LICENSE' ||
            item.certType === 'CERTIFICATION' ||
            item.certType === 'CERTIFICATE'
              ? item.certType
              : 'CERTIFICATE',
        };
        if (pendingData) {
          try {
            const result = await addLicenseCertMutation.mutateAsync({
              type: pendingData.certType,
              displayValue: pendingData.displayValue,
            });

            const pendingId = extractPendingId(result);

            if (!pendingId) {
              hasResolutionError = true;
              continue;
            }

            resolved.push({
              value: pendingId,
              label: item.label,
              source: 'PENDING',
              certType: pendingData.certType,
            });
            pendingLicenseCertsDataRef.current.delete(item.value);
          } catch (error) {
            hasResolutionError = true;
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
    return !hasResolutionError;
  };

  const resolveAndCommitOrganizations = async (): Promise<boolean> => {
    const currentOrganizations = getValues('entry.issuingOrganization');
    const hasUserCreatedOrganizations = currentOrganizations.some(
      organization => organization.source === 'USER_CREATED'
    );

    if (!hasUserCreatedOrganizations) {
      return true;
    }

    try {
      const resolved = await resolveUserCreatedOrganizations(
        [{ associatedOrganizations: currentOrganizations }],
        createOrganization
      );

      const resolvedOrganizations =
        resolved[0]?.associatedOrganizations ?? currentOrganizations;

      setValue('entry.issuingOrganization', resolvedOrganizations);

      return resolvedOrganizations.every(
        organization => organization.source !== 'USER_CREATED'
      );
    } catch {
      return false;
    }
  };

  const handleNext = async () => {
    const resolveOrganizationsSuccess = await resolveAndCommitOrganizations();
    if (!resolveOrganizationsSuccess) {
      ErrorToast({
        title: t('notifications.apiError.save.title'),
        description: t('notifications.apiError.save.message'),
      });
      return;
    }

    const resolveSuccess = await resolveAndCommitLicenseCerts();
    if (!resolveSuccess || hasUnresolvedPendingLicenses()) {
      ErrorToast({
        title: t('notifications.apiError.save.title'),
        description: t('notifications.apiError.save.message'),
      });
      return;
    }

    if (isEnabled && !dataTakenFromCandidate && !hasEntryData()) {
      setEmptyDisableOpen(true);
      return;
    }

    const values = getValues();
    onNext({ licenseCertificates: toLicenseCertificatesPayload(values) });
  };

  const handleBack = () => {
    setForm(prev => ({
      ...prev,
      licenseCertificates: toLicenseCertificatesPayload(getValues()),
    }));
    onBack();
  };

  return (
    <Form {...form}>
      <div
        data-testid="licenseCertificates-section-form"
        className="flex flex-col"
      >
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
              disabled={shouldDisableNavigation}
              className="cursor-pointer text-slate-700 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleBack}
            >
              <ArrowLeft2 size={24} />
            </button>
            <h2
              data-testid="licenseCertificates-header-label"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              {t('licenseCertificates.title')}
            </h2>
            {mode === 'edit' && vacancyForm.status ? (
              <VacancyStatusBadge status={vacancyForm.status} />
            ) : null}
          </div>
          <Controller
            control={control}
            name="isEnabled"
            render={({ field }) => (
              <Switch
                checked={field.value}
                size="lg"
                data-testid="toggle-on-off-switch"
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

        <div
          className={cn(
            'flex items-start gap-3 px-7 pb-8',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
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
            data-testid="licenseCertificates-collectFromCandidates-label"
            className="cursor-pointer leading-snug wrap-break-word"
          >
            {t('licenseCertificates.collectFromCandidates')}
          </Label>
        </div>

        <div className="flex flex-col gap-4 px-6">
          {/* ── License and Certificate Card ─────────────────────────────── */}
          <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-5">
              <h3
                data-testid="licenseCertificates-sectionTitle-label"
                className="text-sm font-semibold text-slate-900"
              >
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
                {isFieldVisible('nameOfLicenseCert') && (
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <Label
                        data-testid="licenseCertificates-nameOfLicenseCert-label"
                        className="shrink-0"
                      >
                        {t('licenseCertificates.nameOfLicenseCert')}
                      </Label>
                      <CharacterCount
                        currentLength={nameOfLicenseCertInput.length}
                        maxLength={200}
                      />
                    </div>
                    <Controller
                      control={control}
                      name="entry.nameOfLicenseCert"
                      render={({ field }) => (
                        <MultipleSelector
                          key={licenseCertSelectorKey}
                          value={field.value}
                          onSearch={async (search: string) => {
                            const results = await searchLicenseCerts(search);
                            // Filter out items already selected to prevent duplication
                            // Use label + type for case-insensitive matching (you can have "AWS" as LICENSE and CERTIFICATION)
                            const selectedItems = new Set(
                              field.value.map(
                                v =>
                                  `${v.label.toLowerCase()}|${v.certType || 'certificate'}`
                              )
                            );
                            return results.filter(
                              item =>
                                !selectedItems.has(
                                  `${item.label.toLowerCase()}|${item.certType || 'certificate'}`
                                )
                            );
                          }}
                          onChange={options => {
                            if (options.length > MAX_SELECTIONS) {
                              setMax('nameOfLicenseCert');
                              return;
                            }
                            if (options.length <= MAX_SELECTIONS)
                              clearMax('nameOfLicenseCert');
                            setNameOfLicenseCertInput('');
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
                          inputProps={{
                            maxLength: 200,
                            onValueChange: val =>
                              setNameOfLicenseCertInput(val),
                          }}
                          placeholder={t(
                            'licenseCertificates.placeholders.nameOfLicenseCert'
                          )}
                        />
                      )}
                    />
                  </div>
                )}

                {isFieldVisible('issuingOrganization') && (
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex h-5 items-center">
                      <Label
                        data-testid="licenseCertificates-issuingOrganization-label"
                        className="shrink-0"
                      >
                        {t('licenseCertificates.issuingOrganization')}
                      </Label>
                    </div>
                    <Controller
                      control={control}
                      name="entry.issuingOrganization"
                      render={({ field }) => (
                        <MultipleSelector
                          key={organizationSelectorKey}
                          value={field.value}
                          onSearch={async (search: string) => {
                            const results = await searchOrganizations(search);
                            // Filter out items already selected to prevent duplication
                            // Use label (name) instead of value (ID) for case-insensitive matching
                            const selectedLabels = new Set(
                              field.value.map(v => v.label.toLowerCase())
                            );
                            return results.filter(
                              item =>
                                !selectedLabels.has(item.label.toLowerCase())
                            );
                          }}
                          onChange={options => {
                            if (options.length > MAX_SELECTIONS) {
                              setMax('issuingOrganization');
                              return;
                            }
                            if (options.length < MAX_SELECTIONS) {
                              clearMax('issuingOrganization');
                            }

                            const newItem = options.find(
                              o => o.value === o.label
                            );
                            if (newItem) {
                              organizationsSnapshotRef.current = getValues(
                                'entry.issuingOrganization'
                              );
                              setPendingOrganizationName(newItem.label);
                              setShowAddOrganizationDialog(true);
                              return;
                            }

                            field.onChange(options);
                          }}
                          maxSelected={MAX_SELECTIONS}
                          onMaxSelected={() => setMax('issuingOrganization')}
                          errorMessage={
                            maxReachedFields.has('issuingOrganization')
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
                            'licenseCertificates.placeholders.issuingOrganization'
                          )}
                        />
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Row 2: Organization Location | Issue Date | Expiration Date */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {isFieldVisible('organizationLocations') && (
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex h-5 items-center">
                      <Label
                        data-testid="licenseCertificates-organizationLocations-label"
                        className="shrink-0"
                      >
                        {t('licenseCertificates.organizationLocations')}
                      </Label>
                    </div>
                    <Controller
                      control={control}
                      name="entry.organizationLocations"
                      render={({ field }) => (
                        <MultipleSelector
                          value={field.value}
                          onSearch={async (search: string) => {
                            const results = await searchLocations(search);
                            // Filter out items already selected to prevent duplication
                            // Use label (location name) instead of value (ID) for case-insensitive matching
                            const selectedLabels = new Set(
                              field.value.map(v => v.label.toLowerCase())
                            );
                            return results.filter(
                              item =>
                                !selectedLabels.has(item.label.toLowerCase())
                            );
                          }}
                          onChange={options => {
                            if (options.length > MAX_SELECTIONS) {
                              setMax('organizationLocations');
                              return;
                            }
                            if (options.length <= MAX_SELECTIONS)
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
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Issue Date */}
                  {isFieldVisible('issueDate') && (
                    <FormField
                      control={control}
                      name="entry.issueDate"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col gap-1 space-y-0">
                          <div className="flex h-5 items-center">
                            <FormLabel data-testid="licenseCertificates-issueDate-label">
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                defaultMonth={
                                  field.value
                                    ? new Date(field.value)
                                    : new Date()
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
                                    compareDates(expDate, date) < 0
                                  ) {
                                    setValue('entry.expirationDate', undefined);
                                  }
                                }}
                                disabled={date =>
                                  date < HUNDRED_YEARS_AGO || date > TODAY
                                }
                                captionLayout="dropdown"
                                startMonth={HUNDRED_YEARS_AGO}
                                endMonth={TODAY}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Expiration Date */}
                  {isFieldVisible('expirationDate') && (
                    <FormField
                      control={control}
                      name="entry.expirationDate"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col gap-1 space-y-0">
                          <div className="flex h-5 items-center">
                            <FormLabel data-testid="licenseCertificates-expirationDate-label">
                              {t('licenseCertificates.expirationDate')}
                            </FormLabel>
                          </div>
                          <Popover
                            modal
                            open={openDatePopover === 'expirationDate'}
                            onOpenChange={open =>
                              setOpenDatePopover(
                                !fieldsDisabled && open
                                  ? 'expirationDate'
                                  : null
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
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
                                  date < HUNDRED_YEARS_AGO ||
                                  date > HUNDRED_YEARS_FROM_NOW ||
                                  (issueDateValue
                                    ? compareDates(date, issueDateValue) < 0
                                    : false)
                                }
                                captionLayout="dropdown"
                                startMonth={HUNDRED_YEARS_AGO}
                                endMonth={HUNDRED_YEARS_FROM_NOW}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Row 3: Internationally accepted (full width) */}
              {isFieldVisible('internationallyAccepted') && (
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
                    data-testid="licenseCertificates-internationallyAccepted-label"
                    className="cursor-pointer leading-snug wrap-break-word"
                  >
                    {t('licenseCertificates.internationallyAccepted')}
                  </Label>
                </div>
              )}
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
          onOpenChange={open => {
            setShowAddOrganizationDialog(open);
            if (!open) {
              setPendingOrganizationName('');
              organizationsSnapshotRef.current = [];
              setOrganizationSelectorKey(k => k + 1);
            }
          }}
          organizationName={pendingOrganizationName}
          onOrganizationAdded={org => {
            // Validation guard: only add if organization name is provided
            if (!org.name || !org.name.trim()) {
              return;
            }

            const currentOrganizations = getValues('entry.issuingOrganization');

            // Check for case-insensitive duplicate: same name
            const normalizedNewLabel = org.name.trim().toLowerCase();
            const isDuplicate = currentOrganizations.some(
              organization =>
                organization.label.trim().toLowerCase() === normalizedNewLabel
            );

            if (isDuplicate) {
              // Item already exists, don't add
              setShowAddOrganizationDialog(false);
              setPendingOrganizationName('');
              setOrganizationSelectorKey(k => k + 1);
              return;
            }

            if (currentOrganizations.length >= MAX_SELECTIONS) {
              setMax('issuingOrganization');
              setShowAddOrganizationDialog(false);
              return;
            }

            setValue('entry.issuingOrganization', [
              ...currentOrganizations,
              {
                value: org.id,
                label: org.name,
                source: org.source,
              },
            ]);

            clearMax('issuingOrganization');

            organizationsSnapshotRef.current = [];
            setPendingOrganizationName('');
            setOrganizationSelectorKey(k => k + 1);
            setShowAddOrganizationDialog(false);
          }}
        />

        {/* ── Add License/Cert dialog ──────────────────────────────────────── */}
        <AddLicenseCertDialog
          open={addLicenseCertDialogOpen}
          initialName={pendingLicenseCertLabel}
          onClose={() => {
            setPendingLicenseCertLabel('');
            setLicenseCertSelectorKey(k => k + 1);
            licenseCertsSnapshotRef.current = [];
            setAddLicenseCertDialogOpen(false);
          }}
          onAdded={option => {
            // Validation guard: only add if name and type are provided
            if (!option.label || !option.certType) {
              return;
            }

            const baseItems =
              licenseCertsSnapshotRef.current.length > 0
                ? licenseCertsSnapshotRef.current
                : getValues('entry.nameOfLicenseCert');

            const normalizedNewLabel = option.label.trim().toLowerCase();
            const deduped = baseItems.filter(item => {
              const sameLabel =
                item.label.trim().toLowerCase() === normalizedNewLabel;
              const sameType = (item.certType ?? '') === option.certType;
              return !(sameLabel && sameType);
            });

            if (deduped.length >= MAX_SELECTIONS) {
              setMax('nameOfLicenseCert');
              pendingLicenseCertsDataRef.current.delete(option.value);
              licenseCertsSnapshotRef.current = [];
              setPendingLicenseCertLabel('');
              setLicenseCertSelectorKey(k => k + 1);
              setAddLicenseCertDialogOpen(false);
              return;
            }

            pendingLicenseCertsDataRef.current.set(option.value, {
              displayValue: option.label,
              certType: option.certType,
            });

            setValue('entry.nameOfLicenseCert', [
              ...deduped,
              {
                value: option.value,
                label: option.label,
                source: option.source,
                certType: option.certType,
              },
            ]);

            clearMax('nameOfLicenseCert');

            licenseCertsSnapshotRef.current = [];
            setPendingLicenseCertLabel('');
            setLicenseCertSelectorKey(k => k + 1);
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
            removeCompletedStep(currentStepIndex);
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
          <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
            {t('licenseCertificates.cancel')}
          </Button>
          <Button
            className="h-12 w-48"
            disabled={shouldDisableNavigation}
            onClick={() => void handleNext()}
          >
            {t('licenseCertificates.next')}
          </Button>
        </div>
      </div>
    </Form>
  );
}
