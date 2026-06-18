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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function buildDefaultValues(
  initialData?: TertiaryEducation[] | Record<string, unknown>
): TertiaryEducationFormValues {
  let normalizedInitialData: TertiaryEducation[] = [];

  if (Array.isArray(initialData)) {
    normalizedInitialData = initialData;
  } else if (isRecord(initialData)) {
    let content: TertiaryEducation['content'] = [];
    if (Array.isArray(initialData.content)) {
      content = initialData.content as TertiaryEducation['content'];
    } else if (Array.isArray(initialData.tertiaryEducation)) {
      content = initialData.tertiaryEducation as TertiaryEducation['content'];
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
      entries: [createEmptyTertiaryEducationEntry()],
    };
  }

  const first = normalizedInitialData[0];

  const entries =
    first.content.length > 0
      ? first.content.map(entry => ({
          qualificationName: entry.qualificationName.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          tertiaryAwardingBody: entry.tertiaryAwardingBody.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          tertiaryAwardingBodyLocations:
            entry.tertiaryAwardingBodyLocations.map(r => ({
              value: r.id,
              label:
                ('name' in r && typeof r.name === 'string' && r.name) ||
                ('label' in r &&
                  typeof (r as { label?: unknown }).label === 'string' &&
                  (r as { label: string }).label) ||
                r.id,
            })),
          levelOfQualification: entry.levelOfQualification.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          specialization: entry.specialization.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          studyMode: entry.studyMode.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          studyPattern: entry.studyPattern.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          deliverySchedule: entry.deliverySchedule.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          batch: entry.batch.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          department: entry.department.map(r => ({
            value: r.id,
            label:
              ('name' in r && typeof r.name === 'string' && r.name) ||
              ('label' in r &&
                typeof (r as { label?: unknown }).label === 'string' &&
                (r as { label: string }).label) ||
              r.id,
            source: r.source,
          })),
          faculty: entry.faculty.map(r => ({
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
        }))
      : [createEmptyTertiaryEducationEntry()];

  return {
    isEnabled: first.isEnabled,
    dataTakenFromCandidate: first.dataTakenFromCandidate,
    entries,
  };
}

const useTertiaryEducationForm = (
  initialData?: TertiaryEducation[] | Record<string, unknown>
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
