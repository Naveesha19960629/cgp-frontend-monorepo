import { Plus, Trash2 } from 'lucide-react';

import { ArrowLeft2 } from 'iconsax-reactjs';

import { useEffect, useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { StepDisableDialog } from '@/views/vacancies';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
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
import type { StepProps } from '@/views/vacancies/types';

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

  const [citySearch, setCitySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  const isEnabled = form.watch('isEnabled');
  const dataTakenFromCandidate = form.watch('dataTakenFromCandidate');
  const isDisabled = !isEnabled || dataTakenFromCandidate;

  const checkDuplicate = () => {
    const addresses = form.getValues('addresses');
    if (isDuplicateAddress(addresses, index)) {
      ErrorToast({
        title: t('common.error', 'Error'),
        description: t(
          'profileRequirements.errors.duplicateEntry',
          'This entry already exists.'
        ),
      });
    }
  };

  const { data: cityData = [], isFetching: isCityLoading } =
    usePlacesCityQuery(citySearch);
  const { data: stateData = [], isFetching: isStateLoading } =
    usePlacesStateQuery(stateSearch);
  const { data: countryData = [], isFetching: isCountryLoading } =
    usePlacesCountryQuery(countrySearch);

  const cityValue = form.watch(`addresses.${index}.city`);
  const stateValue = form.watch(`addresses.${index}.stateProvince`);
  const countryValue = form.watch(`addresses.${index}.country`);

  const cityOptions: ComboboxOption[] = [
    ...(cityValue?.id && !cityData.some(c => c.city.id === cityValue.id)
      ? [{ value: cityValue.id, label: cityValue.label }]
      : []),
    ...cityData.map(c => ({ value: c.city.id, label: c.city.label })),
  ];

  const stateOptions: ComboboxOption[] = [
    ...(stateValue?.id && !stateData.some(s => s.state.id === stateValue.id)
      ? [{ value: stateValue.id, label: stateValue.label }]
      : []),
    ...stateData.map(s => ({ value: s.state.id, label: s.state.label })),
  ];

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
    form.setValue(
      `addresses.${index}.city`,
      { id: r.city.id, label: r.city.label },
      { shouldValidate: true }
    );
    if (r.state?.id) {
      form.setValue(
        `addresses.${index}.stateProvince`,
        { id: r.state.id, label: r.state.label },
        { shouldValidate: true }
      );
    }
    form.setValue(
      `addresses.${index}.country`,
      { id: r.country.id, label: r.country.label },
      { shouldValidate: true }
    );
    // Real-time duplicate check after all fields are set
    setTimeout(() => checkDuplicate(), 0);
  };

  const handleStateSelect = (val: string) => {
    const r = stateData.find(s => s.state.id === val);
    if (!r) return;
    form.setValue(
      `addresses.${index}.stateProvince`,
      { id: r.state.id, label: r.state.label },
      { shouldValidate: true }
    );
    form.setValue(
      `addresses.${index}.country`,
      { id: r.country.id, label: r.country.label },
      { shouldValidate: true }
    );
    setTimeout(() => checkDuplicate(), 0);
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
        <span className="text-base font-bold text-slate-900">
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
              'text-slate-400 transition-colors hover:text-red-500',
              (!canRemove || isDisabled) && 'hidden'
            )}
            aria-label={t('profileRequirements.removeAddress')}
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="grid grid-cols-4 gap-5 px-5 pb-5">
        {/* City */}
        <FormField
          control={form.control}
          name={`addresses.${index}.city`}
          render={({ field, fieldState }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel className="text-sm font-semibold text-slate-900">
                {t('profileRequirements.city')}
              </FormLabel>
              <FormControl>
                <Combobox
                  options={cityOptions}
                  value={field.value?.id ?? ''}
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

        {/* State / Province / Region */}
        <FormField
          control={form.control}
          name={`addresses.${index}.stateProvince`}
          render={({ field, fieldState }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel className="text-sm font-semibold text-slate-900">
                {t('profileRequirements.stateProvince')}
              </FormLabel>
              <FormControl>
                <Combobox
                  options={stateOptions}
                  value={field.value?.id ?? ''}
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

        {/* Country */}
        <FormField
          control={form.control}
          name={`addresses.${index}.country`}
          render={({ field, fieldState }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel className="text-sm font-semibold text-slate-900">
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

        {/* Postal Code / Zip */}
        <FormField
          control={form.control}
          name={`addresses.${index}.postalCode`}
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel className="flex justify-between text-sm font-semibold text-slate-900">
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
                  className="h-9 shadow-none"
                  {...field}
                  onChange={e => {
                    field.onChange(e.target.value.trimStart());
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
      </div>
    </div>
  );
}

export default function ProfileRequirementsStep({ onNext, onBack }: StepProps) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();

  const {
    form: contextForm,
    setForm,
    onCancel,
    stepPersistRef,
    stepDisableRef,
  } = useVacancyForm();
  const { form, fields, append, remove, replace } = useProfileRequirementsForm(
    contextForm.profileRequirements
  );

  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

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
      const hasData =
        data.gender.id !== '' ||
        data.maritalStatus.id !== '' ||
        data.addresses.some(
          a =>
            a.city.id !== '' ||
            a.stateProvince.id !== '' ||
            a.country.id !== '' ||
            a.postalCode !== ''
        );
      if (!hasData) {
        setShowEmptyConfirm(true);
        return;
      }

      // Check for duplicate address entries on submit too
      for (let i = 0; i < data.addresses.length; i++) {
        if (isDuplicateAddress(data.addresses, i)) {
          ErrorToast({
            title: t('common.error', 'Error'),
            description: t(
              'profileRequirements.errors.duplicateEntry',
              'This entry already exists.'
            ),
          });
          return;
        }
      }
    }

    onNext({
      profileRequirements: {
        isEnabled: data.isEnabled,
        dataTakenFromCandidate: data.dataTakenFromCandidate,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        addresses: data.addresses,
      },
    });
  };

  const handleCancel = () => {
    onCancel();
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
      <Form {...form}>
        <form
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
                onClick={onBack}
                className="text-slate-700 transition-colors hover:text-slate-900"
                aria-label={t('profileRequirements.back')}
              >
                <ArrowLeft2 size={24} />
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {t('profileRequirements.title')}
              </h2>
            </div>

            {/* Toggle switch */}
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  size="lg"
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
                    className="cursor-pointer text-sm font-medium text-slate-900"
                  >
                    {t('profileRequirements.dataTakenFromCandidate')}
                  </label>
                </>
              )}
            />
          </div>

          {/* Gender & Marital Status */}
          <div className="grid grid-cols-2 gap-5 px-7 pb-8">
            {/* Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0">
                  <FormLabel className="text-sm font-semibold text-slate-900">
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
                      <SelectTrigger className="h-9 w-full shadow-none">
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

            {/* Marital Status */}
            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0">
                  <FormLabel className="text-sm font-semibold text-slate-900">
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
                      <SelectTrigger className="h-9 w-full shadow-none">
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
          </div>

          {/* Addresses section header */}
          <div className="px-7 pt-6 pb-2">
            <h3 className="text-base font-bold text-slate-900">
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
                    title: t('common.error', 'Error'),
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
            <Button type="submit" className="h-12 w-48">
              {t('profileRequirements.nextButton')}
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
