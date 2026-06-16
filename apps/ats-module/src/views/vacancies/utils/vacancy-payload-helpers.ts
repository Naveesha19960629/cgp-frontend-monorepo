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
  MasterRef,
  OptionWithSource,
  PatentGroupApiPayload,
  ProjectGroupApiPayload,
  PublicationGroupApiPayload,
  SkillsApiPayload,
  SportsGroupApiPayload,
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
  return date;
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

function mapPatents(form: VacancyForm): PatentGroupApiPayload[] {
  if (!form.patents) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
  }

  return [
    {
      isEnabled: form.patents.isEnabled,
      dataTakenFromCandidate: form.patents.dataTakenFromCandidate,
      content: form.patents.patents.map(p => ({
        status: p.statuses[0]?.value,
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

  return [
    {
      isEnabled: form.preferredHonoursAwards.isEnabled,
      dataTakenFromCandidate:
        form.preferredHonoursAwards.dataTakenFromCandidate,
      content: form.preferredHonoursAwards.honoursAndAwards.map(h => ({
        title: h.title,
        issuedBy: h.issuedBy,
        issuedDateFrom: formatOptionalDate(h.issuedDateFrom),
        issuedDateTo: formatOptionalDate(h.issuedDateTo),
        associatedOrganizations: h.associatedOrganizations.map(o => ({
          source: o.source,
          id: o.value,
        })),
        organizationLocations: h.organizationLocations.map(l => ({
          source: 'MASTER' as const,
          id: l.value,
        })),
      })),
    },
  ];
}

function mapProjects(form: VacancyForm): ProjectGroupApiPayload[] {
  if (!form.projectsRequirements) {
    return [{ isEnabled: false, dataTakenFromCandidate: false, content: [] }];
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
        startDate: p.startDate ?? '',
        endDate: p.endDate ?? '',
      })),
    },
  ];
}

function mapPublications(
  form: VacancyForm
): PublicationGroupApiPayload[] | undefined {
  if (!form.preferredPublications) return undefined;

  return [
    {
      isEnabled: form.preferredPublications.isEnabled,
      dataTakenFromCandidate: form.preferredPublications.dataTakenFromCandidate,
      content: form.preferredPublications.publications.map(p => ({
        acceptedPublisher: p.acceptedPublisher,
        publishedDateFrom: p.publishedDateFrom ?? '',
        publishedDateTo: p.publishedDateTo ?? '',
      })),
    },
  ];
}

function mapClubSocieties(
  form: VacancyForm
): ClubSocietiesGroupApiPayload[] | undefined {
  if (!form.preferredClubSocieties) return undefined;

  return [
    {
      isEnabled: form.preferredClubSocieties.isEnabled,
      dataTakenFromCandidate:
        form.preferredClubSocieties.dataTakenFromCandidate,
      content: form.preferredClubSocieties.clubSocieties.map(e => ({
        clubSociety: e.clubSociety.map(c => toRef(c)),
        representedOrganization: e.representedOrganization.map(o => toRef(o)),
        organizationLocation: e.organizationLocations[0]
          ? {
              source: 'MASTER' as const,
              id: e.organizationLocations[0].value,
            }
          : undefined,
        position: e.position,
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
      })),
    },
  ];
}

function mapSports(form: VacancyForm): SportsGroupApiPayload[] | undefined {
  if (!form.preferredSports) return undefined;

  return [
    {
      isEnabled: form.preferredSports.isEnabled,
      dataTakenFromCandidate: form.preferredSports.dataTakenFromCandidate,
      content: form.preferredSports.sports.map(e => ({
        sport: e.sport.map(s => toRef(s)),
        levelRepresented: e.levelRepresented.map(l => toRef(l)),
        representedOrganization: e.representedOrganization.map(o => toRef(o)),
        organizationLocation: e.organizationLocations[0]
          ? {
              source: 'MASTER' as const,
              id: e.organizationLocations[0].value,
            }
          : undefined,
        position: e.position,
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
      })),
    },
  ];
}

function mapVolunteering(
  form: VacancyForm
): VolunteeringGroupApiPayload[] | undefined {
  if (!form.preferredVolunteering) return undefined;

  return [
    {
      isEnabled: form.preferredVolunteering.isEnabled,
      dataTakenFromCandidate: form.preferredVolunteering.dataTakenFromCandidate,
      content: form.preferredVolunteering.volunteering.map(e => ({
        organizationName: e.organizationName.map(o => toRef(o)),
        organizationLocation: e.organizationLocations[0]
          ? {
              source: 'MASTER' as const,
              id: e.organizationLocations[0].value,
            }
          : undefined,
        cause: e.cause.map(c => toRef(c)),
        position: e.position,
        startDate: e.startDate ?? '',
        endDate: e.endDate ?? '',
      })),
    },
  ];
}

function mapPreferredSkills(form: VacancyForm): SkillsApiPayload | undefined {
  if (!form.preferredSkills) return undefined;

  return {
    isEnabled: form.preferredSkills.isEnabled,
    dataTakenFromCandidate: form.preferredSkills.dataTakenFromCandidate,
    skills: form.preferredSkills.skills.map(s => ({
      skillId: s.skillId,
      careerPathId: s.careerPathId,
    })),
  };
}

function mapPreferredLanguages(
  form: VacancyForm
): LanguagesApiPayload | undefined {
  if (!form.preferredLanguages) return undefined;

  return {
    isEnabled: form.preferredLanguages.isEnabled,
    dataTakenFromCandidate: form.preferredLanguages.dataTakenFromCandidate,
    languages: form.preferredLanguages.languages.map(l => ({
      source: l.source ?? 'MASTER',
      id: l.id,
    })),
  };
}

function mapPreferredCauses(form: VacancyForm): CausesApiPayload | undefined {
  if (!form.preferredCauses) return undefined;

  return {
    isEnabled: form.preferredCauses.isEnabled,
    dataTakenFromCandidate: form.preferredCauses.dataTakenFromCandidate,
    causes: form.preferredCauses.causes.map(c => ({
      source: c.source ?? 'MASTER',
      id: c.id,
    })),
  };
}

function mapPreferredHobbies(form: VacancyForm): HobbiesApiPayload | undefined {
  if (!form.preferredHobbies) return undefined;

  return {
    isEnabled: form.preferredHobbies.isEnabled,
    dataTakenFromCandidate: form.preferredHobbies.dataTakenFromCandidate,
    hobbies: form.preferredHobbies.hobbies.map(h => ({
      source: h.source ?? 'MASTER',
      id: h.id,
    })),
  };
}

function mapIndustry(form: VacancyForm): IndustryApiPayload {
  if (!form.preferredIndustries) {
    return { isEnabled: false, dataTakenFromCandidate: false, content: [] };
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
    return { isEnabled: false, sectionTitle: '', forms: [] };
  }

  return {
    isEnabled: form.customizableForm.isEnabled,
    sectionTitle: form.customizableForm.sectionTitle,
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
        if (choiceTypes.includes(q.type) && q.options.length > 0) {
          base.options = q.options.map((o, oIdx) => ({
            value: o.value,
            displayOrder: oIdx + 1,
          }));
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

function toCreateVacancyPayload(form: VacancyForm): CreateVacancyPayload {
  return {
    title: form.title,
    status: 'UNPUBLISHED',
    lastActiveStep: form.lastActiveStep,
    data: {
      jobRequirement: mapJobRequirement(form),
      profileRequirements: form.profileRequirements,
      secondaryEducation: form.secondaryEducation,
      tertiaryEducation: form.tertiaryEducation,
      licenseCertificates: form.licenseCertificates,
      patents: mapPatents(form),
      honoursAndAwards: mapHonoursAndAwards(form),
      projects: mapProjects(form),
      publications: mapPublications(form),
      clubSocieties: mapClubSocieties(form),
      sports: mapSports(form),
      volunteering: mapVolunteering(form),
      preferredSkills: mapPreferredSkills(form),
      preferredLanguages: mapPreferredLanguages(form),
      preferredCauses: mapPreferredCauses(form),
      preferredHobbies: mapPreferredHobbies(form),
      industry: mapIndustry(form),
      customizedForm: mapCustomizedForm(form),
      schedule: form.schedule ?? { schedulePublishAt: '', expirationAt: '' },
    },
  };
}

export { toCreateVacancyPayload };
