import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { z } from 'zod';

import type { TertiaryEducation } from '@/views/vacancies/types';

const selectionItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  source: z.string(),
});

const locationItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const tertiaryEducationEntrySchema = z.object({
  qualificationName: z.array(selectionItemSchema).max(10),
  tertiaryAwardingBody: z.array(selectionItemSchema).max(10),
  tertiaryAwardingBodyLocations: z.array(locationItemSchema).max(10),
  levelOfQualification: z.array(selectionItemSchema).max(10),
  specialization: z.array(selectionItemSchema).max(10),
  studyMode: z.array(selectionItemSchema).max(10),
  studyPattern: z.array(selectionItemSchema).max(10),
  deliverySchedule: z.array(selectionItemSchema).max(10),
  batch: z.array(selectionItemSchema).max(10),
  department: z.array(selectionItemSchema).max(10),
  faculty: z.array(selectionItemSchema).max(10),
  grade: z.string().max(80),
});

const tertiaryEducationFormSchema = z.object({
  isEnabled: z.boolean(),
  dataTakenFromCandidate: z.boolean(),
  entry: tertiaryEducationEntrySchema,
});

type TertiaryEducationFormValues = z.infer<typeof tertiaryEducationFormSchema>;

const DEFAULT_ENTRY: z.infer<typeof tertiaryEducationEntrySchema> = {
  qualificationName: [],
  tertiaryAwardingBody: [],
  tertiaryAwardingBodyLocations: [],
  levelOfQualification: [],
  specialization: [],
  studyMode: [],
  studyPattern: [],
  deliverySchedule: [],
  batch: [],
  department: [],
  faculty: [],
  grade: '',
};

function buildDefaultValues(
  initialData?: TertiaryEducation[]
): TertiaryEducationFormValues {
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
          qualificationName: firstEntry.qualificationName.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          tertiaryAwardingBody: firstEntry.tertiaryAwardingBody.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          tertiaryAwardingBodyLocations:
            firstEntry.tertiaryAwardingBodyLocations.map(r => ({
              value: r.id,
              label: r.name ?? r.id,
            })),
          levelOfQualification: firstEntry.levelOfQualification.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          specialization: firstEntry.specialization.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          studyMode: firstEntry.studyMode.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          studyPattern: firstEntry.studyPattern.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          deliverySchedule: firstEntry.deliverySchedule.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          batch: firstEntry.batch.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          department: firstEntry.department.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          faculty: firstEntry.faculty.map(r => ({
            value: r.id,
            label: r.name ?? r.id,
            source: r.source,
          })),
          grade: firstEntry.grade,
        }
      : DEFAULT_ENTRY,
  };
}

const useTertiaryEducationForm = (
  initialData?: TertiaryEducation[]
): UseFormReturn<TertiaryEducationFormValues> => {
  return useForm<TertiaryEducationFormValues>({
    resolver: zodResolver(tertiaryEducationFormSchema),
    defaultValues: buildDefaultValues(initialData),
  });
};

export type { TertiaryEducationFormValues };
export { useTertiaryEducationForm };
