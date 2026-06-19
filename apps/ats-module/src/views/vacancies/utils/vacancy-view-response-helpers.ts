import type { VacancyViewModel } from '@/views/vacancies/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toLabel(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (!isRecord(value)) {
    return '';
  }

  return (
    toSafeString(value.label) ||
    toSafeString(value.displayValue) ||
    toSafeString(value.name) ||
    toSafeString(value.value) ||
    toSafeString(value.id)
  );
}

function toTagList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(toLabel).filter(Boolean);
  }

  const single = toLabel(value);
  return single ? [single] : [];
}

function pickJobRequirement(
  sectionSource: Record<string, unknown>
): Record<string, unknown> {
  const jobRequirements = sectionSource.jobRequirements;
  if (Array.isArray(jobRequirements) && isRecord(jobRequirements[0])) {
    return jobRequirements[0];
  }
  if (isRecord(jobRequirements)) {
    return jobRequirements;
  }

  const jobRequirement = sectionSource.jobRequirement;
  if (isRecord(jobRequirement)) {
    return jobRequirement;
  }
  if (Array.isArray(jobRequirement) && isRecord(jobRequirement[0])) {
    return jobRequirement[0];
  }

  return {};
}

function toVacancyViewModel(
  rawVacancy: Record<string, unknown>
): VacancyViewModel {
  const sectionSource = isRecord(rawVacancy.data)
    ? rawVacancy.data
    : rawVacancy;
  const jobRequirement = pickJobRequirement(sectionSource);

  const title =
    toSafeString(rawVacancy.title) ||
    toSafeString(rawVacancy.vacancyTitle) ||
    toSafeString(rawVacancy.name);

  return {
    title,
    status: toSafeString(rawVacancy.status),
    applicantCount:
      toSafeNumber(rawVacancy.applicantCount) ||
      toSafeNumber(rawVacancy.appliedCount),
    jobRequirement: {
      discipline: toTagList(jobRequirement.discipline),
      careerPath: toTagList(jobRequirement.careerPath),
      level: toTagList(jobRequirement.level),
      role: toTagList(jobRequirement.role ?? jobRequirement.roles),
      jobTitle: toTagList(jobRequirement.jobTitle ?? jobRequirement.jobTitles),
      employmentType: toTagList(
        jobRequirement.employmentType ?? jobRequirement.employmentTypes
      ),
      workSchedule: toTagList(
        jobRequirement.workSchedule ?? jobRequirement.workSchedules
      ),
      engagementModel: toTagList(
        jobRequirement.engagementModel ?? jobRequirement.engagementModels
      ),
      description: toSafeString(jobRequirement.description),
    },
  };
}

export { toVacancyViewModel };
