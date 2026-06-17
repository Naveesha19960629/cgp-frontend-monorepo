import { zodResolver } from '@hookform/resolvers/zod';

import { useEffect } from 'react';
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
  entries: z.array(tertiaryEducationEntrySchema).min(1),
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

const createEmptyTertiaryEducationEntry = (): z.infer<
  typeof tertiaryEducationEntrySchema
> => ({ ...DEFAULT_ENTRY });

function buildDefaultValues(
  initialData?: TertiaryEducation[]
): TertiaryEducationFormValues {
  if (!initialData?.length) {
    return {
      isEnabled: false,
      dataTakenFromCandidate: false,
      entries: [createEmptyTertiaryEducationEntry()],
    };
  }

  const first = initialData[0];

  const entries =
    first.content.length > 0
      ? first.content.map(firstEntry => ({
          qualificationName: firstEntry.qualificationName.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          tertiaryAwardingBody: firstEntry.tertiaryAwardingBody.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          tertiaryAwardingBodyLocations:
            firstEntry.tertiaryAwardingBodyLocations.map(r => ({
              value: r.id,
              label:
                ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            })),
          levelOfQualification: firstEntry.levelOfQualification.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          specialization: firstEntry.specialization.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          studyMode: firstEntry.studyMode.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          studyPattern: firstEntry.studyPattern.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          deliverySchedule: firstEntry.deliverySchedule.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          batch: firstEntry.batch.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          department: firstEntry.department.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          faculty: firstEntry.faculty.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) || r.id,
            source: r.source,
          })),
          grade: firstEntry.grade,
        }))
      : [createEmptyTertiaryEducationEntry()];

  return {
    isEnabled: first.isEnabled,
    dataTakenFromCandidate: first.dataTakenFromCandidate,
    entries,
  };
}

const useTertiaryEducationForm = (
  initialData?: TertiaryEducation[]
): UseFormReturn<TertiaryEducationFormValues> => {
  const form = useForm<TertiaryEducationFormValues>({
    resolver: zodResolver(tertiaryEducationFormSchema),
    defaultValues: buildDefaultValues(initialData),
  });
  const { reset } = form;

  useEffect(() => {
    reset(buildDefaultValues(initialData));
  }, [initialData, reset]);

  return form;
};

export type { TertiaryEducationFormValues };
export { createEmptyTertiaryEducationEntry, useTertiaryEducationForm };
