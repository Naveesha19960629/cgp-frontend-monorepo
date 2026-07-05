import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';

import { z } from 'zod';

import {
  TEMPLATE_NAME_MAX_LENGTH,
  TEMPLATE_SECTIONS,
} from '@/views/vacancies/utils/vacancy-template-config';
import { createInitialTemplateFormState } from '@/views/vacancies/utils/vacancy-template-payload-helpers';

const templateSectionSchema = z.object({
  dataTakenFromCandidate: z.boolean(),
  fields: z.record(z.string(), z.boolean()),
});

const vacancyTemplateSchema = z.object({
  // Not capped in the UI — the recruiter can type past the limit and the error
  // is shown inline (mirrors the Customizable Form section-title field).
  templateName: z
    .string()
    .min(1, 'createTemplate.nameRequired')
    .max(TEMPLATE_NAME_MAX_LENGTH, 'createTemplate.nameMaxLength'),
  sections: z.record(z.string(), templateSectionSchema),
  customizableForm: z.boolean(),
});

type VacancyTemplateFormValues = z.infer<typeof vacancyTemplateSchema>;

/**
 * Owns the Create Vacancy Template form (name + per-section field toggles +
 * "data taken from candidate" checkboxes + the Customizable Form toggle).
 */
function useVacancyTemplateForm() {
  const form = useForm<VacancyTemplateFormValues>({
    resolver: zodResolver(vacancyTemplateSchema),
    mode: 'onChange',
    defaultValues: {
      templateName: '',
      ...createInitialTemplateFormState(),
    },
  });

  /**
   * Selecting the checkbox turns every field toggle in the section off; the
   * fields are then rendered disabled by the page.
   */
  const setDataTakenFromCandidate = (sectionKey: string, value: boolean) => {
    form.setValue(`sections.${sectionKey}.dataTakenFromCandidate`, value);
    if (value) {
      const section = TEMPLATE_SECTIONS.find(s => s.key === sectionKey);
      section?.fields.forEach(field =>
        form.setValue(`sections.${sectionKey}.fields.${field.code}`, false)
      );
    }
  };

  return { form, setDataTakenFromCandidate };
}

export { useVacancyTemplateForm };
export type { VacancyTemplateFormValues };
