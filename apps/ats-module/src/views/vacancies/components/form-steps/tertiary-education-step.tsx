import { ChevronUpIcon, Plus } from 'lucide-react';

import { ArrowLeft2 } from 'iconsax-reactjs';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { AddAwardingBodyDialog } from '@/views/vacancies/components/form-steps/add-awarding-body-dialog';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useAddBatchMutation,
  useAddDepartmentMutation,
  useAddFacultyMutation,
  useAddLevelOfQualificationMutation,
  useAddQualificationMutation,
  useAddSpecializationMutation,
  useAddTertiaryAwardingBodyMutation,
  useBatchesQuery,
  useBatchesSearch,
  useDeliverySchedulesQuery,
  useDeliverySchedulesSearch,
  useDepartmentsQuery,
  useDepartmentsSearch,
  useFacultiesQuery,
  useFacultiesSearch,
  useLevelOfQualificationsQuery,
  useLevelOfQualificationsSearch,
  useQualificationsQuery,
  useQualificationsSearch,
  useSpecializationsQuery,
  useSpecializationsSearch,
  useStepGuard,
  useStudyModesQuery,
  useStudyModesSearch,
  useStudyPatternsQuery,
  useStudyPatternsSearch,
  useTertiaryAwardingBodiesQuery,
  useTertiaryAwardingBodiesSearch,
  useTertiaryAwardingBodyLocationsQuery,
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
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const {
    form: vacancyForm,
    setForm,
    onCancel,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();

  const { control, watch, handleSubmit, setValue, getValues } =
    useTertiaryEducationForm(vacancyForm.tertiaryEducation);

  const isEnabled = watch('isEnabled');
  const dataTakenFromCandidate = watch('dataTakenFromCandidate');
  const entryValue = watch('entries.0');

  // -- Form field helpers ---------------------------------------------------
  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

  const clearEntryData = () => {
    setValue('entries.0.qualificationName', []);
    setValue('entries.0.tertiaryAwardingBody', []);
    setValue('entries.0.tertiaryAwardingBodyLocations', []);
    setValue('entries.0.levelOfQualification', []);
    setValue('entries.0.specialization', []);
    setValue('entries.0.studyMode', []);
    setValue('entries.0.studyPattern', []);
    setValue('entries.0.deliverySchedule', []);
    setValue('entries.0.batch', []);
    setValue('entries.0.department', []);
    setValue('entries.0.faculty', []);
    setValue('entries.0.grade', '');
  };

  const hasEntryData = (): boolean => {
    const e = getValues('entries.0');
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

  const shouldDisableNavigation =
    isEnabled && !dataTakenFromCandidate && !hasEntryData();

  useStepGuard(shouldDisableNavigation);
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

  // -- Add-Now mutations ----------------------------------------------------
  const addQualificationMutation = useAddQualificationMutation();
  const addLevelOfQualificationMutation = useAddLevelOfQualificationMutation();
  const addSpecializationMutation = useAddSpecializationMutation();
  const addBatchMutation = useAddBatchMutation();
  const addDepartmentMutation = useAddDepartmentMutation();
  const addFacultyMutation = useAddFacultyMutation();

  // -- Awarding body dialog state -------------------------------------------
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

  // -- Disable confirmation dialog state -------------------------------
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // -- Creatable input tracking (for character count) -----------------------
  const [qualificationInput, setQualificationInput] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [specializationInput, setSpecializationInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  const [facultyInput, setFacultyInput] = useState('');

  // -- Refs for creatable selectors (used to commit pending input on Next) --
  const qualificationRef = useRef<MultipleSelectorRef>(null);
  const levelRef = useRef<MultipleSelectorRef>(null);
  const specializationRef = useRef<MultipleSelectorRef>(null);
  const batchRef = useRef<MultipleSelectorRef>(null);
  const departmentRef = useRef<MultipleSelectorRef>(null);
  const facultyRef = useRef<MultipleSelectorRef>(null);
  const attemptedLabelHydrationRef = useRef<Set<string>>(new Set());

  // -- Max-selection tracking -----------------------------------------------
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

  // -- Async search hooks ---------------------------------------------------
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

  // Preload lookup data for edit mode to populate cache for search results
  useQualificationsQuery('');
  useTertiaryAwardingBodiesQuery('');
  useTertiaryAwardingBodyLocationsQuery('');
  useLevelOfQualificationsQuery('');
  useSpecializationsQuery('');
  useStudyModesQuery();
  useStudyPatternsQuery();
  useDeliverySchedulesQuery();
  useBatchesQuery('');
  useDepartmentsQuery('');
  useFacultiesQuery('');

  const findMatchedOption = <T extends { value: string }>(
    options: T[],
    value: string
  ) => options.find(option => option.value === value);

  // Resolve labels for edit-mode ID-only values (payload may not include names).
  useEffect(() => {
    const shouldResolveLabel = (label: string, value: string) =>
      label.trim() === value.trim();

    const resolveSelectionsWithSource = async (
      fieldName:
        | 'entries.0.qualificationName'
        | 'entries.0.tertiaryAwardingBody'
        | 'entries.0.levelOfQualification'
        | 'entries.0.specialization'
        | 'entries.0.studyMode'
        | 'entries.0.studyPattern'
        | 'entries.0.deliverySchedule'
        | 'entries.0.batch'
        | 'entries.0.department'
        | 'entries.0.faculty',
      searchFn: (
        search: string
      ) => Promise<Array<{ value: string; label: string; source: string }>>
    ) => {
      const current = getValues(fieldName);
      let changed = false;
      const resolved = [...current];

      for (let index = 0; index < current.length; index += 1) {
        const item = current[index];
        if (!shouldResolveLabel(item.label, item.value)) {
          continue;
        }

        const hydrationKey = `${fieldName}:${item.value}`;
        if (attemptedLabelHydrationRef.current.has(hydrationKey)) {
          continue;
        }
        attemptedLabelHydrationRef.current.add(hydrationKey);

        let options = await searchFn(item.value);
        let match = findMatchedOption(options, item.value);

        if (!match) {
          options = await searchFn('');
          match = findMatchedOption(options, item.value);
        }

        if (!match || shouldResolveLabel(match.label, item.value)) {
          continue;
        }

        changed = true;
        resolved[index] = {
          ...item,
          label: match.label,
        };
      }

      if (changed) {
        setValue(fieldName, resolved, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    };

    const resolveLocationSelections = async () => {
      const fieldName = 'entries.0.tertiaryAwardingBodyLocations' as const;
      const current = getValues(fieldName);
      let changed = false;
      const resolved = [...current];

      for (let index = 0; index < current.length; index += 1) {
        const item = current[index];
        if (!shouldResolveLabel(item.label, item.value)) {
          continue;
        }

        const hydrationKey = `${fieldName}:${item.value}`;
        if (attemptedLabelHydrationRef.current.has(hydrationKey)) {
          continue;
        }
        attemptedLabelHydrationRef.current.add(hydrationKey);

        let options = await searchLocations(item.value);
        let match = findMatchedOption(options, item.value);

        if (!match) {
          options = await searchLocations('');
          match = findMatchedOption(options, item.value);
        }

        if (!match || shouldResolveLabel(match.label, item.value)) {
          continue;
        }

        changed = true;
        resolved[index] = {
          ...item,
          label: match.label,
        };
      }

      if (changed) {
        setValue(fieldName, resolved, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    };

    const resolveAllLabels = async () => {
      await Promise.all([
        resolveSelectionsWithSource(
          'entries.0.qualificationName',
          searchQualifications
        ),
        resolveSelectionsWithSource(
          'entries.0.tertiaryAwardingBody',
          searchAwardingBodies
        ),
        resolveLocationSelections(),
        resolveSelectionsWithSource(
          'entries.0.levelOfQualification',
          searchLevels
        ),
        resolveSelectionsWithSource(
          'entries.0.specialization',
          searchSpecializations
        ),
        resolveSelectionsWithSource('entries.0.studyMode', searchStudyModes),
        resolveSelectionsWithSource(
          'entries.0.studyPattern',
          searchStudyPatterns
        ),
        resolveSelectionsWithSource(
          'entries.0.deliverySchedule',
          searchDeliverySchedules
        ),
        resolveSelectionsWithSource('entries.0.batch', searchBatches),
        resolveSelectionsWithSource('entries.0.department', searchDepartments),
        resolveSelectionsWithSource('entries.0.faculty', searchFaculties),
      ]);
    };

    void resolveAllLabels();
  }, [
    getValues,
    searchAwardingBodies,
    searchBatches,
    searchDeliverySchedules,
    searchDepartments,
    searchFaculties,
    searchLevels,
    searchLocations,
    searchQualifications,
    searchSpecializations,
    searchStudyModes,
    searchStudyPatterns,
    setValue,
  ]);

  // -- Add-Now handler ------------------------------------------------------
  type CreatableField =
    | 'entries.0.qualificationName'
    | 'entries.0.levelOfQualification'
    | 'entries.0.specialization'
    | 'entries.0.batch'
    | 'entries.0.department'
    | 'entries.0.faculty';

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
    const maxFieldByName = {
      'entries.0.qualificationName': 'qualificationName',
      'entries.0.levelOfQualification': 'levelOfQualification',
      'entries.0.specialization': 'specialization',
      'entries.0.batch': 'batch',
      'entries.0.department': 'department',
      'entries.0.faculty': 'faculty',
    } as const;

    const maxField = maxFieldByName[fieldName];
    const hasRoomForInput = !input || current.length < MAX_SELECTIONS;

    if (!hasRoomForInput) {
      setMax(maxField);
    }

    if (input && hasRoomForInput) {
      current = [...current, { value: input, label: input, source: '' }];
    }
    const resolved: { value: string; label: string; source: string }[] = [];
    for (const item of current) {
      const nextItem =
        item.value === item.label
          ? await resolveItem(item.label, addMutation)
          : item;

      if (nextItem) {
        resolved.push(nextItem);
      }
    }
    setValue(fieldName, resolved);
  };

  const resolveAndCommitTertiaryAwardingBodies = async () => {
    const current = getValues('entries.0.tertiaryAwardingBody');
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
    setValue('entries.0.tertiaryAwardingBody', resolved);
  };
  const handleNext = async () => {
    if (isEnabled && !dataTakenFromCandidate && !hasEntryData()) {
      setEmptyDisableOpen(true);
      return;
    }

    await resolveAndCommitTertiaryAwardingBodies();
    await resolveAndCommitField(
      qualificationRef,
      'entries.0.qualificationName',
      label => addQualificationMutation.mutateAsync(label)
    );
    await resolveAndCommitField(
      levelRef,
      'entries.0.levelOfQualification',
      label => addLevelOfQualificationMutation.mutateAsync(label)
    );
    await resolveAndCommitField(
      specializationRef,
      'entries.0.specialization',
      label => addSpecializationMutation.mutateAsync(label)
    );
    await resolveAndCommitField(batchRef, 'entries.0.batch', label =>
      addBatchMutation.mutateAsync(label)
    );
    await resolveAndCommitField(departmentRef, 'entries.0.department', label =>
      addDepartmentMutation.mutateAsync(label)
    );
    await resolveAndCommitField(facultyRef, 'entries.0.faculty', label =>
      addFacultyMutation.mutateAsync(label)
    );
    void handleSubmit(values => {
      onNext({ tertiaryEducation: toTertiaryEducationPayload(values) });
    })();
  };

  const handleBack = () => {
    setForm(prev => ({
      ...prev,
      tertiaryEducation: toTertiaryEducationPayload(getValues()),
    }));
    onBack();
  };

  return (
    <div className="flex flex-col">
      {/* -- Informational Banner ------------------------------------------ */}
      <MessageBox
        fields={[
          t('tertiaryEducation.qualificationName'),
          t('tertiaryEducation.tertiaryAwardingBody'),
          t('tertiaryEducation.tertiaryAwardingBodyLocations'),
          t('tertiaryEducation.levelOfQualification'),
          t('tertiaryEducation.studyPattern'),
          t('tertiaryEducation.deliverySchedule'),
          t('tertiaryEducation.startDate'),
          t('tertiaryEducation.endDate'),
        ]}
      />

      {/* -- Section Header -------------------------------------------- */}
      <div className="flex items-center justify-between px-7 py-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('tertiaryEducation.back')}
            disabled={shouldDisableNavigation}
            className="text-slate-700 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleBack}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t('tertiaryEducation.title')}
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
        {/* dataTakenFromCandidate � grayed when toggle off */}
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

        {/* -- Education Card -------------------------------------------- */}
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
                  name="entries.0.qualificationName"
                  render={({ field }) => (
                    <MultipleSelector
                      ref={qualificationRef}
                      value={field.value}
                      onSearch={searchQualifications}
                      onChange={options => {
                        if (options.length > MAX_SELECTIONS) {
                          setMax('qualificationName');
                          return;
                        }
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
                    name="entries.0.grade"
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
                  name="entries.0.grade"
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
                  name="entries.0.tertiaryAwardingBodyLocations"
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
                  name="entries.0.batch"
                  render={({ field }) => (
                    <MultipleSelector
                      ref={batchRef}
                      value={field.value}
                      onSearch={searchBatches}
                      onChange={options => {
                        if (options.length > MAX_SELECTIONS) {
                          setMax('batch');
                          return;
                        }
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
                  name="entries.0.tertiaryAwardingBody"
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
                            'entries.0.tertiaryAwardingBody'
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
                  name="entries.0.levelOfQualification"
                  render={({ field }) => (
                    <MultipleSelector
                      ref={levelRef}
                      value={field.value}
                      onSearch={searchLevels}
                      onChange={options => {
                        if (options.length > MAX_SELECTIONS) {
                          setMax('levelOfQualification');
                          return;
                        }
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
                  name="entries.0.specialization"
                  render={({ field }) => (
                    <MultipleSelector
                      ref={specializationRef}
                      value={field.value}
                      onSearch={searchSpecializations}
                      onChange={options => {
                        if (options.length > MAX_SELECTIONS) {
                          setMax('specialization');
                          return;
                        }
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
                  name="entries.0.studyMode"
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
                  name="entries.0.studyPattern"
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
                  name="entries.0.deliverySchedule"
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
                  name="entries.0.department"
                  render={({ field }) => (
                    <MultipleSelector
                      ref={departmentRef}
                      value={field.value}
                      onSearch={searchDepartments}
                      onChange={options => {
                        if (options.length > MAX_SELECTIONS) {
                          setMax('department');
                          return;
                        }
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
                  name="entries.0.faculty"
                  render={({ field }) => (
                    <MultipleSelector
                      ref={facultyRef}
                      value={field.value}
                      onSearch={searchFaculties}
                      onChange={options => {
                        if (options.length > MAX_SELECTIONS) {
                          setMax('faculty');
                          return;
                        }
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

        {/* -- Add Entry button (outside card, bottom-right) ----------- */}
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

      {/* -- Add Awarding Body dialog --------------------------------------- */}
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
          setValue('entries.0.tertiaryAwardingBody', [
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
          removeCompletedStep(currentStepIndex);
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

      {/* -- Step footer ---------------------------------------------------- */}
      <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
          {t('tertiaryEducation.cancel')}
        </Button>
        <Button
          className="h-12 w-48"
          disabled={shouldDisableNavigation}
          onClick={() => void handleNext()}
        >
          {t('tertiaryEducation.next')}
        </Button>
      </div>
    </div>
  );
}
