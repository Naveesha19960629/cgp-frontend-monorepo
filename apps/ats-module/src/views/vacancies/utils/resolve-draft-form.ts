import {
  careerPathService,
  causeService,
  hobbyService,
  industryService,
  languageService,
  licenseCertificatesService,
  organizationService,
  secondaryEducationService,
  skillService,
  societyService,
  sportLevelService,
  sportService,
  tertiaryEducationService,
} from '@/views/vacancies/services';
import type {
  AddOrSelectOption,
  CreateCareerPathPayload,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
  CreateRolePayload,
  JobRequirement,
  JobRequirementFormOption,
  LicenseCertEntry,
  LicenseCertRef,
  LicenseCertType,
  SecondaryEducationEntry,
  SkillCareerPathEntry,
  TertiaryEducationEntry,
  VacancyForm,
} from '@/views/vacancies/types';
import { resolveUserCreatedIndustries } from '@/views/vacancies/utils/patent-form-helpers';
import { resolveUserCreatedEntries } from '@/views/vacancies/utils/resolve-user-created-entries';

import { resolveUserCreatedOrganizations } from './honours-form-helpers';
import { resolveUserCreatedOptions } from './job-requirements-form-helpers';

interface DraftFormResolverDeps {
  addDiscipline: (label: string) => Promise<CreatePendingApiResponse>;
  addCareerPath: (
    payload: CreateCareerPathPayload
  ) => Promise<CreatePendingApiResponse>;
  addRole: (payload: CreateRolePayload) => Promise<CreatePendingApiResponse>;
  addJobTitle: (label: string) => Promise<CreatePendingApiResponse>;
  createIndustry: (label: string) => Promise<CreatePendingItemResponse>;
  createOrganization: (label: string) => Promise<CreatePendingItemResponse>;
  createCause: (label: string) => Promise<CreatePendingItemResponse>;
  createHobby: (label: string) => Promise<CreatePendingItemResponse>;
  createLanguage: (label: string) => Promise<CreatePendingItemResponse>;
  createSociety: (label: string) => Promise<CreatePendingItemResponse>;
  createSport: (label: string) => Promise<CreatePendingItemResponse>;
  createSportLevel: (label: string) => Promise<CreatePendingItemResponse>;
  createCareerPath: (label: string) => Promise<CreatePendingItemResponse>;
  createSkillCareerPath: (params: {
    skillName: string;
    careerPathName: string;
  }) => Promise<CreatePendingItemResponse>;
  addLicenseCertificate: (params: {
    type: LicenseCertType;
    displayValue: string;
  }) => Promise<CreatePendingApiResponse>;
  addSchool: (params: {
    displayValue: string;
    locationId?: string;
    url?: string;
  }) => Promise<CreatePendingApiResponse>;
  addTertiaryAwardingBody: (params: {
    displayValue: string;
    locationId?: string;
    url?: string;
  }) => Promise<CreatePendingApiResponse>;
}

function isAlreadyExistsError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const axiosErr = err as { response?: { data?: { code?: unknown } } };
  return axiosErr.response?.data?.code === 'MST-403';
}

interface LookupResult {
  id: string;
  label: string;
  source?: string;
}

function toLookupResults(
  items: { id: string; label?: string; name?: string; source?: string }[]
): LookupResult[] {
  return items.map(item => ({
    id: item.id,
    label: item.label ?? item.name ?? '',
    source: item.source,
  }));
}

async function searchIndustries(label: string): Promise<LookupResult[]> {
  const result = await industryService.getIndustries(label);
  return toLookupResults(result.data.items.content);
}

async function searchOrganizations(label: string): Promise<LookupResult[]> {
  return toLookupResults(await organizationService.getAllOrganizations(label));
}

async function searchCauses(label: string): Promise<LookupResult[]> {
  const result = await causeService.getAllCauses(label);
  return toLookupResults(result.data.items.content);
}

async function searchSocieties(label: string): Promise<LookupResult[]> {
  const result = await societyService.getSocieties(label);
  return toLookupResults(result.data.items.content);
}

async function searchSports(label: string): Promise<LookupResult[]> {
  return toLookupResults(await sportService.getSports(label));
}

// Sport levels have no search endpoint — the label param is unused, and the
// caller filters the full list client-side by label instead.
async function searchSportLevels(): Promise<LookupResult[]> {
  return toLookupResults(await sportLevelService.getAllSportLevels());
}

/**
 * The same custom label (e.g. an organization) can appear in more than one
 * field across the form. Resolving one field can mint it as a real PENDING
 * record; resolving a different field with the same label afterwards then
 * gets rejected with MST-403 ("already exists in pending approvals") because
 * it's no longer novel. On that error, look the label up via the field's own
 * search endpoint and reuse the id/label/source it already resolved to,
 * mirroring what resolveUserCreatedEntries/resolveUserCreatedOrganizations
 * already do for the fields that go through those shared helpers.
 */
async function resolveFieldAcrossEntries<E>(
  entries: E[],
  field: keyof E,
  createFn: (label: string) => Promise<CreatePendingItemResponse>,
  searchFn: (label: string) => Promise<LookupResult[]>
): Promise<E[]> {
  const allOptions = entries.flatMap(
    entry =>
      (entry[field] as unknown as { source?: string; label: string }[]) ?? []
  );
  const userCreated = allOptions.filter(
    option => option.source === 'USER_CREATED'
  );
  if (userCreated.length === 0) return entries;

  const uniqueByLabel = Array.from(
    new Map(userCreated.map(option => [option.label, option])).values()
  );

  const resultMap = new Map<
    string,
    { value: string; label: string; source: string }
  >();
  await Promise.all(
    uniqueByLabel.map(async option => {
      try {
        const created = await createFn(option.label);
        resultMap.set(option.label, {
          value: created.pendingId,
          label: created.value,
          source: created.status,
        });
      } catch (err) {
        if (isAlreadyExistsError(err)) {
          const existing = await searchFn(option.label);
          const match = existing.find(
            item => item.label.toLowerCase() === option.label.toLowerCase()
          );
          if (match) {
            resultMap.set(option.label, {
              value: match.id,
              label: match.label,
              source: match.source ?? 'MASTER',
            });
            return;
          }
        }
        throw err;
      }
    })
  );

  return entries.map(entry => {
    const values = entry[field] as unknown as
      | { value: string; label: string; source: string }[]
      | undefined;
    if (!values) return entry;

    const resolvedValues = values.map(option => {
      if (option.source !== 'USER_CREATED') return option;
      return resultMap.get(option.label) ?? option;
    });
    return { ...entry, [field]: resolvedValues };
  });
}

async function resolveJobRequirement(
  jobRequirement: JobRequirement,
  deps: DraftFormResolverDeps
): Promise<JobRequirement> {
  const toFormOption = (
    option: AddOrSelectOption
  ): JobRequirementFormOption => ({
    value: option.id,
    label: option.label,
    source: option.source,
  });
  const toAddOrSelectOption = (
    option: JobRequirementFormOption
  ): AddOrSelectOption => ({
    id: option.value,
    label: option.label,
    source: option.source,
  });

  const disciplineOptions = jobRequirement.discipline.map(toFormOption);
  const resolvedDisciplineOptions = await resolveUserCreatedOptions(
    disciplineOptions,
    label => deps.addDiscipline(label)
  );

  const careerPathOptions = jobRequirement.careerPath.map(toFormOption);
  const resolvedCareerPathOptions = await resolveUserCreatedOptions(
    careerPathOptions,
    label =>
      deps.addCareerPath({
        displayValue: label,
        discipline: resolvedDisciplineOptions[0]
          ? {
              id: resolvedDisciplineOptions[0].value,
              source: resolvedDisciplineOptions[0].source,
            }
          : undefined,
      })
  );

  const levelOptions = jobRequirement.level.map(toFormOption);
  const roleOptions = jobRequirement.role.map(toFormOption);
  const resolvedRoleOptions = await resolveUserCreatedOptions(
    roleOptions,
    label =>
      deps.addRole({
        displayValue: label,
        careerPath: resolvedCareerPathOptions[0]
          ? {
              id: resolvedCareerPathOptions[0].value,
              source: resolvedCareerPathOptions[0].source,
            }
          : undefined,
        level: levelOptions[0]
          ? { id: levelOptions[0].value, source: levelOptions[0].source }
          : undefined,
      })
  );

  const jobTitleOptions = jobRequirement.jobTitle.map(toFormOption);
  const resolvedJobTitleOptions = await resolveUserCreatedOptions(
    jobTitleOptions,
    label => deps.addJobTitle(label)
  );

  return {
    ...jobRequirement,
    discipline: resolvedDisciplineOptions.map(toAddOrSelectOption),
    careerPath: resolvedCareerPathOptions.map(toAddOrSelectOption),
    role: resolvedRoleOptions.map(toAddOrSelectOption),
    jobTitle: resolvedJobTitleOptions.map(toAddOrSelectOption),
  };
}

async function resolveSkillEntries(
  skills: SkillCareerPathEntry[],
  deps: DraftFormResolverDeps
): Promise<SkillCareerPathEntry[]> {
  const hasUserCreated = skills.some(skill => skill.source === 'USER_CREATED');
  if (!hasUserCreated) return skills;

  return Promise.all(
    skills.map(async entry => {
      if (entry.source !== 'USER_CREATED') return entry;

      try {
        let resolvedCareerPathId = entry.careerPathId;
        if (!resolvedCareerPathId && entry.careerPathName) {
          try {
            const cpResult = await deps.createCareerPath(entry.careerPathName);
            resolvedCareerPathId = cpResult.pendingId;
          } catch (cpErr) {
            if (isAlreadyExistsError(cpErr)) {
              const cpSearch = await careerPathService.getAllCareerPaths(
                entry.careerPathName
              );
              const existingCp = cpSearch.data?.items?.content?.find(
                item =>
                  item.label.toLowerCase() ===
                  entry.careerPathName.toLowerCase()
              );
              if (existingCp) resolvedCareerPathId = existingCp.id;
            } else {
              throw cpErr;
            }
          }
        }

        const result = await deps.createSkillCareerPath({
          skillName: entry.skillName,
          careerPathName: entry.careerPathName,
        });
        return {
          ...entry,
          skillId: result.pendingId,
          careerPathId: resolvedCareerPathId,
          displayValue: result.value || entry.displayValue,
          source: 'PENDING',
        };
      } catch (err) {
        if (isAlreadyExistsError(err)) {
          const searchResult = await skillService.getAllSkills(
            entry.displayValue
          );
          const existing = searchResult.data?.items?.content?.find(
            item =>
              item.label.toLowerCase() === entry.displayValue.toLowerCase()
          );
          if (existing) {
            return { ...entry, skillId: existing.id, source: 'MASTER' };
          }
        }
        throw err;
      }
    })
  );
}

async function searchLicenseCertificates(
  label: string
): Promise<LookupResult[]> {
  const result =
    await licenseCertificatesService.getLicensesAndCertifications(label);
  return toLookupResults(result.data.items.content);
}

async function searchSchools(label: string): Promise<LookupResult[]> {
  const result = await secondaryEducationService.getSchools(label);
  return toLookupResults(result.data.items.content);
}

async function searchTertiaryAwardingBodies(
  label: string
): Promise<LookupResult[]> {
  const result =
    await tertiaryEducationService.getTertiaryAwardingBodies(label);
  return toLookupResults(result.data.items.content);
}

/**
 * Resolves one placeholder ref: try to create it, and on MST-403 ("already
 * exists in pending approvals" — e.g. because the same label was already
 * resolved via a different field) fall back to searching for it by label and
 * reusing the existing id/source instead of failing the whole draft save.
 */
async function resolvePendingRef(
  label: string,
  createFn: () => Promise<CreatePendingApiResponse>,
  searchFn: (label: string) => Promise<LookupResult[]>
): Promise<{ source: 'PENDING' | 'MASTER'; id: string }> {
  try {
    const created = await createFn();
    return { source: 'PENDING', id: created.data.pendingId };
  } catch (err) {
    if (isAlreadyExistsError(err)) {
      const existing = await searchFn(label);
      const match = existing.find(
        item => item.label.toLowerCase() === label.toLowerCase()
      );
      if (match) {
        return {
          source: match.source === 'PENDING' ? 'PENDING' : 'MASTER',
          id: match.id,
        };
      }
    }
    throw err;
  }
}

/**
 * The add-license-certificate, add-school and add-tertiary-awarding-body
 * dialogs stash a client-generated placeholder id (e.g. '__pending_school_…')
 * on the entry immediately, before the real create-mutation ever runs — that
 * only happens inside each step's "Next" handler. If the user cancels out
 * before clicking Next, the placeholder id is still what's sitting in the
 * form, and (unlike license-certificate names, which the final payload
 * builder already filters out) schools/tertiary-awarding-bodies are sent
 * through unfiltered, so the backend receives that unresolved placeholder id.
 */
async function resolveLicenseCertificateNames(
  content: LicenseCertEntry[],
  addLicenseCertificate: DraftFormResolverDeps['addLicenseCertificate']
): Promise<LicenseCertEntry[]> {
  return Promise.all(
    content.map(async entry => ({
      ...entry,
      nameOfLicenseCert: await Promise.all(
        entry.nameOfLicenseCert.map(async ref => {
          if (!ref.id.startsWith('__pending_license_cert_')) return ref;
          const label = ref.name ?? ref.id;
          const resolved = await resolvePendingRef(
            label,
            () =>
              addLicenseCertificate({
                type: ref.type ?? 'CERTIFICATE',
                displayValue: label,
              }),
            searchLicenseCertificates
          );
          return { ...resolved, name: ref.name, type: ref.type };
        })
      ),
    }))
  );
}

async function resolveSecondaryEducationSchools(
  content: SecondaryEducationEntry[],
  addSchool: DraftFormResolverDeps['addSchool']
): Promise<SecondaryEducationEntry[]> {
  return Promise.all(
    content.map(async entry => ({
      ...entry,
      schools: await Promise.all(
        entry.schools.map(async ref => {
          if (!ref.id.startsWith('__pending_school_')) return ref;
          const label = ref.name ?? ref.id;
          const resolved = await resolvePendingRef(
            label,
            () => addSchool({ displayValue: label }),
            searchSchools
          );
          return { ...resolved, name: ref.name };
        })
      ),
    }))
  );
}

async function resolveTertiaryEducationAwardingBodies(
  content: TertiaryEducationEntry[],
  addTertiaryAwardingBody: DraftFormResolverDeps['addTertiaryAwardingBody']
): Promise<TertiaryEducationEntry[]> {
  return Promise.all(
    content.map(async entry => ({
      ...entry,
      tertiaryAwardingBody: await Promise.all(
        entry.tertiaryAwardingBody.map(async ref => {
          if (!ref.id.startsWith('__pending_awarding_body_')) return ref;
          const label = ref.name ?? ref.id;
          const resolved = await resolvePendingRef(
            label,
            () => addTertiaryAwardingBody({ displayValue: label }),
            searchTertiaryAwardingBodies
          );
          return { ...resolved, name: ref.name };
        })
      ),
    }))
  );
}

/**
 * Most steps sync every edit straight into the shared VacancyForm as the user
 * types, without waiting for "Next" — so a USER_CREATED entry (a custom value
 * not yet resolved to real master data) can still be sitting in the form when
 * the user hits Save as Draft. The backend rejects source: 'USER_CREATED', so
 * every such entry must be resolved to a real master-data record first, using
 * the same create-mutations each step already calls on "Next".
 */
async function resolveDraftUserCreatedEntries(
  form: VacancyForm,
  deps: DraftFormResolverDeps
): Promise<VacancyForm> {
  const resolvedForm: VacancyForm = { ...form };

  const [firstJobRequirement, ...restJobRequirements] =
    resolvedForm.jobRequirements;
  if (firstJobRequirement) {
    resolvedForm.jobRequirements = [
      await resolveJobRequirement(firstJobRequirement, deps),
      ...restJobRequirements,
    ];
  }

  if (resolvedForm.preferredIndustries) {
    resolvedForm.preferredIndustries = {
      ...resolvedForm.preferredIndustries,
      industries: await resolveUserCreatedEntries(
        resolvedForm.preferredIndustries.industries,
        deps.createIndustry,
        industryService.getIndustries
      ),
    };
  }

  if (resolvedForm.patents) {
    resolvedForm.patents = {
      ...resolvedForm.patents,
      patents: await resolveUserCreatedIndustries(
        resolvedForm.patents.patents,
        deps.createIndustry,
        industryService.getIndustries
      ),
    };
  }

  if (resolvedForm.preferredHonoursAwards) {
    resolvedForm.preferredHonoursAwards = {
      ...resolvedForm.preferredHonoursAwards,
      honoursAndAwards: await resolveUserCreatedOrganizations(
        resolvedForm.preferredHonoursAwards.honoursAndAwards,
        deps.createOrganization
      ),
    };
  }

  const [firstLicenseCertificates, ...restLicenseCertificates] =
    resolvedForm.licenseCertificates ?? [];
  if (firstLicenseCertificates) {
    const wrapped = firstLicenseCertificates.content.map(entry => ({
      associatedOrganizations: entry.issuingOrganization.map(ref => ({
        value: ref.id,
        label: ref.name ?? ref.id,
        source: ref.source,
      })),
    }));
    const resolvedWrapped = await resolveUserCreatedOrganizations(
      wrapped,
      deps.createOrganization
    );
    const contentWithResolvedOrgs = firstLicenseCertificates.content.map(
      (entry, index) => ({
        ...entry,
        issuingOrganization: resolvedWrapped[index].associatedOrganizations.map(
          (option): LicenseCertRef => ({
            source: option.source,
            id: option.value,
            name: option.label,
          })
        ),
      })
    );
    resolvedForm.licenseCertificates = [
      {
        ...firstLicenseCertificates,
        content: await resolveLicenseCertificateNames(
          contentWithResolvedOrgs,
          deps.addLicenseCertificate
        ),
      },
      ...restLicenseCertificates,
    ];
  }

  const [firstSecondaryEducation, ...restSecondaryEducation] =
    resolvedForm.secondaryEducation;
  if (firstSecondaryEducation) {
    resolvedForm.secondaryEducation = [
      {
        ...firstSecondaryEducation,
        content: await resolveSecondaryEducationSchools(
          firstSecondaryEducation.content,
          deps.addSchool
        ),
      },
      ...restSecondaryEducation,
    ];
  }

  const [firstTertiaryEducation, ...restTertiaryEducation] =
    resolvedForm.tertiaryEducation;
  if (firstTertiaryEducation) {
    resolvedForm.tertiaryEducation = [
      {
        ...firstTertiaryEducation,
        content: await resolveTertiaryEducationAwardingBodies(
          firstTertiaryEducation.content,
          deps.addTertiaryAwardingBody
        ),
      },
      ...restTertiaryEducation,
    ];
  }

  if (resolvedForm.preferredCauses) {
    resolvedForm.preferredCauses = {
      ...resolvedForm.preferredCauses,
      causes: await resolveUserCreatedEntries(
        resolvedForm.preferredCauses.causes,
        deps.createCause,
        causeService.getAllCauses
      ),
    };
  }

  if (resolvedForm.preferredHobbies) {
    resolvedForm.preferredHobbies = {
      ...resolvedForm.preferredHobbies,
      hobbies: await resolveUserCreatedEntries(
        resolvedForm.preferredHobbies.hobbies,
        deps.createHobby,
        hobbyService.getAllHobbies
      ),
    };
  }

  if (resolvedForm.preferredLanguages) {
    resolvedForm.preferredLanguages = {
      ...resolvedForm.preferredLanguages,
      languages: await resolveUserCreatedEntries(
        resolvedForm.preferredLanguages.languages,
        deps.createLanguage,
        languageService.getAllLanguages
      ),
    };
  }

  if (resolvedForm.preferredSkills) {
    resolvedForm.preferredSkills = {
      ...resolvedForm.preferredSkills,
      skills: await resolveSkillEntries(
        resolvedForm.preferredSkills.skills,
        deps
      ),
    };
  }

  if (resolvedForm.preferredSports) {
    let sports = resolvedForm.preferredSports.sports;
    sports = await resolveFieldAcrossEntries(
      sports,
      'sport',
      deps.createSport,
      searchSports
    );
    sports = await resolveFieldAcrossEntries(
      sports,
      'levelRepresented',
      deps.createSportLevel,
      searchSportLevels
    );
    sports = await resolveFieldAcrossEntries(
      sports,
      'representedOrganization',
      deps.createOrganization,
      searchOrganizations
    );
    resolvedForm.preferredSports = { ...resolvedForm.preferredSports, sports };
  }

  if (resolvedForm.preferredVolunteering) {
    let volunteering = resolvedForm.preferredVolunteering.volunteering;
    volunteering = await resolveFieldAcrossEntries(
      volunteering,
      'cause',
      deps.createCause,
      searchCauses
    );
    volunteering = await resolveFieldAcrossEntries(
      volunteering,
      'organizationName',
      deps.createOrganization,
      searchOrganizations
    );
    resolvedForm.preferredVolunteering = {
      ...resolvedForm.preferredVolunteering,
      volunteering,
    };
  }

  if (resolvedForm.preferredClubSocieties) {
    let clubSocieties = resolvedForm.preferredClubSocieties.clubSocieties;
    clubSocieties = await resolveFieldAcrossEntries(
      clubSocieties,
      'clubSociety',
      deps.createSociety,
      searchSocieties
    );
    clubSocieties = await resolveFieldAcrossEntries(
      clubSocieties,
      'representedOrganization',
      deps.createOrganization,
      searchOrganizations
    );
    resolvedForm.preferredClubSocieties = {
      ...resolvedForm.preferredClubSocieties,
      clubSocieties,
    };
  }

  if (resolvedForm.projectsRequirements) {
    let projects = resolvedForm.projectsRequirements.projects;
    projects = await resolveFieldAcrossEntries(
      projects,
      'relatedIndustry',
      deps.createIndustry,
      searchIndustries
    );
    projects = await resolveFieldAcrossEntries(
      projects,
      'organizations',
      deps.createOrganization,
      searchOrganizations
    );
    resolvedForm.projectsRequirements = {
      ...resolvedForm.projectsRequirements,
      projects,
    };
  }

  return resolvedForm;
}

export { resolveDraftUserCreatedEntries };
export type { DraftFormResolverDeps };
