import { Loader2, Plus } from 'lucide-react';

import { ArrowLeft2, Trash } from 'iconsax-reactjs';

import { useEffect, useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useQueryClient } from '@tanstack/react-query';

import MessageBox from '@/components/message-box';
import { StepDisableDialog, VacancyStatusBadge } from '@/views/vacancies';
import {
  useTemplateFieldVisible,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import {
  useDisableSuccessToast,
  useGendersQuery,
  useMaritalStatusesQuery,
  usePlacesCityQuery,
  usePlacesCountryQuery,
  usePlacesStateQuery,
  useProfileRequirementsForm,
  useStepGuard,
} from '@/views/vacancies/hooks';
import type { ProfileRequirementsFormValues } from '@/views/vacancies/hooks/use-profile-requirements-form';
import { placesService } from '@/views/vacancies/services';
import type { StepProps } from '@/views/vacancies/types';
import { sanitizePostalCodeText } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Combobox } from '@cgp/ui-kit/components/combobox';
import type { ComboboxOption } from '@cgp/ui-kit/components/combobox';
import { ErrorToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cgp/ui-kit/components/ui/select';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_ADDRESS_ENTRIES = 5;

/**
 * Field codes that make up the Addresses group. In the Use Template flow the
 * whole Addresses section (and its add button) is hidden when none of these are
 * enabled by the template — see `hasVisibleAddressField`.
 */
const ADDRESS_FIELD_CODES = [
  'cityRefId',
  'stateRefId',
  'countryRefId',
  'postalCode',
] as const;

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

/**
 * The places API returns the primary entity's label as a full
 * "City, State, Country" (or "State, Country") string, while saved values that
 * come back from the backend are already short. `shortLabel` normalises either
 * form down to just the leading segment (e.g. "Abbotsford") so the collapsed
 * combobox input shows only the city/state name, never the full breadcrumb.
 */
function shortLabel(label?: string): string {
  return (label ?? '').split(',')[0].trim();
}

/**
 * Builds the full "City, State, Country" breadcrumb label used for dropdown
 * items from the individual saved parts, so a prepended saved value matches the
 * richer format the search results use instead of showing only the city/state.
 */
function buildFullLabel(...parts: (string | undefined)[]): string {
  return parts.map(shortLabel).filter(Boolean).join(', ');
}

/**
 * Normalises a place entity into a `{ id, label }` option. The places API
 * returns a city's parent state/country (and a state's parent country) as
 * labels only, without an id. Falling back to the label as the id lets the
 * combobox still render and round-trip the auto-filled value; a later direct
 * state/country search replaces it with the real ref id.
 */
function toPlaceOption(item?: { id?: string; label?: string }): {
  id: string;
  label: string;
} {
  const label = item?.label ?? '';
  return { id: item?.id || label, label };
}

/**
 * Removes options that render the same breadcrumb label (case-insensitive),
 * keeping the first occurrence. This collapses a prepended saved value against
 * an identical search result so the dropdown never lists a duplicate entry.
 */
function dedupeOptions(options: ComboboxOption[]): ComboboxOption[] {
  const seenLabels = new Set<string>();
  return options.filter(option => {
    const key = option.label.trim().toLowerCase();
    if (seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });
}

function isDuplicateAddress(
  addresses: ProfileRequirementsFormValues['addresses'],
  newIndex: number
): boolean {
  const target = addresses[newIndex];
  if (!target) return false;
  const hasValue =
    target.city.id ||
    target.stateProvince.id ||
    target.country.id ||
    target.postalCode.trim();
  if (!hasValue) return false;
  return addresses.some(
    (addr, i) =>
      i !== newIndex &&
      addr.city.id === target.city.id &&
      addr.stateProvince.id === target.stateProvince.id &&
      addr.country.id === target.country.id &&
      addr.postalCode.trim() === target.postalCode.trim()
  );
}

function hasProfileRequirementsData(
  data: ProfileRequirementsFormValues
): boolean {
  return (
    data.gender.id !== '' ||
    data.maritalStatus.id !== '' ||
    data.addresses.some(
      a =>
        a.city.id !== '' ||
        a.stateProvince.id !== '' ||
        a.country.id !== '' ||
        a.postalCode.trim() !== ''
    )
  );
}

function AddressCard({
  index,
  displayNumber,
  form,
  onRemove,
  canRemove,
}: {
  index: number;
  displayNumber: number;
  form: UseFormReturn<ProfileRequirementsFormValues>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { t } = useTranslation('ats');
  const isFieldVisible = useTemplateFieldVisible('profileRequirement');
  const queryClient = useQueryClient();

  const [citySearch, setCitySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  // The places CITY endpoint returns a city's parent state/country as labels
  // only (no id), so the backend rejects the payload when those labels are sent
  // as `stateRefId`/`countryRefId`. These resolvers look the real ref id up from
  // the dedicated STATE/COUNTRY endpoints (reusing the react-query cache) and
  // fall back to the label only when no match is found.
  const resolveCountry = async (item?: {
    id?: string;
    label?: string;
  }): Promise<{ id: string; label: string }> => {
    if (item?.id) return { id: item.id, label: item.label ?? '' };
    const search = shortLabel(item?.label);
    if (!search) return { id: '', label: '' };
    try {
      const results = await queryClient.fetchQuery({
        queryKey: ['places', 'country', search],
        queryFn: () => placesService.getByCountry(search),
        staleTime: 5 * 60 * 1000,
      });
      const match =
        results.find(
          c =>
            shortLabel(c.country.label).toLowerCase() === search.toLowerCase()
        ) ?? results[0];
      if (match) return { id: match.country.id, label: match.country.label };
    } catch {
      // fall through to label-only fallback
    }
    return toPlaceOption(item);
  };

  const resolveState = async (
    item?: { id?: string; label?: string },
    countryLabel?: string
  ): Promise<{ id: string; label: string }> => {
    if (item?.id) return { id: item.id, label: item.label ?? '' };
    const search = shortLabel(item?.label);
    if (!search) return { id: '', label: '' };
    try {
      const results = await queryClient.fetchQuery({
        queryKey: ['places', 'state', search],
        queryFn: () => placesService.getByState(search),
        staleTime: 5 * 60 * 1000,
      });
      const country = shortLabel(countryLabel).toLowerCase();
      const match =
        results.find(
          s =>
            shortLabel(s.state.label).toLowerCase() === search.toLowerCase() &&
            (!country || shortLabel(s.country.label).toLowerCase() === country)
        ) ??
        results.find(
          s => shortLabel(s.state.label).toLowerCase() === search.toLowerCase()
        ) ??
        results[0];
      if (match) return { id: match.state.id, label: match.state.label };
    } catch {
      // fall through to label-only fallback
    }
    return toPlaceOption(item);
  };

  const isEnabled = form.watch('isEnabled');
  const dataTakenFromCandidate = form.watch('dataTakenFromCandidate');
  const isDisabled = !isEnabled || dataTakenFromCandidate;

  const checkDuplicate = () => {
    const addresses = form.getValues('addresses');
    if (isDuplicateAddress(addresses, index)) {
      ErrorToast({
        title: 'Error',
        description: t(
          'profileRequirements.errors.duplicateEntry',
          'This entry already exists.'
        ),
      });
      // Clear the duplicate entry fields
      form.setValue(`addresses.${index}.city`, { id: '', label: '' });
      form.setValue(`addresses.${index}.stateProvince`, { id: '', label: '' });
      form.setValue(`addresses.${index}.country`, { id: '', label: '' });
      form.setValue(`addresses.${index}.postalCode`, '');
    }
  };

  // Search the places endpoints with the leading segment only (the city/state
  // name), so pasting a full "City, State, Country" breadcrumb still hits the
  // canonical name-based lookup. Searching with the full breadcrumb makes the
  // backend fall back to a geocode match that returns a different (Google Place)
  // id for the same place, producing inconsistent `cityRefId`s across entries.
  const { data: cityData = [], isFetching: isCityLoading } = usePlacesCityQuery(
    shortLabel(citySearch)
  );
  const { data: stateData = [], isFetching: isStateLoading } =
    usePlacesStateQuery(shortLabel(stateSearch));
  const { data: countryData = [], isFetching: isCountryLoading } =
    usePlacesCountryQuery(shortLabel(countrySearch));

  const cityValue = form.watch(`addresses.${index}.city`);
  const stateValue = form.watch(`addresses.${index}.stateProvince`);
  const countryValue = form.watch(`addresses.${index}.country`);

  const cityOptions: ComboboxOption[] = dedupeOptions([
    ...(cityValue?.id && !cityData.some(c => c.city.id === cityValue.id)
      ? [
          {
            value: cityValue.id,
            label: buildFullLabel(
              cityValue.label,
              stateValue?.label,
              countryValue?.label
            ),
          },
        ]
      : []),
    ...cityData.map(c => ({
      value: c.city.id,
      label: buildFullLabel(c.city.label, c.state?.label, c.country.label),
    })),
  ]);

  const stateOptions: ComboboxOption[] = dedupeOptions([
    ...(stateValue?.id && !stateData.some(s => s.state.id === stateValue.id)
      ? [
          {
            value: stateValue.id,
            label: buildFullLabel(stateValue.label, countryValue?.label),
          },
        ]
      : []),
    ...stateData.map(s => ({
      value: s.state.id,
      label: buildFullLabel(s.state.label, s.country.label),
    })),
  ]);

  const countryOptions: ComboboxOption[] = [
    ...(countryValue?.id &&
    !countryData.some(co => co.country.id === countryValue.id)
      ? [{ value: countryValue.id, label: countryValue.label }]
      : []),
    ...countryData.map(co => ({
      value: co.country.id,
      label: co.country.label,
    })),
  ];

  const handleCitySelect = (val: string) => {
    const r = cityData.find(c => c.city.id === val);
    if (!r) return;
    form.setValue(`addresses.${index}.city`, toPlaceOption(r.city), {
      shouldValidate: true,
    });
    // Show the labels immediately, then swap in the real ref ids once resolved
    // so the payload carries ids rather than the label-only fallback.
    form.setValue(`addresses.${index}.stateProvince`, toPlaceOption(r.state), {
      shouldValidate: true,
    });
    form.setValue(`addresses.${index}.country`, toPlaceOption(r.country), {
      shouldValidate: true,
    });
    void (async () => {
      const [state, country] = await Promise.all([
        resolveState(r.state, r.country?.label),
        resolveCountry(r.country),
      ]);
      form.setValue(`addresses.${index}.stateProvince`, state, {
        shouldValidate: true,
      });
      form.setValue(`addresses.${index}.country`, country, {
        shouldValidate: true,
      });
      // Real-time duplicate check after all fields are set
      checkDuplicate();
    })();
  };

  const handleStateSelect = (val: string) => {
    const r = stateData.find(s => s.state.id === val);
    if (!r) return;
    form.setValue(`addresses.${index}.stateProvince`, toPlaceOption(r.state), {
      shouldValidate: true,
    });
    form.setValue(`addresses.${index}.country`, toPlaceOption(r.country), {
      shouldValidate: true,
    });
    void (async () => {
      const country = await resolveCountry(r.country);
      form.setValue(`addresses.${index}.country`, country, {
        shouldValidate: true,
      });
      checkDuplicate();
    })();
  };

  const handleCountrySelect = (val: string) => {
    const r = countryData.find(co => co.country.id === val);
    if (!r) return;
    form.setValue(
      `addresses.${index}.country`,
      { id: r.country.id, label: r.country.label },
      { shouldValidate: true }
    );
    setTimeout(() => checkDuplicate(), 0);
  };

  return (
    <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-5">
        <span
          data-testid={`profileRequirements-addressTitle-${index}-label`}
          className="text-base font-bold text-slate-900"
        >
          {t('profileRequirements.addressTitle', {
            number: String(displayNumber).padStart(2, '0'),
          })}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove || isDisabled}
            className={cn(
              'text-slate-900 transition-colors hover:text-red-500',
              (!canRemove || isDisabled) && 'hidden'
            )}
            aria-label={t('profileRequirements.removeAddress')}
          >
            <Trash size={24} />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="quad-profile:grid-cols-4 grid grid-cols-1 gap-5 px-5 pb-5 xl:grid-cols-2">
        {/* City */}
        {isFieldVisible('cityRefId') && (
          <FormField
            control={form.control}
            name={`addresses.${index}.city`}
            render={({ field, fieldState }) => (
              <FormItem className="flex min-w-0 flex-col gap-1.5 space-y-0">
                <FormLabel
                  data-testid={`profileRequirements-city-${index}-label`}
                  className="text-sm font-semibold text-slate-900"
                >
                  {t('profileRequirements.city')}
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={cityOptions}
                    value={field.value?.id ?? ''}
                    selectedLabel={
                      field.value?.label
                        ? buildFullLabel(
                            field.value.label,
                            stateValue?.label,
                            countryValue?.label
                          )
                        : undefined
                    }
                    onValueChange={handleCitySelect}
                    onSearchChange={setCitySearch}
                    loading={isCityLoading}
                    disabled={isDisabled}
                    placeholder={t('profileRequirements.cityPlaceholder')}
                    addable={false}
                    isError={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* State / Province / Region */}
        {isFieldVisible('stateRefId') && (
          <FormField
            control={form.control}
            name={`addresses.${index}.stateProvince`}
            render={({ field, fieldState }) => (
              <FormItem className="flex min-w-0 flex-col gap-1.5 space-y-0">
                <FormLabel
                  data-testid={`profileRequirements-stateProvince-${index}-label`}
                  className="text-sm font-semibold text-slate-900"
                >
                  {t('profileRequirements.stateProvince')}
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={stateOptions}
                    value={field.value?.id ?? ''}
                    selectedLabel={
                      field.value?.label
                        ? buildFullLabel(field.value.label, countryValue?.label)
                        : undefined
                    }
                    onValueChange={handleStateSelect}
                    onSearchChange={setStateSearch}
                    loading={isStateLoading}
                    disabled={isDisabled}
                    placeholder={t(
                      'profileRequirements.stateProvincePlaceholder'
                    )}
                    addable={false}
                    isError={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Country */}
        {isFieldVisible('countryRefId') && (
          <FormField
            control={form.control}
            name={`addresses.${index}.country`}
            render={({ field, fieldState }) => (
              <FormItem className="flex min-w-0 flex-col gap-1.5 space-y-0">
                <FormLabel
                  data-testid={`profileRequirements-country-${index}-label`}
                  className="text-sm font-semibold text-slate-900"
                >
                  {t('profileRequirements.country')}
                </FormLabel>
                <FormControl>
                  <Combobox
                    options={countryOptions}
                    value={field.value?.id ?? ''}
                    onValueChange={handleCountrySelect}
                    onSearchChange={setCountrySearch}
                    loading={isCountryLoading}
                    disabled={isDisabled}
                    placeholder={t('profileRequirements.countryPlaceholder')}
                    addable={false}
                    isError={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Postal Code / Zip */}
        {isFieldVisible('postalCode') && (
          <FormField
            control={form.control}
            name={`addresses.${index}.postalCode`}
            render={({ field }) => (
              <FormItem className="flex min-w-0 flex-col gap-1.5 space-y-0">
                <FormLabel
                  data-testid={`profileRequirements-postalCode-${index}-label`}
                  className="flex justify-between text-sm font-semibold text-slate-900"
                >
                  <span>{t('profileRequirements.postalCode')}</span>
                  <CharacterCount
                    maxLength={20}
                    currentLength={field.value?.length ?? 0}
                  />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('profileRequirements.postalCodePlaceholder')}
                    maxLength={20}
                    disabled={isDisabled}
                    className="h-11 shadow-none"
                    {...field}
                    onChange={e => {
                      const sanitized = sanitizePostalCodeText(e.target.value);
                      field.onChange(sanitized.trimStart());
                    }}
                    onBlur={() => {
                      field.onBlur();
                      checkDuplicate();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}

export default function ProfileRequirementsStep({ onNext, onBack }: StepProps) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const isFieldVisible = useTemplateFieldVisible('profileRequirement');
  // In the Use Template flow, hide the entire Addresses group (and its add
  // button) when the template enabled none of the address fields.
  const hasVisibleAddressField = ADDRESS_FIELD_CODES.some(code =>
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
  const { form, fields, append, remove, replace } = useProfileRequirementsForm(
    contextForm.profileRequirements
  );

  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: gendersResponse } = useGendersQuery();
  const gendersData = gendersResponse?.data?.items?.content ?? [];

  const { data: maritalStatusesResponse } = useMaritalStatusesQuery();
  const maritalStatusesData =
    maritalStatusesResponse?.data?.items?.content ?? [];

  const isEnabled = form.watch('isEnabled');
  const dataTakenFromCandidate = form.watch('dataTakenFromCandidate');
  const genderValue = form.watch('gender');
  const maritalStatusValue = form.watch('maritalStatus');
  const addressEntries = form.watch('addresses');

  useStepGuard(
    isEnabled &&
      !dataTakenFromCandidate &&
      !genderValue?.id &&
      !maritalStatusValue?.id &&
      !addressEntries.some(
        a =>
          !!a.city.id ||
          !!a.stateProvince.id ||
          !!a.country.id ||
          !!a.postalCode.trim()
      )
  );
  useEffect(() => {
    stepPersistRef.current = () => {
      const values = form.getValues();
      setForm(prev => ({
        ...prev,
        profileRequirements: {
          isEnabled: values.isEnabled,
          dataTakenFromCandidate: values.dataTakenFromCandidate,
          gender: values.gender ?? { id: '', label: '' },
          maritalStatus: values.maritalStatus ?? { id: '', label: '' },
          addresses: values.addresses ?? [],
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
        profileRequirements: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          gender: { id: '', label: '' },
          maritalStatus: { id: '', label: '' },
          addresses: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  const canNavigate =
    !isEnabled ||
    dataTakenFromCandidate ||
    hasProfileRequirementsData(form.getValues());

  const isFieldsDisabled = !isEnabled || dataTakenFromCandidate;

  const handleConfirmDisable = () => {
    form.setValue('isEnabled', false);
    form.setValue('dataTakenFromCandidate', false);
    form.setValue('gender', { id: '', label: '' });
    form.setValue('maritalStatus', { id: '', label: '' });
    replace([
      {
        city: { id: '', label: '' },
        stateProvince: { id: '', label: '' },
        country: { id: '', label: '' },
        postalCode: '',
        isOpen: true,
      },
    ]);
    removeCompletedStep(currentStepIndex);
    setShowDisableConfirm(false);
    showDisableToast(t('profileRequirements.title'));
  };

  const handleConfirmEmptyData = () => {
    form.setValue('gender', { id: '', label: '' });
    form.setValue('maritalStatus', { id: '', label: '' });
    replace([
      {
        city: { id: '', label: '' },
        stateProvince: { id: '', label: '' },
        country: { id: '', label: '' },
        postalCode: '',
        isOpen: true,
      },
    ]);
    setShowEmptyConfirm(false);
    onNext({
      profileRequirements: {
        isEnabled: false,
        dataTakenFromCandidate: form.getValues('dataTakenFromCandidate'),
        gender: { id: '', label: '' },
        maritalStatus: { id: '', label: '' },
        addresses: [],
      },
    });
  };

  const handleSubmit = (data: ProfileRequirementsFormValues) => {
    if (data.isEnabled && !data.dataTakenFromCandidate) {
      const hasData = hasProfileRequirementsData(data);
      if (!hasData) {
        setShowEmptyConfirm(true);
        return;
      }

      // Check for duplicate address entries on submit too
      for (let i = 0; i < data.addresses.length; i++) {
        if (isDuplicateAddress(data.addresses, i)) {
          ErrorToast({
            title: 'Error',
            description: t(
              'profileRequirements.errors.duplicateEntry',
              'This entry already exists.'
            ),
          });
          // Clear all fields in the duplicate address entry
          form.setValue(`addresses.${i}.city`, { id: '', label: '' });
          form.setValue(`addresses.${i}.stateProvince`, { id: '', label: '' });
          form.setValue(`addresses.${i}.country`, { id: '', label: '' });
          form.setValue(`addresses.${i}.postalCode`, '');
          return;
        }
      }
    }

    // NOTE(Edit Profile Requirements): backend update API integration point
    // Endpoint: /v1/candidates/{candidate_id}/profile-basic-informations
    // Service scaffold: candidateProfileService.updateProfileBasicInformations(...)
    // Mutation scaffold: useUpdateCandidateProfileBasicInformationsMutation()
    // Keep runtime call disabled until candidate id source and payload mapping are finalized.

    setIsSubmitting(true);
    try {
      onNext({
        profileRequirements: {
          isEnabled: data.isEnabled,
          dataTakenFromCandidate: data.dataTakenFromCandidate,
          gender: data.gender,
          maritalStatus: data.maritalStatus,
          addresses: data.addresses,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleBack = () => {
    if (!canNavigate || isSubmitting) {
      return;
    }

    stepPersistRef.current?.();
    onBack();
  };

  const handleDataTakenFromCandidateChange = (checked: boolean) => {
    if (checked) {
      form.setValue('gender', { id: '', label: '' });
      form.setValue('maritalStatus', { id: '', label: '' });
      replace([
        {
          city: { id: '', label: '' },
          stateProvince: { id: '', label: '' },
          country: { id: '', label: '' },
          postalCode: '',
          isOpen: true,
        },
      ]);
    }
    form.setValue('dataTakenFromCandidate', checked);
  };

  return (
    <>
      <style>{`
        div[data-radix-popper-content-wrapper] img[alt="common.noData"],
        div[data-radix-popper-content-wrapper] img[alt="No results found"] {
          content: url("${multiSelectInfoAvatar}") !important;
        }
      `}</style>
      <Form {...form}>
        <form
          data-testid="profileRequirements-section-form"
          onSubmit={e => {
            void form.handleSubmit(handleSubmit)(e);
          }}
          className="flex flex-1 flex-col"
        >
          <MessageBox
            fields={[
              t('profileRequirements.fieldList.title'),
              t('profileRequirements.fieldList.firstName'),
              t('profileRequirements.fieldList.lastName'),
              t('profileRequirements.fieldList.email'),
              t('profileRequirements.fieldList.numberType'),
              t('profileRequirements.fieldList.primaryPhoneNumber'),
              t('profileRequirements.fieldList.permanentAddressDetails'),
              t('profileRequirements.fieldList.currentAddressDetails'),
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
                aria-label={t('profileRequirements.back')}
              >
                <ArrowLeft2 size={24} />
              </button>
              <h2
                data-testid="profileRequirements-header-label"
                className="text-xl font-bold tracking-tight text-slate-900"
              >
                {t('profileRequirements.title')}
              </h2>
              <VacancyStatusBadge
                status={contextForm.status}
                applicantCount={contextForm.applicantCount}
              />
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
                      const gender = form.getValues('gender');
                      const maritalStatus = form.getValues('maritalStatus');
                      const addresses = form.getValues('addresses');
                      const hasData =
                        gender.id !== '' ||
                        maritalStatus.id !== '' ||
                        addresses.some(
                          a =>
                            a.city.id !== '' ||
                            a.stateProvince.id !== '' ||
                            a.country.id !== '' ||
                            a.postalCode !== ''
                        );
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
                      handleDataTakenFromCandidateChange(checked as boolean);
                    }}
                  />
                  <label
                    htmlFor="data-from-candidate"
                    data-testid="profileRequirements-dataTakenFromCandidate-label"
                    className="cursor-pointer text-sm font-medium text-slate-900"
                  >
                    {t('profileRequirements.dataTakenFromCandidate')}
                  </label>
                </>
              )}
            />
          </div>

          {/* Gender & Marital Status */}
          <div className="grid grid-cols-1 gap-5 px-7 pb-8 xl:grid-cols-2">
            {/* Gender */}
            {isFieldVisible('gender') && (
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="flex min-w-0 flex-col gap-1 space-y-0">
                    <FormLabel
                      data-testid="profileRequirements-gender-label"
                      className="text-sm font-semibold text-slate-900"
                    >
                      {t('profileRequirements.gender')}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.id ?? ''}
                        onValueChange={val => {
                          const found = gendersData.find(g => g.id === val);
                          if (found) {
                            field.onChange({
                              id: found.id,
                              label: found.label,
                            });
                          }
                        }}
                        disabled={isFieldsDisabled}
                      >
                        <SelectTrigger className="!h-11 w-full bg-white shadow-none">
                          <SelectValue
                            placeholder={t(
                              'profileRequirements.genderPlaceholder'
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {gendersData.map(g => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Marital Status */}
            {isFieldVisible('maritalStatus') && (
              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem className="flex min-w-0 flex-col gap-1 space-y-0">
                    <FormLabel
                      data-testid="profileRequirements-maritalStatus-label"
                      className="text-sm font-semibold text-slate-900"
                    >
                      {t('profileRequirements.maritalStatus')}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.id ?? ''}
                        onValueChange={val => {
                          const found = maritalStatusesData.find(
                            ms => ms.id === val
                          );
                          if (found) {
                            field.onChange({
                              id: found.id,
                              label: found.label,
                            });
                          }
                        }}
                        disabled={isFieldsDisabled}
                      >
                        <SelectTrigger className="!h-11 w-full bg-white shadow-none">
                          <SelectValue
                            placeholder={t(
                              'profileRequirements.maritalStatusPlaceholder'
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {maritalStatusesData.map(ms => (
                            <SelectItem key={ms.id} value={ms.id}>
                              {ms.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Addresses group — hidden when the template enabled no address field. */}
          {hasVisibleAddressField && (
            <>
              {/* Addresses section header */}
              <div className="px-7 pt-6 pb-2">
                <h3
                  data-testid="profileRequirements-addressesTitle-label"
                  className="text-base font-bold text-slate-900"
                >
                  {t('profileRequirements.addressesTitle')}
                </h3>
                <p className="text-sm text-slate-500">
                  {t('profileRequirements.addressesDescription')}
                </p>
              </div>

              {/* Address cards - reverse chronological order (newest first) */}
              <div className="flex flex-col gap-4 px-6 pt-4">
                {[...fields]
                  .map((field, originalIndex) => ({ field, originalIndex }))
                  .reverse()
                  .map(({ field, originalIndex }) => (
                    <AddressCard
                      key={field.id}
                      index={originalIndex}
                      displayNumber={originalIndex + 1}
                      form={form}
                      onRemove={() => remove(originalIndex)}
                      canRemove={fields.length > 1}
                    />
                  ))}
              </div>

              {/* Add address button */}
              <div className="flex justify-end px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isFieldsDisabled}
                  className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
                  onClick={() => {
                    if (fields.length >= MAX_ADDRESS_ENTRIES) {
                      ErrorToast({
                        title: 'Error',
                        description: t(
                          'profileRequirements.errors.maxEntries',
                          'Exceeded maximum of {{max}} entries allowed.',
                          { max: MAX_ADDRESS_ENTRIES }
                        ),
                      });
                      return;
                    }

                    append({
                      city: { id: '', label: '' },
                      stateProvince: { id: '', label: '' },
                      country: { id: '', label: '' },
                      postalCode: '',
                      isOpen: true,
                    });
                  }}
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
              {t('profileRequirements.cancelButton')}
            </Button>
            <Button
              type="submit"
              className="h-12 w-48"
              disabled={!canNavigate || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('profileRequirements.nextButton')
              )}
            </Button>
          </div>
        </form>
      </Form>

      <StepDisableDialog
        open={showDisableConfirm}
        onOpenChange={setShowDisableConfirm}
        onConfirm={handleConfirmDisable}
        title={t('profileRequirements.disableDialog.title')}
        description={t('profileRequirements.disableDialog.description')}
        confirmLabel={t('profileRequirements.disableDialog.confirmButton')}
      />

      <StepDisableDialog
        open={showEmptyConfirm}
        onOpenChange={setShowEmptyConfirm}
        onConfirm={handleConfirmEmptyData}
        title={t('profileRequirements.emptyDisableDialog.title')}
        description={t('profileRequirements.emptyDisableDialog.message')}
        confirmLabel={t('profileRequirements.emptyDisableDialog.disable')}
      />
    </>
  );
}
