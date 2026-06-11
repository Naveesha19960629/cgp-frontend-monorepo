import { ChevronUpIcon, Plus } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { AddSchoolDialog } from '@/views/vacancies/components/form-steps/add-school-dialog';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useAddAwardingBodyMutation,
  useAddExaminationMutation,
  useAddFieldOfStudyMutation,
  useAddSchoolMutation,
  useAwardingBodiesSearch,
  useExaminationsSearch,
  useFieldsOfStudySearch,
  useSchoolLocationsSearch,
  useSchoolsSearch,
  useSecondaryEducationForm,
  useStepGuard,
} from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import {
  formatDate,
  toSecondaryEducationPayload,
} from '@/views/vacancies/utils';

import deleteConfirmAvatar from '@cgp/ui-kit/assets/images/delete-confirm-avator.svg';
import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { ErrorToast } from '@cgp/ui-kit/components/custom-toast';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import type { MultipleSelectorRef } from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Calendar } from '@cgp/ui-kit/components/ui/calendar';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@cgp/ui-kit/components/ui/dialog';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { Textarea } from '@cgp/ui-kit/components/ui/textarea';
import { applyTypography } from '@cgp/ui-kit/lib/typography';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_SELECTIONS = 10;
const HUNDRED_YEARS_AGO = new Date(new Date().getFullYear() - 100, 0, 1);

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function SecondaryEducationStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { form: vacancyForm, setForm, stepPersistRef } = useVacancyForm();

  const { control, watch, handleSubmit, setValue, getValues, resetField } =
    useSecondaryEducationForm(vacancyForm.secondaryEducation);

  const isEnabled = watch('isEnabled');
  const dataTakenFromCandidate = watch('dataTakenFromCandidate');
  const startDateValue = watch('entry.startDate');
  const endDateValue = watch('entry.endDate');
  const schoolsValue = watch('entry.schools');

  const savedEntries = vacancyForm.secondaryEducation[0]?.content ?? [];

  // ── Form field helpers ───────────────────────────────────────
  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;
  const endDateDefaultMonth = new Date(endDateValue ?? startDateValue ?? 0);

  const clearEntryData = () => {
    setValue('entry.schools', []);
    setValue('entry.schoolLocations', []);
    setValue('entry.examinations', []);
    setValue('entry.awardingBodies', []);
    setValue('entry.fieldsOfStudy', []);
    setValue('entry.grade', '');
    resetField('entry.startDate', { defaultValue: undefined });
    resetField('entry.endDate', { defaultValue: undefined });
    setValue('entry.result', '');
    setValue('entry.acceptsHomeSchooling', false);
  };

  const checkHasFilledData = (): boolean => {
    const e = getValues('entry');
    return Boolean(
      e.schools.length > 0 ||
      e.schoolLocations.length > 0 ||
      e.examinations.length > 0 ||
      e.awardingBodies.length > 0 ||
      e.fieldsOfStudy.length > 0 ||
      !!e.grade ||
      !!e.startDate ||
      !!e.endDate ||
      !!e.result ||
      e.acceptsHomeSchooling ||
      getValues('dataTakenFromCandidate')
    );
  };

  useStepGuard(
    isEnabled &&
      !dataTakenFromCandidate &&
      !checkHasFilledData() &&
      savedEntries.length === 0
  );
  useEffect(() => {
    stepPersistRef.current = () => {
      setForm(prev => ({
        ...prev,
        secondaryEducation: toSecondaryEducationPayload(getValues()),
      }));
    };
    return () => {
      stepPersistRef.current = null;
    };
  }, [getValues, setForm, stepPersistRef]);

  // ── Add-Now mutations ────────────────────────────────────────────────────
  const addExaminationMutation = useAddExaminationMutation();
  const addAwardingBodyMutation = useAddAwardingBodyMutation();
  const addFieldOfStudyMutation = useAddFieldOfStudyMutation();

  // ── Add School dialog state ──────────────────────────────────────────
  const addSchoolMutation = useAddSchoolMutation();
  const pendingSchoolsDataRef = useRef<
    Map<string, { displayValue: string; locationId?: string; url?: string }>
  >(new Map());
  const schoolsSnapshotRef = useRef<
    { value: string; label: string; source: string }[]
  >([]);
  const [addSchoolDialogOpen, setAddSchoolDialogOpen] = useState(false);
  const [pendingSchoolLabel, setPendingSchoolLabel] = useState('');
  const [schoolsSelectorKey, setSchoolsSelectorKey] = useState(0);

  // ── Disable confirmation dialog state ───────────────────────────────
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [openDatePopover, setOpenDatePopover] = useState<
    'startDate' | 'endDate' | null
  >(null);

  // ── Creatable input tracking (for character count) ────────────────────────
  const [examinationInput, setExaminationInput] = useState('');
  const [awardingBodyInput, setAwardingBodyInput] = useState('');
  const [fieldOfStudyInput, setFieldOfStudyInput] = useState('');

  // ── Refs for creatable selectors (used to commit pending input on Next) ──
  const examinationRef = useRef<MultipleSelectorRef>(null);
  const awardingBodyRef = useRef<MultipleSelectorRef>(null);
  const fieldOfStudyRef = useRef<MultipleSelectorRef>(null);

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

  // ── Async search via React Query hooks (gender pattern) ──────────────────
  const searchSchools = useSchoolsSearch();
  const searchLocations = useSchoolLocationsSearch();
  const searchExaminations = useExaminationsSearch();
  const searchAwardingBodies = useAwardingBodiesSearch();
  const searchFieldsOfStudy = useFieldsOfStudySearch();

  // ── Add-Now handler ──────────────────────────────────────────────────────
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
    fieldName:
      | 'entry.examinations'
      | 'entry.awardingBodies'
      | 'entry.fieldsOfStudy',
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

  const resolveAndCommitSchools = async () => {
    const current = getValues('entry.schools');
    const resolved: { value: string; label: string; source: string }[] = [];
    for (const school of current) {
      if (school.source === 'PENDING_TEMP') {
        const pendingData = pendingSchoolsDataRef.current.get(school.value);
        if (pendingData) {
          const created = await resolveItem(school.label, () =>
            addSchoolMutation.mutateAsync(pendingData)
          );
          if (created) {
            resolved.push(created);
            pendingSchoolsDataRef.current.delete(school.value);
          }
        }
      } else {
        resolved.push(school);
      }
    }
    setValue('entry.schools', resolved);
  };
  const handleNext = async () => {
    await resolveAndCommitSchools();
    await resolveAndCommitField(examinationRef, 'entry.examinations', label =>
      addExaminationMutation.mutateAsync(label)
    );
    await resolveAndCommitField(
      awardingBodyRef,
      'entry.awardingBodies',
      label => addAwardingBodyMutation.mutateAsync(label)
    );
    await resolveAndCommitField(fieldOfStudyRef, 'entry.fieldsOfStudy', label =>
      addFieldOfStudyMutation.mutateAsync(label)
    );
    void handleSubmit(values => {
      onNext({ secondaryEducation: toSecondaryEducationPayload(values) });
    })();
  };

  return (
    <div className="flex flex-col">
      {/* ── Informational Banner ────────────────────────────────────────── */}
      <MessageBox
        fields={[
          t('secondaryEducation.schoolName'),
          t('secondaryEducation.schoolLocation'),
          t('secondaryEducation.examination'),
          t('secondaryEducation.awardingBody'),
          t('secondaryEducation.fieldOfStudy'),
          t('secondaryEducation.grade'),
          t('secondaryEducation.startDate'),
          t('secondaryEducation.endDate'),
          t('secondaryEducation.results'),
        ]}
      />

      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-7 py-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('secondaryEducation.back')}
            className="text-slate-700 transition-colors hover:text-slate-900"
            onClick={onBack}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {t('secondaryEducation.title')}
          </h2>
        </div>
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
                'focus-visible:ring-ring/50 inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
                field.value ? 'bg-brand-primary-500' : 'bg-slate-300'
              )}
            >
              <SwitchPrimitive.Thumb
                className={cn(
                  'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
                  field.value ? 'translate-x-6' : 'translate-x-0'
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
                  id="dataTakenFromCandidate"
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
              htmlFor="dataTakenFromCandidate"
              className="cursor-pointer leading-snug"
            >
              {t('secondaryEducation.collectFromCandidates')}
            </Label>
          </div>
        </div>

        {/* ── Education Card ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
          {/* Card header — always active, chevron always muted */}
          <div className="flex items-center justify-between px-5 py-5">
            <h3 className="text-sm font-semibold text-slate-900">
              {t('secondaryEducation.sectionTitle')} 01
            </h3>
            <ChevronUpIcon className="h-5 w-5 text-slate-300" />
          </div>

          {/* Card body — always visible, disabled when toggle off or dataTakenFromCandidate */}
          <div
            className={cn(
              'flex flex-col gap-5 px-6 py-5',
              fieldsDisabled && 'pointer-events-none opacity-60'
            )}
          >
            {/* Accepts Home Schooling */}
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="entry.acceptsHomeSchooling"
                render={({ field }) => (
                  <Checkbox
                    id="acceptsHomeSchooling"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="acceptsHomeSchooling" className="cursor-pointer">
                {t('secondaryEducation.acceptsHomeSchooling')}
              </Label>
            </div>

            {/* Row 1: School Name | School Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label>{t('secondaryEducation.schoolName')}</Label>
                <Controller
                  control={control}
                  name="entry.schools"
                  render={({ field }) => (
                    <MultipleSelector
                      key={schoolsSelectorKey}
                      value={field.value}
                      onSearch={searchSchools}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('schools');
                        const newItem = options.find(o => o.value === o.label);
                        if (newItem) {
                          schoolsSnapshotRef.current =
                            getValues('entry.schools');
                          setPendingSchoolLabel(newItem.label);
                          setAddSchoolDialogOpen(true);
                        } else {
                          field.onChange(options);
                        }
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('schools')}
                      errorMessage={
                        maxReachedFields.has('schools')
                          ? t('secondaryEducation.errors.maxSelections')
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
                      placeholder={t('secondaryEducation.placeholders.school')}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label>{t('secondaryEducation.schoolLocation')}</Label>
                <Controller
                  control={control}
                  name="entry.schoolLocations"
                  render={({ field }) => (
                    <MultipleSelector
                      value={field.value}
                      onSearch={searchLocations}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('schoolLocations');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('schoolLocations')}
                      errorMessage={
                        maxReachedFields.has('schoolLocations')
                          ? t('secondaryEducation.errors.maxSelections')
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
                        'secondaryEducation.placeholders.schoolLocation'
                      )}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 2: Grade | Start Date | End Date */}
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('secondaryEducation.grade')}</Label>
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
                      placeholder={t('secondaryEducation.placeholders.grade')}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>{t('secondaryEducation.startDate')}</Label>
                </div>
                <Controller
                  control={control}
                  name="entry.startDate"
                  render={({ field }) => (
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
                            formatDate(field.value)
                          ) : (
                            <span>
                              {t('secondaryEducation.placeholders.startDate')}
                            </span>
                          )}
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
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          defaultMonth={
                            field.value ? new Date(field.value) : new Date()
                          }
                          onSelect={date => {
                            field.onChange(
                              date ? date.toISOString() : undefined
                            );
                            setOpenDatePopover(null);
                            const endDate = getValues('entry.endDate');
                            if (endDate && date && new Date(endDate) <= date) {
                              resetField('entry.endDate', {
                                defaultValue: undefined,
                              });
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
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex h-5 items-center">
                  <Label>{t('secondaryEducation.endDate')}</Label>
                </div>
                <Controller
                  control={control}
                  name="entry.endDate"
                  render={({ field }) => (
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
                            formatDate(field.value)
                          ) : (
                            <span>
                              {t('secondaryEducation.placeholders.endDate')}
                            </span>
                          )}
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
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          defaultMonth={endDateDefaultMonth}
                          onSelect={date => {
                            field.onChange(
                              date ? date.toISOString() : undefined
                            );
                            setOpenDatePopover(null);
                          }}
                          disabled={date =>
                            date < HUNDRED_YEARS_AGO ||
                            (startDateValue
                              ? date <= new Date(startDateValue)
                              : false)
                          }
                          captionLayout="dropdown"
                          startMonth={HUNDRED_YEARS_AGO}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            </div>

            {/* Row 3: Examination | Awarding Body */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('secondaryEducation.examination')}</Label>
                  <CharacterCount
                    currentLength={examinationInput.length}
                    maxLength={100}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.examinations"
                  render={({ field }) => (
                    <MultipleSelector
                      ref={examinationRef}
                      value={field.value}
                      onSearch={searchExaminations}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('examinations');
                        setExaminationInput('');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('examinations')}
                      errorMessage={
                        maxReachedFields.has('examinations')
                          ? t('secondaryEducation.errors.maxSelections')
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
                        onValueChange: val => setExaminationInput(val),
                      }}
                      placeholder={t(
                        'secondaryEducation.placeholders.examination'
                      )}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('secondaryEducation.awardingBody')}</Label>
                  <CharacterCount
                    currentLength={awardingBodyInput.length}
                    maxLength={200}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.awardingBodies"
                  render={({ field }) => (
                    <MultipleSelector
                      ref={awardingBodyRef}
                      value={field.value}
                      onSearch={searchAwardingBodies}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('awardingBodies');
                        setAwardingBodyInput('');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('awardingBodies')}
                      errorMessage={
                        maxReachedFields.has('awardingBodies')
                          ? t('secondaryEducation.errors.maxSelections')
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
                        onValueChange: val => setAwardingBodyInput(val),
                      }}
                      placeholder={t(
                        'secondaryEducation.placeholders.awardingBody'
                      )}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 4: Field of Study | Results */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('secondaryEducation.fieldOfStudy')}</Label>
                  <CharacterCount
                    currentLength={fieldOfStudyInput.length}
                    maxLength={100}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.fieldsOfStudy"
                  render={({ field }) => (
                    <MultipleSelector
                      ref={fieldOfStudyRef}
                      value={field.value}
                      onSearch={searchFieldsOfStudy}
                      onChange={options => {
                        if (options.length < MAX_SELECTIONS)
                          clearMax('fieldsOfStudy');
                        setFieldOfStudyInput('');
                        field.onChange(options);
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => setMax('fieldsOfStudy')}
                      errorMessage={
                        maxReachedFields.has('fieldsOfStudy')
                          ? t('secondaryEducation.errors.maxSelections')
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
                        onValueChange: val => setFieldOfStudyInput(val),
                      }}
                      placeholder={t(
                        'secondaryEducation.placeholders.fieldOfStudy'
                      )}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>{t('secondaryEducation.results')}</Label>
                  <Controller
                    control={control}
                    name="entry.result"
                    render={({ field }) => (
                      <CharacterCount
                        currentLength={field.value.length}
                        maxLength={1000}
                      />
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name="entry.result"
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      maxLength={1000}
                      className="min-h-42.5"
                      placeholder={t('secondaryEducation.placeholders.results')}
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

      <AddSchoolDialog
        open={addSchoolDialogOpen}
        initialName={pendingSchoolLabel}
        onClose={() => {
          setSchoolsSelectorKey(k => k + 1);
          setAddSchoolDialogOpen(false);
        }}
        onAdded={option => {
          pendingSchoolsDataRef.current.set(option.value, {
            displayValue: option.label,
            locationId: option.locationId,
            url: option.url,
          });
          setValue('entry.schools', [
            ...schoolsValue,
            { value: option.value, label: option.label, source: option.source },
          ]);
          setAddSchoolDialogOpen(false);
        }}
      />

      {/* ── Disable confirmation dialog ─────────────────────────────────── */}
      <Dialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
      >
        <DialogContent
          showCloseButton
          className="max-w-99 overflow-hidden rounded-2xl border-0 p-7"
          style={{
            background:
              'linear-gradient(90deg, rgb(254,244,238) 2%, rgb(248,242,236) 34%, rgb(233,244,240) 66%, rgb(238,247,245) 100%)',
          }}
        >
          <div className="flex flex-col items-center gap-7">
            {/* Avatar + text */}
            <div className="flex w-full flex-col items-center gap-3">
              <div className="h-25 w-25 overflow-hidden rounded-full">
                <img
                  src={deleteConfirmAvatar}
                  className="h-full w-full object-cover"
                  alt=""
                />
              </div>
              <div className="flex w-full flex-col items-center gap-2">
                <DialogTitle className="text-center text-xl font-bold text-slate-900">
                  {t('secondaryEducation.confirmDisableDialog.title')}
                </DialogTitle>
                <p className="text-center text-sm text-slate-900">
                  {t('secondaryEducation.confirmDisableDialog.message')}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex w-full gap-3">
              <Button
                className="h-12 flex-1 rounded-lg bg-[#e5e5e5] font-bold text-[#525252] hover:bg-[#d4d4d4]"
                onClick={() => setConfirmDisableOpen(false)}
              >
                {t('secondaryEducation.confirmDisableDialog.cancel')}
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
                {t('secondaryEducation.confirmDisableDialog.disable')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button variant="secondary" className="h-12 w-48" onClick={onBack}>
          {t('secondaryEducation.cancel')}
        </Button>
        <Button className="h-12 w-48" onClick={() => void handleNext()}>
          {t('secondaryEducation.next')}
        </Button>
      </div>
    </div>
  );
}
