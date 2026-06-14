import { ChevronUpIcon, Plus } from 'lucide-react';

import { ArrowLeft2 } from 'iconsax-reactjs';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { AddAwardingBodyDialog } from '@/views/vacancies/components/form-steps/add-awarding-body-dialog';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
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
  useStepGuard,
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
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import type { MultipleSelectorRef } from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_SELECTIONS = 10;

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function TertiaryEducationStep({
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

  const { control, watch, handleSubmit, setValue, getValues } =
    useTertiaryEducationForm(vacancyForm.tertiaryEducation);

  const isEnabled = watch('isEnabled');
  const dataTakenFromCandidate = watch('dataTakenFromCandidate');
  const entryValue = watch('entry');

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

  const hasEntryData = (): boolean => {
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
      !!e.grade
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
        tertiaryEducation: toTertiaryEducationPayload(getValues()),
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
        tertiaryEducation: [
          { isEnabled: false, dataTakenFromCandidate: false, content: [] },
        ],
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  // ── Add-Now mutations ────────────────────────────────────────────────────
  const addQualificationMutation = useAddQualificationMutation();
  const addLevelOfQualificationMutation = useAddLevelOfQualificationMutation();
  const addSpecializationMutation = useAddSpecializationMutation();
  const addBatchMutation = useAddBatchMutation();
  const addDepartmentMutation = useAddDepartmentMutation();
  const addFacultyMutation = useAddFacultyMutation();

  // ── Awarding body dialog state ───────────────────────────────────────────
  const awardingBodyValue = entryValue.tertiaryAwardingBody;
  const addTertiaryAwardingBodyMutation = useAddTertiaryAwardingBodyMutation();
  const pendingAwardingBodiesDataRef = useRef<
    Map<string, { displayValue: string; locationId?: string; url?: string }>
  >(new Map());
  const awardingBodiesSnapshotRef = useRef<
    { value: string; label: string; source: string }[]
  >([]);
  const [addAwardingBodyDialogOpen, setAddAwardingBodyDialogOpen] =
    useState(false);
  const [pendingAwardingBodyLabel, setPendingAwardingBodyLabel] = useState('');
  const [awardingBodySelectorKey, setAwardingBodySelectorKey] = useState(0);

  // ── Disable confirmation dialog state ───────────────────────────────
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Creatable input tracking (for character count) ───────────────────────
  const [qualificationInput, setQualificationInput] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [specializationInput, setSpecializationInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  const [facultyInput, setFacultyInput] = useState('');

  // ── Refs for creatable selectors (used to commit pending input on Next) ──
  const qualificationRef = useRef<MultipleSelectorRef>(null);
  const levelRef = useRef<MultipleSelectorRef>(null);
  const specializationRef = useRef<MultipleSelectorRef>(null);
  const batchRef = useRef<MultipleSelectorRef>(null);
  const departmentRef = useRef<MultipleSelectorRef>(null);
  const facultyRef = useRef<MultipleSelectorRef>(null);

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
  type CreatableField =
    | 'entry.qualificationName'
    | 'entry.levelOfQualification'
    | 'entry.specialization'
    | 'entry.batch'
    | 'entry.department'
    | 'entry.faculty';

  const resolveItem = async (
    label: string,
    addMutation: (label: string) => Promise<{ data: { pendingId: string } }>
  ): Promise<{ value: string; label: string; source: string } | null> => {
    try {
      const result = await addMutation(label);
      return { value: result.data.pendingId, label, source: 'PENDING' };
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
      return null;
    }
  };

  const resolveAndCommitField = async (
    ref: RefObject<MultipleSelectorRef | null>,
    fieldName: CreatableField,
    addMutation: (label: string) => Promise<{ data: { pendingId: string } }>
  ) => {
    const input = ref.current?.input.value.trim();
    let current = getValues(fieldName);
    if (input) {
      current = [...current, { value: input, label: input, source: '' }];
    }
    const resolved: { value: string; label: string; source: string }[] = [];
    for (const item of current) {
      if (item.value === item.label) {
        const created = await resolveItem(item.label, addMutation);
        if (created) resolved.push(created);
      } else {
        resolved.push(item);
      }
    }
    setValue(fieldName, resolved);
  };

  const resolveAndCommitTertiaryAwardingBodies = async () => {
    const current = getValues('entry.tertiaryAwardingBody');
    const resolved: { value: string; label: string; source: string }[] = [];
    for (const body of current) {
      if (body.source === 'PENDING_TEMP') {
        const pendingData = pendingAwardingBodiesDataRef.current.get(
          body.value
        );
        if (pendingData) {
          const created = await resolveItem(body.label, () =>
            addTertiaryAwardingBodyMutation.mutateAsync(pendingData)
          );
          if (created) {
            resolved.push(created);
            pendingAwardingBodiesDataRef.current.delete(body.value);
          }
        }
      } else {
        resolved.push(body);
      }
    }
    setValue('entry.tertiaryAwardingBody', resolved);
  };
  const handleNext = async () => {
    if (isEnabled && !dataTakenFromCandidate && !hasEntryData()) {
      setEmptyDisableOpen(true);
      return;
    }

    await resolveAndCommitTertiaryAwardingBodies();
    await resolveAndCommitField(
      qualificationRef,
      'entry.qualificationName',
      label => addQualificationMutation.mutateAsync(label)
    );
    await resolveAndCommitField(levelRef, 'entry.levelOfQualification', label =>
      addLevelOfQualificationMutation.mutateAsync(label)
    );
    await resolveAndCommitField(
      specializationRef,
      'entry.specialization',
      label => addSpecializationMutation.mutateAsync(label)
    );
    await resolveAndCommitField(batchRef, 'entry.batch', label =>
      addBatchMutation.mutateAsync(label)
    );
    await resolveAndCommitField(departmentRef, 'entry.department', label =>
      addDepartmentMutation.mutateAsync(label)
    );
    await resolveAndCommitField(facultyRef, 'entry.faculty', label =>
      addFacultyMutation.mutateAsync(label)
    );
    void handleSubmit(values => {
      onNext({ tertiaryEducation: toTertiaryEducationPayload(values) });
    })();
  };

  return (
    <div className="flex flex-col">
      {/* ── Informational Banner ────────────────────────────────────────── */}
      <MessageBox
        fields={[
          t('tertiaryEducation.qualificationName'),
          t('tertiaryEducation.tertiaryAwardingBody'),
          t('tertiaryEducation.tertiaryAwardingBodyLocations'),
          t('tertiaryEducation.levelOfQualification'),
          t('tertiaryEducation.specialization'),
          t('tertiaryEducation.studyMode'),
          t('tertiaryEducation.studyPattern'),
          t('tertiaryEducation.deliverySchedule'),
          t('tertiaryEducation.batch'),
          t('tertiaryEducation.department'),
          t('tertiaryEducation.faculty'),
          t('tertiaryEducation.grade'),
        ]}
      />

      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-7 py-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('tertiaryEducation.back')}
            className="text-slate-700 transition-colors hover:text-slate-900"
            onClick={onBack}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t('tertiaryEducation.title')}
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
                    const checked = newValue === true;
                    if (checked) clearEntryData();
                    field.onChange(checked);
                  }}
                  className="mt-0.5"
                />
              )}
            />
            <Label
              htmlFor="tertiaryDataTakenFromCandidate"
              className="cursor-pointer leading-snug wrap-break-word"
            >
              {t('tertiaryEducation.collectFromCandidates')}
            </Label>
          </div>
        </div>

        {/* ── Education Card ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-5">
            <h3 className="text-sm font-semibold text-slate-900">
              {t('tertiaryEducation.sectionTitle')} 01
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
            {/* Row 1: Required Qualification(s) | Grade */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <div className="flex min-w-0 flex-col gap-1 xl:col-span-2">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <Label className="truncate pr-2">
                    {t('tertiaryEducation.qualificationName')}
                  </Label>
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
                      ref={qualificationRef}
                      value={field.value}
                      onSearch={searchQualifications}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('qualificationName');
                        setQualificationInput('');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('qualificationName')}
                      errorMessage={
                        maxReachedFields.has('qualificationName')
                          ? t('tertiaryEducation.errors.maxSelections')
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
                        onValueChange: val => setQualificationInput(val),
                      }}
                      placeholder={t(
                        'tertiaryEducation.placeholders.qualificationName'
                      )}
                    />
                  )}
                />
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <Label className="truncate pr-2">
                    {t('tertiaryEducation.grade')}
                  </Label>
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
                      className="h-11"
                      placeholder={t('tertiaryEducation.placeholders.grade')}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 2: Location | Batch */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>
                    {t('tertiaryEducation.tertiaryAwardingBodyLocations')}
                  </Label>
                </div>
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
                      ref={batchRef}
                      value={field.value}
                      onSearch={searchBatches}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS) clearMax('batch');
                        setBatchInput('');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('batch')}
                      errorMessage={
                        maxReachedFields.has('batch')
                          ? t('tertiaryEducation.errors.maxSelections')
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
                        maxLength: 100,
                        onValueChange: val => setBatchInput(val),
                      }}
                      placeholder={t('tertiaryEducation.placeholders.batch')}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 3: Awarding Body | Level of Qualification */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>{t('tertiaryEducation.tertiaryAwardingBody')}</Label>
                </div>
                <Controller
                  control={control}
                  name="entry.tertiaryAwardingBody"
                  render={({ field }) => (
                    <MultipleSelector
                      key={awardingBodySelectorKey}
                      value={field.value}
                      onSearch={searchAwardingBodies}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('awardingBody');
                        const newItem = options.find(o => o.value === o.label);
                        if (newItem) {
                          awardingBodiesSnapshotRef.current = getValues(
                            'entry.tertiaryAwardingBody'
                          );
                          setPendingAwardingBodyLabel(newItem.label);
                          setAddAwardingBodyDialogOpen(true);
                        } else {
                          field.onChange(options);
                        }
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('awardingBody')}
                      errorMessage={
                        maxReachedFields.has('awardingBody')
                          ? t('tertiaryEducation.errors.maxSelections')
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
                      ref={levelRef}
                      value={field.value}
                      onSearch={searchLevels}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('levelOfQualification');
                        setLevelInput('');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('levelOfQualification')}
                      errorMessage={
                        maxReachedFields.has('levelOfQualification')
                          ? t('tertiaryEducation.errors.maxSelections')
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
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                      ref={specializationRef}
                      value={field.value}
                      onSearch={searchSpecializations}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('specialization');
                        setSpecializationInput('');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('specialization')}
                      errorMessage={
                        maxReachedFields.has('specialization')
                          ? t('tertiaryEducation.errors.maxSelections')
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
                <div className="flex h-5 items-center">
                  <Label>{t('tertiaryEducation.studyMode')}</Label>
                </div>
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
                        'tertiaryEducation.placeholders.studyMode'
                      )}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 5: Study Pattern | Delivery Schedule */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                        'tertiaryEducation.placeholders.deliverySchedule'
                      )}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 6: Department | Faculty */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                      ref={departmentRef}
                      value={field.value}
                      onSearch={searchDepartments}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('department');
                        setDepartmentInput('');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('department')}
                      errorMessage={
                        maxReachedFields.has('department')
                          ? t('tertiaryEducation.errors.maxSelections')
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
                      ref={facultyRef}
                      value={field.value}
                      onSearch={searchFaculties}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('faculty');
                        setFacultyInput('');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('faculty')}
                      errorMessage={
                        maxReachedFields.has('faculty')
                          ? t('tertiaryEducation.errors.maxSelections')
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
            'flex justify-end py-4',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Button
            type="button"
            variant="secondary"
            className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
          >
            <Plus className="size-4 text-neutral-600!" />
          </Button>
        </div>
      </div>

      {/* ── Add Awarding Body dialog ─────────────────────────────────────── */}
      <AddAwardingBodyDialog
        open={addAwardingBodyDialogOpen}
        initialName={pendingAwardingBodyLabel}
        onClose={() => {
          setAwardingBodySelectorKey(k => k + 1);
          setAddAwardingBodyDialogOpen(false);
        }}
        onAdded={option => {
          pendingAwardingBodiesDataRef.current.set(option.value, {
            displayValue: option.label,
            locationId: option.locationId,
            url: option.url,
          });
          setValue('entry.tertiaryAwardingBody', [
            ...awardingBodyValue,
            { value: option.value, label: option.label, source: option.source },
          ]);
          setAddAwardingBodyDialogOpen(false);
        }}
      />

      <StepDisableDialog
        open={confirmDisableOpen}
        onOpenChange={setConfirmDisableOpen}
        title={t('tertiaryEducation.confirmDisableDialog.title')}
        description={t('tertiaryEducation.confirmDisableDialog.message')}
        confirmLabel={t('tertiaryEducation.confirmDisableDialog.disable')}
        onConfirm={() => {
          clearEntryData();
          setValue('dataTakenFromCandidate', false);
          setValue('isEnabled', false);
          setConfirmDisableOpen(false);
        }}
      />

      <StepDisableDialog
        open={emptyDisableOpen}
        onOpenChange={setEmptyDisableOpen}
        title={t('tertiaryEducation.emptyDisableDialog.title')}
        description={t('tertiaryEducation.emptyDisableDialog.message')}
        confirmLabel={t('tertiaryEducation.emptyDisableDialog.disable')}
        onConfirm={() => {
          clearEntryData();
          setValue('dataTakenFromCandidate', false);
          setValue('isEnabled', false);
          setEmptyDisableOpen(false);
          void handleSubmit(values => {
            onNext({ tertiaryEducation: toTertiaryEducationPayload(values) });
          })();
        }}
      />

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button variant="secondary" className="h-12 w-48" onClick={onBack}>
          {t('tertiaryEducation.cancel')}
        </Button>
        <Button className="h-12 w-48" onClick={() => void handleNext()}>
          {t('tertiaryEducation.next')}
        </Button>
      </div>
    </div>
  );
}
