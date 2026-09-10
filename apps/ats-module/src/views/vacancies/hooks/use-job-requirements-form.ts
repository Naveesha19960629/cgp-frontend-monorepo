import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { z } from 'zod';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';

const selectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  source: z.string(),
});

type JobRequirementsFormValues = z.infer<
  ReturnType<typeof createJobRequirementsSchema>
>;

const createJobRequirementsSchema = (validationErrors: {
  discipline: string;
  careerPath: string;
  level: string;
  role: string;
  jobTitle: string;
}) =>
  z
    .object({
      isEnabled: z.boolean(),
      dataTakenFromCandidate: z.boolean(),
      discipline: z
        .array(selectOptionSchema)
        .min(1, { message: validationErrors.discipline })
        .max(1),
      careerPath: z
        .array(selectOptionSchema)
        .min(1, { message: validationErrors.careerPath })
        .max(1),
      level: z.array(selectOptionSchema).max(1),
      role: z.array(selectOptionSchema).max(10),
      jobTitle: z
        .array(selectOptionSchema)
        .min(1, { message: validationErrors.jobTitle })
        .max(10),
      employmentType: z.array(selectOptionSchema).max(10),
      workSchedule: z.array(selectOptionSchema).max(10),
      engagementModel: z.array(selectOptionSchema).max(10),
      description: z.string().max(2000).optional(),
    })
    .superRefine((data, ctx) => {
      const isOther = data.discipline[0]?.label?.toLowerCase() === 'other';
      if (!isOther) {
        if (data.level.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: validationErrors.level,
            path: ['level'],
          });
        }
        if (data.role.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: validationErrors.role,
            path: ['role'],
          });
        }
      }
    });

const mapRefToFormOption = (
  refs?: Array<{ id: string; label: string; source: string }>
) =>
  (refs ?? []).map(ref => ({
    value: ref.id,
    label: ref.label,
    source: ref.source,
  }));

const useJobRequirementsForm = () => {
  const { t } = useTranslation('ats');
  const {
    form: { jobRequirements },
  } = useVacancyForm();

  const initial = jobRequirements[0];

  const jobRequirementsSchema = createJobRequirementsSchema({
    discipline: t('jobRequirements.errors.required.discipline'),
    careerPath: t('jobRequirements.errors.required.careerPath'),
    level: t('jobRequirements.errors.required.level'),
    role: t('jobRequirements.errors.required.role'),
    jobTitle: t('jobRequirements.errors.required.jobTitle'),
  });

  return useForm<JobRequirementsFormValues>({
    resolver: zodResolver(jobRequirementsSchema),
    mode: 'onChange',
    defaultValues: {
      // DQCGP-3862: round-trip the loaded flags instead of hardcoding —
      // this section has no UI toggle for either, but silently resetting
      // them to a fixed default on every edit (regardless of what the
      // vacancy was actually saved with) mutated data the user never
      // touched and triggered a spurious new version on Update.
      isEnabled: initial?.isEnabled ?? true,
      dataTakenFromCandidate: initial?.dataTakenFromCandidate ?? false,
      discipline: mapRefToFormOption(initial?.discipline),
      careerPath: mapRefToFormOption(initial?.careerPath),
      level: mapRefToFormOption(initial?.level),
      role: mapRefToFormOption(initial?.role),
      jobTitle: mapRefToFormOption(initial?.jobTitle),
      employmentType: mapRefToFormOption(initial?.employmentType),
      workSchedule: mapRefToFormOption(initial?.workSchedule),
      engagementModel: mapRefToFormOption(initial?.engagementModel),
      description: initial?.description ?? '',
    },
  });
};

export { useJobRequirementsForm, type JobRequirementsFormValues };
