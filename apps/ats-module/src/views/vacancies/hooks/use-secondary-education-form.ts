import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { z } from 'zod';

import type { SecondaryEducation } from '@/views/vacancies/types';

const selectionItemSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  source: z.string(),
});

const locationItemSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const secondaryEducationEntrySchema = z.object({
  acceptsHomeSchooling: z.boolean(),
  schools: z.array(selectionItemSchema).max(10),
  schoolLocations: z.array(locationItemSchema).max(10),
  examinations: z.array(selectionItemSchema).max(10),
  awardingBodies: z.array(selectionItemSchema).max(10),
  fieldsOfStudy: z.array(selectionItemSchema).max(10),
  grade: z.string().max(80),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  result: z.string().max(1000),
});

const secondaryEducationFormSchema = z.object({
  isEnabled: z.boolean(),
  dataTakenFromCandidate: z.boolean(),
  entry: secondaryEducationEntrySchema,
});

type SecondaryEducationFormValues = z.infer<
  typeof secondaryEducationFormSchema
>;

const DEFAULT_ENTRY: z.infer<typeof secondaryEducationEntrySchema> = {
  acceptsHomeSchooling: false,
  schools: [],
  schoolLocations: [],
  examinations: [],
  awardingBodies: [],
  fieldsOfStudy: [],
  grade: '',
  startDate: undefined,
  endDate: undefined,
  result: '',
};

function buildDefaultValues(
  initialData?: SecondaryEducation[]
): SecondaryEducationFormValues {
  if (!initialData?.length) {
    return {
      isEnabled: false,
      dataTakenFromCandidate: false,
      entry: DEFAULT_ENTRY,
    };
  }

  const first = initialData[0];
  const firstEntry = first.content[0];

  return {
    isEnabled: first.isEnabled,
    dataTakenFromCandidate: first.dataTakenFromCandidate,
    entry: firstEntry
      ? {
          acceptsHomeSchooling: firstEntry.acceptsHomeSchooling,
          schools: firstEntry.schools.map(r => ({
            id: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          schoolLocations: firstEntry.schoolLocations.map(r => ({
            id: r.id,
            label: r.name ?? r.id,
          })),
          examinations: firstEntry.examinations.map(r => ({
            id: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          awardingBodies: firstEntry.secondaryAwardingBody.map(r => ({
            id: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          fieldsOfStudy: firstEntry.fieldsOfStudy.map(r => ({
            id: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          grade: firstEntry.grade,
          startDate: firstEntry.startDate,
          endDate: firstEntry.endDate,
          result: firstEntry.result,
        }
      : DEFAULT_ENTRY,
  };
}

const useSecondaryEducationForm = (
  initialData?: SecondaryEducation[]
): UseFormReturn<SecondaryEducationFormValues> => {
  return useForm<SecondaryEducationFormValues>({
    resolver: zodResolver(secondaryEducationFormSchema),
    defaultValues: buildDefaultValues(initialData),
  });
};

export type { SecondaryEducationFormValues };
export { useSecondaryEducationForm };
