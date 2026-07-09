import { zodResolver } from '@hookform/resolvers/zod';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { z } from 'zod';

import type {
  JobDescriptionFieldVisibilityUpdate,
  JobDescriptionFormState,
  VacancyJobDescription,
} from '@/views/vacancies/types';

const editJobDescriptionSchema = z.record(
  z.string(),
  z.record(z.string(), z.boolean())
);

const toFormState = (
  jobDescription: VacancyJobDescription | undefined
): JobDescriptionFormState => {
  if (!jobDescription) return {};
  return jobDescription.sections.reduce<JobDescriptionFormState>(
    (sections, section) => {
      sections[section.sectionKey] = section.fields.reduce<
        Record<string, boolean>
      >((fields, field) => {
        fields[field.fieldKey] = field.isVisible;
        return fields;
      }, {});
      return sections;
    },
    {}
  );
};

/**
 * Owns the Edit Job Description form: per-field visibility toggles, loaded
 * from the fetched job description and reset whenever it (re)loads.
 *
 * The backend PATCH is a full-state replace scoped to the vacancy's eligible
 * fields: any eligible field not included in the request is hidden. So on
 * save the page must submit every currently-loaded field's toggle state
 * (getAllFields), not just the ones the recruiter touched — `isDirty` still
 * gates whether the Update button is enabled at all.
 */
function useEditJobDescriptionForm(jobDescription?: VacancyJobDescription) {
  const form = useForm<JobDescriptionFormState>({
    resolver: zodResolver(editJobDescriptionSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (jobDescription) {
      form.reset(toFormState(jobDescription));
    }
  }, [jobDescription, form]);

  const toggleField = (
    sectionKey: string,
    fieldKey: string,
    value: boolean
  ) => {
    form.setValue(`${sectionKey}.${fieldKey}`, value, { shouldDirty: true });
  };

  const getAllFields = (): JobDescriptionFieldVisibilityUpdate[] => {
    const current = form.getValues();
    const fields: JobDescriptionFieldVisibilityUpdate[] = [];

    Object.entries(current).forEach(([sectionKey, sectionFields]) => {
      Object.entries(sectionFields).forEach(([fieldKey, isVisible]) => {
        fields.push({ sectionKey, fieldKey, isVisible });
      });
    });

    return fields;
  };

  return {
    form,
    toggleField,
    getAllFields,
    isDirty: form.formState.isDirty,
  };
}

export { useEditJobDescriptionForm };
