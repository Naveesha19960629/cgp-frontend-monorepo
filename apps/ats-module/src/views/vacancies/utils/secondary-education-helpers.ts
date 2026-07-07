import type { SecondaryEducationFormValues } from '@/views/vacancies/hooks/use-secondary-education-form';
import type {
  SecondaryEducation,
  SecondaryEducationRef,
} from '@/views/vacancies/types';
import { DATE_DISPLAY_FORMAT } from '@/views/vacancies/utils/constants';
import { parseLocalDate } from '@/views/vacancies/utils/date-timezone-safe';

import { format } from 'date-fns';

function formatDate(iso?: string): string {
  if (!iso) return '';
  const date = parseLocalDate(iso);
  if (!date) return '';
  return format(date, DATE_DISPLAY_FORMAT);
}

const toSecondaryEducationPayload = (
  values: SecondaryEducationFormValues
): SecondaryEducation[] => {
  if (!values.isEnabled) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (values.dataTakenFromCandidate) {
    return [{ isEnabled: true, dataTakenFromCandidate: true, content: [] }];
  }

  const isEntryEmpty = (
    entry: SecondaryEducationFormValues['entries'][number]
  ) =>
    !entry.acceptsHomeSchooling &&
    entry.schools.length === 0 &&
    entry.schoolLocations.length === 0 &&
    entry.examinations.length === 0 &&
    entry.awardingBodies.length === 0 &&
    entry.fieldsOfStudy.length === 0 &&
    !entry.grade.trim() &&
    !entry.startDate &&
    !entry.endDate &&
    !entry.result.trim();

  const toRef = (item: {
    value?: string;
    label: string;
    source: string;
  }): SecondaryEducationRef | null => {
    if (!item.value) return null;
    // A freshly-typed creatable chip has no id yet (value === label) — keep
    // it tagged as USER_CREATED instead of dropping it, so it can still be
    // resolved to real master data later (e.g. on draft-save) instead of the
    // user's input silently vanishing.
    if (item.value === item.label) {
      return { source: 'USER_CREATED', id: item.value, name: item.label };
    }
    return {
      source: item.source as 'MASTER' | 'PENDING',
      id: item.value,
      name: item.label,
    };
  };

  const toRefs = (items: { value?: string; label: string; source: string }[]) =>
    items.flatMap(i => {
      const ref = toRef(i);
      return ref ? [ref] : [];
    });

  const toLocationRef = (item: {
    value: string;
    label: string;
  }): SecondaryEducationRef => ({
    source: 'MASTER',
    id: item.value,
    name: item.label,
  });

  const content = values.entries
    .filter(entry => !isEntryEmpty(entry))
    .map(entry => ({
      acceptsHomeSchooling: entry.acceptsHomeSchooling,
      schools: toRefs(entry.schools),
      schoolLocations: entry.schoolLocations.map(toLocationRef),
      examinations: toRefs(entry.examinations),
      secondaryAwardingBody: toRefs(entry.awardingBodies),
      fieldsOfStudy: toRefs(entry.fieldsOfStudy),
      grade: entry.grade,
      startDate: entry.startDate ? entry.startDate.split('T')[0] : '',
      endDate: entry.endDate ? entry.endDate.split('T')[0] : '',
      result: entry.result,
    }));

  return [{ isEnabled: true, dataTakenFromCandidate: false, content }];
};

export { toSecondaryEducationPayload, formatDate };
