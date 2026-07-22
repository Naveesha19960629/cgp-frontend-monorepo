import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FieldToggle from '@/views/vacancies/components/field-toggle';
import SectionCard from '@/views/vacancies/components/section-card';
import type { VacancyTemplateFormValues } from '@/views/vacancies/hooks/use-vacancy-template-form';
import type {
  TemplateFormState,
  TemplateSectionConfig,
} from '@/views/vacancies/types';
import {
  TEMPLATE_NAME_MAX_LENGTH,
  TEMPLATE_SECTIONS,
} from '@/views/vacancies/utils/vacancy-template-config';

import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';

/** One section card: title, "data from candidate" checkbox, and field toggles. */
function TemplateSectionCard({
  section,
  state,
  onToggleField,
  onToggleCandidateData,
}: {
  section: TemplateSectionConfig;
  state: TemplateFormState['sections'][string];
  onToggleField: (fieldCode: string, value: boolean) => void;
  onToggleCandidateData: (value: boolean) => void;
}) {
  const { t } = useTranslation('ats');
  const checkboxId = `data-from-candidate-${section.key}`;

  return (
    <SectionCard
      title={t(section.titleKey)}
      headerExtra={
        <label
          htmlFor={checkboxId}
          className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-900"
        >
          <Checkbox
            id={checkboxId}
            checked={state.dataTakenFromCandidate}
            onCheckedChange={value => onToggleCandidateData(value === true)}
          />
          <span>{t('createTemplate.dataFromCandidate')}</span>
        </label>
      }
    >
      {/* When "data taken from candidate" is selected the fields stay visible
          but are toggled off and disabled (mirrors the create-vacancy
          behaviour). */}
      <div className="mt-8 grid grid-cols-1 items-start gap-x-5 gap-y-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {section.fields.map(field => (
          <FieldToggle
            key={field.code}
            label={t(field.labelKey)}
            checked={
              state.dataTakenFromCandidate
                ? false
                : (state.fields[field.code] ?? false)
            }
            disabled={state.dataTakenFromCandidate}
            onToggle={value => onToggleField(field.code, value)}
          />
        ))}
      </div>
    </SectionCard>
  );
}

/**
 * Shared body for the Create and Edit Vacancy Template forms: the inline-editable
 * template name, the per-section field toggles, and the Customizable Form
 * section-level toggle. The surrounding header/footer (and their labels) belong
 * to the individual pages.
 */
export default function TemplateFormBody({
  form,
  setDataTakenFromCandidate,
}: {
  form: UseFormReturn<VacancyTemplateFormValues>;
  setDataTakenFromCandidate: (sectionKey: string, value: boolean) => void;
}) {
  const { t } = useTranslation('ats');
  const values = form.watch();
  const nameErrorKey = form.formState.errors.templateName?.message;

  return (
    <>
      {/* Inline-editable template name, styled as the page heading. */}
      <div className="pt-10">
        <input
          id="template-name"
          type="text"
          className="w-full border-0 border-b border-slate-200 bg-transparent px-0 pb-3 text-[28px] leading-8 font-bold tracking-[-0.168px] text-slate-900 placeholder:text-slate-300 focus:border-slate-300 focus:ring-0 focus:outline-none"
          placeholder={t('createTemplate.namePlaceholder')}
          value={values.templateName}
          aria-label={t('createTemplate.nameLabel')}
          aria-invalid={nameErrorKey ? true : undefined}
          onChange={e =>
            form.setValue('templateName', removeEmoji(e.target.value), {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        />
        {nameErrorKey && (
          <p className="mt-3 text-[13px] text-[#FF4A55]">
            {t(nameErrorKey, { max: TEMPLATE_NAME_MAX_LENGTH })}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {TEMPLATE_SECTIONS.map(section => (
          <TemplateSectionCard
            key={section.key}
            section={section}
            state={values.sections[section.key]}
            onToggleField={(fieldCode, value) =>
              form.setValue(
                `sections.${section.key}.fields.${fieldCode}`,
                value,
                { shouldDirty: true }
              )
            }
            onToggleCandidateData={value =>
              setDataTakenFromCandidate(section.key, value)
            }
          />
        ))}

        {/* Customizable Form — section-level toggle only, no fields. */}
        <section className="rounded-xl border border-[#d4d4d4] bg-white px-5 py-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)]">
          <div className="flex items-center gap-4">
            <h3 className="text-xl leading-6 font-bold tracking-[-0.1px] text-slate-900">
              {t('createTemplate.sections.customizableForm')}
            </h3>
            <Switch
              size="lg"
              checked={values.customizableForm}
              onCheckedChange={value =>
                form.setValue('customizableForm', value, { shouldDirty: true })
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}
