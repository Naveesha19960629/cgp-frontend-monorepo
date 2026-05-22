import { CalendarIcon, ChevronLeftIcon, ChevronUpIcon } from 'lucide-react';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/app/components/message-box';
import { AddSchoolDialog } from '@/views/vacancies/components/form-steps/add-school-dialog';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useAddAwardingBodyMutation,
  useAddExaminationMutation,
  useAddFieldOfStudyMutation,
  useAwardingBodiesSearch,
  useExaminationsSearch,
  useFieldsOfStudySearch,
  useSchoolLocationsSearch,
  useSchoolsSearch,
  useSecondaryEducationForm,
} from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import { toSecondaryEducationPayload } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import MultipleSelector from '@cgp/ui-kit/components/multiple-selector';
import type { Option } from '@cgp/ui-kit/components/multiple-selector';
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
import { cn } from '@cgp/ui-kit/lib/utils';
import { format } from 'date-fns';
import { Switch as SwitchPrimitive } from 'radix-ui';

const MAX_SELECTIONS = 10;

function formatDate(iso?: string): string {
  if (!iso) return '';
  return format(new Date(iso), 'do MMM yyyy');
}

export default function SecondaryEducationStep({ onNext, onBack }: StepProps) {
  const { t } = useTranslation('ats');
  const { form: vacancyForm } = useVacancyForm();

  const { control, watch, handleSubmit, setValue, getValues, resetField } =
    useSecondaryEducationForm(vacancyForm.secondaryEducation);

  const isEnabled = watch('isEnabled');
  const dataTakenFromCandidate = watch('dataTakenFromCandidate');
  const startDateValue = watch('entry.startDate');
  const schoolsValue = watch('entry.schools');

  // ── Form field helpers ───────────────────────────────────────────────────
  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;

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

  // ── Add-Now mutations ────────────────────────────────────────────────────
  const addExaminationMutation = useAddExaminationMutation();
  const addAwardingBodyMutation = useAddAwardingBodyMutation();
  const addFieldOfStudyMutation = useAddFieldOfStudyMutation();

  // ── Add School dialog state ──────────────────────────────────────────
  const [addSchoolDialogOpen, setAddSchoolDialogOpen] = useState(false);
  const [pendingSchoolLabel, setPendingSchoolLabel] = useState('');

  // ── Disable confirmation dialog state ───────────────────────────────
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  // ── Creatable input tracking (for character count) ────────────────────────
  const [examinationInput, setExaminationInput] = useState('');
  const [awardingBodyInput, setAwardingBodyInput] = useState('');
  const [fieldOfStudyInput, setFieldOfStudyInput] = useState('');

  // ── Async search via React Query hooks (gender pattern) ──────────────────
  const searchSchools = useSchoolsSearch();
  const searchLocations = useSchoolLocationsSearch();
  const searchExaminations = useExaminationsSearch();
  const searchAwardingBodies = useAwardingBodiesSearch();
  const searchFieldsOfStudy = useFieldsOfStudySearch();

  // ── Add-Now handler ──────────────────────────────────────────────────────
  const handleCreatableChange = async (
    options: Option[],
    onFieldChange: (val: Option[]) => void,
    addMutation: (label: string) => Promise<{ data: { pendingId: string } }>
  ) => {
    const newItem = options.find(o => !o.id);
    if (newItem) {
      const result = await addMutation(newItem.label);
      const updated = options.map(o =>
        !o.id && o.label === newItem.label
          ? { ...o, id: result.data.pendingId, source: 'PENDING' }
          : o
      );
      onFieldChange(updated);
    } else {
      onFieldChange(options);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleNext = handleSubmit(values => {
    onNext({ secondaryEducation: toSecondaryEducationPayload(values) });
  });

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* ── Informational Banner ────────────────────────────────────────── */}
      <div className="px-6">
        <MessageBox
          title={t('secondaryEducation.bannerTitle')}
          message={
            <>
              <span className="text-brand-primary-500 font-bold">
                {t('secondaryEducation.bannerMessageHighlight')}
              </span>{' '}
              {t('secondaryEducation.bannerMessageRest')}
            </>
          }
        />
      </div>

      {/* ── Section Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6">
        <button
          type="button"
          aria-label={t('secondaryEducation.back')}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
          onClick={onBack}
        >
          <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="flex-1 text-xl font-bold text-slate-900">
          {t('secondaryEducation.title')}
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
        <div className="rounded-lg border border-slate-200 bg-white">
          {/* Card header — always active, chevron always muted */}
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              {t('secondaryEducation.sectionTitle')} 01
            </h3>
            <ChevronUpIcon className="h-5 w-5 text-slate-300" />
          </div>

          {/* Card body — always visible, disabled when toggle off or dataTakenFromCandidate */}
          <div
            className={cn(
              'flex flex-col gap-5 border-t border-slate-200 px-6 py-5',
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
                      value={field.value}
                      onSearch={searchSchools}
                      onChange={options => {
                        const newItem = options.find(o => !o.id);
                        if (newItem) {
                          setPendingSchoolLabel(newItem.label);
                          setAddSchoolDialogOpen(true);
                        } else {
                          field.onChange(options);
                        }
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => {}}
                      creatable
                      triggerSearchOnFocus
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
                      onChange={field.onChange}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => {}}
                      triggerSearchOnFocus
                      placeholder={t(
                        'secondaryEducation.placeholders.schoolLocation'
                      )}
                    />
                  )}
                />
              </div>
            </div>

            {/* Row 2: Grade | Start Date | End Date */}
            <div className="grid grid-cols-3 gap-4">
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
                      placeholder={t('secondaryEducation.placeholders.grade')}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label>{t('secondaryEducation.startDate')}</Label>
                <Controller
                  control={control}
                  name="entry.startDate"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'h-9 w-full justify-between text-left font-normal',
                            !field.value && 'text-slate-500'
                          )}
                        >
                          {field.value
                            ? formatDate(field.value)
                            : t('secondaryEducation.placeholders.startDate')}
                          <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={date => {
                            field.onChange(
                              date ? date.toISOString() : undefined
                            );
                          }}
                          disabled={date => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label>{t('secondaryEducation.endDate')}</Label>
                <Controller
                  control={control}
                  name="entry.endDate"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'h-9 w-full justify-between text-left font-normal',
                            !field.value && 'text-slate-500'
                          )}
                        >
                          {field.value
                            ? formatDate(field.value)
                            : t('secondaryEducation.placeholders.endDate')}
                          <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={date => {
                            field.onChange(
                              date ? date.toISOString() : undefined
                            );
                          }}
                          disabled={date =>
                            startDateValue
                              ? date <= new Date(startDateValue)
                              : false
                          }
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
                      value={field.value}
                      onSearch={searchExaminations}
                      onChange={options => {
                        setExaminationInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label => addExaminationMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => {}}
                      creatable
                      triggerSearchOnFocus
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
                      value={field.value}
                      onSearch={searchAwardingBodies}
                      onChange={options => {
                        setAwardingBodyInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label => addAwardingBodyMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => {}}
                      creatable
                      triggerSearchOnFocus
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
                      value={field.value}
                      onSearch={searchFieldsOfStudy}
                      onChange={options => {
                        setFieldOfStudyInput('');
                        void handleCreatableChange(
                          options,
                          field.onChange,
                          label => addFieldOfStudyMutation.mutateAsync(label)
                        );
                      }}
                      maxSelected={MAX_SELECTIONS}
                      onMaxSelected={() => {}}
                      creatable
                      triggerSearchOnFocus
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
            'flex justify-end',
            !isEnabled && 'pointer-events-none opacity-60'
          )}
        >
          <Button variant="outline" size="sm" disabled>
            + {t('secondaryEducation.addEntry')}
          </Button>
        </div>
      </div>

      <AddSchoolDialog
        open={addSchoolDialogOpen}
        initialName={pendingSchoolLabel}
        onClose={() => setAddSchoolDialogOpen(false)}
        onAdded={option => {
          setValue('entry.schools', [...schoolsValue, option]);
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
            {t('secondaryEducation.confirmDisableDialog.title')}
          </DialogTitle>

          {/* Message */}
          <p className="mb-7 text-center text-sm text-slate-900">
            {t('secondaryEducation.confirmDisableDialog.message')}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
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
        </DialogContent>
      </Dialog>

      {/* ── Step footer ──────────────────────────────────────────────────── */}
      <div className="mt-auto flex justify-end gap-4 border-t border-slate-200 px-6 pt-4">
        <Button variant="secondary" className="h-12 w-44" onClick={onBack}>
          {t('secondaryEducation.cancel')}
        </Button>
        <Button className="h-12 w-44" onClick={() => void handleNext()}>
          {t('secondaryEducation.next')}
        </Button>
      </div>
    </div>
  );
}
