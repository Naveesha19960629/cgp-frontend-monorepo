import { zodResolver } from '@hookform/resolvers/zod';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';

import { z } from 'zod';

import type { SecondaryEducation } from '@/views/vacancies/types';

const selectionItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  source: z.string(),
});

const locationItemSchema = z.object({
  value: z.string(),
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
  entries: z.array(secondaryEducationEntrySchema).min(1),
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

const createEmptySecondaryEducationEntry = (): z.infer<
  typeof secondaryEducationEntrySchema
> => ({
  ...DEFAULT_ENTRY,
});

function buildDefaultValues(
  initialData?: SecondaryEducation[] | Record<string, unknown>
): SecondaryEducationFormValues {
  let normalizedInitialData: SecondaryEducation[] = [];

  if (Array.isArray(initialData)) {
    normalizedInitialData = initialData;
  } else if (isRecord(initialData)) {
    let content: SecondaryEducation['content'] = [];
    if (Array.isArray(initialData.content)) {
      content = initialData.content as SecondaryEducation['content'];
    } else if (Array.isArray(initialData.secondaryEducation)) {
      content = initialData.secondaryEducation as SecondaryEducation['content'];
    }

    normalizedInitialData = [
      {
        isEnabled: Boolean(initialData.isEnabled),
        dataTakenFromCandidate: Boolean(initialData.dataTakenFromCandidate),
        content,
      },
    ];
  }

  if (!normalizedInitialData.length) {
    return {
      isEnabled: false,
      dataTakenFromCandidate: false,
      entries: [createEmptySecondaryEducationEntry()],
    };
  }

  const first = normalizedInitialData[0];

  const entries =
    first.content.length > 0
      ? first.content.map(entry => ({
          acceptsHomeSchooling: entry.acceptsHomeSchooling,
          schools: entry.schools.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          schoolLocations: entry.schoolLocations.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
          })),
          examinations: entry.examinations.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          awardingBodies: entry.secondaryAwardingBody.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          fieldsOfStudy: entry.fieldsOfStudy.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          grade: entry.grade ?? '',
          startDate: entry.startDate ?? undefined,
          endDate: entry.endDate ?? undefined,
          result: entry.result ?? '',
        }))
      : [createEmptySecondaryEducationEntry()];

  return {
    isEnabled: first.isEnabled,
    dataTakenFromCandidate: first.dataTakenFromCandidate,
    entries,
  };
}

const useSecondaryEducationForm = (
  initialData?: SecondaryEducation[] | Record<string, unknown>
): UseFormReturn<SecondaryEducationFormValues> => {
  const form = useForm<SecondaryEducationFormValues>({
    resolver: zodResolver(secondaryEducationFormSchema),
    defaultValues: buildDefaultValues(initialData),
  });
  const { reset } = form;

  useEffect(() => {
    reset(buildDefaultValues(initialData));
  }, [initialData, reset]);

  return form;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type { SecondaryEducationFormValues };
export { createEmptySecondaryEducationEntry, useSecondaryEducationForm };
