import { ChevronUpIcon, Plus } from 'lucide-react';

import { ArrowLeft2, Calendar as CalendarIcon } from 'iconsax-reactjs';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Controller } from 'react-hook-form';
import type {
  Control,
  UseFormGetValues,
  UseFormResetField,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/message-box';
import { AddSchoolDialog } from '@/views/vacancies/components/form-steps/add-school-dialog';
import StepDisableDialog from '@/views/vacancies/components/step-disable-dialog';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import {
  useTemplateFieldVisible,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import {
  useAddAwardingBodyMutation,
  useAddExaminationMutation,
  useAddFieldOfStudyMutation,
  useAddSchoolMutation,
  useAwardingBodiesSearch,
  useDisableSuccessToast,
  useExaminationsQuery,
  useExaminationsSearch,
  useFieldsOfStudyQuery,
  useFieldsOfStudySearch,
  useSchoolLocationsQuery,
  useSchoolLocationsSearch,
  useSchoolsQuery,
  useSchoolsSearch,
  useSecondaryAwardingBodiesQuery,
  useSecondaryEducationForm,
  useStepGuard,
} from '@/views/vacancies/hooks';
import type { SecondaryEducationFormValues } from '@/views/vacancies/hooks';
import type { StepProps } from '@/views/vacancies/types';
import {
  formatDate,
  toSecondaryEducationPayload,
} from '@/views/vacancies/utils';
import { DATE_POPOVER } from '@/views/vacancies/utils/constants';
import {
  compareDates,
  formatLocalDate,
  getHundredYearDateBoundaries,
  parseLocalDate,
} from '@/views/vacancies/utils/date-timezone-safe';
import { computeRowStartCodes } from '@/views/vacancies/utils/field-grid-layout';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { ErrorToast } from '@cgp/ui-kit/components/custom-toast';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import type { MultipleSelectorRef } from '@cgp/ui-kit/components/multi-select';
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
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@cgp/ui-kit/components/ui/popover';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { Textarea } from '@cgp/ui-kit/components/ui/textarea';
import { createDateClearHandler } from '@cgp/ui-kit/lib/keyboard-actions';
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

/**
 * Field codes that make up the secondary-education entry. In the Use Template
 * flow the whole entry content region (card + add button) is hidden when none
 * of these are enabled by the template — see `hasAnyVisibleField`.
 */
const SECONDARY_EDUCATION_FIELD_CODES = [
  'acceptsHomeSchooling',
  'schools',
  'schoolLocations',
  'examinations',
  'secondaryAwardingBody',
  'fieldsOfStudy',
  'grade',
  'startDate',
  'endDate',
  'result',
] as const;

/**
 * Fields in the exact order they render inside the entry-card grid, with their
 * `xl` column spans. Drives the JS row-placement rule via `computeRowStartCodes`.
 */
const SECONDARY_GRID_FIELDS = [
  { code: 'acceptsHomeSchooling', span: 4 },
  { code: 'schools', span: 2 },
  { code: 'schoolLocations', span: 2 },
  { code: 'grade', span: 1 },
  { code: 'startDate', span: 1 },
  { code: 'endDate', span: 1 },
  { code: 'examinations', span: 2 },
  { code: 'secondaryAwardingBody', span: 2 },
  { code: 'fieldsOfStudy', span: 2 },
  { code: 'result', span: 2 },
] as const;

/** Shared button/trigger styling for the two date-picker fields below. */
const DATE_TRIGGER_CLASSNAME = cn(
  'border-input flex h-11 w-full min-w-0 items-center justify-between rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none hover:bg-transparent md:text-sm',
  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  'dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  applyTypography('body-medium'),
  'shadow-none!'
);

function SecondaryStartDateField({
  control,
  fieldsDisabled,
  isOpen,
  onOpenChange,
  getValues,
  resetField,
  t,
}: Readonly<{
  control: Control<SecondaryEducationFormValues>;
  fieldsDisabled: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  getValues: UseFormGetValues<SecondaryEducationFormValues>;
  resetField: UseFormResetField<SecondaryEducationFormValues>;
  t: (key: string) => string;
}>) {
  return (
    <FormField
      control={control}
      name="entries.0.startDate"
      render={({ field }) => (
        <FormItem className="flex w-full flex-col gap-1 space-y-0 xl:col-span-1">
          <div className="flex h-5 items-center">
            <FormLabel data-testid="secondaryEducation-startDate-label">
              {t('secondaryEducation.startDate')}
            </FormLabel>
          </div>
          <Popover
            modal
            open={isOpen}
            onOpenChange={open => onOpenChange(!fieldsDisabled && open)}
          >
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  onKeyDown={createDateClearHandler({
                    hasValue: !!field.value,
                    isOpen: isOpen,
                    onClear: () => field.onChange(''),
                  })}
                  type="button"
                  variant="outline"
                  disabled={fieldsDisabled}
                  className={cn(
                    DATE_TRIGGER_CLASSNAME,
                    !field.value && 'text-slate-500',
                    field.value && 'text-zinc-800'
                  )}
                >
                  {field.value ? (
                    <span className="truncate pr-2">
                      {formatDate(field.value)}
                    </span>
                  ) : (
                    <span className="truncate pr-2">
                      {t('secondaryEducation.placeholders.startDate')}
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
              aria-label={t('common.a11y.chooseDate')}
              className="w-auto p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                defaultMonth={
                  field.value
                    ? (parseLocalDate(field.value) ?? new Date())
                    : new Date()
                }
                onSelect={date => {
                  // '' rather than undefined: undefined falls back to the loaded
                  // value in edit mode, so the cleared date kept showing (DQCGP-4212).
                  field.onChange(date ? formatLocalDate(date) : '');
                  onOpenChange(false);
                  const endDate = getValues('entries.0.endDate');
                  if (endDate && date && compareDates(endDate, date) <= 0) {
                    resetField('entries.0.endDate', {
                      defaultValue: undefined,
                    });
                  }
                }}
                disabled={date => date > TODAY || date < HUNDRED_YEARS_AGO}
                captionLayout="dropdown"
                startMonth={HUNDRED_YEARS_AGO}
                endMonth={TODAY}
              />
            </PopoverContent>
          </Popover>
        </FormItem>
      )}
    />
  );
}

function SecondaryEndDateField({
  control,
  fieldsDisabled,
  isOpen,
  onOpenChange,
  minEndDate,
  endDateDefaultMonth,
  t,
}: Readonly<{
  control: Control<SecondaryEducationFormValues>;
  fieldsDisabled: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  minEndDate: Date | null;
  endDateDefaultMonth: Date;
  t: (key: string) => string;
}>) {
  return (
    <FormField
      control={control}
      name="entries.0.endDate"
      render={({ field }) => (
        <FormItem className="flex w-full flex-col gap-1 space-y-0 xl:col-span-1">
          <div className="flex h-5 items-center">
            <FormLabel data-testid="secondaryEducation-endDate-label">
              {t('secondaryEducation.endDate')}
            </FormLabel>
          </div>
          <Popover
            modal
            open={isOpen}
            onOpenChange={open => onOpenChange(!fieldsDisabled && open)}
          >
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  onKeyDown={createDateClearHandler({
                    hasValue: !!field.value,
                    isOpen: isOpen,
                    onClear: () => field.onChange(''),
                  })}
                  type="button"
                  variant="outline"
                  disabled={fieldsDisabled}
                  className={cn(
                    DATE_TRIGGER_CLASSNAME,
                    !field.value && 'text-slate-500',
                    field.value && 'text-zinc-800'
                  )}
                >
                  {field.value ? (
                    <span className="truncate pr-2">
                      {formatDate(field.value)}
                    </span>
                  ) : (
                    <span className="truncate pr-2">
                      {t('secondaryEducation.placeholders.endDate')}
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
              aria-label={t('common.a11y.chooseDate')}
              className="w-auto p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                defaultMonth={endDateDefaultMonth}
                onSelect={date => {
                  // '' rather than undefined: undefined falls back to the loaded
                  // value in edit mode, so the cleared date kept showing (DQCGP-4212).
                  field.onChange(date ? formatLocalDate(date) : '');
                  onOpenChange(false);
                }}
                disabled={date =>
                  date > HUNDRED_YEARS_FROM_NOW ||
                  (minEndDate ? compareDates(date, minEndDate) < 0 : false)
                }
                captionLayout="dropdown"
                startMonth={minEndDate ?? HUNDRED_YEARS_AGO}
                endMonth={HUNDRED_YEARS_FROM_NOW}
              />
            </PopoverContent>
          </Popover>
        </FormItem>
      )}
    />
  );
}

function SecondarySchoolsField({
  control,
  fieldsDisabled,
  colStart1,
  schoolsSelectorKey,
  searchSchools,
  getValues,
  schoolsSnapshotRef,
  setPendingSchoolLabel,
  setAddSchoolDialogOpen,
  isMaxReached,
  setMax,
  clearMax,
  t,
}: Readonly<{
  control: Control<SecondaryEducationFormValues>;
  fieldsDisabled: boolean;
  colStart1: boolean;
  schoolsSelectorKey: number;
  searchSchools: ReturnType<typeof useSchoolsSearch>;
  getValues: UseFormGetValues<SecondaryEducationFormValues>;
  schoolsSnapshotRef: RefObject<
    { value: string; label: string; source: string }[]
  >;
  setPendingSchoolLabel: (label: string) => void;
  setAddSchoolDialogOpen: (open: boolean) => void;
  isMaxReached: boolean;
  setMax: (field: string) => void;
  clearMax: (field: string) => void;
  t: (key: string) => string;
}>) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 xl:col-span-2',
        colStart1 && 'xl:col-start-1'
      )}
    >
      <Label
        data-testid="secondaryEducation-schoolName-label"
        className="truncate"
      >
        {t('secondaryEducation.schoolName')}
      </Label>
      <Controller
        control={control}
        name="entries.0.schools"
        render={({ field }) => (
          <MultipleSelector
            aria-label={t('secondaryEducation.schoolName')}
            key={schoolsSelectorKey}
            value={field.value}
            onSearch={async (search: string) => {
              const results = await searchSchools(search);
              // Filter out items already selected to prevent duplication
              const selectedValues = new Set(
                field.value.map(v => v.value.toLowerCase())
              );
              return results.filter(
                item => !selectedValues.has(item.value.toLowerCase())
              );
            }}
            onChange={options => {
              if (options.length > MAX_SELECTIONS) {
                setMax('schools');
                return;
              }
              if (options.length < MAX_SELECTIONS) clearMax('schools');
              const newItem = options.find(o => o.value === o.label);
              if (newItem) {
                schoolsSnapshotRef.current = getValues('entries.0.schools');
                setPendingSchoolLabel(newItem.label);
                setAddSchoolDialogOpen(true);
              } else {
                field.onChange(options);
              }
            }}
            maxSelected={MAX_SELECTIONS}
            onMaxSelected={() => setMax('schools')}
            errorMessage={
              isMaxReached
                ? t('secondaryEducation.errors.maxSelections')
                : undefined
            }
            creatable
            hideClearAllButton
            triggerSearchOnFocus
            keepSelectedInList
            disabled={fieldsDisabled}
            loadingIndicator={
              <p className="px-3 pb-3 text-left">{t('common.loading')}</p>
            }
            emptyIndicator={
              <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                <div className="flex flex-col items-start">
                  <img src={multiSelectInfoAvatar} alt={t('common.noData')} />
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
  );
}

function SecondarySchoolLocationsField({
  control,
  fieldsDisabled,
  colStart1,
  searchLocations,
  isMaxReached,
  setMax,
  clearMax,
  t,
}: Readonly<{
  control: Control<SecondaryEducationFormValues>;
  fieldsDisabled: boolean;
  colStart1: boolean;
  searchLocations: ReturnType<typeof useSchoolLocationsSearch>;
  isMaxReached: boolean;
  setMax: (field: string) => void;
  clearMax: (field: string) => void;
  t: (key: string) => string;
}>) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 xl:col-span-2',
        colStart1 && 'xl:col-start-1'
      )}
    >
      <Label
        data-testid="secondaryEducation-schoolLocation-label"
        className="truncate"
      >
        {t('secondaryEducation.schoolLocation')}
      </Label>
      <Controller
        control={control}
        name="entries.0.schoolLocations"
        render={({ field }) => (
          <MultipleSelector
            aria-label={t('secondaryEducation.schoolLocation')}
            value={field.value}
            onSearch={searchLocations}
            onChange={options => {
              if (options.length < MAX_SELECTIONS) clearMax('schoolLocations');
              field.onChange(options);
            }}
            showArrow
            maxSelected={MAX_SELECTIONS}
            onMaxSelected={() => setMax('schoolLocations')}
            errorMessage={
              isMaxReached
                ? t('secondaryEducation.errors.maxSelections')
                : undefined
            }
            hideClearAllButton
            triggerSearchOnFocus
            keepSelectedInList
            disabled={fieldsDisabled}
            loadingIndicator={
              <p className="px-3 pb-3 text-left">{t('common.loading')}</p>
            }
            emptyIndicator={
              <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                <div className="flex flex-col items-start">
                  <img src={multiSelectInfoAvatar} alt={t('common.noData')} />
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
            placeholder={t('secondaryEducation.placeholders.schoolLocation')}
          />
        )}
      />
    </div>
  );
}

function SecondaryExaminationsField({
  control,
  fieldsDisabled,
  colStart1,
  searchExaminations,
  examinationRef,
  examinationInput,
  setExaminationInput,
  isMaxReached,
  setMax,
  clearMax,
  t,
}: Readonly<{
  control: Control<SecondaryEducationFormValues>;
  fieldsDisabled: boolean;
  colStart1: boolean;
  searchExaminations: ReturnType<typeof useExaminationsSearch>;
  examinationRef: RefObject<MultipleSelectorRef | null>;
  examinationInput: string;
  setExaminationInput: (value: string) => void;
  isMaxReached: boolean;
  setMax: (field: string) => void;
  clearMax: (field: string) => void;
  t: (key: string) => string;
}>) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 xl:col-span-2',
        colStart1 && 'xl:col-start-1'
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <Label
          data-testid="secondaryEducation-examination-label"
          className="shrink-0"
        >
          {t('secondaryEducation.examination')}
        </Label>
        <CharacterCount
          currentLength={examinationInput.length}
          maxLength={100}
        />
      </div>
      <Controller
        control={control}
        name="entries.0.examinations"
        render={({ field }) => (
          <MultipleSelector
            aria-label={t('secondaryEducation.examination')}
            ref={examinationRef}
            value={field.value}
            onSearch={searchExaminations}
            onChange={options => {
              if (options.length > MAX_SELECTIONS) {
                setMax('examinations');
                return;
              }
              if (options.length < MAX_SELECTIONS) clearMax('examinations');
              setExaminationInput('');
              field.onChange(options);
            }}
            maxSelected={MAX_SELECTIONS}
            onMaxSelected={() => setMax('examinations')}
            errorMessage={
              isMaxReached
                ? t('secondaryEducation.errors.maxSelections')
                : undefined
            }
            creatable
            hideClearAllButton
            triggerSearchOnFocus
            keepSelectedInList
            disabled={fieldsDisabled}
            loadingIndicator={
              <p className="px-3 pb-3 text-left">{t('common.loading')}</p>
            }
            emptyIndicator={
              <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                <div className="flex flex-col items-start">
                  <img src={multiSelectInfoAvatar} alt={t('common.noData')} />
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
            placeholder={t('secondaryEducation.placeholders.examination')}
          />
        )}
      />
    </div>
  );
}

function SecondaryAwardingBodyField({
  control,
  fieldsDisabled,
  colStart1,
  searchAwardingBodies,
  awardingBodyRef,
  awardingBodyInput,
  setAwardingBodyInput,
  isMaxReached,
  setMax,
  clearMax,
  t,
}: Readonly<{
  control: Control<SecondaryEducationFormValues>;
  fieldsDisabled: boolean;
  colStart1: boolean;
  searchAwardingBodies: ReturnType<typeof useAwardingBodiesSearch>;
  awardingBodyRef: RefObject<MultipleSelectorRef | null>;
  awardingBodyInput: string;
  setAwardingBodyInput: (value: string) => void;
  isMaxReached: boolean;
  setMax: (field: string) => void;
  clearMax: (field: string) => void;
  t: (key: string) => string;
}>) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 xl:col-span-2',
        colStart1 && 'xl:col-start-1'
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <Label
          data-testid="secondaryEducation-awardingBody-label"
          className="shrink-0"
        >
          {t('secondaryEducation.awardingBody')}
        </Label>
        <CharacterCount
          currentLength={awardingBodyInput.length}
          maxLength={200}
        />
      </div>
      <Controller
        control={control}
        name="entries.0.awardingBodies"
        render={({ field }) => (
          <MultipleSelector
            aria-label={t('secondaryEducation.awardingBody')}
            ref={awardingBodyRef}
            value={field.value}
            onSearch={searchAwardingBodies}
            onChange={options => {
              if (options.length > MAX_SELECTIONS) {
                setMax('awardingBodies');
                return;
              }
              if (options.length < MAX_SELECTIONS) clearMax('awardingBodies');
              setAwardingBodyInput('');
              field.onChange(options);
            }}
            maxSelected={MAX_SELECTIONS}
            onMaxSelected={() => setMax('awardingBodies')}
            errorMessage={
              isMaxReached
                ? t('secondaryEducation.errors.maxSelections')
                : undefined
            }
            creatable
            hideClearAllButton
            triggerSearchOnFocus
            keepSelectedInList
            disabled={fieldsDisabled}
            loadingIndicator={
              <p className="px-3 pb-3 text-left">{t('common.loading')}</p>
            }
            emptyIndicator={
              <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                <div className="flex flex-col items-start">
                  <img src={multiSelectInfoAvatar} alt={t('common.noData')} />
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
            placeholder={t('secondaryEducation.placeholders.awardingBody')}
          />
        )}
      />
    </div>
  );
}

function SecondaryFieldsOfStudyField({
  control,
  fieldsDisabled,
  colStart1,
  searchFieldsOfStudy,
  fieldOfStudyRef,
  fieldOfStudyInput,
  setFieldOfStudyInput,
  isMaxReached,
  setMax,
  clearMax,
  t,
}: Readonly<{
  control: Control<SecondaryEducationFormValues>;
  fieldsDisabled: boolean;
  colStart1: boolean;
  searchFieldsOfStudy: ReturnType<typeof useFieldsOfStudySearch>;
  fieldOfStudyRef: RefObject<MultipleSelectorRef | null>;
  fieldOfStudyInput: string;
  setFieldOfStudyInput: (value: string) => void;
  isMaxReached: boolean;
  setMax: (field: string) => void;
  clearMax: (field: string) => void;
  t: (key: string) => string;
}>) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 xl:col-span-2',
        colStart1 && 'xl:col-start-1'
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <Label
          data-testid="secondaryEducation-fieldOfStudy-label"
          className="shrink-0"
        >
          {t('secondaryEducation.fieldOfStudy')}
        </Label>
        <CharacterCount
          currentLength={fieldOfStudyInput.length}
          maxLength={100}
        />
      </div>
      <Controller
        control={control}
        name="entries.0.fieldsOfStudy"
        render={({ field }) => (
          <MultipleSelector
            aria-label={t('secondaryEducation.fieldOfStudy')}
            ref={fieldOfStudyRef}
            value={field.value}
            onSearch={searchFieldsOfStudy}
            onChange={options => {
              if (options.length > MAX_SELECTIONS) {
                setMax('fieldsOfStudy');
                return;
              }
              if (options.length < MAX_SELECTIONS) clearMax('fieldsOfStudy');
              setFieldOfStudyInput('');
              field.onChange(options);
            }}
            maxSelected={MAX_SELECTIONS}
            onMaxSelected={() => setMax('fieldsOfStudy')}
            errorMessage={
              isMaxReached
                ? t('secondaryEducation.errors.maxSelections')
                : undefined
            }
            creatable
            hideClearAllButton
            triggerSearchOnFocus
            keepSelectedInList
            disabled={fieldsDisabled}
            loadingIndicator={
              <p className="px-3 pb-3 text-left">{t('common.loading')}</p>
            }
            emptyIndicator={
              <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                <div className="flex flex-col items-start">
                  <img src={multiSelectInfoAvatar} alt={t('common.noData')} />
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
            placeholder={t('secondaryEducation.placeholders.fieldOfStudy')}
          />
        )}
      />
    </div>
  );
}

export default function SecondaryEducationStep({
  onNext,
  onBack,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const isFieldVisible = useTemplateFieldVisible('secondaryEducation');
  const {
    form: vacancyForm,
    setForm,
    onCancel,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();

  const form = useSecondaryEducationForm(vacancyForm.secondaryEducation);
  const { control, watch, handleSubmit, setValue, getValues, resetField } =
    form;

  const isEnabled = watch('isEnabled');
  const dataTakenFromCandidate = watch('dataTakenFromCandidate');
  const entryValue = watch('entries.0');
  const startDateValue = entryValue.startDate;
  const endDateValue = entryValue.endDate;
  const schoolsValue = entryValue.schools;

  // -- Form field helpers ---------------------------------------
  const fieldsDisabled = !isEnabled || dataTakenFromCandidate;
  const hasAnyVisibleField = SECONDARY_EDUCATION_FIELD_CODES.some(code =>
    isFieldVisible(code)
  );
  const rowStartCodes = computeRowStartCodes(
    SECONDARY_GRID_FIELDS,
    isFieldVisible
  );
  const endDateDefaultMonth =
    parseLocalDate(endDateValue ?? startDateValue) ?? new Date();
  let parsedStartDate: Date | null = null;
  if (startDateValue) {
    parsedStartDate = parseLocalDate(startDateValue);
  }

  let minEndDate: Date | null = null;
  if (parsedStartDate) {
    minEndDate = new Date(
      parsedStartDate.getFullYear(),
      parsedStartDate.getMonth(),
      parsedStartDate.getDate() + 1
    );
  }

  const clearEntryData = () => {
    setValue('entries.0.schools', []);
    setValue('entries.0.schoolLocations', []);
    setValue('entries.0.examinations', []);
    setValue('entries.0.awardingBodies', []);
    setValue('entries.0.fieldsOfStudy', []);
    setValue('entries.0.grade', '');
    setValue('entries.0.startDate', '');
    setValue('entries.0.endDate', '');
    setValue('entries.0.result', '');
    setValue('entries.0.acceptsHomeSchooling', false);
  };

  const hasEntryData = (): boolean => {
    const e = getValues('entries.0');
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
      e.acceptsHomeSchooling === true
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
        secondaryEducation: toSecondaryEducationPayload(getValues()),
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
        secondaryEducation: [
          { isEnabled: false, dataTakenFromCandidate: false, content: [] },
        ],
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  // -- Add-Now mutations ----------------------------------------------------
  const addExaminationMutation = useAddExaminationMutation();
  const addAwardingBodyMutation = useAddAwardingBodyMutation();
  const addFieldOfStudyMutation = useAddFieldOfStudyMutation();

  // -- Add School dialog state ------------------------------------------
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

  // -- Disable confirmation dialog state -------------------------------
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);
  const [openDatePopover, setOpenDatePopover] = useState<
    'startDate' | 'endDate' | null
  >(null);

  // -- Creatable input tracking (for character count) ------------------------
  const [examinationInput, setExaminationInput] = useState('');
  const [awardingBodyInput, setAwardingBodyInput] = useState('');
  const [fieldOfStudyInput, setFieldOfStudyInput] = useState('');

  // Mirrors each combobox's own clear-on-disable behaviour (DQCGP-2866) for
  // these step-level search-text states, which also drive the character
  // counters next to their labels. Adjusted during render (not an effect)
  // per https://react.dev/learn/you-might-not-need-an-effect.
  const [prevFieldsDisabled, setPrevFieldsDisabled] = useState(fieldsDisabled);
  if (fieldsDisabled !== prevFieldsDisabled) {
    setPrevFieldsDisabled(fieldsDisabled);
    if (fieldsDisabled) {
      setExaminationInput('');
      setAwardingBodyInput('');
      setFieldOfStudyInput('');
    }
  }

  // -- Refs for creatable selectors (used to commit pending input on Next) --
  const examinationRef = useRef<MultipleSelectorRef>(null);
  const awardingBodyRef = useRef<MultipleSelectorRef>(null);
  const fieldOfStudyRef = useRef<MultipleSelectorRef>(null);
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

  // -- Async search via React Query hooks (gender pattern) ------------------
  const searchSchools = useSchoolsSearch();
  const searchLocations = useSchoolLocationsSearch();
  const searchExaminations = useExaminationsSearch();
  const searchAwardingBodies = useAwardingBodiesSearch();
  const searchFieldsOfStudy = useFieldsOfStudySearch();

  // Preload lookup data for edit mode to populate cache for search results
  useSchoolsQuery('');
  useSchoolLocationsQuery('');
  useExaminationsQuery('');
  useSecondaryAwardingBodiesQuery('');
  useFieldsOfStudyQuery('');

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
        | 'entries.0.schools'
        | 'entries.0.examinations'
        | 'entries.0.awardingBodies'
        | 'entries.0.fieldsOfStudy',
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

        const options = await searchFn(item.value);
        const match = findMatchedOption(options, item.value);

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
      const fieldName = 'entries.0.schoolLocations' as const;
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

        const options = await searchLocations(item.value);
        const match = findMatchedOption(options, item.value);

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
        resolveSelectionsWithSource('entries.0.schools', searchSchools),
        resolveLocationSelections(),
        resolveSelectionsWithSource(
          'entries.0.examinations',
          searchExaminations
        ),
        resolveSelectionsWithSource(
          'entries.0.awardingBodies',
          searchAwardingBodies
        ),
        resolveSelectionsWithSource(
          'entries.0.fieldsOfStudy',
          searchFieldsOfStudy
        ),
      ]);
    };

    void resolveAllLabels();
  }, [
    getValues,
    searchAwardingBodies,
    searchExaminations,
    searchFieldsOfStudy,
    searchLocations,
    searchSchools,
    setValue,
  ]);

  // -- Add-Now handler ------------------------------------------------------
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
      | 'entries.0.examinations'
      | 'entries.0.awardingBodies'
      | 'entries.0.fieldsOfStudy',
    addMutation: (label: string) => Promise<{ data: { pendingId: string } }>
  ) => {
    const input = ref.current?.input.value.trim();
    let current = getValues(fieldName);
    const maxFieldByName = {
      'entries.0.examinations': 'examinations',
      'entries.0.awardingBodies': 'awardingBodies',
      'entries.0.fieldsOfStudy': 'fieldsOfStudy',
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

  const resolveAndCommitSchools = async () => {
    const current = getValues('entries.0.schools');
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
    setValue('entries.0.schools', resolved);
  };
  const handleNext = async () => {
    if (isEnabled && !dataTakenFromCandidate && !hasEntryData()) {
      setEmptyDisableOpen(true);
      return;
    }

    await resolveAndCommitSchools();
    await resolveAndCommitField(
      examinationRef,
      'entries.0.examinations',
      label => addExaminationMutation.mutateAsync(label)
    );
    await resolveAndCommitField(
      awardingBodyRef,
      'entries.0.awardingBodies',
      label => addAwardingBodyMutation.mutateAsync(label)
    );
    await resolveAndCommitField(
      fieldOfStudyRef,
      'entries.0.fieldsOfStudy',
      label => addFieldOfStudyMutation.mutateAsync(label)
    );
    void handleSubmit(values => {
      onNext({ secondaryEducation: toSecondaryEducationPayload(values) });
    })();
  };

  const handleBack = () => {
    setForm(prev => ({
      ...prev,
      secondaryEducation: toSecondaryEducationPayload(getValues()),
    }));
    onBack();
  };

  return (
    <Form {...form}>
      <div
        data-testid="secondaryEducation-section-form"
        className="flex min-h-full flex-1 flex-col"
      >
        {/* -- Informational Banner ------------------------------------------ */}
        <MessageBox
          fields={[
            t('secondaryEducation.school'),
            t('secondaryEducation.schoolLocation'),
            t('secondaryEducation.examination'),
            t('secondaryEducation.startDate'),
            t('secondaryEducation.endDate'),
          ]}
        />

        {/* -- Section Header -------------------------------------------- */}
        <div className="flex items-center justify-between px-7 py-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t('secondaryEducation.back')}
              disabled={shouldDisableNavigation}
              className="cursor-pointer text-slate-700 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleBack}
            >
              <ArrowLeft2 size={24} />
            </button>
            <h2
              data-testid="secondaryEducation-header-label"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              {t('secondaryEducation.title')}
            </h2>
            {mode === 'edit' && vacancyForm.status ? (
              <VacancyStatusBadge
                status={vacancyForm.status}
                applicantCount={vacancyForm.applicantCount}
              />
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
                id="dataTakenFromCandidate"
                checked={field.value}
                disabled={!isEnabled}
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
            htmlFor="dataTakenFromCandidate"
            data-testid="secondaryEducation-collectFromCandidates-label"
            className="cursor-pointer leading-snug"
          >
            {t('secondaryEducation.collectFromCandidates')}
          </Label>
        </div>

        {hasAnyVisibleField && (
          <div className="flex flex-col gap-4 px-6">
            {/* dataTakenFromCandidate � grayed when toggle off */}

            {/* -- Education Card -------------------------------------------- */}
            <div className="rounded-xl border border-neutral-300 bg-white shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]">
              {/* Card header � always active, chevron always muted */}
              <div className="flex items-center justify-between px-5 py-5">
                <h3
                  data-testid="secondaryEducation-sectionTitle-label"
                  className="text-sm font-semibold text-slate-900"
                >
                  {t('secondaryEducation.sectionTitle')} 01
                </h3>
                <ChevronUpIcon className="h-5 w-5 text-slate-300" />
              </div>

              {/* Card body � always visible, disabled when toggle off or dataTakenFromCandidate */}
              <div
                className={cn(
                  'flex flex-col gap-5 px-6 py-5',
                  fieldsDisabled && 'pointer-events-none opacity-60'
                )}
              >
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                  {/* Accepts Home Schooling */}
                  {isFieldVisible('acceptsHomeSchooling') && (
                    <div className="flex items-center gap-2 xl:col-span-4">
                      <Controller
                        control={control}
                        name="entries.0.acceptsHomeSchooling"
                        render={({ field }) => (
                          <Checkbox
                            id="acceptsHomeSchooling"
                            checked={field.value}
                            disabled={fieldsDisabled}
                            onCheckedChange={newValue =>
                              field.onChange(newValue === true)
                            }
                          />
                        )}
                      />
                      <Label
                        htmlFor="acceptsHomeSchooling"
                        data-testid="secondaryEducation-acceptsHomeSchooling-label"
                        className="cursor-pointer"
                      >
                        {t('secondaryEducation.acceptsHomeSchooling')}
                      </Label>
                    </div>
                  )}

                  {isFieldVisible('schools') && (
                    <SecondarySchoolsField
                      control={control}
                      fieldsDisabled={fieldsDisabled}
                      colStart1={rowStartCodes.has('schools')}
                      schoolsSelectorKey={schoolsSelectorKey}
                      searchSchools={searchSchools}
                      getValues={getValues}
                      schoolsSnapshotRef={schoolsSnapshotRef}
                      setPendingSchoolLabel={setPendingSchoolLabel}
                      setAddSchoolDialogOpen={setAddSchoolDialogOpen}
                      isMaxReached={maxReachedFields.has('schools')}
                      setMax={setMax}
                      clearMax={clearMax}
                      t={t}
                    />
                  )}

                  {isFieldVisible('schoolLocations') && (
                    <SecondarySchoolLocationsField
                      control={control}
                      fieldsDisabled={fieldsDisabled}
                      colStart1={rowStartCodes.has('schoolLocations')}
                      searchLocations={searchLocations}
                      isMaxReached={maxReachedFields.has('schoolLocations')}
                      setMax={setMax}
                      clearMax={clearMax}
                      t={t}
                    />
                  )}

                  {isFieldVisible('grade') && (
                    <div className="flex min-w-0 flex-col gap-1 xl:col-span-1">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <Label
                          data-testid="secondaryEducation-grade-label"
                          className="shrink-0"
                        >
                          {t('secondaryEducation.grade')}
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
                            disabled={fieldsDisabled}
                            className="h-11"
                            placeholder={t(
                              'secondaryEducation.placeholders.grade'
                            )}
                          />
                        )}
                      />
                    </div>
                  )}

                  {isFieldVisible('startDate') && (
                    <SecondaryStartDateField
                      control={control}
                      fieldsDisabled={fieldsDisabled}
                      isOpen={openDatePopover === DATE_POPOVER.startDate}
                      onOpenChange={open =>
                        setOpenDatePopover(open ? DATE_POPOVER.startDate : null)
                      }
                      getValues={getValues}
                      resetField={resetField}
                      t={t}
                    />
                  )}

                  {isFieldVisible('endDate') && (
                    <SecondaryEndDateField
                      control={control}
                      fieldsDisabled={fieldsDisabled}
                      isOpen={openDatePopover === DATE_POPOVER.endDate}
                      onOpenChange={open =>
                        setOpenDatePopover(open ? DATE_POPOVER.endDate : null)
                      }
                      minEndDate={minEndDate}
                      endDateDefaultMonth={endDateDefaultMonth}
                      t={t}
                    />
                  )}

                  {isFieldVisible('examinations') && (
                    <SecondaryExaminationsField
                      control={control}
                      fieldsDisabled={fieldsDisabled}
                      colStart1={rowStartCodes.has('examinations')}
                      searchExaminations={searchExaminations}
                      examinationRef={examinationRef}
                      examinationInput={examinationInput}
                      setExaminationInput={setExaminationInput}
                      isMaxReached={maxReachedFields.has('examinations')}
                      setMax={setMax}
                      clearMax={clearMax}
                      t={t}
                    />
                  )}

                  {isFieldVisible('secondaryAwardingBody') && (
                    <SecondaryAwardingBodyField
                      control={control}
                      fieldsDisabled={fieldsDisabled}
                      colStart1={rowStartCodes.has('secondaryAwardingBody')}
                      searchAwardingBodies={searchAwardingBodies}
                      awardingBodyRef={awardingBodyRef}
                      awardingBodyInput={awardingBodyInput}
                      setAwardingBodyInput={setAwardingBodyInput}
                      isMaxReached={maxReachedFields.has('awardingBodies')}
                      setMax={setMax}
                      clearMax={clearMax}
                      t={t}
                    />
                  )}

                  {isFieldVisible('fieldsOfStudy') && (
                    <SecondaryFieldsOfStudyField
                      control={control}
                      fieldsDisabled={fieldsDisabled}
                      colStart1={rowStartCodes.has('fieldsOfStudy')}
                      searchFieldsOfStudy={searchFieldsOfStudy}
                      fieldOfStudyRef={fieldOfStudyRef}
                      fieldOfStudyInput={fieldOfStudyInput}
                      setFieldOfStudyInput={setFieldOfStudyInput}
                      isMaxReached={maxReachedFields.has('fieldsOfStudy')}
                      setMax={setMax}
                      clearMax={clearMax}
                      t={t}
                    />
                  )}

                  {isFieldVisible('result') && (
                    <div
                      className={cn(
                        'flex min-w-0 flex-col gap-1 xl:col-span-2',
                        rowStartCodes.has('result') && 'xl:col-start-1'
                      )}
                    >
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <Label
                          data-testid="secondaryEducation-results-label"
                          className="shrink-0"
                        >
                          {t('secondaryEducation.results')}
                        </Label>
                        <Controller
                          control={control}
                          name="entries.0.result"
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
                        name="entries.0.result"
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            maxLength={1000}
                            disabled={fieldsDisabled}
                            className="min-h-42.5"
                            placeholder={t(
                              'secondaryEducation.placeholders.results'
                            )}
                          />
                        )}
                      />
                    </div>
                  )}
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
        )}

        <AddSchoolDialog
          open={addSchoolDialogOpen}
          initialName={pendingSchoolLabel}
          onClose={() => {
            setAddSchoolDialogOpen(false);
            setPendingSchoolLabel('');
            setSchoolsSelectorKey(k => k + 1);
          }}
          onAdded={option => {
            // Validation guard: only add if location is provided
            if (!option.locationId) {
              return;
            }

            const currentSchools = getValues('entries.0.schools');

            // Check for case-insensitive duplicate: same name + same location
            const normalizedNewLabel = option.label.trim().toLowerCase();
            const isDuplicate = currentSchools.some(
              school => school.label.trim().toLowerCase() === normalizedNewLabel
            );

            if (isDuplicate) {
              // Item already exists, don't add
              setAddSchoolDialogOpen(false);
              setPendingSchoolLabel('');
              setSchoolsSelectorKey(k => k + 1);
              return;
            }

            if (currentSchools.length >= MAX_SELECTIONS) {
              setMax('schools');
              setAddSchoolDialogOpen(false);
              return;
            }

            pendingSchoolsDataRef.current.set(option.value, {
              displayValue: option.label,
              locationId: option.locationId,
              url: option.url,
            });
            setValue('entries.0.schools', [
              ...schoolsValue,
              {
                value: option.value,
                label: option.label,
                source: option.source,
              },
            ]);
            setSchoolsSelectorKey(k => k + 1);
            setAddSchoolDialogOpen(false);
            setPendingSchoolLabel('');
          }}
        />

        <StepDisableDialog
          open={confirmDisableOpen}
          onOpenChange={setConfirmDisableOpen}
          title={t('secondaryEducation.confirmDisableDialog.title')}
          description={t('secondaryEducation.confirmDisableDialog.message')}
          confirmLabel={t('secondaryEducation.confirmDisableDialog.disable')}
          onConfirm={() => {
            clearEntryData();
            setValue('dataTakenFromCandidate', false);
            setValue('isEnabled', false);
            removeCompletedStep(currentStepIndex);
            setConfirmDisableOpen(false);
            showDisableToast(t('secondaryEducation.sectionTitle'));
          }}
        />

        <StepDisableDialog
          open={emptyDisableOpen}
          onOpenChange={setEmptyDisableOpen}
          title={t('secondaryEducation.emptyDisableDialog.title')}
          description={t('secondaryEducation.emptyDisableDialog.message')}
          confirmLabel={t('secondaryEducation.emptyDisableDialog.disable')}
          onConfirm={() => {
            clearEntryData();
            setValue('dataTakenFromCandidate', false);
            setValue('isEnabled', false);
            setEmptyDisableOpen(false);
            showDisableToast(t('secondaryEducation.sectionTitle'));
            void handleSubmit(values => {
              onNext({
                secondaryEducation: toSecondaryEducationPayload(values),
              });
            })();
          }}
        />

        {/* -- Step footer ---------------------------------------------------- */}
        <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
          <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
            {t('secondaryEducation.cancel')}
          </Button>
          <Button
            className="h-12 w-48"
            disabled={shouldDisableNavigation}
            onClick={() => void handleNext()}
          >
            {t('secondaryEducation.next')}
          </Button>
        </div>
      </div>
    </Form>
  );
}
