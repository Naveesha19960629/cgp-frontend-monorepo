import type { TertiaryEducationFormValues } from '@/views/vacancies/hooks/use-tertiary-education-form';
import type {
  TertiaryEducation,
  TertiaryEducationRef,
} from '@/views/vacancies/types';

const toTertiaryEducationPayload = (
  values: TertiaryEducationFormValues
): TertiaryEducation[] => {
  if (!values.isEnabled) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (values.dataTakenFromCandidate) {
    return [{ isEnabled: true, dataTakenFromCandidate: true, content: [] }];
  }

  const toRef = (item: {
    value?: string;
    label: string;
    source: string;
  }): TertiaryEducationRef | null => {
    if (!item.value || item.value === item.label) return null;
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
  }): TertiaryEducationRef => ({
    source: 'MASTER',
    id: item.value,
    name: item.label,
  });

  const isEntryEmpty = (
    entry: TertiaryEducationFormValues['entries'][number]
  ) =>
    entry.qualificationName.length === 0 &&
    entry.tertiaryAwardingBody.length === 0 &&
    entry.tertiaryAwardingBodyLocations.length === 0 &&
    entry.levelOfQualification.length === 0 &&
    entry.specialization.length === 0 &&
    entry.studyMode.length === 0 &&
    entry.studyPattern.length === 0 &&
    entry.deliverySchedule.length === 0 &&
    entry.batch.length === 0 &&
    entry.department.length === 0 &&
    entry.faculty.length === 0 &&
    !entry.grade.trim();

  const content = values.entries
    .filter(entry => !isEntryEmpty(entry))
    .map(entry => ({
      qualificationName: toRefs(entry.qualificationName),
      tertiaryAwardingBody: toRefs(entry.tertiaryAwardingBody),
      tertiaryAwardingBodyLocations:
        entry.tertiaryAwardingBodyLocations.map(toLocationRef),
      levelOfQualification: toRefs(entry.levelOfQualification),
      specialization: toRefs(entry.specialization),
      studyMode: toRefs(entry.studyMode),
      studyPattern: toRefs(entry.studyPattern),
      deliverySchedule: toRefs(entry.deliverySchedule),
      batch: toRefs(entry.batch),
      department: toRefs(entry.department),
      faculty: toRefs(entry.faculty),
      grade: entry.grade,
    }));

  return [{ isEnabled: true, dataTakenFromCandidate: false, content }];
};

export { toTertiaryEducationPayload };
