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

function pickProfileRequirement(
  sectionSource: Record<string, unknown>
): Record<string, unknown> {
  const profileRequirement = sectionSource.profileRequirement;
  if (Array.isArray(profileRequirement) && isRecord(profileRequirement[0])) {
    return profileRequirement[0];
  }
  if (isRecord(profileRequirement)) {
    return profileRequirement;
  }

  const profileRequirements = sectionSource.profileRequirements;
  if (isRecord(profileRequirements)) {
    return profileRequirements;
  }
  if (Array.isArray(profileRequirements) && isRecord(profileRequirements[0])) {
    return profileRequirements[0];
  }

  return {};
}

function getAddressField(
  addr: Record<string, unknown>,
  fieldName: string
): string {
  if (isRecord(addr[fieldName])) {
    return toLabel(addr[fieldName]);
  }
  const labelKey = `${fieldName}Label`;
  if (typeof addr[labelKey] === 'string') {
    return addr[labelKey];
  }
  const refIdKey = `${fieldName}RefId`;
  if (typeof addr[refIdKey] === 'string') {
    return addr[refIdKey];
  }
  return toLabel(addr[fieldName]);
}

function getAddressStateProvince(addr: Record<string, unknown>): string {
  if (isRecord(addr.stateProvince)) {
    return toLabel(addr.stateProvince);
  }
  if (isRecord(addr.state)) {
    return toLabel(addr.state);
  }
  if (typeof addr.stateLabel === 'string') {
    return addr.stateLabel;
  }
  if (typeof addr.stateProvinceLabel === 'string') {
    return addr.stateProvinceLabel;
  }
  return toLabel(addr.stateProvince ?? addr.state);
}

function toVacancyViewModel(
  rawVacancy: Record<string, unknown>
): VacancyViewModel {
  const sectionSource = isRecord(rawVacancy.data)
    ? rawVacancy.data
    : rawVacancy;
  const jobRequirement = pickJobRequirement(sectionSource);
  const profileRequirement = pickProfileRequirement(sectionSource);

  const title =
    toSafeString(rawVacancy.title) ||
    toSafeString(rawVacancy.vacancyTitle) ||
    toSafeString(rawVacancy.name);

  const prIsEnabled =
    typeof profileRequirement.isEnabled === 'boolean'
      ? profileRequirement.isEnabled
      : false;
  const prDataTakenFromCandidate =
    typeof profileRequirement.dataTakenFromCandidate === 'boolean'
      ? profileRequirement.dataTakenFromCandidate
      : false;

  const prContent = isRecord(profileRequirement.content)
    ? profileRequirement.content
    : profileRequirement;

  const rawAddresses = Array.isArray(prContent.addresses)
    ? prContent.addresses
    : [];

  const addresses = rawAddresses.map(addr => {
    if (!isRecord(addr)) {
      return { city: '', stateProvince: '', country: '', postalCode: '' };
    }
    return {
      city: getAddressField(addr, 'city'),
      stateProvince: getAddressStateProvince(addr),
      country: getAddressField(addr, 'country'),
      postalCode: toSafeString(addr.postalCode),
    };
  });

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
    profileRequirement: {
      isEnabled: prIsEnabled,
      dataTakenFromCandidate: prDataTakenFromCandidate,
      gender: toLabel(prContent.gender),
      maritalStatus: toLabel(prContent.maritalStatus),
      addresses,
    },
  };
}

export { toVacancyViewModel };
