/**
 * Maps the backend's Edit Job Description section/field keys to the same
 * i18n label keys used by the Create Vacancy Template screen, since both
 * screens describe the same set of preferred-value sections and fields.
 */

const SECTION_TITLE_KEYS: Record<string, string> = {
  PROFILE_REQUIREMENT: 'createTemplate.sections.profileRequirement',
  SECONDARY_EDUCATION: 'createTemplate.sections.secondaryEducation',
  TERTIARY_EDUCATION: 'createTemplate.sections.tertiaryEducation',
  PROJECT: 'createTemplate.sections.projects',
  PUBLICATION: 'createTemplate.sections.publications',
  CLUB_SOCIETY: 'createTemplate.sections.clubsAndSocieties',
  SPORT: 'createTemplate.sections.sports',
  VOLUNTEERING: 'createTemplate.sections.volunteering',
  PATENT: 'createTemplate.sections.patents',
  HONOUR_AWARD: 'createTemplate.sections.honoursAndAwards',
  LICENSE_CERT: 'createTemplate.sections.licensesAndCertifications',
  SKILL: 'createTemplate.sections.skills',
  LANGUAGE: 'createTemplate.sections.languages',
  CAUSE: 'createTemplate.sections.causes',
  HOBBY: 'createTemplate.sections.hobbies',
  INDUSTRY: 'createTemplate.sections.industries',
};

const FIELD_LABEL_KEYS: Record<string, Record<string, string>> = {
  PROFILE_REQUIREMENT: {
    GENDER: 'createTemplate.fields.profile.gender',
    MARITAL_STATUS: 'createTemplate.fields.profile.maritalStatus',
    CITY: 'createTemplate.fields.profile.city',
    STATE: 'createTemplate.fields.profile.state',
    COUNTRY: 'createTemplate.fields.profile.country',
    POSTAL_CODE: 'createTemplate.fields.profile.postalCode',
  },
  SECONDARY_EDUCATION: {
    SCHOOL: 'createTemplate.fields.secondary.school',
    SCHOOL_LOCATION: 'createTemplate.fields.secondary.schoolLocation',
    EXAMINATION: 'createTemplate.fields.secondary.examination',
    AWARDING_BODY: 'createTemplate.fields.secondary.awardingBody',
    FIELD_OF_STUDY: 'createTemplate.fields.secondary.fieldOfStudy',
    GRADE: 'createTemplate.fields.secondary.grade',
    START_DATE: 'createTemplate.fields.secondary.startDate',
    END_DATE: 'createTemplate.fields.secondary.endDate',
    RESULTS: 'createTemplate.fields.secondary.results',
  },
  TERTIARY_EDUCATION: {
    QUALIFICATION: 'createTemplate.fields.tertiary.requiredQualification',
    AWARDING_BODY: 'createTemplate.fields.tertiary.preferredAwardingBodyName',
    AWARDING_BODY_LOCATION:
      'createTemplate.fields.tertiary.preferredAwardingBodyLocation',
    LEVEL_OF_QUALIFICATION:
      'createTemplate.fields.tertiary.levelOfQualification',
    SPECIALIZATION: 'createTemplate.fields.tertiary.specialization',
    MODE_OF_STUDY: 'createTemplate.fields.tertiary.modeOfStudy',
    STUDY_PATTERN: 'createTemplate.fields.tertiary.studyPattern',
    DELIVERY_SCHEDULE: 'createTemplate.fields.tertiary.deliverySchedule',
    GRADE: 'createTemplate.fields.tertiary.grade',
    BATCH: 'createTemplate.fields.tertiary.batch',
    DEPARTMENT: 'createTemplate.fields.tertiary.department',
    FACULTY: 'createTemplate.fields.tertiary.faculty',
  },
  PROJECT: {
    RELATED_INDUSTRY: 'createTemplate.fields.projects.relatedIndustry',
    ORGANIZATION_NAME: 'createTemplate.fields.projects.organizationName',
    ORGANIZATION_LOCATION:
      'createTemplate.fields.projects.organizationLocation',
    START_DATE_OF_INVOLVEMENT:
      'createTemplate.fields.projects.startDateOfInvolvement',
    END_DATE_OF_INVOLVEMENT:
      'createTemplate.fields.projects.endDateOfInvolvement',
  },
  PUBLICATION: {
    ACCEPTED_PUBLISHER: 'createTemplate.fields.publications.acceptedPublisher',
    PUBLISHED_DATE_FROM: 'createTemplate.fields.publications.publishedDateFrom',
    PUBLISHED_DATE_TO: 'createTemplate.fields.publications.publishedDateTo',
  },
  CLUB_SOCIETY: {
    CLUB_SOCIETY: 'createTemplate.fields.clubs.clubSociety',
    REPRESENTED_ORGANIZATION:
      'createTemplate.fields.clubs.representedOrganization',
    ORGANIZATION_LOCATION: 'createTemplate.fields.clubs.organizationLocation',
    POSITION_ROLE_HELD: 'createTemplate.fields.clubs.positionRoleHeld',
    START_DATE: 'createTemplate.fields.clubs.startDate',
    END_DATE: 'createTemplate.fields.clubs.endDate',
  },
  SPORT: {
    SPORT_NAME: 'createTemplate.fields.sports.nameOfSport',
    REPRESENTED_ORGANIZATION:
      'createTemplate.fields.sports.representedOrganization',
    ORGANIZATION_LOCATION: 'createTemplate.fields.sports.organizationLocation',
    LEVEL_REPRESENTED: 'createTemplate.fields.sports.levelRepresented',
    POSITION_ROLE_HELD: 'createTemplate.fields.sports.positionRoleHeld',
    START_DATE: 'createTemplate.fields.sports.startDate',
    END_DATE: 'createTemplate.fields.sports.endDate',
  },
  VOLUNTEERING: {
    ORGANIZATION_NAME: 'createTemplate.fields.volunteering.organizationName',
    ORGANIZATION_LOCATION:
      'createTemplate.fields.volunteering.organizationLocation',
    POSITION_ROLE: 'createTemplate.fields.volunteering.positionRole',
    CAUSE: 'createTemplate.fields.volunteering.cause',
    START_DATE: 'createTemplate.fields.volunteering.startDate',
    END_DATE: 'createTemplate.fields.volunteering.endDate',
  },
  PATENT: {
    RELATED_INDUSTRY: 'createTemplate.fields.patents.relatedIndustry',
    STATUS: 'createTemplate.fields.patents.status',
    FROM_DATE: 'createTemplate.fields.patents.from',
    TO_DATE: 'createTemplate.fields.patents.to',
  },
  HONOUR_AWARD: {
    TITLE: 'createTemplate.fields.honours.title',
    ISSUED_BY: 'createTemplate.fields.honours.issuedBy',
    ISSUED_DATE_FROM: 'createTemplate.fields.honours.issuedDateFrom',
    ISSUED_DATE_TO: 'createTemplate.fields.honours.issuedDateTo',
    ASSOCIATED_ORGANIZATION:
      'createTemplate.fields.honours.associatedOrganization',
    ORGANIZATION_LOCATION: 'createTemplate.fields.honours.organizationLocation',
  },
  LICENSE_CERT: {
    NAME: 'createTemplate.fields.licenses.nameOfLicense',
    ISSUING_ORGANIZATION: 'createTemplate.fields.licenses.issuingOrganization',
    ORGANIZATION_LOCATION:
      'createTemplate.fields.licenses.organizationLocation',
    ISSUE_DATE: 'createTemplate.fields.licenses.issueDate',
    EXPIRATION_DATE: 'createTemplate.fields.licenses.expirationDate',
  },
  SKILL: {
    SKILLS: 'createTemplate.fields.skills.skillCareerPath',
  },
  LANGUAGE: {
    LANGUAGE: 'createTemplate.fields.languages.language',
  },
  CAUSE: {
    CAUSES: 'createTemplate.fields.causes.cause',
  },
  HOBBY: {
    HOBBIES: 'createTemplate.fields.hobbies.hobby',
  },
  INDUSTRY: {
    INDUSTRIES: 'createTemplate.fields.industries.industry',
  },
};

const getSectionTitleKey = (sectionKey: string): string =>
  SECTION_TITLE_KEYS[sectionKey] ?? sectionKey;

const getFieldLabelKey = (sectionKey: string, fieldKey: string): string =>
  FIELD_LABEL_KEYS[sectionKey]?.[fieldKey] ?? fieldKey;

export { getSectionTitleKey, getFieldLabelKey };
