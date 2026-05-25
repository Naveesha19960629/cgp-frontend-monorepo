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

  const { entry } = values;

  const toRef = (item: {
    id?: string;
    label: string;
    source: string;
  }): TertiaryEducationRef | null => {
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
  }): TertiaryEducationRef => ({
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
        },
      ],
    },
  ];
};

export { toTertiaryEducationPayload };
