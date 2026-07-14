/**
 * Static configuration for the Create Vacancy Template form.
 *
 * Each section maps 1:1 to a key in the candidate-service
 * `CreateVacancyTemplateSectionRequest.data` payload, and every field carries
 * the exact `fieldCode` the backend expects inside the section item `content`
 * map (see VacancyTemplateServiceImpl#buildXxxPayload / #normalizeFieldCode).
 *
 * The recruiter never types data here — they only toggle which fields are
 * included in the template, so the config is intentionally static.
 */
import type {
  TemplateFieldConfig,
  TemplateSectionConfig,
} from '@/views/vacancies/types';

const f = (code: string, labelKey: string): TemplateFieldConfig => ({
  code,
  labelKey,
});

/**
 * Ordered list of field sections rendered on the form.
 *
 * Order follows the Figma design (node 4229:226985). The Customizable Form
 * section is handled separately as it has only a section-level toggle.
 */
export const TEMPLATE_SECTIONS: TemplateSectionConfig[] = [
  {
    key: 'profileRequirement',
    kind: 'list',
    titleKey: 'createTemplate.sections.profileRequirement',
    fields: [
      f('gender', 'createTemplate.fields.profile.gender'),
      f('maritalStatus', 'createTemplate.fields.profile.maritalStatus'),
      f('cityRefId', 'createTemplate.fields.profile.city'),
      f('stateRefId', 'createTemplate.fields.profile.state'),
      f('countryRefId', 'createTemplate.fields.profile.country'),
      f('postalCode', 'createTemplate.fields.profile.postalCode'),
    ],
  },
  {
    key: 'secondaryEducation',
    kind: 'list',
    titleKey: 'createTemplate.sections.secondaryEducation',
    fields: [
      f(
        'acceptsHomeSchooling',
        'createTemplate.fields.secondary.acceptsHomeSchooling'
      ),
      f('schools', 'createTemplate.fields.secondary.school'),
      f('schoolLocations', 'createTemplate.fields.secondary.schoolLocation'),
      f('examinations', 'createTemplate.fields.secondary.examination'),
      f(
        'secondaryAwardingBody',
        'createTemplate.fields.secondary.awardingBody'
      ),
      f('fieldsOfStudy', 'createTemplate.fields.secondary.fieldOfStudy'),
      f('grade', 'createTemplate.fields.secondary.grade'),
      f('startDate', 'createTemplate.fields.secondary.startDate'),
      f('endDate', 'createTemplate.fields.secondary.endDate'),
      f('result', 'createTemplate.fields.secondary.results'),
    ],
  },
  {
    key: 'tertiaryEducation',
    kind: 'list',
    titleKey: 'createTemplate.sections.tertiaryEducation',
    fields: [
      f(
        'qualificationName',
        'createTemplate.fields.tertiary.requiredQualification'
      ),
      f(
        'tertiaryAwardingBody',
        'createTemplate.fields.tertiary.preferredAwardingBodyName'
      ),
      f(
        'tertiaryAwardingBodyLocations',
        'createTemplate.fields.tertiary.preferredAwardingBodyLocation'
      ),
      f(
        'levelOfQualification',
        'createTemplate.fields.tertiary.levelOfQualification'
      ),
      f('specialization', 'createTemplate.fields.tertiary.specialization'),
      f('studyMode', 'createTemplate.fields.tertiary.modeOfStudy'),
      f('studyPattern', 'createTemplate.fields.tertiary.studyPattern'),
      f('deliverySchedule', 'createTemplate.fields.tertiary.deliverySchedule'),
      f('grade', 'createTemplate.fields.tertiary.grade'),
      f('batch', 'createTemplate.fields.tertiary.batch'),
      f('department', 'createTemplate.fields.tertiary.department'),
      f('faculty', 'createTemplate.fields.tertiary.faculty'),
    ],
  },
  {
    key: 'projects',
    kind: 'list',
    titleKey: 'createTemplate.sections.projects',
    fields: [
      f('relatedIndustry', 'createTemplate.fields.projects.relatedIndustry'),
      f('organization', 'createTemplate.fields.projects.organizationName'),
      f(
        'organizationLocations',
        'createTemplate.fields.projects.organizationLocation'
      ),
      f('startDate', 'createTemplate.fields.projects.startDateOfInvolvement'),
      f('endDate', 'createTemplate.fields.projects.endDateOfInvolvement'),
    ],
  },
  {
    key: 'publications',
    kind: 'list',
    titleKey: 'createTemplate.sections.publications',
    fields: [
      f(
        'acceptedPublisherName',
        'createTemplate.fields.publications.acceptedPublisher'
      ),
      f(
        'publishedDateFrom',
        'createTemplate.fields.publications.publishedDateFrom'
      ),
      f(
        'publishedDateTo',
        'createTemplate.fields.publications.publishedDateTo'
      ),
    ],
  },
  {
    key: 'clubsAndSocieties',
    kind: 'list',
    titleKey: 'createTemplate.sections.clubsAndSocieties',
    fields: [
      f('clubSociety', 'createTemplate.fields.clubs.clubSociety'),
      f('organization', 'createTemplate.fields.clubs.representedOrganization'),
      f(
        'organizationLocations',
        'createTemplate.fields.clubs.organizationLocation'
      ),
      f('positionRoleHeld', 'createTemplate.fields.clubs.positionRoleHeld'),
      f('startDate', 'createTemplate.fields.clubs.startDate'),
      f('endDate', 'createTemplate.fields.clubs.endDate'),
    ],
  },
  {
    key: 'sports',
    kind: 'list',
    titleKey: 'createTemplate.sections.sports',
    fields: [
      f('nameOfSport', 'createTemplate.fields.sports.nameOfSport'),
      f(
        'representedOrganization',
        'createTemplate.fields.sports.representedOrganization'
      ),
      f(
        'organizationLocations',
        'createTemplate.fields.sports.organizationLocation'
      ),
      f('levelRepresented', 'createTemplate.fields.sports.levelRepresented'),
      f('positionRoleHeld', 'createTemplate.fields.sports.positionRoleHeld'),
      f('startDate', 'createTemplate.fields.sports.startDate'),
      f('endDate', 'createTemplate.fields.sports.endDate'),
    ],
  },
  {
    key: 'volunteering',
    kind: 'list',
    titleKey: 'createTemplate.sections.volunteering',
    fields: [
      f('organization', 'createTemplate.fields.volunteering.organizationName'),
      f(
        'organizationLocations',
        'createTemplate.fields.volunteering.organizationLocation'
      ),
      f('positionRole', 'createTemplate.fields.volunteering.positionRole'),
      f('cause', 'createTemplate.fields.volunteering.cause'),
      f('startDate', 'createTemplate.fields.volunteering.startDate'),
      f('endDate', 'createTemplate.fields.volunteering.endDate'),
    ],
  },
  {
    key: 'patents',
    kind: 'list',
    titleKey: 'createTemplate.sections.patents',
    fields: [
      f('relatedIndustry', 'createTemplate.fields.patents.relatedIndustry'),
      f('statuses', 'createTemplate.fields.patents.status'),
      f('fromDate', 'createTemplate.fields.patents.from'),
      f('toDate', 'createTemplate.fields.patents.to'),
    ],
  },
  {
    key: 'honoursAndAwards',
    kind: 'list',
    titleKey: 'createTemplate.sections.honoursAndAwards',
    fields: [
      f('title', 'createTemplate.fields.honours.title'),
      f('issuedBy', 'createTemplate.fields.honours.issuedBy'),
      f('issuedFromDate', 'createTemplate.fields.honours.issuedDateFrom'),
      f('issuedToDate', 'createTemplate.fields.honours.issuedDateTo'),
      f(
        'associatedOrganizations',
        'createTemplate.fields.honours.associatedOrganization'
      ),
      f(
        'organizationLocations',
        'createTemplate.fields.honours.organizationLocation'
      ),
    ],
  },
  {
    key: 'licensesAndCertifications',
    kind: 'list',
    titleKey: 'createTemplate.sections.licensesAndCertifications',
    fields: [
      f('nameOfLicenseCert', 'createTemplate.fields.licenses.nameOfLicense'),
      f(
        'issuingOrganization',
        'createTemplate.fields.licenses.issuingOrganization'
      ),
      f(
        'organizationLocations',
        'createTemplate.fields.licenses.organizationLocation'
      ),
      f(
        'internationallyAccepted',
        'createTemplate.fields.licenses.internationallyAccepted'
      ),
      f('issueDate', 'createTemplate.fields.licenses.issueDate'),
      f('expirationDate', 'createTemplate.fields.licenses.expirationDate'),
    ],
  },
  {
    key: 'skills',
    kind: 'single',
    titleKey: 'createTemplate.sections.skills',
    fields: [
      f('skillCareerPath', 'createTemplate.fields.skills.skillCareerPath'),
    ],
  },
  {
    key: 'languages',
    kind: 'single',
    titleKey: 'createTemplate.sections.languages',
    fields: [f('language', 'createTemplate.fields.languages.language')],
  },
  {
    key: 'causes',
    kind: 'list',
    titleKey: 'createTemplate.sections.causes',
    fields: [f('cause', 'createTemplate.fields.causes.cause')],
  },
  {
    key: 'hobbyList',
    kind: 'list',
    titleKey: 'createTemplate.sections.hobbies',
    fields: [f('hobby', 'createTemplate.fields.hobbies.hobby')],
  },
  {
    key: 'industry',
    kind: 'single',
    titleKey: 'createTemplate.sections.industries',
    fields: [f('industry', 'createTemplate.fields.industries.industry')],
  },
];

/**
 * Sections that are never rendered on the Create Template form but are always
 * included in the created template with every field enabled (AC — Out of Scope
 * #2: "Job Requirements ... shall be automatically included in the template").
 *
 * Keys match the candidate-service `OptionalSectionToggleRequest.content` field
 * codes (VacancyTemplateServiceImpl#buildJobRequirementPayload / buildSchedulePayload).
 */
export const AUTO_INCLUDED_SECTION_FIELD_CODES: Record<string, string[]> = {
  jobRequirement: [
    'discipline',
    'careerPath',
    'level',
    'roles',
    'jobTitles',
    'employmentTypes',
    'workSchedules',
    'engagementModels',
    'description',
  ],
  schedule: ['schedulePublishAt', 'expirationAt'],
};

/** Maximum length allowed for the template name (mirrors backend validation). */
export const TEMPLATE_NAME_MAX_LENGTH = 150;

/**
 * Maps a backend template `data` section key (as returned by getTemplateById /
 * sent in the create payload) to the corresponding wizard step key in
 * `VACANCY_STEPS`. Used by the "Use Template" flow to decide which steps appear
 * in the navigator and to look up per-section field visibility.
 */
export const SECTION_KEY_TO_STEP_KEY: Record<string, string> = {
  jobRequirement: 'job-requirements',
  profileRequirement: 'profile-requirements',
  secondaryEducation: 'secondary-education',
  tertiaryEducation: 'tertiary-education',
  projects: 'projects-requirements',
  publications: 'preferred-publications',
  clubsAndSocieties: 'preferred-club-societies',
  sports: 'preferred-sports',
  volunteering: 'preferred-volunteering',
  patents: 'preferred-patents',
  honoursAndAwards: 'preferred-honours-awards',
  licensesAndCertifications: 'license-certificates',
  skills: 'preferred-skills',
  languages: 'preferred-languages',
  causes: 'preferred-causes',
  hobbyList: 'preferred-hobbies',
  industry: 'preferred-industry',
  customizedForm: 'customizable-form',
  schedule: 'schedule-vacancy',
};

/**
 * Step keys that must always appear in the navigator during the Use Template
 * flow regardless of what the template configured (AC 7.1). Vacancy Title is the
 * separate initial screen and is not part of `VACANCY_STEPS`.
 */
export const MANDATORY_TEMPLATE_STEP_KEYS: readonly string[] = [
  'job-requirements',
  'schedule-vacancy',
];
