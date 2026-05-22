import type { SecondaryEducationFormValues } from '@/views/vacancies/hooks/use-secondary-education-form';
import type {
  SecondaryEducation,
  SecondaryEducationRef,
} from '@/views/vacancies/types';

const toSecondaryEducationPayload = (
  values: SecondaryEducationFormValues
): SecondaryEducation[] => {
  if (!values.isEnabled) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (values.dataTakenFromCandidate) {
    return [{ isEnabled: true, dataTakenFromCandidate: true, content: [] }];
  }

  const { entry } = values;

  const toRef = (item: {
    id?: string;
    label: string;
    source: string;
  }): SecondaryEducationRef | null => {
    if (!item.id) return null;
    return {
      source: item.source as 'MASTER' | 'PENDING',
      id: item.id,
      name: item.label,
    };
  };

  const toRefs = (items: { id?: string; label: string; source: string }[]) =>
    items.flatMap(i => {
      const ref = toRef(i);
      return ref ? [ref] : [];
    });

  const toLocationRef = (item: {
    id: string;
    label: string;
  }): SecondaryEducationRef => ({
    source: 'MASTER',
    id: item.id,
    name: item.label,
  });

  return [
    {
      isEnabled: true,
      dataTakenFromCandidate: false,
      content: [
        {
          acceptsHomeSchooling: entry.acceptsHomeSchooling,
          schools: toRefs(entry.schools),
          schoolLocations: entry.schoolLocations.map(toLocationRef),
          examinations: toRefs(entry.examinations),
          secondaryAwardingBody: toRefs(entry.awardingBodies),
          fieldsOfStudy: toRefs(entry.fieldsOfStudy),
          grade: entry.grade,
          startDate: entry.startDate ?? '',
          endDate: entry.endDate ?? '',
          result: entry.result,
        },
      ],
    },
  ];
};

export { toSecondaryEducationPayload };
