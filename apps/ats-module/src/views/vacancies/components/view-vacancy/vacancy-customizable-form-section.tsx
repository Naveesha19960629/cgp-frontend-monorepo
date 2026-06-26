import { ShieldTick } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';

import type {
  VacancyViewCustomizableFormQuestion,
  VacancyViewModel,
} from '@/views/vacancies/types';

import { Badge } from '@cgp/ui-kit/components/ui/badge';

const QUESTION_TYPE_LABEL_KEYS: Record<
  Exclude<VacancyViewCustomizableFormQuestion['type'], ''>,
  string
> = {
  SHORT_ANSWER: 'customizableForm.question.types.shortAnswer',
  PARAGRAPH: 'customizableForm.question.types.paragraph',
  MULTIPLE_CHOICE: 'customizableForm.question.types.multipleChoice',
  CHECKBOXES: 'customizableForm.question.types.checkboxes',
  DROPDOWN: 'customizableForm.question.types.dropDown',
  LINEAR_SCALE: 'customizableForm.question.types.linearScale',
};

const OPTION_QUESTION_TYPES = new Set<
  VacancyViewCustomizableFormQuestion['type']
>(['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN']);

function MetaField({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value || '-'}</p>
    </div>
  );
}

function QuestionCard({
  question,
}: {
  question: VacancyViewCustomizableFormQuestion;
}) {
  const { t } = useTranslation('ats');

  const typeLabel = question.type
    ? t(QUESTION_TYPE_LABEL_KEYS[question.type])
    : '-';
  const isLinearScale = question.type === 'LINEAR_SCALE';
  const showOptions =
    OPTION_QUESTION_TYPES.has(question.type) && question.options.length > 0;

  return (
    <div className="rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-slate-500">
              {t('customizableForm.view.question')}
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {question.text || '-'}
            </p>
          </div>

          {showOptions && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-slate-500">
                {t('customizableForm.view.options')}
              </p>
              <div className="flex flex-wrap gap-3">
                {question.options.map((option, index) => (
                  <Badge key={index} variant="chip">
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row flex-wrap gap-x-8 gap-y-4 lg:justify-start">
          <MetaField
            label={t('customizableForm.view.type')}
            value={typeLabel}
            className="min-w-[100px]"
          />

          {isLinearScale && (
            <>
              <MetaField
                label={t('customizableForm.view.scale')}
                value={`${question.scaleFrom}–${question.scaleTo}`}
                className="min-w-[60px]"
              />
              <MetaField
                label={t('customizableForm.question.startLabel')}
                value={question.startLabel}
                className="min-w-[100px]"
              />
              <MetaField
                label={t('customizableForm.question.endLabel')}
                value={question.endLabel}
                className="min-w-[100px]"
              />
            </>
          )}

          <MetaField
            label={t('customizableForm.view.submissionRequirement')}
            value={
              question.required
                ? t('customizableForm.view.required')
                : t('customizableForm.view.optional')
            }
            className="min-w-[150px]"
          />
        </div>
      </div>
    </div>
  );
}

function VacancyCustomizableFormSection({
  customizableForm,
}: {
  customizableForm?: VacancyViewModel['customizableForm'];
}) {
  const { t } = useTranslation('ats');

  if (
    !customizableForm ||
    !customizableForm.isEnabled ||
    customizableForm.forms.length === 0
  ) {
    return null;
  }

  return (
    <section className="mb-4 flex flex-col gap-3 rounded-lg border border-[#e5e5e5] bg-[#f5f5f5] p-3">
      <h2 className="text-[18px] leading-6 font-bold text-slate-900">
        {customizableForm.sectionTitle ||
          t('vacancies.view.sections.customizableForms')}
      </h2>

      {customizableForm.forms.map((form, formIndex) => (
        <article
          key={formIndex}
          className="flex flex-col gap-4 rounded-[12px] bg-white p-4"
        >
          <div className="flex items-center gap-1 text-sm">
            <ShieldTick size={20} className="text-slate-500" variant="Bold" />
            <span className="font-semibold text-slate-600">
              {form.title || t('customizableForm.untitledForm')}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {form.questions.map((question, qIndex) => (
              <QuestionCard key={qIndex} question={question} />
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

export { VacancyCustomizableFormSection };
