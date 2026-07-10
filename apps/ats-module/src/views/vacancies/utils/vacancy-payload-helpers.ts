import type {
  CausesApiPayload,
  ClubSocietiesGroupApiPayload,
  CreateVacancyPayload,
  CustomizedFormApiPayload,
  CustomizedFormQuestionApiPayload,
  HobbiesApiPayload,
  HonoursGroupApiPayload,
  IndustryApiPayload,
  JobRequirementApiPayload,
  LanguagesApiPayload,
  LicenseCertificates,
  MasterRef,
  OptionWithSource,
  PatentGroupApiPayload,
  ProfileRequirementApiPayload,
  ProjectGroupApiPayload,
  PublicationGroupApiPayload,
  SecondaryEducation,
  SkillsApiPayload,
  SportsGroupApiPayload,
  TertiaryEducation,
  VacancyForm,
  VolunteeringGroupApiPayload,
} from '@/views/vacancies/types';

import { format } from 'date-fns';

function toRef(item: OptionWithSource): MasterRef {
  return {
    source: item.source ?? 'MASTER',
    id: item.value ?? '',
  };
}

function normalizeLicenseSource(source?: string): 'MASTER' | 'PENDING' {
  if (source === 'PENDING' || source === 'PENDING_TEMP') {
    return 'PENDING';
  }

  return 'MASTER';
}

function isTemporaryLicenseId(id: string): boolean {
  return id.startsWith('__pending_license_cert_');
}

function normalizeLicenseType(type?: string): 'LICENSE' | 'CERTIFICATE' {
  if (type === 'LICENSE') {
    return 'LICENSE';
  }

  return 'CERTIFICATE';
}

function toRefFromAddOrSelect(item: {
  source?: string;
  id?: string;
  label?: string;
}): MasterRef {
  return {
    source: item.source ?? 'MASTER',
    id: item.id ?? '',
  };
}

function formatOptionalDate(
  date: Date | string | undefined
): string | undefined {
  if (!date) return undefined;
  if (date instanceof Date) return format(date, 'yyyy-MM-dd');
  return normalizeToDateOnly(date);
}

function normalizeToDateOnly(value: string): string {
  if (!value) return '';
  const [datePart] = value.split('T');
  return datePart || '';
}

function mapJobRequirement(form: VacancyForm): JobRequirementApiPayload {
  const jobReq = form.jobRequirements[0];
  if (!jobReq) {
    return {
      isEnabled: true,
      dataTakenFromCandidate: false,
      roles: [],
      jobTitles: [],
    };
  }

  if (jobReq.dataTakenFromCandidate) {
    return {
      isEnabled: jobReq.isEnabled,
      dataTakenFromCandidate: true,
      roles: [],
      jobTitles: [],
    };
  }

  return {
    isEnabled: jobReq.isEnabled,
    dataTakenFromCandidate: jobReq.dataTakenFromCandidate,
    discipline: jobReq.discipline[0]
      ? toRefFromAddOrSelect(jobReq.discipline[0])
      : undefined,
    careerPath: jobReq.careerPath[0]
      ? toRefFromAddOrSelect(jobReq.careerPath[0])
      : undefined,
    level: jobReq.level[0] ? toRefFromAddOrSelect(jobReq.level[0]) : undefined,
    roles: jobReq.role.map(r => toRefFromAddOrSelect(r)),
    jobTitles: jobReq.jobTitle.map(jt => toRefFromAddOrSelect(jt)),
    employmentTypes: jobReq.employmentType.map(et => toRefFromAddOrSelect(et)),
    workSchedules: jobReq.workSchedule.map(ws => toRefFromAddOrSelect(ws)),
    engagementModels: jobReq.engagementModel.map(em =>
      toRefFromAddOrSelect(em)
    ),
    description: jobReq.description,
  };
}

function mapProfileRequirement(
  form: VacancyForm
): ProfileRequirementApiPayload[] {
  const pr = form.profileRequirements;

  if (pr.dataTakenFromCandidate) {
    return [
      {
        isEnabled: pr.isEnabled,
        dataTakenFromCandidate: true,
        content: {
          gender: '',
          maritalStatus: '',
          addresses: [],
        },
      },
    ];
  }

  return [
    {
      isEnabled: pr.isEnabled,
      dataTakenFromCandidate: pr.dataTakenFromCandidate,
      content: {
        gender: pr.gender?.id ?? '',
        maritalStatus: pr.maritalStatus?.id ?? '',
        addresses: pr.addresses.map(addr => ({
          cityRefId: addr.city?.id ?? '',
          stateRefId: addr.stateProvince?.id ?? '',
          countryRefId: addr.country?.id ?? '',
          postalCode: addr.postalCode ?? '',
        })),
      },
    },
  ];
}

function mapPatents(form: VacancyForm): PatentGroupApiPayload[] {
  if (!form.patents) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (form.patents.dataTakenFromCandidate) {
    return [
      {
        isEnabled: form.patents.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      },
    ];
  }

  return [
    {
      isEnabled: form.patents.isEnabled,
      dataTakenFromCandidate: form.patents.dataTakenFromCandidate,
      content: form.patents.patents.map(p => ({
        statuses: p.statuses.map(s => s.value),
        fromDate: formatOptionalDate(p.fromDate),
        toDate: formatOptionalDate(p.toDate),
        relatedIndustry: p.relatedIndustries.map(i => ({
          source: i.source,
          id: i.value,
        })),
      })),
    },
  ];
}

function mapHonoursAndAwards(form: VacancyForm): HonoursGroupApiPayload[] {
  if (!form.preferredHonoursAwards) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (form.preferredHonoursAwards.dataTakenFromCandidate) {
    return [
      {
        isEnabled: form.preferredHonoursAwards.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      },
    ];
  }

  return [
    {
      isEnabled: form.preferredHonoursAwards.isEnabled,
      dataTakenFromCandidate:
        form.preferredHonoursAwards.dataTakenFromCandidate,
      content: form.preferredHonoursAwards.honoursAndAwards.map(h => ({
        title: h.title,
        associatedOrganizations: h.associatedOrganizations.map(o => ({
          source: o.source,
          id: o.value,
        })),
        organizationLocations: h.organizationLocations.map(l => ({
          source: 'MASTER' as const,
          id: l.value,
        })),
        issuedBy: h.issuedBy,
        issuedFromDate: formatOptionalDate(h.issuedDateFrom),
        issuedToDate: formatOptionalDate(h.issuedDateTo),
      })),
    },
  ];
}

function mapProjects(form: VacancyForm): ProjectGroupApiPayload[] {
  if (!form.projectsRequirements) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (form.projectsRequirements.dataTakenFromCandidate) {
    return [
      {
        isEnabled: form.projectsRequirements.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      },
    ];
  }

  return [
    {
      isEnabled: form.projectsRequirements.isEnabled,
      dataTakenFromCandidate: form.projectsRequirements.dataTakenFromCandidate,
      content: form.projectsRequirements.projects.map(p => ({
        relatedIndustry: p.relatedIndustry.map(i => toRef(i)),
        organization: p.organizations.map(o => toRef(o)),
        organizationLocations: p.organizationLocations.map(l => ({
          source: 'MASTER' as const,
          id: l.value,
        })),
        startDate: formatOptionalDate(p.startDate) ?? '',
        endDate: formatOptionalDate(p.endDate) ?? '',
      })),
    },
  ];
}

function mapPublications(form: VacancyForm): PublicationGroupApiPayload[] {
  if (!form.preferredPublications) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (form.preferredPublications.dataTakenFromCandidate) {
    return [
      {
        isEnabled: form.preferredPublications.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      },
    ];
  }

  return [
    {
      isEnabled: form.preferredPublications.isEnabled,
      dataTakenFromCandidate: form.preferredPublications.dataTakenFromCandidate,
      content: form.preferredPublications.publications.map(p => ({
        acceptedPublisherName: p.acceptedPublisher,
        publishedDateFrom: formatOptionalDate(p.publishedDateFrom) ?? '',
        publishedDateTo: formatOptionalDate(p.publishedDateTo) ?? '',
      })),
    },
  ];
}

function mapClubSocieties(form: VacancyForm): ClubSocietiesGroupApiPayload[] {
  if (!form.preferredClubSocieties) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (form.preferredClubSocieties.dataTakenFromCandidate) {
    return [
      {
        isEnabled: form.preferredClubSocieties.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      },
    ];
  }

  return [
    {
      isEnabled: form.preferredClubSocieties.isEnabled,
      dataTakenFromCandidate:
        form.preferredClubSocieties.dataTakenFromCandidate,
      content: form.preferredClubSocieties.clubSocieties.map(e => ({
        clubSociety: e.clubSociety.map(c => toRef(c)),
        organization: e.representedOrganization.map(o => toRef(o)),
        organizationLocations: e.organizationLocations.map(l => ({
          source: 'MASTER' as const,
          id: l.value,
        })),
        positionRoleHeld: e.position,
        startDate: formatOptionalDate(e.startDate) ?? '',
        endDate: formatOptionalDate(e.endDate) ?? '',
      })),
    },
  ];
}

function mapSports(form: VacancyForm): SportsGroupApiPayload[] {
  if (!form.preferredSports) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (form.preferredSports.dataTakenFromCandidate) {
    return [
      {
        isEnabled: form.preferredSports.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      },
    ];
  }

  return [
    {
      isEnabled: form.preferredSports.isEnabled,
      dataTakenFromCandidate: form.preferredSports.dataTakenFromCandidate,
      content: form.preferredSports.sports.map(e => ({
        nameOfSport: e.sport.map(s => toRef(s)),
        representedOrganization: e.representedOrganization.map(o => toRef(o)),
        organizationLocations: e.organizationLocations.map(l => ({
          source: 'MASTER' as const,
          id: l.value,
        })),
        levelRepresented: e.levelRepresented.map(l => toRef(l)),
        positionRoleHeld: e.position,
        startDate: formatOptionalDate(e.startDate) ?? '',
        endDate: formatOptionalDate(e.endDate) ?? '',
      })),
    },
  ];
}

function mapVolunteering(form: VacancyForm): VolunteeringGroupApiPayload[] {
  if (!form.preferredVolunteering) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (form.preferredVolunteering.dataTakenFromCandidate) {
    return [
      {
        isEnabled: form.preferredVolunteering.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      },
    ];
  }

  return [
    {
      isEnabled: form.preferredVolunteering.isEnabled,
      dataTakenFromCandidate: form.preferredVolunteering.dataTakenFromCandidate,
      content: form.preferredVolunteering.volunteering.map(e => ({
        organization: e.organizationName.map(o => toRef(o)),
        organizationLocations: e.organizationLocations.map(l => ({
          source: 'MASTER' as const,
          id: l.value,
        })),
        positionRole: e.position,
        cause: e.cause.map(c => toRef(c)),
        startDate: formatOptionalDate(e.startDate) ?? '',
        endDate: formatOptionalDate(e.endDate) ?? '',
      })),
    },
  ];
}

function mapPreferredSkills(form: VacancyForm): SkillsApiPayload {
  if (!form.preferredSkills) {
    return { isEnabled: false, dataTakenFromCandidate: false, content: [] };
  }

  if (form.preferredSkills.dataTakenFromCandidate) {
    return {
      isEnabled: form.preferredSkills.isEnabled,
      dataTakenFromCandidate: true,
      content: [],
    };
  }

  return {
    isEnabled: form.preferredSkills.isEnabled,
    dataTakenFromCandidate: form.preferredSkills.dataTakenFromCandidate,
    content: form.preferredSkills.skills.map(s => ({
      source: s.source ?? 'MASTER',
      id: s.skillId,
    })),
  };
}

function mapPreferredLanguages(form: VacancyForm): LanguagesApiPayload {
  if (!form.preferredLanguages) {
    return { isEnabled: false, dataTakenFromCandidate: false, content: [] };
  }

  if (form.preferredLanguages.dataTakenFromCandidate) {
    return {
      isEnabled: form.preferredLanguages.isEnabled,
      dataTakenFromCandidate: true,
      content: [],
    };
  }

  return {
    isEnabled: form.preferredLanguages.isEnabled,
    dataTakenFromCandidate: form.preferredLanguages.dataTakenFromCandidate,
    content: form.preferredLanguages.languages.map(l => ({
      source: l.source ?? 'MASTER',
      id: l.id,
    })),
  };
}

function mapPreferredCauses(form: VacancyForm): CausesApiPayload[] {
  if (!form.preferredCauses) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (form.preferredCauses.dataTakenFromCandidate) {
    return [
      {
        isEnabled: form.preferredCauses.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      },
    ];
  }

  return [
    {
      isEnabled: form.preferredCauses.isEnabled,
      dataTakenFromCandidate: form.preferredCauses.dataTakenFromCandidate,
      content: form.preferredCauses.causes.map(c => ({
        source: c.source ?? 'MASTER',
        id: c.id,
      })),
    },
  ];
}

function mapPreferredHobbies(form: VacancyForm): HobbiesApiPayload[] {
  if (!form.preferredHobbies) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  if (form.preferredHobbies.dataTakenFromCandidate) {
    return [
      {
        isEnabled: form.preferredHobbies.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      },
    ];
  }

  return [
    {
      isEnabled: form.preferredHobbies.isEnabled,
      dataTakenFromCandidate: form.preferredHobbies.dataTakenFromCandidate,
      content: form.preferredHobbies.hobbies.map(h => ({
        source: h.source ?? 'MASTER',
        id: h.id,
      })),
    },
  ];
}

function mapIndustry(form: VacancyForm): IndustryApiPayload {
  if (!form.preferredIndustries) {
    return { isEnabled: false, dataTakenFromCandidate: false, content: [] };
  }

  if (form.preferredIndustries.dataTakenFromCandidate) {
    return {
      isEnabled: form.preferredIndustries.isEnabled,
      dataTakenFromCandidate: true,
      content: [],
    };
  }

  return {
    isEnabled: form.preferredIndustries.isEnabled,
    dataTakenFromCandidate: form.preferredIndustries.dataTakenFromCandidate,
    content: form.preferredIndustries.industries.map(i => ({
      source: i.source ?? 'MASTER',
      id: i.id,
    })),
  };
}

function mapCustomizedForm(form: VacancyForm): CustomizedFormApiPayload {
  if (!form.customizableForm) {
    return { isEnabled: false, sectionTitle: null, forms: [] };
  }

  return {
    isEnabled: form.customizableForm.isEnabled,
    sectionTitle: form.customizableForm.sectionTitle || null,
    forms: form.customizableForm.forms.map((f, formIdx) => ({
      title: f.title,
      displayOrder: formIdx + 1,
      questions: f.questions.map((q, qIdx) => {
        const base: CustomizedFormQuestionApiPayload = {
          questionText: q.text,
          questionType: q.type,
          required: q.required,
          displayOrder: qIdx + 1,
        };

        const choiceTypes = ['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'];
        if (choiceTypes.includes(q.type)) {
          // Option fields left blank are not valid options and are not saved.
          const filledOptions = q.options.filter(o => o.value.trim() !== '');
          if (filledOptions.length > 0) {
            base.options = filledOptions.map((o, oIdx) => ({
              value: o.value,
              displayOrder: oIdx + 1,
            }));
          }
        }

        if (q.type === 'LINEAR_SCALE') {
          base.linearScale = {
            startValue: q.from,
            endValue: q.to,
            startLabel: q.startLabel,
            endLabel: q.endLabel,
          };
        }

        return base;
      }),
    })),
  };
}

function mapLicensesAndCertifications(
  form: VacancyForm
): LicenseCertificates[] {
  if (!form.licenseCertificates) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  return form.licenseCertificates.map(lc => {
    if (lc.dataTakenFromCandidate) {
      return {
        isEnabled: lc.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      };
    }

    return {
      isEnabled: lc.isEnabled,
      dataTakenFromCandidate: lc.dataTakenFromCandidate,
      content: (lc.content ?? []).map(entry => ({
        nameOfLicenseCert: (entry.nameOfLicenseCert ?? [])
          .filter(
            ref => ref?.source && ref?.id && !isTemporaryLicenseId(ref.id)
          )
          .map(ref => ({
            source: normalizeLicenseSource(ref.source),
            id: ref.id,
            type: normalizeLicenseType(ref.type),
          })),
        issuingOrganization: (entry.issuingOrganization ?? [])
          .filter(ref => ref?.source && ref?.id)
          .map(ref => ({
            source: ref.source,
            id: ref.id,
          })),
        organizationLocations: (entry.organizationLocations ?? [])
          .filter(ref => ref?.source && ref?.id)
          .map(ref => ({
            source: ref.source,
            id: ref.id,
          })),
        internationallyAccepted: entry.internationallyAccepted,
        issueDate: entry.issueDate,
        expirationDate: entry.expirationDate,
      })),
    };
  });
}

function mapSecondaryEducation(form: VacancyForm): SecondaryEducation[] {
  return form.secondaryEducation.map(se => {
    if (se.dataTakenFromCandidate) {
      return {
        isEnabled: se.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      };
    }
    return {
      ...se,
      content: se.content.map(entry => ({
        ...entry,
        startDate: normalizeToDateOnly(entry.startDate),
        endDate: normalizeToDateOnly(entry.endDate),
      })),
    };
  });
}

function mapTertiaryEducation(form: VacancyForm): TertiaryEducation[] {
  return form.tertiaryEducation.map(te => {
    if (te.dataTakenFromCandidate) {
      return {
        isEnabled: te.isEnabled,
        dataTakenFromCandidate: true,
        content: [],
      };
    }
    return te;
  });
}

// Explicit map from form state values → API enum values.
// on_hold (form) maps to ONHOLD (API enum, no underscore).
const FORM_STATUS_TO_API: Record<string, string> = {
  draft: 'DRAFT',
  unpublished: 'UNPUBLISHED',
  live: 'LIVE',
  expired: 'EXPIRED',
  on_hold: 'ONHOLD',
};

function toApiStatus(formStatus: string): string {
  return FORM_STATUS_TO_API[formStatus.trim().toLowerCase()] ?? 'UNPUBLISHED';
}

function toVacancyPayload(
  form: VacancyForm,
  status: string
): CreateVacancyPayload {
  return {
    title: form.title,
    status,
    lastActiveStep: form.lastActiveStep,
    data: {
      jobRequirement: mapJobRequirement(form),
      profileRequirement: mapProfileRequirement(form),
      secondaryEducation: mapSecondaryEducation(form),
      tertiaryEducation: mapTertiaryEducation(form),
      skills: mapPreferredSkills(form),
      languages: mapPreferredLanguages(form),
      causes: mapPreferredCauses(form),
      hobbyList: mapPreferredHobbies(form),
      industry: mapIndustry(form),
      schedule: {
        schedulePublishAt: form.schedule?.schedulePublishAt || null,
        expirationAt: form.schedule?.expirationAt || null,
      },
      customizedForm: mapCustomizedForm(form),
      projects: mapProjects(form),
      publications: mapPublications(form),
      clubsAndSocieties: mapClubSocieties(form),
      sports: mapSports(form),
      volunteering: mapVolunteering(form),
      patents: mapPatents(form),
      honoursAndAwards: mapHonoursAndAwards(form),
      licensesAndCertifications: mapLicensesAndCertifications(form),
    },
  };
}

function toCreateVacancyPayload(
  form: VacancyForm,
  status = 'UNPUBLISHED'
): CreateVacancyPayload {
  return toVacancyPayload(form, status);
}

function toUpdateVacancyPayload(
  form: VacancyForm,
  existingStatus: string
): CreateVacancyPayload {
  return toVacancyPayload(form, toApiStatus(existingStatus));
}

export { toCreateVacancyPayload, toUpdateVacancyPayload };
