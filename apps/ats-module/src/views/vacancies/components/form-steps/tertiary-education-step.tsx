import { ChevronLeftIcon, ChevronUpIcon } from 'lucide-react';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/app/components/message-box';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useAddBatchMutation,
  useAddDepartmentMutation,
  useAddFacultyMutation,
  useAddLevelOfQualificationMutation,
  useAddQualificationMutation,
  useAddSpecializationMutation,
  useAddTertiaryAwardingBodyMutation,
  useBatchesSearch,
  useDeliverySchedulesSearch,
  useDepartmentsSearch,
  useFacultiesSearch,
  useLevelOfQualificationsSearch,
  useQualificationsSearch,
  useSpecializationsSearch,
  useStudyModesSearch,
  useStudyPatternsSearch,
  useTertiaryAwardingBodiesSearch,
  useTertiaryAwardingBodyLocationsSearch,
  useTertiaryEducationForm,
} from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { toTertiaryEducationPayload } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { ErrorToast } from '@cgp/ui-kit/components/custom-toast';
import MultipleSelector from '@cgp/ui-kit/components/multiple-selector';
import type { Option } from '@cgp/ui-kit/components/multiple-selector';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@cgp/ui-kit/components/ui/dialog';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import { cn } from '@cgp/ui-kit/lib/utils';
import { Switch as SwitchPrimitive } from 'radix-ui';

const MAX_SELECTIONS = 10;

export default function TertiaryEducationStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: vacancyForm } = useVacancyForm();

  const { control, watch, handleSubmit, setValue, getValues } =
    useTertiaryEducationForm(vacancyForm.tertiaryEducation);

  const isEnabled = watch('isEnabled');
  const dataTakenFromCandidate = watch('dataTakenFromCandidate');

  // ── Form field helpers ───────────────────────────────────────────────────
  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  const clearEntryData = () => {
    setValue('entry.qualificationName', []);
    setValue('entry.tertiaryAwardingBody', []);
    setValue('entry.tertiaryAwardingBodyLocations', []);
    setValue('entry.levelOfQualification', []);
    setValue('entry.specialization', []);
    setValue('entry.studyMode', []);
    setValue('entry.studyPattern', []);
    setValue('entry.deliverySchedule', []);
    setValue('entry.batch', []);
    setValue('entry.department', []);
    setValue('entry.faculty', []);
    setValue('entry.grade', '');
  };

  const checkHasFilledData = (): boolean => {
    const e = getValues('entry');
    return Boolean(
      e.qualificationName.length > 0 ||
      e.tertiaryAwardingBody.length > 0 ||
      e.tertiaryAwardingBodyLocations.length > 0 ||
      e.levelOfQualification.length > 0 ||
      e.specialization.length > 0 ||
      e.studyMode.length > 0 ||
      e.studyPattern.length > 0 ||
      e.deliverySchedule.length > 0 ||
      e.batch.length > 0 ||
      e.department.length > 0 ||
      e.faculty.length > 0 ||
      !!e.grade ||
      getValues('dataTakenFromCandidate')
    );
  };

  // ── Add-Now mutations ────────────────────────────────────────────────────
  const addQualificationMutation = useAddQualificationMutation();
  const addTertiaryAwardingBodyMutation = useAddTertiaryAwardingBodyMutation();
  const addLevelOfQualificationMutation = useAddLevelOfQualificationMutation();
  const addSpecializationMutation = useAddSpecializationMutation();
  const addBatchMutation = useAddBatchMutation();
  const addDepartmentMutation = useAddDepartmentMutation();
  const addFacultyMutation = useAddFacultyMutation();

  // ── Disable confirmation dialog state ───────────────────────────────
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  // ── Creatable input tracking (for character count) ───────────────────────
  const [qualificationInput, setQualificationInput] = useState('');
  const [awardingBodyInput, setAwardingBodyInput] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [specializationInput, setSpecializationInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  const [facultyInput, setFacultyInput] = useState('');

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

  // ── Async search hooks ───────────────────────────────────────────────────
  const searchQualifications = useQualificationsSearch();
  const searchAwardingBodies = useTertiaryAwardingBodiesSearch();
  const searchLocations = useTertiaryAwardingBodyLocationsSearch();
  const searchLevels = useLevelOfQualificationsSearch();
  const searchSpecializations = useSpecializationsSearch();
  const searchStudyModes = useStudyModesSearch();
  const searchStudyPatterns = useStudyPatternsSearch();
  const searchDeliverySchedules = useDeliverySchedulesSearch();
  const searchBatches = useBatchesSearch();
  const searchDepartments = useDepartmentsSearch();
  const searchFaculties = useFacultiesSearch();

  // ── Add-Now handler ──────────────────────────────────────────────────────
  const handleCreatableChange = async (
    options: Option[],
    onFieldChange: (val: Option[]) => void,
    addMutation: (label: string) => Promise<{ data: { pendingId: string } }>
  ) => {
    const newItem = options.find(o => !o.id);
    if (newItem) {
      try {
        const result = await addMutation(newItem.label);
        const updated = options.map(o =>
          !o.id && o.label === newItem.label
            ? { ...o, id: result.data.pendingId, source: 'PENDING' }
            : o
        );
        onFieldChange(updated);
      } catch (error) {
        onFieldChange(options.filter(o => o.id));
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
    } else {
      onFieldChange(options);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleNext = handleSubmit(values => {
    onNext({ tertiaryEducation: toTertiaryEducationPayload(values) });
  });

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* ── Informational Banner ────────────────────────────────────────── */}
      <div className="px-6">
        <MessageBox
          title={t('tertiaryEducation.bannerTitle')}
          message={
            <>
              <span className="text-brand-primary-500 font-bold">
                {t('tertiaryEducation.bannerMessageHighlight')}
              </span>{' '}
              {t('tertiaryEducation.bannerMessageRest')}
            </>
          }
        />
      </div>

      {/* ── Section Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6">
        <button
          type="button"
          aria-label={t('tertiaryEducation.back')}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
          onClick={onBack}
        >
          <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="flex-1 text-xl font-bold text-slate-900">
          {t('tertiaryEducation.title')}
        </h2>
        <Controller
          control={control}
          name="isEnabled"
          render={({ field }) => (
            <SwitchPrimitive.Root
              checked={field.value}
              onCheckedChange={newValue => {
                if (!newValue && checkHasFilledData()) {
                  setConfirmDisableOpen(true);
                } else {
                  field.onChange(newValue);
                }
              }}
              className={cn(
                'focus-visible:ring-ring/50 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
                field.value ? 'bg-brand-primary-500' : 'bg-slate-300'
              )}
            >
              <SwitchPrimitive.Thumb
                className={cn(
                  'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                  field.value ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </SwitchPrimitive.Root>
          )}
        />
      </div>

      <div className="flex flex-col gap-4 px-6">
        {/* dataTakenFromCandidate — grayed when toggle off */}
        <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
          <div className="flex items-start gap-2">
            <Controller
              control={control}
              name="dataTakenFromCandidate"
              render={({ field }) => (
                <Checkbox
                  id="tertiaryDataTakenFromCandidate"
                  checked={field.value}
                  onCheckedChange={newValue => {
                    if (newValue) clearEntryData();
                    field.onChange(newValue);
                  }}
                  className="mt-0.5"
                />
              )}
            />
            <Label
              htmlFor="tertiaryDataTakenFromCandidate"
              className="cursor-pointer leading-snug"
            >
              {t('tertiaryEducation.collectFromCandidates')}
            </Label>
          </div>
        </div>

        {/* ── Education Card ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-slate-200 bg-white">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              {t('tertiaryEducation.sectionTitle')} 01
            </h3>
            <ChevronUpIcon className="h-5 w-5 text-slate-300" />
          </div>

          {/* Card body */}
          <div
            className={cn(
              'flex flex-col gap-5 border-t border-slate-200 px-6 py-5',
              fieldsDisabled && 'pointer-events-none opacity-60'
            )}
          >
            {/* Row 1: Required Qualification(s) | Grade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('tertiaryEducation.qualificationName')}</Label>
                  <CharacterCount
                    currentLength={qualificationInput.length}
                    maxLength={200}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.qualificationName"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchQualifications}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('qualificationName');
                        setQualificationInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label => addQualificationMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('qualificationName')}
                      errorMessage={
                        maxReachedFields.has('qualificationName')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      creatable
                      triggerSearchOnFocus
                      inputProps={{
                        maxLength: 200,
                        onValueChange: val => setQualificationInput(val),
                      }}
                      placeholder={t(
                        'tertiaryEducation.placeholders.qualificationName'
                      )}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('tertiaryEducation.grade')}</Label>
                  <Controller
                    control={control}
                    name="entry.grade"
                    render={({ field }) => (
                      <CharacterCount
                        currentLength={field.value.length}
                        maxLength={80}
                      />
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.grade"
                  render={({ field }) => (
                    <Input
                      {...field}
                      maxLength={80}
                      placeholder={t('tertiaryEducation.placeholders.grade')}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 2: Awarding Body/Institute Location | Batch */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label>
                  {t('tertiaryEducation.tertiaryAwardingBodyLocations')}
                </Label>
                <Controller
                  control={control}
                  name="entry.tertiaryAwardingBodyLocations"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchLocations}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('awardingBodyLocations');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('awardingBodyLocations')}
                      errorMessage={
                        maxReachedFields.has('awardingBodyLocations')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      triggerSearchOnFocus
                      placeholder={t(
                        'tertiaryEducation.placeholders.awardingBodyLocation'
                      )}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('tertiaryEducation.batch')}</Label>
                  <CharacterCount
                    currentLength={batchInput.length}
                    maxLength={100}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.batch"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchBatches}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS) clearMax('batch');
                        setBatchInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label => addBatchMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('batch')}
                      errorMessage={
                        maxReachedFields.has('batch')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      creatable
                      triggerSearchOnFocus
                      inputProps={{
                        maxLength: 100,
                        onValueChange: val => setBatchInput(val),
                      }}
                      placeholder={t('tertiaryEducation.placeholders.batch')}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 3: Awarding Body/Institute Name | Level of Qualification */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('tertiaryEducation.tertiaryAwardingBody')}</Label>
                  <CharacterCount
                    currentLength={awardingBodyInput.length}
                    maxLength={100}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.tertiaryAwardingBody"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchAwardingBodies}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('awardingBody');
                        setAwardingBodyInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label =>
                            addTertiaryAwardingBodyMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('awardingBody')}
                      errorMessage={
                        maxReachedFields.has('awardingBody')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      creatable
                      triggerSearchOnFocus
                      inputProps={{
                        maxLength: 100,
                        onValueChange: val => setAwardingBodyInput(val),
                      }}
                      placeholder={t(
                        'tertiaryEducation.placeholders.awardingBody'
                      )}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('tertiaryEducation.levelOfQualification')}</Label>
                  <CharacterCount
                    currentLength={levelInput.length}
                    maxLength={100}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.levelOfQualification"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchLevels}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('levelOfQualification');
                        setLevelInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label =>
                            addLevelOfQualificationMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('levelOfQualification')}
                      errorMessage={
                        maxReachedFields.has('levelOfQualification')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      creatable
                      triggerSearchOnFocus
                      inputProps={{
                        maxLength: 100,
                        onValueChange: val => setLevelInput(val),
                      }}
                      placeholder={t(
                        'tertiaryEducation.placeholders.levelOfQualification'
                      )}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 4: Specialization | Mode of Study */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('tertiaryEducation.specialization')}</Label>
                  <CharacterCount
                    currentLength={specializationInput.length}
                    maxLength={100}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.specialization"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchSpecializations}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('specialization');
                        setSpecializationInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label => addSpecializationMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('specialization')}
                      errorMessage={
                        maxReachedFields.has('specialization')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      creatable
                      triggerSearchOnFocus
                      inputProps={{
                        maxLength: 100,
                        onValueChange: val => setSpecializationInput(val),
                      }}
                      placeholder={t(
                        'tertiaryEducation.placeholders.specialization'
                      )}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label>{t('tertiaryEducation.studyMode')}</Label>
                <Controller
                  control={control}
                  name="entry.studyMode"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchStudyModes}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('studyMode');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('studyMode')}
                      errorMessage={
                        maxReachedFields.has('studyMode')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      triggerSearchOnFocus
                      placeholder={t(
                        'tertiaryEducation.placeholders.studyMode'
                      )}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 5: Study Pattern | Delivery Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label>{t('tertiaryEducation.studyPattern')}</Label>
                <Controller
                  control={control}
                  name="entry.studyPattern"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchStudyPatterns}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('studyPattern');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('studyPattern')}
                      errorMessage={
                        maxReachedFields.has('studyPattern')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      triggerSearchOnFocus
                      placeholder={t(
                        'tertiaryEducation.placeholders.studyPattern'
                      )}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label>{t('tertiaryEducation.deliverySchedule')}</Label>
                <Controller
                  control={control}
                  name="entry.deliverySchedule"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchDeliverySchedules}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('deliverySchedule');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('deliverySchedule')}
                      errorMessage={
                        maxReachedFields.has('deliverySchedule')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      triggerSearchOnFocus
                      placeholder={t(
                        'tertiaryEducation.placeholders.deliverySchedule'
                      )}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 6: Department | Faculty */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('tertiaryEducation.department')}</Label>
                  <CharacterCount
                    currentLength={departmentInput.length}
                    maxLength={100}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.department"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchDepartments}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('department');
                        setDepartmentInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label => addDepartmentMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('department')}
                      errorMessage={
                        maxReachedFields.has('department')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      creatable
                      triggerSearchOnFocus
                      inputProps={{
                        maxLength: 100,
                        onValueChange: val => setDepartmentInput(val),
                      }}
                      placeholder={t(
                        'tertiaryEducation.placeholders.department'
                      )}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('tertiaryEducation.faculty')}</Label>
                  <CharacterCount
                    currentLength={facultyInput.length}
                    maxLength={100}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.faculty"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchFaculties}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('faculty');
                        setFacultyInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label => addFacultyMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('faculty')}
                      errorMessage={
                        maxReachedFields.has('faculty')
                          ? t('tertiaryEducation.errors.maxSelections')
                          : undefined
                      }
                      creatable
                      triggerSearchOnFocus
                      inputProps={{
                        maxLength: 100,
                        onValueChange: val => setFacultyInput(val),
                      }}
                      placeholder={t('tertiaryEducation.placeholders.faculty')}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Add Entry button (outside card, bottom-right) ─────────── */}
        <div
          className={cn(
            'flex justify-end',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Button variant="outline" size="sm" disabled>
            + {t('tertiaryEducation.addEntry')}
          </Button>
        </div>
      </div>

      {/* ── Disable confirmation dialog ─────────────────────────────────── */}
      <Dialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
      >
        <DialogContent
          showCloseButton
          className="max-w-sm overflow-hidden rounded-2xl border-0 p-7 text-center"
          style={{
            background:
              'linear-gradient(90deg, rgb(254,244,238) 2%, rgb(248,242,236) 34%, rgb(233,244,240) 66%, rgb(238,247,245) 100%)',
          }}
        >
          {/* Avatar */}
          <div className="relative mx-auto mb-3 h-25 w-25 overflow-hidden rounded-full">
            <img
              src="http://localhost:3845/assets/4fdefbb8a24d33ab390e947b7da2b8d191829c0f.png"
              className="absolute top-0 -left-px h-17.75 w-17.75"
              alt=""
            />
            <img
              src="http://localhost:3845/assets/89bb1e1f996dd3362419d659b94b6022af9ca06d.png"
              className="absolute top-0 left-0 h-24.75 w-24.75"
              alt=""
            />
          </div>

          {/* Title */}
          <DialogTitle className="mb-2 text-center text-xl font-bold text-slate-900">
            {t('tertiaryEducation.confirmDisableDialog.title')}
          </DialogTitle>

          {/* Message */}
          <p className="mb-7 text-center text-sm text-slate-900">
            {t('tertiaryEducation.confirmDisableDialog.message')}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              className="h-12 flex-1 rounded-lg bg-[#e5e5e5] font-bold text-[#525252] hover:bg-[#d4d4d4]"
              onClick={() => setConfirmDisableOpen(false)}
            >
              {t('tertiaryEducation.confirmDisableDialog.cancel')}
            </Button>
            <Button
              className="h-12 flex-1 rounded-lg bg-[#be123c] font-bold text-white hover:bg-[#9f1239]"
              onClick={() => {
                clearEntryData();
                setValue('dataTakenFromCandidate', false);
                setValue('isEnabled', false);
                setConfirmDisableOpen(false);
              }}
            >
              {t('tertiaryEducation.confirmDisableDialog.disable')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="mt-auto flex justify-end gap-4 border-t border-slate-200 px-6 pt-4">
        <Button variant="secondary" className="h-12 w-44" onClick={onBack}>
          {t('tertiaryEducation.cancel')}
        </Button>
        <Button className="h-12 w-44" onClick={() => void handleNext()}>
          {t('tertiaryEducation.next')}
        </Button>
      </div>
    </div>
  );
}
