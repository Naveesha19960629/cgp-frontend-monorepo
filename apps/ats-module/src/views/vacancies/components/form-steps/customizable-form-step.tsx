import { Plus, X } from 'lucide-react';

import { ArrowDown2, ArrowLeft2, Simcard2, Trash } from 'iconsax-reactjs';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StepDisableDialog } from '@/views/vacancies';
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
  questions: [],
  nextQuestionId: 1,
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

// ── QuestionCard ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question;
  index: number;
  nextOptionId: number;
  onUpdate: (updated: Question) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onNextOptionId: (n: number) => void;
}

function QuestionCard({
  question,
  index,
  nextOptionId,
  onUpdate,
  onDuplicate,
  onRemove,
  onNextOptionId,
}: Readonly<QuestionCardProps>) {
  const { t } = useTranslation('ats');

  const set = (patch: Partial<Question>) => onUpdate({ ...question, ...patch });

  const addOption = () => {
    if (question.options.length >= MAX_OPTIONS) {
      ErrorToast({
        title: t('common.errorTitle'),
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
            placeholder={t('customizableForm.question.questionPlaceholder')}
            onChange={e => set({ text: removeEmoji(e.target.value) })}
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-900">
            {t('customizableForm.question.typeLabel')}
            <span className="ml-0.5 text-red-500">*</span>
          </label>
          <Select
            value={question.type}
            onValueChange={val => set({ type: val as QuestionType })}
          >
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
        </div>
      </div>

      {/* Multiple Choice options */}
      {question.type === 'MULTIPLE_CHOICE' && (
        <div className="mt-4 rounded-xl border border-neutral-300 bg-white p-5">
          <div className="grid grid-cols-2 gap-4">
            {question.options.map((opt, optIdx) => (
              <div key={opt.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    {`Option ${String(optIdx + 1).padStart(2, '0')}`}
                  </span>
                  <CharacterCount
                    maxLength={OPTION_MAX}
                    currentLength={opt.value.length}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={OPTION_MAX}
                    value={opt.value}
                    onChange={e =>
                      updateOption(opt.id, removeEmoji(e.target.value))
                    }
                    placeholder={t('customizableForm.question.enterOption')}
                    className="h-11 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none"
                  />
                  {optIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-neutral-600 transition-colors hover:border-red-300 hover:text-red-500"
                      aria-label="Remove option"
                    >
                      <X className="size-6" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-neutral-200 px-8 text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-300"
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    {`Option ${String(optIdx + 1).padStart(2, '0')}`}
                  </span>
                  <CharacterCount
                    maxLength={OPTION_MAX}
                    currentLength={opt.value.length}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={OPTION_MAX}
                    value={opt.value}
                    onChange={e =>
                      updateOption(opt.id, removeEmoji(e.target.value))
                    }
                    placeholder={t('customizableForm.question.enterOption')}
                    className="h-11 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none"
                  />
                  {optIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-neutral-600 transition-colors hover:border-red-300 hover:text-red-500"
                      aria-label="Remove option"
                    >
                      <X className="size-6" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-neutral-200 px-8 text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-300"
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    {`Option ${String(optIdx + 1).padStart(2, '0')}`}
                  </span>
                  <CharacterCount
                    maxLength={OPTION_MAX}
                    currentLength={opt.value.length}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={OPTION_MAX}
                    value={opt.value}
                    onChange={e =>
                      updateOption(opt.id, removeEmoji(e.target.value))
                    }
                    placeholder={t('customizableForm.question.enterOption')}
                    className="h-11 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-0 focus:outline-none"
                  />
                  {optIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-neutral-600 transition-colors hover:border-red-300 hover:text-red-500"
                      aria-label="Remove option"
                    >
                      <X className="size-6" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-neutral-200 px-8 text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-300"
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
          className="text-slate-500 transition-colors hover:text-slate-700"
          onClick={onDuplicate}
        >
          <Simcard2 size={24} />
        </button>
        <button
          type="button"
          aria-label="Delete question"
          className="text-slate-500 transition-colors hover:text-red-500"
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
export default function CustomizableFormStep({ onNext, onBack }: StepProps) {
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
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingQuestionDelete, setPendingQuestionDelete] = useState<{
    formId: number;
    questionId: number;
  } | null>(null);
  const [pendingFormDelete, setPendingFormDelete] = useState<number | null>(
    null
  );

  const { setForm, stepPersistRef, stepDisableRef } = useVacancyForm();
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

  useStepGuard(
    isEnabled &&
      !sectionTitle.trim() &&
      forms.every(f => f.questions.length === 0)
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const hasAtLeastOneQuestion = forms.some(form => form.questions.length > 0);
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

  const isSectionTitleError = sectionTitle.length > 200;

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
        title: t('common.errorTitle'),
        description: t('customizableForm.errors.maxFormsExceeded'),
      });
      return;
    }
    setForms(prev => [...prev, createForm(nextFormId)]);
    setNextFormId(id => id + 1);
  };

  const removeForm = (id: number) => {
    setForms(prev => {
      const filtered = prev.filter(f => f.id !== id);

      const copyOfPrefix = String(
        t('customizableForm.copyOfTitle', { title: '' })
      );
      const prefix = copyOfPrefix.endsWith(' ')
        ? copyOfPrefix
        : `${copyOfPrefix} `;

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
        return {
          baseTitle: prefix + title.trim(),
          suffix: null,
        };
      };

      // Count actual duplicates for each targetBaseTitle in the filtered list
      const duplicateCounts = new Map<string, number>();
      filtered.forEach(f => {
        if (f.title.startsWith(prefix)) {
          const { baseTitle } = parseTitle(f.title);
          duplicateCounts.set(
            baseTitle,
            (duplicateCounts.get(baseTitle) || 0) + 1
          );
        }
      });

      // For any duplicate form whose baseTitle now has only 1 duplicate in the list:
      // If it has a suffix, remove its suffix (rename to just baseTitle)
      return filtered.map(f => {
        if (f.title.startsWith(prefix)) {
          const parsed = parseTitle(f.title);
          if (
            duplicateCounts.get(parsed.baseTitle) === 1 &&
            parsed.suffix !== null
          ) {
            return { ...f, title: parsed.baseTitle };
          }
        }
        return f;
      });
    });
  };

  const duplicateForm = (id: number) => {
    if (forms.length >= MAX_FORMS) {
      ErrorToast({
        title: t('common.errorTitle'),
        description: t('customizableForm.errors.maxFormsExceeded'),
      });
      return;
    }

    const source = forms.find(f => f.id === id);
    if (!source) return;

    const copyOfPrefix = String(
      t('customizableForm.copyOfTitle', { title: '' })
    );
    const prefix = copyOfPrefix.endsWith(' ')
      ? copyOfPrefix
      : `${copyOfPrefix} `;

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
      return {
        baseTitle: prefix + title.trim(),
        suffix: null,
      };
    };

    const parsedSource = parseTitle(source.title);
    const targetBaseTitle = parsedSource.baseTitle;

    // Filter existing forms that are duplicates matching the targetBaseTitle
    const matchingForms = forms.filter(f => {
      if (!f.title.startsWith(prefix)) return false;
      return parseTitle(f.title).baseTitle === targetBaseTitle;
    });

    const existingSuffixes = new Set<number>();
    let unsuffixedFormId: number | null = null;

    matchingForms.forEach(f => {
      const parsed = parseTitle(f.title);
      if (parsed.suffix !== null) {
        existingSuffixes.add(parsed.suffix);
      } else {
        unsuffixedFormId = f.id;
      }
    });

    let nextSuffix = 1;
    if (unsuffixedFormId !== null) {
      existingSuffixes.add(1);
    }
    while (existingSuffixes.has(nextSuffix)) {
      nextSuffix++;
    }

    const copiedTitle =
      matchingForms.length === 0
        ? targetBaseTitle
        : `${targetBaseTitle} (${nextSuffix})`;

    const copy: FormCard = { ...source, id: nextFormId, title: copiedTitle };

    setForms(prev => {
      // If we are adding a second duplicate, rename the first unsuffixed duplicate to have suffix (1)
      const updated = prev.map(f => {
        if (f.id === unsuffixedFormId && matchingForms.length > 0) {
          return { ...f, title: `${targetBaseTitle} (1)` };
        }
        return f;
      });
      const idx = updated.findIndex(f => f.id === id);
      return [...updated.slice(0, idx + 1), copy, ...updated.slice(idx + 1)];
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
        title: t('common.errorTitle'),
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
        title: t('common.errorTitle'),
        description: t('customizableForm.errors.maxQuestionsExceeded'),
      });
      return;
    }

    setForms(prev =>
      prev.map(f => {
        if (f.id !== formId) return f;
        const source = f.questions.find(q => q.id === questionId);
        if (!source) return f;
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

  const handleNext = () => {
    if (isEnabled) {
      const missingSectionTitle = sectionTitle.trim().length === 0;
      const missingRequiredFormData =
        forms.length === 0 || !hasAtLeastOneQuestion;

      if (missingSectionTitle || missingRequiredFormData) {
        setShowValidationModal(true);
        return;
      }
    }

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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between px-7 pt-7 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-slate-700 transition-colors hover:text-slate-900"
            aria-label={t('common.back')}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-[-0.1px] text-slate-900">
            {t('customizableForm.title')}
          </h2>
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
            onChange={e => setSectionTitle(removeEmoji(e.target.value))}
            className="w-full border-0 border-b border-slate-200 bg-transparent px-0 pb-3 text-[24px] leading-8 font-bold tracking-[-0.144px] text-slate-900 placeholder:text-slate-300 focus:border-slate-300 focus:ring-0 focus:outline-none"
          />
          {isSectionTitleError && (
            <p className="mt-3 text-[13px] text-[#FF4A55]">
              {t('customizableForm.errors.maxLengthExceeded', { max: 200 })}
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
            const isFormTitleError = form.title.length > 150;
            const displayFormTitle = getDisplayFormTitle(form.title);
            return (
              <div
                key={form.id}
                className="rounded-xl border border-neutral-300 bg-white p-5 shadow-[0px_4px_90px_0px_rgba(0,0,0,0.07)]"
              >
                {/* Card action buttons */}
                <div className="flex items-center justify-between">
                  <p className="text-base leading-6 font-bold text-slate-900">
                    {displayFormTitle}
                  </p>
                  <div className="flex items-center gap-3 text-slate-500">
                    <button
                      type="button"
                      aria-label="Duplicate form"
                      className="transition-colors hover:text-slate-700"
                      onClick={() => duplicateForm(form.id)}
                    >
                      <Simcard2 size={24} />
                    </button>

                    <button
                      type="button"
                      aria-label="Delete form"
                      className="transition-colors hover:text-red-600"
                      onClick={() => setPendingFormDelete(form.id)}
                    >
                      <Trash size={24} />
                    </button>

                    <button
                      type="button"
                      aria-label={form.isOpen ? 'Collapse form' : 'Expand form'}
                      className="transition-colors hover:text-slate-700"
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
                    </div>

                    {/* Questions */}
                    {form.questions.map((question, qIdx) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={qIdx}
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
                      />
                    ))}

                    {/* Create Question button */}
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex h-14 items-center gap-1 rounded-lg bg-neutral-200 px-8 text-sm font-semibold text-slate-700 transition-colors hover:bg-neutral-300"
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
          setShowDisableConfirm(false);
          setIsEnabled(false);
          showDisableToast(t('customizableForm.title'));
        }}
        title={t('customizableForm.confirmDisableDialog.title')}
        description={t('customizableForm.confirmDisableDialog.message')}
        cancelLabel={t('customizableForm.confirmDisableDialog.cancel')}
        confirmLabel={t('customizableForm.confirmDisableDialog.disable')}
      />

      <StepDisableDialog
        open={showValidationModal}
        onOpenChange={setShowValidationModal}
        onConfirm={() => {
          setSectionTitle('');
          setForms([createForm(1)]);
          setNextFormId(2);
          setIsEnabled(false);
          setShowValidationModal(false);
          showDisableToast(t('customizableForm.title'));

          onNext({
            customizableForm: {
              isEnabled: false,
              sectionTitle: '',
              forms: [],
            },
          });
        }}
        title={t('customizableForm.validationModal.title')}
        description={t('customizableForm.validationModal.message')}
        cancelLabel={t('customizableForm.validationModal.cancel')}
        confirmLabel={t('customizableForm.validationModal.disable')}
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
