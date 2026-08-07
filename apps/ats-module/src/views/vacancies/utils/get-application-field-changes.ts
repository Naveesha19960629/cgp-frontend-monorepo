import type {
  ApplicationFieldChange,
  VacancyForm,
} from '@/views/vacancies/types';
import { detectApplicationFormChanges } from '@/views/vacancies/utils/detect-application-form-changes';

function extractIndices(path: string): number[] {
  return [...path.matchAll(/\[(\d+)\]/g)].map(match => Number(match[1]));
}

function leafFieldName(path: string): string {
  const segments = path.split('.').filter(Boolean);
  const last = segments.at(-1) ?? path;
  return last.replace(/\[\d+\]/g, '');
}

function sectionKeyFromPath(path: string): string {
  return path.split(/[.[]/)[0] ?? path;
}

/**
 * Classifies a changed customizableForm path as Added (a brand new form
 * card/question, or the array holding them grew) or Updated (an existing
 * field's value changed), by comparing array lengths at each level the path
 * indexes into — collectChangedPaths shortcuts to the array-level path
 * itself when lengths differ, so an index isn't always present.
 */
function classifyCustomizableFormChange(
  original: VacancyForm,
  edited: VacancyForm,
  path: string
): { formName: string; changeType: 'Added' | 'Updated' } {
  const [formIndex, questionIndex] = extractIndices(path);
  const originalForms = original.customizableForm?.forms ?? [];
  const editedForms = edited.customizableForm?.forms ?? [];

  if (formIndex === undefined) {
    return {
      formName: 'customizableForm',
      changeType:
        editedForms.length > originalForms.length ? 'Added' : 'Updated',
    };
  }

  const formCard = editedForms[formIndex];
  const formName = formCard?.title || 'customizableForm';

  if (formIndex >= originalForms.length) {
    return { formName, changeType: 'Added' };
  }

  const originalQuestions = originalForms[formIndex]?.questions ?? [];
  const editedQuestions = formCard?.questions ?? [];

  if (questionIndex === undefined) {
    return {
      formName,
      changeType:
        editedQuestions.length > originalQuestions.length ? 'Added' : 'Updated',
    };
  }

  if (questionIndex >= originalQuestions.length) {
    return { formName, changeType: 'Added' };
  }

  return { formName, changeType: 'Updated' };
}

/**
 * Converts the raw section/path diff from detectApplicationFormChanges into
 * the {formName, fieldName, changeType} shape used to describe what an
 * applicant needs to review — one entry per changed leaf path.
 * customizableForm changes are classified Added/Updated by comparing array
 * lengths; "preferred value" section changes (skills, education, etc.) are
 * always PreferredValuesUpdated, matching how those sections are presented
 * to applicants regardless of whether an entry was added or edited.
 */
function getApplicationFieldChanges(
  original: VacancyForm,
  edited: VacancyForm
): ApplicationFieldChange[] {
  const { changedFields } = detectApplicationFormChanges(original, edited);

  return changedFields.map(path => {
    const fieldName = leafFieldName(path);

    if (sectionKeyFromPath(path) === 'customizableForm') {
      const { formName, changeType } = classifyCustomizableFormChange(
        original,
        edited,
        path
      );
      return { formName, fieldName, changeType };
    }

    return {
      formName: sectionKeyFromPath(path),
      fieldName,
      changeType: 'PreferredValuesUpdated' as const,
    };
  });
}

/** Applicant change-notification emails are sent only when both applicants exist and the application form actually changed. */
function shouldNotifyApplicants(
  hasApplicants: boolean,
  fieldChanges: ApplicationFieldChange[]
): boolean {
  return hasApplicants && fieldChanges.length > 0;
}

export { getApplicationFieldChanges, shouldNotifyApplicants };
