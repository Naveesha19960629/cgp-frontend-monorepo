import { Plus, X } from 'lucide-react';

import { ArrowDown2, ArrowLeft2, Simcard2, Trash } from 'iconsax-reactjs';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StepDisableDialog } from '@/views/vacancies';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import { useStepGuard } from '@/views/vacancies/hooks';
import { useDisableSuccessToast } from '@/views/vacancies/hooks';
import type {
  CustomizableFormData,
  CustomizableFormFormCard,
  StepProps,
  VacancyForm,
} from '@/views/vacancies/types';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { ErrorToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cgp/ui-kit/components/ui/select';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';

// ── UI-only state types (not API types) ──────────────────────────────────────

type QuestionType =
  | 'SHORT_ANSWER'
  | 'PARAGRAPH'
  | 'MULTIPLE_CHOICE'
  | 'CHECKBOXES'
  | 'DROPDOWN'
  | 'LINEAR_SCALE';

interface QuestionOption {
  id: number;
  value: string;
}

interface Question {
  id: number;
  text: string;
  type: QuestionType | '';
  required: boolean;
  options: QuestionOption[];
  from: number;
  to: number;
  startLabel: string;
  endLabel: string;
}

interface FormCard {
  id: number;
  title: string;
  isOpen: boolean;
  questions: Question[];
  nextQuestionId: number;
  nextOptionId: number;
}

// ── Factories ────────────────────────────────────────────────────────────────

const createQuestion = (id: number): Question => ({
  id,
  text: '',
  type: '',
  required: false,
  options: [{ id: 1, value: '' }],
  from: 0,
  to: 2,
  startLabel: '',
  endLabel: '',
});

const createForm = (id: number): FormCard => ({
  id,
  title: '',
  isOpen: true,
  questions: [createQuestion(1)],
  nextQuestionId: 2,
  nextOptionId: 2,
});

const toFormCard = (savedForm: CustomizableFormFormCard): FormCard => {
  const maxQuestionId = Math.max(...savedForm.questions.map(q => q.id), 0);
  const maxOptionId = Math.max(
    ...savedForm.questions.flatMap(q => q.options.map(o => o.id)),
    0
  );

  return {
    id: savedForm.id,
    title: savedForm.title,
    isOpen: true,
    questions: savedForm.questions,
    nextQuestionId: maxQuestionId + 1,
    nextOptionId: maxOptionId + 1,
  };
};

const getInitialForms = (savedData?: CustomizableFormData): FormCard[] => {
  if (savedData?.forms?.length) {
    return savedData.forms.map(toFormCard);
  }

  return [createForm(1)];
};

const getNextFormId = (currentForms: FormCard[]): number =>
  Math.max(...currentForms.map(f => f.id), 0) + 1;

// ── Scale range options ────────────────────────────────────────────────────────
const SCALE_RANGE_START = [0, 1];
const SCALE_RANGE_END = [2, 3, 4, 5, 6, 7, 8, 9, 10];

// ── Character limits ────────────────────────────────────────────────────────────
const QUESTION_MAX = 150;

const OPTION_MAX = 80;
const START_END_MAX = 80;

// ── Validation limits ───────────────────────────────────────────────────────────
const MAX_FORMS = 5;
const MAX_QUESTIONS = 10;
const MAX_OPTIONS = 5;
const MIN_OPTIONS = 2;
const SECTION_TITLE_MAX = 200;
const FORM_TITLE_MAX = 150;

// ── Validation helpers (UI-only, pure) ───────────────────────────────────────────
const isChoiceType = (type: QuestionType | ''): boolean =>
  type === 'MULTIPLE_CHOICE' || type === 'CHECKBOXES' || type === 'DROPDOWN';

// A question is empty when it has no user input at all: no text, no selected
// type, the Required toggle off, and no option values or scale labels. (Option
// values / scale labels are checked too so a question loaded with that data but
// an unrecognized type — normalized to '' — is still treated as non-empty.)
const isQuestionEmpty = (q: Question): boolean =>
  q.text.trim() === '' &&
  q.type === '' &&
  q.required === false &&
  q.options.every(o => o.value.trim() === '') &&
  q.startLabel.trim() === '' &&
  q.endLabel.trim() === '';

// A form is empty when it has no title and every question is empty.
const isFormEmpty = (form: FormCard): boolean =>
  form.title.trim() === '' && form.questions.every(isQuestionEmpty);

// Duplicate option detection: case-insensitive, trimmed, ignoring blanks,
// only among options belonging to the same question.
const hasDuplicateOptionValues = (q: Question): boolean => {
  if (!isChoiceType(q.type)) return false;
  const seen = new Set<string>();
  for (const opt of q.options) {
    const value = opt.value.trim().toLowerCase();
    if (value === '') continue;
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
};

// ── QuestionCard ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question;
  nextOptionId: number;
  onUpdate: (updated: Question) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onNextOptionId: (n: number) => void;
  isDeleteDisabled: boolean;
  isDuplicateDisabled: boolean;
  showValidation: boolean;
}

function QuestionCard({
  question,
  nextOptionId,
  onUpdate,
  onDuplicate,
  onRemove,
  onNextOptionId,
  isDeleteDisabled,
  isDuplicateDisabled,
  showValidation,
}: Readonly<QuestionCardProps>) {
  const { t } = useTranslation('ats');

  const set = (patch: Partial<Question>) => onUpdate({ ...question, ...patch });

  // Option ids whose (normalized) value collides with another option in this
  // question — used to highlight and focus duplicates on validation.
  const duplicateOptionIds = (() => {
    const counts = new Map<string, number>();
    question.options.forEach(o => {
      const v = o.value.trim().toLowerCase();
      if (v !== '') counts.set(v, (counts.get(v) ?? 0) + 1);
    });
    return new Set(
      question.options
        .filter(o => {
          const v = o.value.trim().toLowerCase();
          return v !== '' && (counts.get(v) ?? 0) > 1;
        })
        .map(o => o.id)
    );
  })();

  // An option field is invalid when it is a mandatory (first MIN_OPTIONS) blank
  // field, or its value duplicates another option in the same question.
  const isOptionInvalid = (opt: QuestionOption, optIdx: number): boolean =>
    showValidation &&
    ((optIdx < MIN_OPTIONS && opt.value.trim() === '') ||
      duplicateOptionIds.has(opt.id));

  // Changing the question type pads option-based types to the minimum number of
  // option fields and clears option values when switching to a non-option type.
  const changeType = (val: string) => {
    const newType = val as QuestionType;
    const willBeChoice = isChoiceType(newType);
    const wasChoice = isChoiceType(question.type);

    if (willBeChoice) {
      let options = question.options;
      if (options.length < MIN_OPTIONS) {
        const additions: QuestionOption[] = [];
        let nid = nextOptionId;
        for (let i = options.length; i < MIN_OPTIONS; i += 1) {
          additions.push({ id: nid, value: '' });
          nid += 1;
        }
        options = [...options, ...additions];
        onNextOptionId(nid);
      }
      onUpdate({ ...question, type: newType, options });
      return;
    }

    onUpdate({
      ...question,
      type: newType,
      options: wasChoice ? [] : question.options,
    });
  };

  const addOption = () => {
    if (question.options.length >= MAX_OPTIONS) {
      ErrorToast({
        title: t('customizableForm.errors.errorTitle'),
        description: t('customizableForm.errors.maxOptionsExceeded'),
      });
      return;
    }
    onUpdate({
      ...question,
      options: [...question.options, { id: nextOptionId, value: '' }],
    });
    onNextOptionId(nextOptionId + 1);
  };

  const removeOption = (optId: number) => {
    if (question.options.length <= MIN_OPTIONS) return;
    onUpdate({
      ...question,
      options: question.options.filter(o => o.id !== optId),
    });
  };

  const updateOption = (optId: number, value: string) => {
    onUpdate({
      ...question,
      options: question.options.map(o =>
        o.id === optId ? { ...o, value } : o
      ),
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-neutral-300 bg-neutral-100 p-6">
      {/* Question + Type row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Question text */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-900">
              {t('customizableForm.question.questionLabel')}
              <span className="ml-0.5 text-red-500">*</span>
            </label>
            <CharacterCount
              maxLength={QUESTION_MAX}
              currentLength={question.text.length}
            />
          </div>
          <input
            type="text"
            maxLength={QUESTION_MAX}
            value={question.text}
            data-invalid={
              showValidation && question.text.trim() === '' ? 'true' : undefined
            }
            placeholder={t('customizableForm.question.questionPlaceholder')}
            onChange={e => set({ text: removeEmoji(e.target.value) })}
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none"
          />
          {showValidation && question.text.trim() === '' && (
            <p className="text-[13px] text-[#FF4A55]">
              {t('customizableForm.errors.requiredQuestion')}
            </p>
          )}
        </div>

        {/* Type */}
        <div
          className="flex flex-col gap-1.5"
          data-invalid={
            showValidation && question.type === '' ? 'true' : undefined
          }
        >
          <label className="text-sm font-semibold text-slate-900">
            {t('customizableForm.question.typeLabel')}
            <span className="ml-0.5 text-red-500">*</span>
          </label>
          <Select value={question.type} onValueChange={changeType}>
            <SelectTrigger className="!h-11 w-full bg-white shadow-none">
              <SelectValue
                placeholder={t('customizableForm.question.typePlaceholder')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SHORT_ANSWER">
                {t('customizableForm.question.types.shortAnswer')}
              </SelectItem>
              <SelectItem value="PARAGRAPH">
                {t('customizableForm.question.types.paragraph')}
              </SelectItem>
              <SelectItem value="MULTIPLE_CHOICE">
                {t('customizableForm.question.types.multipleChoice')}
              </SelectItem>
              <SelectItem value="CHECKBOXES">
                {t('customizableForm.question.types.checkboxes')}
              </SelectItem>
              <SelectItem value="DROPDOWN">
                {t('customizableForm.question.types.dropDown')}
              </SelectItem>
              <SelectItem value="LINEAR_SCALE">
                {t('customizableForm.question.types.linearScale')}
              </SelectItem>
            </SelectContent>
          </Select>
          {showValidation && question.type === '' && (
            <p className="text-[13px] text-[#FF4A55]">
              {t('customizableForm.errors.requiredType')}
            </p>
          )}
        </div>
      </div>

      {/* Multiple Choice options */}
      {question.type === 'MULTIPLE_CHOICE' && (
        <div className="mt-4 rounded-xl border border-neutral-300 bg-white p-5">
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((opt, optIdx) => (
              <div key={opt.id} className="flex flex-col gap-1.5">
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">
                        {`Option ${String(optIdx + 1).padStart(2, '0')}`}
                        {optIdx < MIN_OPTIONS && (
                          <span className="ml-0.5 text-red-500">*</span>
                        )}
                      </span>
                      <CharacterCount
                        maxLength={OPTION_MAX}
                        currentLength={opt.value.length}
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={OPTION_MAX}
                      value={opt.value}
                      data-invalid={
                        isOptionInvalid(opt, optIdx) ? 'true' : undefined
                      }
                      onChange={e =>
                        updateOption(opt.id, removeEmoji(e.target.value))
                      }
                      placeholder={t('customizableForm.question.enterOption')}
                      className={`h-11 w-full rounded-md border ${
                        showValidation && duplicateOptionIds.has(opt.id)
                          ? 'border-[#FF4A55]'
                          : 'border-slate-200'
                      } bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none`}
                    />
                  </div>
                  {optIdx >= MIN_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-neutral-600 transition-colors hover:border-red-300 hover:text-red-500"
                      aria-label="Remove option"
                    >
                      <X className="size-6" />
                    </button>
                  )}
                </div>
                {showValidation &&
                  opt.value.trim() === '' &&
                  optIdx < MIN_OPTIONS && (
                    <p className="text-[13px] text-[#FF4A55]">
                      {t('customizableForm.errors.requiredOption')}
                    </p>
                  )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg bg-neutral-200 px-8 text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-300"
              onClick={addOption}
            >
              <Plus className="size-5" />
              {t('customizableForm.question.addOption')}
            </button>
          </div>
        </div>
      )}

      {/* Checkboxes options */}
      {question.type === 'CHECKBOXES' && (
        <div className="mt-4 rounded-xl border border-neutral-300 bg-white p-5">
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((opt, optIdx) => (
              <div key={opt.id} className="flex flex-col gap-1.5">
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">
                        {`Option ${String(optIdx + 1).padStart(2, '0')}`}
                        {optIdx < MIN_OPTIONS && (
                          <span className="ml-0.5 text-red-500">*</span>
                        )}
                      </span>
                      <CharacterCount
                        maxLength={OPTION_MAX}
                        currentLength={opt.value.length}
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={OPTION_MAX}
                      value={opt.value}
                      data-invalid={
                        isOptionInvalid(opt, optIdx) ? 'true' : undefined
                      }
                      onChange={e =>
                        updateOption(opt.id, removeEmoji(e.target.value))
                      }
                      placeholder={t('customizableForm.question.enterOption')}
                      className={`h-11 w-full rounded-md border ${
                        showValidation && duplicateOptionIds.has(opt.id)
                          ? 'border-[#FF4A55]'
                          : 'border-slate-200'
                      } bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none`}
                    />
                  </div>
                  {optIdx >= MIN_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-neutral-600 transition-colors hover:border-red-300 hover:text-red-500"
                      aria-label="Remove option"
                    >
                      <X className="size-6" />
                    </button>
                  )}
                </div>
                {showValidation &&
                  opt.value.trim() === '' &&
                  optIdx < MIN_OPTIONS && (
                    <p className="text-[13px] text-[#FF4A55]">
                      {t('customizableForm.errors.requiredOption')}
                    </p>
                  )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg bg-neutral-200 px-8 text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-300"
              onClick={addOption}
            >
              <Plus className="size-5" />
              {t('customizableForm.question.addOption')}
            </button>
          </div>
        </div>
      )}

      {/* Drop Down options */}
      {question.type === 'DROPDOWN' && (
        <div className="mt-4 rounded-xl border border-neutral-300 bg-white p-5">
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((opt, optIdx) => (
              <div key={opt.id} className="flex flex-col gap-1.5">
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">
                        {`Option ${String(optIdx + 1).padStart(2, '0')}`}
                        {optIdx < MIN_OPTIONS && (
                          <span className="ml-0.5 text-red-500">*</span>
                        )}
                      </span>
                      <CharacterCount
                        maxLength={OPTION_MAX}
                        currentLength={opt.value.length}
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={OPTION_MAX}
                      value={opt.value}
                      data-invalid={
                        isOptionInvalid(opt, optIdx) ? 'true' : undefined
                      }
                      onChange={e =>
                        updateOption(opt.id, removeEmoji(e.target.value))
                      }
                      placeholder={t('customizableForm.question.enterOption')}
                      className={`h-11 w-full rounded-md border ${
                        showValidation && duplicateOptionIds.has(opt.id)
                          ? 'border-[#FF4A55]'
                          : 'border-slate-200'
                      } bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none`}
                    />
                  </div>
                  {optIdx >= MIN_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-neutral-600 transition-colors hover:border-red-300 hover:text-red-500"
                      aria-label="Remove option"
                    >
                      <X className="size-6" />
                    </button>
                  )}
                </div>
                {showValidation &&
                  opt.value.trim() === '' &&
                  optIdx < MIN_OPTIONS && (
                    <p className="text-[13px] text-[#FF4A55]">
                      {t('customizableForm.errors.requiredOption')}
                    </p>
                  )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg bg-neutral-200 px-8 text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-300"
              onClick={addOption}
            >
              <Plus className="size-5" />
              {t('customizableForm.question.addOption')}
            </button>
          </div>
        </div>
      )}

      {/* Linear Scale fields */}
      {question.type === 'LINEAR_SCALE' && (
        <div className="mt-4 space-y-4 rounded-xl border border-neutral-300 bg-white p-5">
          {/* From / To */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-900">
                {t('customizableForm.question.from')}
              </label>
              <Select
                value={String(question.from)}
                onValueChange={val => set({ from: Number(val) })}
              >
                <SelectTrigger className="!h-11 w-[68px] bg-white shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCALE_RANGE_START.map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {String(n)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-900">
                {t('customizableForm.question.to')}
              </label>
              <Select
                value={String(question.to)}
                onValueChange={val => set({ to: Number(val) })}
              >
                <SelectTrigger className="!h-11 w-[68px] bg-white shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCALE_RANGE_END.map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {String(n)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Label / End Label */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900">
                  {t('customizableForm.question.startLabel')}
                </label>
                <CharacterCount
                  maxLength={START_END_MAX}
                  currentLength={question.startLabel.length}
                />
              </div>
              <input
                type="text"
                maxLength={START_END_MAX}
                value={question.startLabel}
                onChange={e => set({ startLabel: removeEmoji(e.target.value) })}
                className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900">
                  {t('customizableForm.question.endLabel')}
                </label>
                <CharacterCount
                  maxLength={START_END_MAX}
                  currentLength={question.endLabel.length}
                />
              </div>
              <input
                type="text"
                maxLength={START_END_MAX}
                value={question.endLabel}
                onChange={e => set({ endLabel: removeEmoji(e.target.value) })}
                className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Question footer: copy, delete, required */}
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          aria-label="Duplicate question"
          className={
            isDuplicateDisabled
              ? 'cursor-not-allowed text-slate-300'
              : 'cursor-pointer text-slate-500 transition-colors hover:text-slate-700'
          }
          disabled={isDuplicateDisabled}
          onClick={onDuplicate}
        >
          <Simcard2 size={24} />
        </button>
        <button
          type="button"
          aria-label="Delete question"
          className={
            isDeleteDisabled
              ? 'cursor-not-allowed text-slate-300'
              : 'cursor-pointer text-slate-500 transition-colors hover:text-red-500'
          }
          disabled={isDeleteDisabled}
          onClick={onRemove}
        >
          <Trash size={24} />
        </button>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            {t('customizableForm.question.required')}
          </span>
          <Switch
            checked={question.required}
            onCheckedChange={val => set({ required: val })}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}

// ── Main step ────────────────────────────────────────────────────────────────
export default function CustomizableFormStep({
  onNext,
  onBack,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');

  const showDisableToast = useDisableSuccessToast();
  const { form, onCancel } = useVacancyForm();
  const initialCustomizableForm = form.customizableForm;
  const initialForms = getInitialForms(initialCustomizableForm);

  const [isEnabled, setIsEnabled] = useState(
    initialCustomizableForm?.isEnabled ?? false
  );
  const [sectionTitle, setSectionTitle] = useState(
    initialCustomizableForm?.sectionTitle ?? ''
  );
  const [forms, setForms] = useState<FormCard[]>(initialForms);
  const [nextFormId, setNextFormId] = useState(getNextFormId(initialForms));
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  // Set to true once the recruiter attempts to navigate (Next/Back) so inline
  // required-field messages render. Stays live afterwards so they clear as fields fill.
  const [showValidation, setShowValidation] = useState(false);
  const [pendingQuestionDelete, setPendingQuestionDelete] = useState<{
    formId: number;
    questionId: number;
  } | null>(null);
  const [pendingFormDelete, setPendingFormDelete] = useState<number | null>(
    null
  );

  // Root container, used to scroll/focus the first invalid field on a blocked
  // navigation attempt.
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    setForm,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();
  const _customizableRef = useRef<() => void>(() => {});
  useEffect(() => {
    _customizableRef.current = () => {
      setForm(prev => ({
        ...prev,
        customizableForm: { isEnabled, sectionTitle, forms },
      }));
    };
  }, [isEnabled, sectionTitle, forms, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _customizableRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        customizableForm: { isEnabled: false, sectionTitle: '', forms: [] },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  useStepGuard(isEnabled && !sectionTitle.trim() && forms.every(isFormEmpty));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const hasFormData =
    sectionTitle.trim().length > 0 ||
    forms.some(
      form =>
        form.title.trim().length > 0 ||
        form.questions.length > 0 ||
        form.questions.some(
          q =>
            q.text.trim().length > 0 ||
            q.options.some(o => o.value.trim().length > 0)
        )
    );

  const isSectionTitleError = sectionTitle.length > SECTION_TITLE_MAX;

  // Question-level mandatory content (text, type, and options for choice types).
  const isQuestionContentInvalid = (q: Question): boolean => {
    if (q.text.trim() === '' || q.text.length > QUESTION_MAX) return true;
    if (q.type === '') return true;
    if (isChoiceType(q.type)) {
      // The first MIN_OPTIONS option fields are mandatory (marked with *);
      // extra fields beyond that are optional and are not saved when blank.
      if (q.options.length < MIN_OPTIONS) return true;
      const requiredEmpty = q.options
        .slice(0, MIN_OPTIONS)
        .some(o => o.value.trim() === '');
      if (requiredEmpty) return true;
    }
    return false;
  };

  // Whether the enabled section has any missing/invalid mandatory content.
  // Duplicate options are reported separately via a toast (see handleNavigate).
  const hasInvalidContent = (): boolean => {
    if (!isEnabled) return false;
    if (sectionTitle.trim() === '' || isSectionTitleError) return true;
    return forms.some(
      form =>
        form.title.trim() === '' ||
        form.title.length > FORM_TITLE_MAX ||
        form.questions.some(isQuestionContentInvalid)
    );
  };

  const hasDuplicateOptions = (): boolean =>
    isEnabled && forms.some(f => f.questions.some(hasDuplicateOptionValues));

  const getDisplayFormTitle = (title: string) => {
    const trimmedTitle = title.trim();
    return trimmedTitle.length > 0
      ? trimmedTitle
      : t('customizableForm.untitledForm');
  };

  // ── Form-level actions ──────────────────────────────────────────────────

  const addForm = () => {
    if (forms.length >= MAX_FORMS) {
      ErrorToast({
        title: t('customizableForm.errors.errorTitle'),
        description: t('customizableForm.errors.maxFormsExceeded'),
      });
      return;
    }
    setForms(prev => [...prev, createForm(nextFormId)]);
    setNextFormId(id => id + 1);
  };

  // Deleting a form simply removes it — remaining copies are never renumbered.
  const removeForm = (id: number) => {
    setForms(prev => prev.filter(f => f.id !== id));
  };

  const duplicateForm = (id: number) => {
    if (forms.length >= MAX_FORMS) {
      ErrorToast({
        title: t('customizableForm.errors.errorTitle'),
        description: t('customizableForm.errors.maxFormsExceeded'),
      });
      return;
    }

    const source = forms.find(f => f.id === id);
    if (!source || isFormEmpty(source)) return;

    const copyOfPrefix = String(
      t('customizableForm.copyOfTitle', { title: '' })
    );
    const prefix = copyOfPrefix.endsWith(' ')
      ? copyOfPrefix
      : `${copyOfPrefix} `;

    // Strip any existing "Copy of " prefix and "(n)" suffix to find the family base.
    const parseTitle = (title: string) => {
      if (title.startsWith(prefix)) {
        const remaining = title.slice(prefix.length);
        const match = remaining.match(/^(.*?)(?:\s*\((\d+)\))?$/);
        if (match) {
          return {
            baseTitle: prefix + match[1].trim(),
            suffix: match[2] ? parseInt(match[2], 10) : null,
          };
        }
      }
      return { baseTitle: prefix + title.trim(), suffix: null };
    };

    const targetBaseTitle = parseTitle(source.title).baseTitle;

    // Existing copies in the same family. Existing copies are NEVER renamed.
    const matchingForms = forms.filter(
      f =>
        f.title.startsWith(prefix) &&
        parseTitle(f.title).baseTitle === targetBaseTitle
    );

    // First copy → "Copy of X" (no suffix). Subsequent → next number after the
    // highest existing suffix (treating the unsuffixed copy as 0): (1), (2), …
    let maxSuffix = 0;
    matchingForms.forEach(f => {
      const { suffix } = parseTitle(f.title);
      if (suffix !== null && suffix > maxSuffix) maxSuffix = suffix;
    });

    const copiedTitle =
      matchingForms.length === 0
        ? targetBaseTitle
        : `${targetBaseTitle} (${maxSuffix + 1})`;

    const copy: FormCard = { ...source, id: nextFormId, title: copiedTitle };

    setForms(prev => {
      const idx = prev.findIndex(f => f.id === id);
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });

    setNextFormId(n => n + 1);
  };

  const toggleOpen = (id: number) => {
    setForms(prev =>
      prev.map(f => (f.id === id ? { ...f, isOpen: !f.isOpen } : f))
    );
  };

  const updateFormTitle = (id: number, value: string) => {
    setForms(prev => prev.map(f => (f.id === id ? { ...f, title: value } : f)));
  };

  // ── Question-level actions ──────────────────────────────────────────────

  const addQuestion = (formId: number) => {
    const form = forms.find(f => f.id === formId);
    if (form && form.questions.length >= MAX_QUESTIONS) {
      ErrorToast({
        title: t('customizableForm.errors.errorTitle'),
        description: t('customizableForm.errors.maxQuestionsExceeded'),
      });
      return;
    }
    setForms(prev =>
      prev.map(f => {
        if (f.id !== formId) return f;
        return {
          ...f,
          questions: [...f.questions, createQuestion(f.nextQuestionId)],
          nextQuestionId: f.nextQuestionId + 1,
        };
      })
    );
  };

  const updateQuestion = (formId: number, updated: Question) => {
    setForms(prev =>
      prev.map(f => {
        if (f.id !== formId) return f;
        return {
          ...f,
          questions: f.questions.map(q => (q.id === updated.id ? updated : q)),
        };
      })
    );
  };

  const removeQuestion = (formId: number, questionId: number) => {
    setForms(prev =>
      prev.map(f => {
        if (f.id !== formId) return f;
        return {
          ...f,
          questions: f.questions.filter(q => q.id !== questionId),
        };
      })
    );
  };

  const duplicateQuestion = (formId: number, questionId: number) => {
    const form = forms.find(f => f.id === formId);
    if (form && form.questions.length >= MAX_QUESTIONS) {
      ErrorToast({
        title: t('customizableForm.errors.errorTitle'),
        description: t('customizableForm.errors.maxQuestionsExceeded'),
      });
      return;
    }

    setForms(prev =>
      prev.map(f => {
        if (f.id !== formId) return f;
        const source = f.questions.find(q => q.id === questionId);
        if (!source || isQuestionEmpty(source)) return f;
        const copy: Question = { ...source, id: f.nextQuestionId };
        const idx = f.questions.findIndex(q => q.id === questionId);
        return {
          ...f,
          questions: [
            ...f.questions.slice(0, idx + 1),
            copy,
            ...f.questions.slice(idx + 1),
          ],
          nextQuestionId: f.nextQuestionId + 1,
        };
      })
    );
  };

  const setNextOptionId = (formId: number, n: number) => {
    setForms(prev =>
      prev.map(f => (f.id === formId ? { ...f, nextOptionId: n } : f))
    );
  };

  const handleToggleEnabled = (enabled: boolean) => {
    if (!enabled) {
      if (hasFormData) {
        setShowDisableConfirm(true);
      } else {
        setIsEnabled(false);
      }
      return;
    }

    setIsEnabled(true);
  };

  // After the validation state renders, scroll the first invalid field into
  // view and focus it so the recruiter is taken straight to what needs fixing.
  const focusFirstInvalidField = () => {
    requestAnimationFrame(() => {
      const target = containerRef.current?.querySelector<HTMLElement>(
        '[data-invalid="true"]'
      );
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus({ preventScroll: true });
    });
  };

  // Validates the section (when enabled) before allowing navigation. Surfaces all
  // inline required messages at once and a toast for duplicate options; returns
  // false (and blocks navigation) when anything is invalid.
  const canNavigate = (): boolean => {
    if (!isEnabled) return true;

    const duplicates = hasDuplicateOptions();
    if (hasInvalidContent() || duplicates) {
      setShowValidation(true);
      // Expand every form so collapsed invalid fields are rendered and focusable.
      setForms(prev =>
        prev.every(f => f.isOpen)
          ? prev
          : prev.map(f => (f.isOpen ? f : { ...f, isOpen: true }))
      );
      if (duplicates) {
        ErrorToast({
          title: t('customizableForm.errors.errorTitle'),
          description: t('customizableForm.errors.duplicateOption'),
        });
      }
      focusFirstInvalidField();
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!canNavigate()) return;

    const formsPayload = isEnabled
      ? forms.map(currentForm => ({
          id: currentForm.id,
          title: currentForm.title,
          questions: currentForm.questions,
        }))
      : [];

    // Build the payload for persistence
    const payload: Partial<VacancyForm> = {
      customizableForm: {
        isEnabled,
        sectionTitle: isEnabled ? sectionTitle : '',
        forms: formsPayload,
      },
    };

    onNext(payload);
  };

  const handleBack = () => {
    if (!canNavigate()) return;
    stepPersistRef.current?.();
    onBack();
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef}>
      {/* Header row */}
      <div className="flex items-center justify-between px-7 pt-7 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="cursor-pointer text-slate-700 transition-colors hover:text-slate-900"
            aria-label={t('common.back')}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-[-0.1px] text-slate-900">
            {t('customizableForm.title')}
          </h2>
          {mode === 'edit' && form.status ? (
            <VacancyStatusBadge status={form.status} />
          ) : null}
        </div>

        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggleEnabled}
          size="lg"
        />
      </div>

      {/* Content area */}
      <div
        className={
          isEnabled ? 'px-7 pb-6' : 'pointer-events-none px-7 pb-6 opacity-60'
        }
      >
        {/* Section Title */}
        <div className="mt-2">
          <input
            type="text"
            placeholder={t('customizableForm.sectionTitlePlaceholder')}
            value={sectionTitle}
            data-invalid={
              showValidation &&
              (sectionTitle.trim() === '' || isSectionTitleError)
                ? 'true'
                : undefined
            }
            onChange={e => setSectionTitle(removeEmoji(e.target.value))}
            className="w-full border-0 border-b border-slate-200 bg-transparent px-0 pb-3 text-[24px] leading-8 font-bold tracking-[-0.144px] text-slate-900 placeholder:text-slate-300 focus:border-slate-300 focus:ring-0 focus:outline-none"
          />
          {isSectionTitleError && (
            <p className="mt-3 text-[13px] text-[#FF4A55]">
              {t('customizableForm.errors.maxLengthExceeded', { max: 200 })}
            </p>
          )}
          {showValidation && sectionTitle.trim() === '' && (
            <p className="mt-3 text-[13px] text-[#FF4A55]">
              {t('customizableForm.errors.requiredSectionTitle')}
            </p>
          )}
        </div>

        {/* Form Builder heading */}
        <h3 className="mt-10 mb-6 text-lg leading-6 font-bold text-slate-900">
          {t('customizableForm.formBuilderTitle')}
        </h3>

        {/* Form cards */}
        <div className="flex flex-col gap-4">
          {forms.map(form => {
            const isFormTitleError = form.title.length > FORM_TITLE_MAX;
            const displayFormTitle = getDisplayFormTitle(form.title);
            const isFormDuplicateDisabled = isFormEmpty(form);
            return (
              <div
                key={form.id}
                className="rounded-xl border border-neutral-300 bg-white p-5 shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]"
              >
                {/* Card action buttons */}
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-base leading-6 font-bold wrap-break-word text-slate-900">
                    {displayFormTitle}
                  </p>
                  <div className="flex shrink-0 items-center gap-3 text-slate-500">
                    <button
                      type="button"
                      aria-label="Duplicate form"
                      className={
                        isFormDuplicateDisabled
                          ? 'cursor-not-allowed text-slate-300'
                          : 'cursor-pointer transition-colors hover:text-slate-700'
                      }
                      disabled={isFormDuplicateDisabled}
                      onClick={() => duplicateForm(form.id)}
                    >
                      <Simcard2 size={24} />
                    </button>

                    <button
                      type="button"
                      aria-label="Delete form"
                      className={
                        forms.length === 1
                          ? 'cursor-not-allowed text-slate-300'
                          : 'cursor-pointer transition-colors hover:text-red-600'
                      }
                      disabled={forms.length === 1}
                      onClick={() => setPendingFormDelete(form.id)}
                    >
                      <Trash size={24} />
                    </button>

                    <button
                      type="button"
                      aria-label={form.isOpen ? 'Collapse form' : 'Expand form'}
                      className="cursor-pointer transition-colors hover:text-slate-700"
                      onClick={() => toggleOpen(form.id)}
                    >
                      <ArrowDown2
                        size={24}
                        className={form.isOpen ? 'rotate-180' : ''}
                        style={{ transition: 'transform 0.2s' }}
                      />
                    </button>
                  </div>
                </div>

                {form.isOpen && (
                  <>
                    {/* Form Title */}
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder={t('customizableForm.formTitlePlaceholder')}
                        value={form.title}
                        data-invalid={
                          showValidation &&
                          (form.title.trim() === '' || isFormTitleError)
                            ? 'true'
                            : undefined
                        }
                        onChange={e =>
                          updateFormTitle(form.id, removeEmoji(e.target.value))
                        }
                        className="w-full border-0 border-b border-slate-200 bg-transparent px-0 pb-3 text-xl leading-6 font-bold text-slate-900 placeholder:text-slate-300 focus:border-slate-300 focus:ring-0 focus:outline-none"
                      />
                      {isFormTitleError && (
                        <p className="mt-3 text-[13px] text-[#FF4A55]">
                          {t('customizableForm.errors.maxLengthExceeded', {
                            max: 150,
                          })}
                        </p>
                      )}
                      {showValidation && form.title.trim() === '' && (
                        <p className="mt-3 text-[13px] text-[#FF4A55]">
                          {t('customizableForm.errors.requiredFormTitle')}
                        </p>
                      )}
                    </div>

                    {/* Questions */}
                    {form.questions.map(question => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        nextOptionId={form.nextOptionId}
                        onUpdate={updated => updateQuestion(form.id, updated)}
                        onDuplicate={() =>
                          duplicateQuestion(form.id, question.id)
                        }
                        onRemove={() =>
                          setPendingQuestionDelete({
                            formId: form.id,
                            questionId: question.id,
                          })
                        }
                        onNextOptionId={n => setNextOptionId(form.id, n)}
                        isDeleteDisabled={form.questions.length === 1}
                        isDuplicateDisabled={isQuestionEmpty(question)}
                        showValidation={showValidation}
                      />
                    ))}

                    {/* Create Question button */}
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex h-14 cursor-pointer items-center gap-1 rounded-lg bg-neutral-200 px-8 text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-300"
                        onClick={() => addQuestion(form.id)}
                      >
                        <Plus className="size-5" />
                        {t('customizableForm.createQuestion')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add form button */}
        <div className="flex justify-end py-4">
          <Button
            type="button"
            variant="secondary"
            className="size-11 rounded-lg bg-gray-200 px-3 text-sm"
            aria-label={t('customizableForm.addForm')}
            onClick={addForm}
          >
            <Plus className="size-4 text-neutral-600!" />
          </Button>
        </div>
      </div>

      <StepDisableDialog
        open={showDisableConfirm}
        onOpenChange={setShowDisableConfirm}
        onConfirm={() => {
          setSectionTitle('');
          setForms([createForm(1)]);
          setNextFormId(2);
          setIsEnabled(false);
          removeCompletedStep(currentStepIndex);
          setShowDisableConfirm(false);
          showDisableToast(t('customizableForm.title'));
        }}
        title={t('customizableForm.confirmDisableDialog.title')}
        description={t('customizableForm.confirmDisableDialog.message')}
        cancelLabel={t('customizableForm.confirmDisableDialog.cancel')}
        confirmLabel={t('customizableForm.confirmDisableDialog.disable')}
      />

      <StepDisableDialog
        open={pendingQuestionDelete !== null}
        onOpenChange={open => {
          if (!open) setPendingQuestionDelete(null);
        }}
        onConfirm={() => {
          if (pendingQuestionDelete) {
            removeQuestion(
              pendingQuestionDelete.formId,
              pendingQuestionDelete.questionId
            );
          }
          setPendingQuestionDelete(null);
        }}
        title={t('customizableForm.deleteQuestionModal.title')}
        description={t('customizableForm.deleteQuestionModal.message')}
        cancelLabel={t('customizableForm.deleteQuestionModal.cancel')}
        confirmLabel={t('customizableForm.deleteQuestionModal.delete')}
      />

      <StepDisableDialog
        open={pendingFormDelete !== null}
        onOpenChange={open => {
          if (!open) setPendingFormDelete(null);
        }}
        onConfirm={() => {
          if (pendingFormDelete !== null) {
            removeForm(pendingFormDelete);
          }
          setPendingFormDelete(null);
        }}
        title={t('customizableForm.deleteFormModal.title')}
        description={t('customizableForm.deleteFormModal.message')}
        cancelLabel={t('customizableForm.deleteFormModal.cancel')}
        confirmLabel={t('customizableForm.deleteFormModal.delete')}
      />

      <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button className="h-12 w-48" onClick={handleNext}>
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
