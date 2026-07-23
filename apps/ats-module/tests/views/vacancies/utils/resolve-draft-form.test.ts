import { vi } from 'vitest';

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
  ApiResponse,
  ClubSocietyFormEntry,
  CreatePendingApiResponse,
  CreatePendingItemResponse,
  HonourEntrySchemaType,
  JobRequirement,
  LicenseCertEntry,
  PatentEntrySchemaType,
  ProjectFormEntry,
  SecondaryEducationEntry,
  SportFormEntry,
  TertiaryEducationEntry,
  VacancyForm,
  VolunteeringFormEntry,
} from '@/views/vacancies/types';
import type { DraftFormResolverDeps } from '@/views/vacancies/utils/resolve-draft-form';
import { resolveDraftUserCreatedEntries } from '@/views/vacancies/utils/resolve-draft-form';

vi.mock('@/views/vacancies/services', () => ({
  careerPathService: {
    getAllCareerPaths: vi.fn(),
    createCareerPath: vi.fn(),
    addCareerPath: vi.fn(),
  },
  causeService: {
    getAllCauses: vi.fn(),
    createCause: vi.fn(),
  },
  hobbyService: {
    getAllHobbies: vi.fn(),
    createHobby: vi.fn(),
  },
  industryService: {
    getIndustries: vi.fn(),
    createIndustry: vi.fn(),
  },
  languageService: {
    getAllLanguages: vi.fn(),
    createLanguage: vi.fn(),
  },
  licenseCertificatesService: {
    getLicensesAndCertifications: vi.fn(),
    addLicenseCertificate: vi.fn(),
  },
  organizationService: {
    getAllOrganizations: vi.fn(),
    createMasterDataOrganization: vi.fn(),
  },
  secondaryEducationService: {
    getSchools: vi.fn(),
    getSchoolLocations: vi.fn(),
    getExaminations: vi.fn(),
    getAwardingBodies: vi.fn(),
    getFieldsOfStudy: vi.fn(),
    addSchool: vi.fn(),
    addExamination: vi.fn(),
    addAwardingBody: vi.fn(),
    addFieldOfStudy: vi.fn(),
  },
  skillService: {
    getAllSkills: vi.fn(),
    createSkillCareerPath: vi.fn(),
  },
  societyService: {
    getSocieties: vi.fn(),
    createSociety: vi.fn(),
  },
  sportLevelService: {
    getAllSportLevels: vi.fn(),
    createSportLevel: vi.fn(),
  },
  sportService: {
    getSports: vi.fn(),
    createSport: vi.fn(),
  },
  tertiaryEducationService: {
    getQualifications: vi.fn(),
    getTertiaryAwardingBodies: vi.fn(),
    getTertiaryAwardingBodyLocations: vi.fn(),
    getLevelOfQualifications: vi.fn(),
    getSpecializations: vi.fn(),
    getStudyModes: vi.fn(),
    getStudyPatterns: vi.fn(),
    getDeliverySchedules: vi.fn(),
    getBatches: vi.fn(),
    getDepartments: vi.fn(),
    getFaculties: vi.fn(),
    addQualification: vi.fn(),
    addTertiaryAwardingBody: vi.fn(),
    addLevelOfQualification: vi.fn(),
    addSpecialization: vi.fn(),
    addBatch: vi.fn(),
    addDepartment: vi.fn(),
    addFaculty: vi.fn(),
  },
}));

// ─── Test helpers ──────────────────────────────────────────────────────────────

function makeSort(): { empty: boolean; sorted: boolean; unsorted: boolean } {
  return { empty: true, sorted: false, unsorted: true };
}

function makeApiResponse<T>(content: T[]): ApiResponse<T[]> {
  return {
    requestId: 'req-id',
    success: true,
    message: 'OK',
    data: {
      type: 'TEST',
      items: {
        content,
        empty: content.length === 0,
        first: true,
        last: true,
        number: 0,
        numberOfElements: content.length,
        size: content.length || 10,
        totalElements: content.length,
        totalPages: 1,
        pageable: {
          offset: 0,
          pageNumber: 0,
          pageSize: 10,
          paged: true,
          unpaged: false,
          sort: makeSort(),
        },
        sort: makeSort(),
      },
    },
  };
}

function pendingItem(
  pendingId: string,
  value: string
): CreatePendingItemResponse {
  return { pendingId, type: 'TEST', value, status: 'PENDING' };
}

function pendingApiResponse(
  pendingId: string,
  value: string
): CreatePendingApiResponse {
  return {
    requestId: 'req-id',
    success: true,
    message: 'Created',
    data: pendingItem(pendingId, value),
  };
}

function mst403Error() {
  return { response: { data: { code: 'MST-403' } } };
}

function buildBaseForm(overrides?: Partial<VacancyForm>): VacancyForm {
  return {
    title: 'Test Vacancy',
    status: 'draft',
    lastActiveStep: 'job-requirements',
    jobRequirements: [
      {
        isEnabled: true,
        dataTakenFromCandidate: false,
        discipline: [],
        careerPath: [],
        level: [],
        role: [],
        jobTitle: [],
        employmentType: [],
        workSchedule: [],
        engagementModel: [],
        description: '',
      },
    ],
    profileRequirements: {
      isEnabled: false,
      dataTakenFromCandidate: false,
      gender: { id: '', label: '' },
      maritalStatus: { id: '', label: '' },
      addresses: [],
    },
    secondaryEducation: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    tertiaryEducation: [
      { isEnabled: false, dataTakenFromCandidate: false, content: [] },
    ],
    ...overrides,
  };
}

function buildDeps(
  overrides?: Partial<DraftFormResolverDeps>
): DraftFormResolverDeps {
  return {
    addDiscipline: vi.fn(),
    addCareerPath: vi.fn(),
    addRole: vi.fn(),
    addJobTitle: vi.fn(),
    createIndustry: vi.fn(),
    createOrganization: vi.fn(),
    createCause: vi.fn(),
    createHobby: vi.fn(),
    createLanguage: vi.fn(),
    createSociety: vi.fn(),
    createSport: vi.fn(),
    createSportLevel: vi.fn(),
    createCareerPath: vi.fn(),
    createSkillCareerPath: vi.fn(),
    addLicenseCertificate: vi.fn(),
    addSchool: vi.fn(),
    addTertiaryAwardingBody: vi.fn(),
    addExamination: vi.fn(),
    addSecondaryAwardingBody: vi.fn(),
    addFieldOfStudy: vi.fn(),
    addQualification: vi.fn(),
    addLevelOfQualification: vi.fn(),
    addSpecialization: vi.fn(),
    addBatch: vi.fn(),
    addDepartment: vi.fn(),
    addFaculty: vi.fn(),
    ...overrides,
  };
}

function emptyJobRequirement(
  overrides?: Partial<JobRequirement>
): JobRequirement {
  return {
    isEnabled: true,
    dataTakenFromCandidate: false,
    discipline: [],
    careerPath: [],
    level: [],
    role: [],
    jobTitle: [],
    employmentType: [],
    workSchedule: [],
    engagementModel: [],
    description: '',
    ...overrides,
  };
}

// ─── Shared default mocks ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  (
    careerPathService.getAllCareerPaths as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (causeService.getAllCauses as ReturnType<typeof vi.fn>).mockResolvedValue(
    makeApiResponse([])
  );
  (hobbyService.getAllHobbies as ReturnType<typeof vi.fn>).mockResolvedValue(
    makeApiResponse([])
  );
  (industryService.getIndustries as ReturnType<typeof vi.fn>).mockResolvedValue(
    makeApiResponse([])
  );
  (
    languageService.getAllLanguages as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (
    licenseCertificatesService.getLicensesAndCertifications as ReturnType<
      typeof vi.fn
    >
  ).mockResolvedValue(makeApiResponse([]));
  (
    organizationService.getAllOrganizations as ReturnType<typeof vi.fn>
  ).mockResolvedValue([]);
  (
    secondaryEducationService.getSchools as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (
    secondaryEducationService.getExaminations as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (
    secondaryEducationService.getAwardingBodies as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (
    secondaryEducationService.getFieldsOfStudy as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (skillService.getAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(
    makeApiResponse([])
  );
  (societyService.getSocieties as ReturnType<typeof vi.fn>).mockResolvedValue(
    makeApiResponse([])
  );
  (
    sportLevelService.getAllSportLevels as ReturnType<typeof vi.fn>
  ).mockResolvedValue([]);
  (sportService.getSports as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (
    tertiaryEducationService.getQualifications as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (
    tertiaryEducationService.getTertiaryAwardingBodies as ReturnType<
      typeof vi.fn
    >
  ).mockResolvedValue(makeApiResponse([]));
  (
    tertiaryEducationService.getLevelOfQualifications as ReturnType<
      typeof vi.fn
    >
  ).mockResolvedValue(makeApiResponse([]));
  (
    tertiaryEducationService.getSpecializations as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (
    tertiaryEducationService.getBatches as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (
    tertiaryEducationService.getDepartments as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
  (
    tertiaryEducationService.getFaculties as ReturnType<typeof vi.fn>
  ).mockResolvedValue(makeApiResponse([]));
});

// ─── resolveDraftUserCreatedEntries ────────────────────────────────────────────

describe('resolveDraftUserCreatedEntries', () => {
  describe('no optional sections present', () => {
    it('returns a form with only the required sections, all optional sections left undefined', async () => {
      const form = buildBaseForm();
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(result.preferredIndustries).toBeUndefined();
      expect(result.patents).toBeUndefined();
      expect(result.preferredHonoursAwards).toBeUndefined();
      expect(result.licenseCertificates).toBeUndefined();
      expect(result.preferredCauses).toBeUndefined();
      expect(result.preferredHobbies).toBeUndefined();
      expect(result.preferredLanguages).toBeUndefined();
      expect(result.preferredSkills).toBeUndefined();
      expect(result.preferredSports).toBeUndefined();
      expect(result.preferredVolunteering).toBeUndefined();
      expect(result.preferredClubSocieties).toBeUndefined();
      expect(result.projectsRequirements).toBeUndefined();
    });
  });

  // ─── Job Requirements ────────────────────────────────────────────────────────

  describe('job requirements', () => {
    it('leaves jobRequirements untouched when the array is empty', async () => {
      const form = buildBaseForm({ jobRequirements: [] });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(result.jobRequirements).toEqual([]);
    });

    it('does not call any add-fns when no options are USER_CREATED', async () => {
      const form = buildBaseForm({
        jobRequirements: [
          emptyJobRequirement({
            discipline: [{ source: 'MASTER', id: 'd1', label: 'IT' }],
            careerPath: [{ source: 'MASTER', id: 'cp1', label: 'Dev' }],
            level: [{ source: 'MASTER', id: 'l1', label: 'Senior' }],
            role: [{ source: 'PENDING', id: 'r1', label: 'Engineer' }],
            jobTitle: [{ source: 'MASTER', id: 'jt1', label: 'SWE' }],
          }),
        ],
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addDiscipline).not.toHaveBeenCalled();
      expect(deps.addCareerPath).not.toHaveBeenCalled();
      expect(deps.addRole).not.toHaveBeenCalled();
      expect(deps.addJobTitle).not.toHaveBeenCalled();
      expect(result.jobRequirements[0].discipline).toEqual([
        { source: 'MASTER', id: 'd1', label: 'IT' },
      ]);
    });

    it('resolves USER_CREATED discipline/careerPath/role/jobTitle, threading resolved discipline/careerPath/level into downstream create payloads', async () => {
      const form = buildBaseForm({
        jobRequirements: [
          emptyJobRequirement({
            discipline: [
              { source: 'USER_CREATED', id: 'temp-d', label: 'New Discipline' },
            ],
            careerPath: [
              {
                source: 'USER_CREATED',
                id: 'temp-cp',
                label: 'New Career Path',
              },
            ],
            level: [{ source: 'MASTER', id: 'level-1', label: 'Senior' }],
            role: [{ source: 'USER_CREATED', id: 'temp-r', label: 'New Role' }],
            jobTitle: [
              { source: 'USER_CREATED', id: 'temp-jt', label: 'New Title' },
            ],
          }),
          emptyJobRequirement({ description: 'second entry' }),
        ],
      });
      const deps = buildDeps({
        addDiscipline: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('pending-d', 'New Discipline')),
        addCareerPath: vi
          .fn()
          .mockResolvedValue(
            pendingApiResponse('pending-cp', 'New Career Path')
          ),
        addRole: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('pending-r', 'New Role')),
        addJobTitle: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('pending-jt', 'New Title')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addDiscipline).toHaveBeenCalledWith('New Discipline');
      expect(deps.addCareerPath).toHaveBeenCalledWith({
        displayValue: 'New Career Path',
        discipline: { id: 'pending-d', source: 'PENDING' },
      });
      expect(deps.addRole).toHaveBeenCalledWith({
        displayValue: 'New Role',
        careerPath: { id: 'pending-cp', source: 'PENDING' },
        level: { id: 'level-1', source: 'MASTER' },
      });
      expect(deps.addJobTitle).toHaveBeenCalledWith('New Title');

      expect(result.jobRequirements[0].discipline).toEqual([
        { source: 'PENDING', id: 'pending-d', label: 'New Discipline' },
      ]);
      expect(result.jobRequirements[0].careerPath).toEqual([
        { source: 'PENDING', id: 'pending-cp', label: 'New Career Path' },
      ]);
      expect(result.jobRequirements[0].role).toEqual([
        { source: 'PENDING', id: 'pending-r', label: 'New Role' },
      ]);
      expect(result.jobRequirements[0].jobTitle).toEqual([
        { source: 'PENDING', id: 'pending-jt', label: 'New Title' },
      ]);
      // second entry preserved untouched
      expect(result.jobRequirements[1]).toEqual(
        emptyJobRequirement({ description: 'second entry' })
      );
    });

    it('omits discipline/careerPath/level from downstream payloads when they are absent', async () => {
      const form = buildBaseForm({
        jobRequirements: [
          emptyJobRequirement({
            careerPath: [
              { source: 'USER_CREATED', id: 'temp-cp', label: 'Career Only' },
            ],
            role: [
              { source: 'USER_CREATED', id: 'temp-r', label: 'Role Only' },
            ],
          }),
        ],
      });
      const deps = buildDeps({
        addCareerPath: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('cp-2', 'Career Only')),
        addRole: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('r-2', 'Role Only')),
      });

      await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addCareerPath).toHaveBeenCalledWith({
        displayValue: 'Career Only',
        discipline: undefined,
      });
      expect(deps.addRole).toHaveBeenCalledWith({
        displayValue: 'Role Only',
        careerPath: { id: 'cp-2', source: 'PENDING' },
        level: undefined,
      });
    });

    it('omits careerPath from the role payload when no career path is present at all', async () => {
      const form = buildBaseForm({
        jobRequirements: [
          emptyJobRequirement({
            role: [
              {
                source: 'USER_CREATED',
                id: 'temp-r',
                label: 'Standalone Role',
              },
            ],
          }),
        ],
      });
      const deps = buildDeps({
        addRole: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('r-3', 'Standalone Role')),
      });

      await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addRole).toHaveBeenCalledWith({
        displayValue: 'Standalone Role',
        careerPath: undefined,
        level: undefined,
      });
    });
  });

  // ─── Preferred Industries ────────────────────────────────────────────────────

  describe('preferred industries', () => {
    it('resolves USER_CREATED industries via createIndustry', async () => {
      const form = buildBaseForm({
        preferredIndustries: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          industries: [
            { id: 'temp', label: 'New Industry', source: 'USER_CREATED' },
          ],
        },
      });
      const deps = buildDeps({
        createIndustry: vi
          .fn()
          .mockResolvedValue(pendingItem('ind-1', 'New Industry')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createIndustry).toHaveBeenCalledWith('New Industry');
      expect(result.preferredIndustries?.industries[0]).toEqual({
        id: 'ind-1',
        label: 'New Industry',
        source: 'PENDING',
      });
    });

    it('falls back to industryService.getIndustries on MST-403 and reuses the existing id', async () => {
      const form = buildBaseForm({
        preferredIndustries: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          industries: [
            { id: 'temp', label: 'Existing Industry', source: 'USER_CREATED' },
          ],
        },
      });
      const deps = buildDeps({
        createIndustry: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        industryService.getIndustries as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        makeApiResponse([
          { id: 'ind-existing', label: 'Existing Industry', source: 'MASTER' },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(industryService.getIndustries).toHaveBeenCalledWith(
        'Existing Industry'
      );
      expect(result.preferredIndustries?.industries[0]).toEqual({
        id: 'ind-existing',
        label: 'Existing Industry',
        source: 'MASTER',
      });
    });

    it('rethrows a non-MST-403 error unchanged', async () => {
      const form = buildBaseForm({
        preferredIndustries: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          industries: [
            { id: 'temp', label: 'Broken Industry', source: 'USER_CREATED' },
          ],
        },
      });
      const deps = buildDeps({
        createIndustry: vi.fn().mockRejectedValue(new Error('network down')),
      });

      await expect(resolveDraftUserCreatedEntries(form, deps)).rejects.toThrow(
        'network down'
      );
    });
  });

  // ─── Patents ─────────────────────────────────────────────────────────────────

  describe('patents', () => {
    it('resolves USER_CREATED related industries within patent entries', async () => {
      const patentEntry: PatentEntrySchemaType = {
        relatedIndustries: [
          { value: 'temp', label: 'Patent Industry', source: 'USER_CREATED' },
        ],
        statuses: [{ value: 'PATENT_PENDING', label: 'Patent Pending' }],
        isOpen: true,
      };
      const form = buildBaseForm({
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [patentEntry],
        },
      });
      const deps = buildDeps({
        createIndustry: vi
          .fn()
          .mockResolvedValue(pendingItem('pat-ind-1', 'Patent Industry')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(result.patents?.patents[0].relatedIndustries[0]).toEqual({
        value: 'pat-ind-1',
        label: 'Patent Industry',
        source: 'PENDING',
      });
    });

    it('leaves patents unchanged when no related industries are USER_CREATED', async () => {
      const patentEntry: PatentEntrySchemaType = {
        relatedIndustries: [
          { value: 'ind-1', label: 'Existing', source: 'MASTER' },
        ],
        statuses: [],
        isOpen: false,
      };
      const form = buildBaseForm({
        patents: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          patents: [patentEntry],
        },
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createIndustry).not.toHaveBeenCalled();
      expect(result.patents?.patents[0]).toEqual(patentEntry);
    });
  });

  // ─── Preferred Honours & Awards ──────────────────────────────────────────────

  describe('preferred honours & awards', () => {
    it('resolves USER_CREATED associated organizations', async () => {
      const honour: HonourEntrySchemaType = {
        title: 'Award',
        issuedBy: 'Org',
        associatedOrganizations: [
          { value: 'temp', label: 'New Org', source: 'USER_CREATED' },
        ],
        organizationLocations: [],
        isOpen: false,
      };
      const form = buildBaseForm({
        preferredHonoursAwards: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          honoursAndAwards: [honour],
        },
      });
      const deps = buildDeps({
        createOrganization: vi
          .fn()
          .mockResolvedValue(pendingItem('org-1', 'New Org')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createOrganization).toHaveBeenCalledWith('New Org');
      expect(
        result.preferredHonoursAwards?.honoursAndAwards[0]
          .associatedOrganizations[0]
      ).toEqual({ value: 'org-1', label: 'New Org', source: 'PENDING' });
    });
  });

  // ─── License Certificates ────────────────────────────────────────────────────

  describe('license certificates', () => {
    function buildLicenseEntry(
      overrides?: Partial<LicenseCertEntry>
    ): LicenseCertEntry {
      return {
        nameOfLicenseCert: [],
        issuingOrganization: [],
        organizationLocations: [],
        internationallyAccepted: false,
        issueDate: '',
        expirationDate: '',
        ...overrides,
      };
    }

    it('leaves licenseCertificates undefined when absent from the form', async () => {
      const form = buildBaseForm();
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(result.licenseCertificates).toBeUndefined();
    });

    it('leaves an unresolved (non-placeholder) nameOfLicenseCert ref untouched', async () => {
      const form = buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildLicenseEntry({
                nameOfLicenseCert: [
                  { source: 'MASTER', id: 'license-1', type: 'LICENSE' },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addLicenseCertificate).not.toHaveBeenCalled();
      expect(
        result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0]
      ).toEqual({ source: 'MASTER', id: 'license-1', type: 'LICENSE' });
    });

    it('resolves a placeholder nameOfLicenseCert id via addLicenseCertificate', async () => {
      const form = buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildLicenseEntry({
                nameOfLicenseCert: [
                  {
                    source: 'PENDING',
                    id: '__pending_license_cert_1',
                    name: 'Custom Cert',
                    type: 'CERTIFICATE',
                  },
                ],
              }),
            ],
          },
          { isEnabled: false, dataTakenFromCandidate: false, content: [] },
        ],
      });
      const deps = buildDeps({
        addLicenseCertificate: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('cert-1', 'Custom Cert')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addLicenseCertificate).toHaveBeenCalledWith({
        type: 'CERTIFICATE',
        displayValue: 'Custom Cert',
      });
      expect(
        result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0]
      ).toEqual({
        source: 'PENDING',
        id: 'cert-1',
        name: 'Custom Cert',
        type: 'CERTIFICATE',
      });
      // second group untouched
      expect(result.licenseCertificates?.[1]).toEqual({
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      });
    });

    it('defaults the license cert type to CERTIFICATE when the ref has no type', async () => {
      const form = buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildLicenseEntry({
                nameOfLicenseCert: [
                  { source: 'PENDING', id: '__pending_license_cert_2' },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addLicenseCertificate: vi
          .fn()
          .mockResolvedValue(
            pendingApiResponse('cert-2', '__pending_license_cert_2')
          ),
      });

      await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addLicenseCertificate).toHaveBeenCalledWith({
        type: 'CERTIFICATE',
        displayValue: '__pending_license_cert_2',
      });
    });

    it('falls back to searching licenses on MST-403 and reuses the matched id/source', async () => {
      const form = buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildLicenseEntry({
                nameOfLicenseCert: [
                  {
                    source: 'PENDING',
                    id: '__pending_license_cert_3',
                    name: 'Duplicate Cert',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addLicenseCertificate: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        licenseCertificatesService.getLicensesAndCertifications as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue(
        makeApiResponse([
          { id: 'existing-cert', label: 'Duplicate Cert', source: 'PENDING' },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(
        result.licenseCertificates?.[0].content[0].nameOfLicenseCert[0]
      ).toMatchObject({ source: 'PENDING', id: 'existing-cert' });
    });

    it('rethrows when MST-403 fallback search finds no match', async () => {
      const form = buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildLicenseEntry({
                nameOfLicenseCert: [
                  { source: 'PENDING', id: '__pending_license_cert_4' },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addLicenseCertificate: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        licenseCertificatesService.getLicensesAndCertifications as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue(makeApiResponse([]));

      await expect(resolveDraftUserCreatedEntries(form, deps)).rejects.toEqual(
        mst403Error()
      );
    });

    it('resolves USER_CREATED issuing organizations and maps them back onto the license entry', async () => {
      const form = buildBaseForm({
        licenseCertificates: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildLicenseEntry({
                issuingOrganization: [
                  {
                    source: 'USER_CREATED',
                    id: 'temp-org',
                    name: 'New Issuer',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        createOrganization: vi
          .fn()
          .mockResolvedValue(pendingItem('org-issuer-1', 'New Issuer')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createOrganization).toHaveBeenCalledWith('New Issuer');
      expect(
        result.licenseCertificates?.[0].content[0].issuingOrganization[0]
      ).toEqual({ source: 'PENDING', id: 'org-issuer-1', name: 'New Issuer' });
    });
  });

  // ─── Secondary Education ─────────────────────────────────────────────────────

  describe('secondary education', () => {
    function buildSecondaryEntry(
      overrides?: Partial<SecondaryEducationEntry>
    ): SecondaryEducationEntry {
      return {
        acceptsHomeSchooling: false,
        schools: [],
        schoolLocations: [],
        examinations: [],
        secondaryAwardingBody: [],
        fieldsOfStudy: [],
        grade: '',
        startDate: '',
        endDate: '',
        result: '',
        ...overrides,
      };
    }

    it('leaves a non-placeholder school ref untouched', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                schools: [{ source: 'MASTER', id: 'school-1', name: 'Alpha' }],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addSchool).not.toHaveBeenCalled();
      expect(result.secondaryEducation[0].content[0].schools[0]).toEqual({
        source: 'MASTER',
        id: 'school-1',
        name: 'Alpha',
      });
    });

    it('resolves a placeholder school ref via addSchool', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                schools: [
                  {
                    source: 'PENDING',
                    id: '__pending_school_1',
                    name: 'New School',
                  },
                ],
              }),
            ],
          },
          { isEnabled: false, dataTakenFromCandidate: false, content: [] },
        ],
      });
      const deps = buildDeps({
        addSchool: vi
          .fn()
          .mockResolvedValue(
            pendingApiResponse('school-pending-1', 'New School')
          ),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addSchool).toHaveBeenCalledWith({
        displayValue: 'New School',
      });
      expect(result.secondaryEducation[0].content[0].schools[0]).toEqual({
        source: 'PENDING',
        id: 'school-pending-1',
        name: 'New School',
      });
      expect(result.secondaryEducation[1]).toEqual({
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      });
    });

    it('falls back to searchSchools on MST-403 for a placeholder school ref', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                schools: [
                  {
                    source: 'PENDING',
                    id: '__pending_school_2',
                    name: 'Duplicate School',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addSchool: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        secondaryEducationService.getSchools as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        makeApiResponse([
          {
            id: 'existing-school',
            label: 'Duplicate School',
            source: 'MASTER',
          },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(result.secondaryEducation[0].content[0].schools[0]).toEqual({
        source: 'MASTER',
        id: 'existing-school',
        name: 'Duplicate School',
      });
    });

    it('resolves USER_CREATED examinations, secondaryAwardingBody and fieldsOfStudy refs', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                examinations: [
                  { source: 'USER_CREATED', id: 'temp-exam', name: 'New Exam' },
                ],
                secondaryAwardingBody: [
                  { source: 'USER_CREATED', id: 'temp-ab', name: 'New Body' },
                ],
                fieldsOfStudy: [
                  { source: 'USER_CREATED', id: 'temp-fos', name: 'New Field' },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addExamination: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('exam-1', 'New Exam')),
        addSecondaryAwardingBody: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('ab-1', 'New Body')),
        addFieldOfStudy: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('fos-1', 'New Field')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addExamination).toHaveBeenCalledWith('New Exam');
      expect(deps.addSecondaryAwardingBody).toHaveBeenCalledWith('New Body');
      expect(deps.addFieldOfStudy).toHaveBeenCalledWith('New Field');

      const content = result.secondaryEducation[0].content[0];
      expect(content.examinations[0]).toEqual({
        source: 'PENDING',
        id: 'exam-1',
        name: 'New Exam',
      });
      expect(content.secondaryAwardingBody[0]).toEqual({
        source: 'PENDING',
        id: 'ab-1',
        name: 'New Body',
      });
      expect(content.fieldsOfStudy[0]).toEqual({
        source: 'PENDING',
        id: 'fos-1',
        name: 'New Field',
      });
    });

    it('leaves non-USER_CREATED examination/awarding-body/field-of-study refs untouched', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                examinations: [
                  {
                    source: 'MASTER',
                    id: 'exam-existing',
                    name: 'Existing Exam',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addExamination).not.toHaveBeenCalled();
      expect(result.secondaryEducation[0].content[0].examinations[0]).toEqual({
        source: 'MASTER',
        id: 'exam-existing',
        name: 'Existing Exam',
      });
    });

    it('falls back to searchExaminations on MST-403 and reuses the matched entry', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                examinations: [
                  {
                    source: 'USER_CREATED',
                    id: 'temp-exam',
                    name: 'Duplicate Exam',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addExamination: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        secondaryEducationService.getExaminations as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        makeApiResponse([
          { id: 'exam-existing', label: 'Duplicate Exam', source: 'MASTER' },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(secondaryEducationService.getExaminations).toHaveBeenCalledWith(
        'Duplicate Exam'
      );
      expect(
        result.secondaryEducation[0].content[0].examinations[0]
      ).toMatchObject({ source: 'MASTER', id: 'exam-existing' });
    });

    it('falls back to searchSecondaryAwardingBodies on MST-403 and reuses the matched entry', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                secondaryAwardingBody: [
                  {
                    source: 'USER_CREATED',
                    id: 'temp-ab',
                    name: 'Duplicate Body',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addSecondaryAwardingBody: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        secondaryEducationService.getAwardingBodies as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        makeApiResponse([
          { id: 'ab-existing', label: 'Duplicate Body', source: 'MASTER' },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(secondaryEducationService.getAwardingBodies).toHaveBeenCalledWith(
        'Duplicate Body'
      );
      expect(
        result.secondaryEducation[0].content[0].secondaryAwardingBody[0]
      ).toMatchObject({ source: 'MASTER', id: 'ab-existing' });
    });

    it('falls back to searchFieldsOfStudy on MST-403 and reuses the matched entry', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                fieldsOfStudy: [
                  {
                    source: 'USER_CREATED',
                    id: 'temp-fos',
                    name: 'Duplicate Field',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addFieldOfStudy: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        secondaryEducationService.getFieldsOfStudy as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        makeApiResponse([
          { id: 'fos-existing', label: 'Duplicate Field', source: 'MASTER' },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(secondaryEducationService.getFieldsOfStudy).toHaveBeenCalledWith(
        'Duplicate Field'
      );
      expect(
        result.secondaryEducation[0].content[0].fieldsOfStudy[0]
      ).toMatchObject({ source: 'MASTER', id: 'fos-existing' });
    });

    it('rethrows a non-MST-403 error from a plain ref field create call', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                examinations: [
                  {
                    source: 'USER_CREATED',
                    id: 'temp-exam',
                    name: 'Broken Exam',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addExamination: vi.fn().mockRejectedValue(new Error('offline')),
      });

      await expect(resolveDraftUserCreatedEntries(form, deps)).rejects.toThrow(
        'offline'
      );
    });

    it('uses the ref id as the label fallback when name is absent', async () => {
      const form = buildBaseForm({
        secondaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildSecondaryEntry({
                examinations: [{ source: 'USER_CREATED', id: 'Label As Id' }],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addExamination: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('exam-2', 'Label As Id')),
      });

      await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addExamination).toHaveBeenCalledWith('Label As Id');
    });
  });

  // ─── Tertiary Education ──────────────────────────────────────────────────────

  describe('tertiary education', () => {
    function buildTertiaryEntry(
      overrides?: Partial<TertiaryEducationEntry>
    ): TertiaryEducationEntry {
      return {
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
        ...overrides,
      };
    }

    it('resolves a placeholder tertiaryAwardingBody ref via addTertiaryAwardingBody', async () => {
      const form = buildBaseForm({
        tertiaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildTertiaryEntry({
                tertiaryAwardingBody: [
                  {
                    source: 'PENDING',
                    id: '__pending_awarding_body_1',
                    name: 'New Awarding Body',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addTertiaryAwardingBody: vi
          .fn()
          .mockResolvedValue(
            pendingApiResponse('awarding-1', 'New Awarding Body')
          ),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addTertiaryAwardingBody).toHaveBeenCalledWith({
        displayValue: 'New Awarding Body',
      });
      expect(
        result.tertiaryEducation[0].content[0].tertiaryAwardingBody[0]
      ).toEqual({
        source: 'PENDING',
        id: 'awarding-1',
        name: 'New Awarding Body',
      });
    });

    it('falls back to searchTertiaryAwardingBodies on MST-403', async () => {
      const form = buildBaseForm({
        tertiaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildTertiaryEntry({
                tertiaryAwardingBody: [
                  {
                    source: 'PENDING',
                    id: '__pending_awarding_body_2',
                    name: 'Duplicate Body',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addTertiaryAwardingBody: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        tertiaryEducationService.getTertiaryAwardingBodies as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue(
        makeApiResponse([
          { id: 'existing-body', label: 'Duplicate Body', source: 'MASTER' },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(
        result.tertiaryEducation[0].content[0].tertiaryAwardingBody[0]
      ).toEqual({
        source: 'MASTER',
        id: 'existing-body',
        name: 'Duplicate Body',
      });
    });

    it('leaves a non-placeholder tertiaryAwardingBody ref untouched', async () => {
      const form = buildBaseForm({
        tertiaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildTertiaryEntry({
                tertiaryAwardingBody: [
                  { source: 'MASTER', id: 'body-1', name: 'Existing Body' },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addTertiaryAwardingBody).not.toHaveBeenCalled();
      expect(
        result.tertiaryEducation[0].content[0].tertiaryAwardingBody[0]
      ).toEqual({ source: 'MASTER', id: 'body-1', name: 'Existing Body' });
    });

    it('resolves USER_CREATED qualificationName, levelOfQualification, specialization, batch, department and faculty refs', async () => {
      const form = buildBaseForm({
        tertiaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildTertiaryEntry({
                qualificationName: [
                  { source: 'USER_CREATED', id: 'temp-q', name: 'New Qual' },
                ],
                levelOfQualification: [
                  { source: 'USER_CREATED', id: 'temp-loq', name: 'New Level' },
                ],
                specialization: [
                  { source: 'USER_CREATED', id: 'temp-spec', name: 'New Spec' },
                ],
                batch: [
                  {
                    source: 'USER_CREATED',
                    id: 'temp-batch',
                    name: 'New Batch',
                  },
                ],
                department: [
                  { source: 'USER_CREATED', id: 'temp-dept', name: 'New Dept' },
                ],
                faculty: [
                  {
                    source: 'USER_CREATED',
                    id: 'temp-fac',
                    name: 'New Faculty',
                  },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addQualification: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('q-1', 'New Qual')),
        addLevelOfQualification: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('loq-1', 'New Level')),
        addSpecialization: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('spec-1', 'New Spec')),
        addBatch: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('batch-1', 'New Batch')),
        addDepartment: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('dept-1', 'New Dept')),
        addFaculty: vi
          .fn()
          .mockResolvedValue(pendingApiResponse('fac-1', 'New Faculty')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.addQualification).toHaveBeenCalledWith('New Qual');
      expect(deps.addLevelOfQualification).toHaveBeenCalledWith('New Level');
      expect(deps.addSpecialization).toHaveBeenCalledWith('New Spec');
      expect(deps.addBatch).toHaveBeenCalledWith('New Batch');
      expect(deps.addDepartment).toHaveBeenCalledWith('New Dept');
      expect(deps.addFaculty).toHaveBeenCalledWith('New Faculty');

      const content = result.tertiaryEducation[0].content[0];
      expect(content.qualificationName[0]).toEqual({
        source: 'PENDING',
        id: 'q-1',
        name: 'New Qual',
      });
      expect(content.levelOfQualification[0]).toEqual({
        source: 'PENDING',
        id: 'loq-1',
        name: 'New Level',
      });
      expect(content.specialization[0]).toEqual({
        source: 'PENDING',
        id: 'spec-1',
        name: 'New Spec',
      });
      expect(content.batch[0]).toEqual({
        source: 'PENDING',
        id: 'batch-1',
        name: 'New Batch',
      });
      expect(content.department[0]).toEqual({
        source: 'PENDING',
        id: 'dept-1',
        name: 'New Dept',
      });
      expect(content.faculty[0]).toEqual({
        source: 'PENDING',
        id: 'fac-1',
        name: 'New Faculty',
      });
    });

    it.each([
      [
        'qualificationName',
        'addQualification',
        'getQualifications',
        'Duplicate Qualification',
      ],
      [
        'levelOfQualification',
        'addLevelOfQualification',
        'getLevelOfQualifications',
        'Duplicate Level',
      ],
      [
        'specialization',
        'addSpecialization',
        'getSpecializations',
        'Duplicate Specialization',
      ],
      ['batch', 'addBatch', 'getBatches', 'Duplicate Batch'],
      ['department', 'addDepartment', 'getDepartments', 'Duplicate Department'],
      ['faculty', 'addFaculty', 'getFaculties', 'Duplicate Faculty'],
    ] as const)(
      'falls back to search%s on MST-403 for the %s field',
      async (field, depFn, serviceFn, label) => {
        const form = buildBaseForm({
          tertiaryEducation: [
            {
              isEnabled: true,
              dataTakenFromCandidate: false,
              content: [
                buildTertiaryEntry({
                  [field]: [
                    { source: 'USER_CREATED', id: 'temp', name: label },
                  ],
                }),
              ],
            },
          ],
        });
        const deps = buildDeps({
          [depFn]: vi.fn().mockRejectedValue(mst403Error()),
        });
        (
          tertiaryEducationService[serviceFn] as ReturnType<typeof vi.fn>
        ).mockResolvedValue(
          makeApiResponse([{ id: 'existing-id', label, source: 'MASTER' }])
        );

        const result = await resolveDraftUserCreatedEntries(form, deps);

        expect(
          tertiaryEducationService[serviceFn] as ReturnType<typeof vi.fn>
        ).toHaveBeenCalledWith(label);
        expect(result.tertiaryEducation[0].content[0][field][0]).toMatchObject({
          source: 'MASTER',
          id: 'existing-id',
        });
      }
    );

    it('rethrows a non-MST-403 error from a plain tertiary ref field create call', async () => {
      const form = buildBaseForm({
        tertiaryEducation: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            content: [
              buildTertiaryEntry({
                qualificationName: [
                  { source: 'USER_CREATED', id: 'temp-q', name: 'Broken Qual' },
                ],
              }),
            ],
          },
        ],
      });
      const deps = buildDeps({
        addQualification: vi.fn().mockRejectedValue(new Error('offline')),
      });

      await expect(resolveDraftUserCreatedEntries(form, deps)).rejects.toThrow(
        'offline'
      );
    });
  });

  // ─── Preferred Causes / Hobbies / Languages ────────────────────────────────

  describe('preferred causes, hobbies and languages', () => {
    it('resolves USER_CREATED causes via createCause', async () => {
      const form = buildBaseForm({
        preferredCauses: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          causes: [{ id: 'temp', label: 'New Cause', source: 'USER_CREATED' }],
        },
      });
      const deps = buildDeps({
        createCause: vi
          .fn()
          .mockResolvedValue(pendingItem('cause-1', 'New Cause')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createCause).toHaveBeenCalledWith('New Cause');
      expect(result.preferredCauses?.causes[0]).toEqual({
        id: 'cause-1',
        label: 'New Cause',
        source: 'PENDING',
      });
    });

    it('resolves USER_CREATED hobbies via createHobby', async () => {
      const form = buildBaseForm({
        preferredHobbies: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          hobbies: [{ id: 'temp', label: 'New Hobby', source: 'USER_CREATED' }],
        },
      });
      const deps = buildDeps({
        createHobby: vi
          .fn()
          .mockResolvedValue(pendingItem('hobby-1', 'New Hobby')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createHobby).toHaveBeenCalledWith('New Hobby');
      expect(result.preferredHobbies?.hobbies[0]).toEqual({
        id: 'hobby-1',
        label: 'New Hobby',
        source: 'PENDING',
      });
    });

    it('resolves USER_CREATED languages via createLanguage', async () => {
      const form = buildBaseForm({
        preferredLanguages: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          languages: [
            { id: 'temp', label: 'New Language', source: 'USER_CREATED' },
          ],
        },
      });
      const deps = buildDeps({
        createLanguage: vi
          .fn()
          .mockResolvedValue(pendingItem('lang-1', 'New Language')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createLanguage).toHaveBeenCalledWith('New Language');
      expect(result.preferredLanguages?.languages[0]).toEqual({
        id: 'lang-1',
        label: 'New Language',
        source: 'PENDING',
      });
    });
  });

  // ─── Preferred Skills ────────────────────────────────────────────────────────

  describe('preferred skills', () => {
    it('leaves skills unchanged when none are USER_CREATED', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'skill-1',
              skillName: 'Java',
              careerPathName: 'Backend',
              displayValue: 'Java - Backend',
              source: 'MASTER',
            },
          ],
        },
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createSkillCareerPath).not.toHaveBeenCalled();
      expect(skillService.getAllSkills).not.toHaveBeenCalled();
      expect(result.preferredSkills?.skills[0].skillId).toBe('skill-1');
    });

    it('reuses an existing skill found via skillService.getAllSkills instead of creating a duplicate', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp',
              skillName: 'Java',
              careerPathId: 'cp-1',
              careerPathName: 'Backend',
              displayValue: 'Java - Backend',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      (skillService.getAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeApiResponse([
          { id: 'existing-skill', label: 'Java - Backend', source: 'MASTER' },
        ])
      );
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createSkillCareerPath).not.toHaveBeenCalled();
      expect(result.preferredSkills?.skills[0]).toMatchObject({
        skillId: 'existing-skill',
        careerPathId: 'cp-1',
        source: 'MASTER',
      });
    });

    it('creates a new skill-career-path when careerPathId is already known', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp',
              skillName: 'Rust',
              careerPathId: 'cp-known',
              careerPathName: 'Systems',
              displayValue: 'Rust - Systems',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createSkillCareerPath: vi
          .fn()
          .mockResolvedValue(pendingItem('skill-pending-1', 'Rust - Systems')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createSkillCareerPath).toHaveBeenCalledWith({
        skillName: 'Rust',
        careerPathName: 'Systems',
      });
      expect(result.preferredSkills?.skills[0]).toMatchObject({
        skillId: 'skill-pending-1',
        careerPathId: 'cp-known',
        displayValue: 'Rust - Systems',
        source: 'PENDING',
      });
    });

    it('resolves the career path first via createCareerPath when careerPathId is missing', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp',
              skillName: 'Go',
              careerPathName: 'Cloud',
              displayValue: 'Go - Cloud',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createCareerPath: vi
          .fn()
          .mockResolvedValue(pendingItem('cp-new', 'Cloud')),
        createSkillCareerPath: vi
          .fn()
          .mockResolvedValue(pendingItem('skill-new', 'Go - Cloud')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createCareerPath).toHaveBeenCalledWith('Cloud');
      expect(result.preferredSkills?.skills[0].careerPathId).toBe('cp-new');
    });

    it('falls back to careerPathService.getAllCareerPaths on MST-403 when resolving the career path', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp',
              skillName: 'Kotlin',
              careerPathName: 'Mobile',
              displayValue: 'Kotlin - Mobile',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createCareerPath: vi.fn().mockRejectedValue(mst403Error()),
        createSkillCareerPath: vi
          .fn()
          .mockResolvedValue(pendingItem('skill-2', 'Kotlin - Mobile')),
      });
      (
        careerPathService.getAllCareerPaths as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        makeApiResponse([{ id: 'cp-existing', label: 'Mobile' }])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(result.preferredSkills?.skills[0].careerPathId).toBe(
        'cp-existing'
      );
    });

    it('leaves careerPathId undefined when the MST-403 career path fallback search has no match', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp',
              skillName: 'Swift',
              careerPathName: 'iOS',
              displayValue: 'Swift - iOS',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createCareerPath: vi.fn().mockRejectedValue(mst403Error()),
        createSkillCareerPath: vi
          .fn()
          .mockResolvedValue(pendingItem('skill-3', 'Swift - iOS')),
      });
      (
        careerPathService.getAllCareerPaths as ReturnType<typeof vi.fn>
      ).mockResolvedValue(makeApiResponse([]));

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(result.preferredSkills?.skills[0].careerPathId).toBeUndefined();
    });

    it('rethrows a non-MST-403 error from createCareerPath', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp',
              skillName: 'Elixir',
              careerPathName: 'Backend',
              displayValue: 'Elixir - Backend',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createCareerPath: vi.fn().mockRejectedValue(new Error('boom')),
      });

      await expect(resolveDraftUserCreatedEntries(form, deps)).rejects.toThrow(
        'boom'
      );
    });

    it('falls back to findExistingSkill on MST-403 from createSkillCareerPath', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp',
              skillName: 'Python',
              careerPathId: 'cp-1',
              careerPathName: 'Data',
              displayValue: 'Python - Data',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createSkillCareerPath: vi.fn().mockRejectedValue(mst403Error()),
      });
      (skillService.getAllSkills as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(makeApiResponse([]))
        .mockResolvedValueOnce(
          makeApiResponse([
            { id: 'skill-existing', label: 'Python - Data', source: 'PENDING' },
          ])
        );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(result.preferredSkills?.skills[0]).toMatchObject({
        skillId: 'skill-existing',
        source: 'PENDING',
      });
    });

    it('rethrows when createSkillCareerPath gets MST-403 but no fallback skill is found', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp',
              skillName: 'Haskell',
              careerPathId: 'cp-1',
              careerPathName: 'Research',
              displayValue: 'Haskell - Research',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createSkillCareerPath: vi.fn().mockRejectedValue(mst403Error()),
      });
      (skillService.getAllSkills as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeApiResponse([])
      );

      await expect(resolveDraftUserCreatedEntries(form, deps)).rejects.toEqual(
        mst403Error()
      );
    });

    it('rethrows a non-MST-403 error from createSkillCareerPath', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp',
              skillName: 'Scala',
              careerPathId: 'cp-1',
              careerPathName: 'Backend',
              displayValue: 'Scala - Backend',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createSkillCareerPath: vi.fn().mockRejectedValue(new Error('down')),
      });

      await expect(resolveDraftUserCreatedEntries(form, deps)).rejects.toThrow(
        'down'
      );
    });

    it('resolves the same skill+career-path combo only once, applying it to every matching row', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp1',
              skillName: 'C++',
              careerPathId: 'cp-1',
              careerPathName: 'Systems',
              displayValue: 'C++ - Systems',
              source: 'USER_CREATED',
            },
            {
              skillId: 'temp2',
              skillName: ' c++ ',
              careerPathId: 'cp-1',
              careerPathName: ' SYSTEMS ',
              displayValue: 'C++ - Systems',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createSkillCareerPath: vi
          .fn()
          .mockResolvedValue(pendingItem('combo-1', 'C++ - Systems')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createSkillCareerPath).toHaveBeenCalledTimes(1);
      expect(result.preferredSkills?.skills[0].skillId).toBe('combo-1');
      expect(result.preferredSkills?.skills[1].skillId).toBe('combo-1');
    });

    it('resolves a shared career path name only once across different skills', async () => {
      const form = buildBaseForm({
        preferredSkills: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          skills: [
            {
              skillId: 'temp1',
              skillName: 'Vue',
              careerPathName: 'Frontend',
              displayValue: 'Vue - Frontend',
              source: 'USER_CREATED',
            },
            {
              skillId: 'temp2',
              skillName: 'React',
              careerPathName: 'Frontend',
              displayValue: 'React - Frontend',
              source: 'USER_CREATED',
            },
          ],
        },
      });
      const deps = buildDeps({
        createCareerPath: vi
          .fn()
          .mockResolvedValue(pendingItem('cp-shared', 'Frontend')),
        createSkillCareerPath: vi
          .fn()
          .mockImplementation((params: { skillName: string }) =>
            Promise.resolve(
              pendingItem(`skill-${params.skillName}`, params.skillName)
            )
          ),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createCareerPath).toHaveBeenCalledTimes(1);
      expect(result.preferredSkills?.skills[0].careerPathId).toBe('cp-shared');
      expect(result.preferredSkills?.skills[1].careerPathId).toBe('cp-shared');
    });
  });

  // ─── Preferred Sports ────────────────────────────────────────────────────────

  describe('preferred sports', () => {
    function buildSportEntry(
      overrides?: Partial<SportFormEntry>
    ): SportFormEntry {
      return {
        id: 'sport-entry-1',
        isOpen: false,
        sport: [],
        sportSearch: '',
        levelRepresented: [],
        representedOrganization: [],
        organizationLocations: [],
        position: '',
        ...overrides,
      };
    }

    it('leaves sports unchanged when no fields have USER_CREATED options', async () => {
      const form = buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            buildSportEntry({
              sport: [{ value: 's1', label: 'Football', source: 'MASTER' }],
            }),
          ],
        },
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createSport).not.toHaveBeenCalled();
      expect(deps.createSportLevel).not.toHaveBeenCalled();
      expect(deps.createOrganization).not.toHaveBeenCalled();
      expect(result.preferredSports?.sports[0].sport).toEqual([
        { value: 's1', label: 'Football', source: 'MASTER' },
      ]);
    });

    it('resolves USER_CREATED sport, levelRepresented and representedOrganization fields', async () => {
      const form = buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            buildSportEntry({
              sport: [
                { value: 'temp-s', label: 'Rugby', source: 'USER_CREATED' },
              ],
              levelRepresented: [
                { value: 'temp-l', label: 'National', source: 'USER_CREATED' },
              ],
              representedOrganization: [
                { value: 'temp-o', label: 'Club X', source: 'USER_CREATED' },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createSport: vi.fn().mockResolvedValue(pendingItem('sport-1', 'Rugby')),
        createSportLevel: vi
          .fn()
          .mockResolvedValue(pendingItem('level-1', 'National')),
        createOrganization: vi
          .fn()
          .mockResolvedValue(pendingItem('org-1', 'Club X')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createSport).toHaveBeenCalledWith('Rugby');
      expect(deps.createSportLevel).toHaveBeenCalledWith('National');
      expect(deps.createOrganization).toHaveBeenCalledWith('Club X');

      const sport = result.preferredSports?.sports[0];
      expect(sport?.sport[0]).toEqual({
        value: 'sport-1',
        label: 'Rugby',
        source: 'PENDING',
      });
      expect(sport?.levelRepresented[0]).toEqual({
        value: 'level-1',
        label: 'National',
        source: 'PENDING',
      });
      expect(sport?.representedOrganization[0]).toEqual({
        value: 'org-1',
        label: 'Club X',
        source: 'PENDING',
      });
    });

    it('falls back to searchSports on MST-403 and reuses the matched entry', async () => {
      const form = buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            buildSportEntry({
              sport: [
                {
                  value: 'temp-s',
                  label: 'Duplicate Sport',
                  source: 'USER_CREATED',
                },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createSport: vi.fn().mockRejectedValue(mst403Error()),
      });
      (sportService.getSports as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'sport-existing', name: 'Duplicate Sport', source: 'MASTER' },
      ]);

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(result.preferredSports?.sports[0].sport[0]).toEqual({
        value: 'sport-existing',
        label: 'Duplicate Sport',
        source: 'MASTER',
      });
    });

    it('rethrows when the MST-403 fallback search for sports finds no match', async () => {
      const form = buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            buildSportEntry({
              sport: [
                {
                  value: 'temp-s',
                  label: 'Missing Sport',
                  source: 'USER_CREATED',
                },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createSport: vi.fn().mockRejectedValue(mst403Error()),
      });
      (sportService.getSports as ReturnType<typeof vi.fn>).mockResolvedValue(
        []
      );

      await expect(resolveDraftUserCreatedEntries(form, deps)).rejects.toEqual(
        mst403Error()
      );
    });

    it('rethrows a non-MST-403 error immediately', async () => {
      const form = buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            buildSportEntry({
              sport: [
                {
                  value: 'temp-s',
                  label: 'Broken Sport',
                  source: 'USER_CREATED',
                },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createSport: vi.fn().mockRejectedValue(new Error('offline')),
      });

      await expect(resolveDraftUserCreatedEntries(form, deps)).rejects.toThrow(
        'offline'
      );
    });

    it('falls back to searchSportLevels on MST-403 for the levelRepresented field', async () => {
      const form = buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            buildSportEntry({
              levelRepresented: [
                {
                  value: 'temp-l',
                  label: 'Duplicate Level',
                  source: 'USER_CREATED',
                },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createSportLevel: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        sportLevelService.getAllSportLevels as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { id: 'level-existing', label: 'Duplicate Level', source: 'MASTER' },
      ]);

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(sportLevelService.getAllSportLevels).toHaveBeenCalled();
      expect(result.preferredSports?.sports[0].levelRepresented[0]).toEqual({
        value: 'level-existing',
        label: 'Duplicate Level',
        source: 'MASTER',
      });
    });

    it('falls back to searchOrganizations on MST-403 for the representedOrganization field', async () => {
      const form = buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            buildSportEntry({
              representedOrganization: [
                {
                  value: 'temp-o',
                  label: 'Duplicate Club',
                  source: 'USER_CREATED',
                },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createOrganization: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        organizationService.getAllOrganizations as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { id: 'org-existing', name: 'Duplicate Club', source: 'MASTER' },
      ]);

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(organizationService.getAllOrganizations).toHaveBeenCalledWith(
        'Duplicate Club'
      );
      expect(
        result.preferredSports?.sports[0].representedOrganization[0]
      ).toEqual({
        value: 'org-existing',
        label: 'Duplicate Club',
        source: 'MASTER',
      });
    });

    it('resolves a shared USER_CREATED sport label only once across multiple entries', async () => {
      const form = buildBaseForm({
        preferredSports: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          sports: [
            buildSportEntry({
              id: 'sport-a',
              sport: [
                { value: 't1', label: 'Cricket', source: 'USER_CREATED' },
              ],
            }),
            buildSportEntry({
              id: 'sport-b',
              sport: [
                { value: 't2', label: 'Cricket', source: 'USER_CREATED' },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createSport: vi
          .fn()
          .mockResolvedValue(pendingItem('cricket-1', 'Cricket')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createSport).toHaveBeenCalledTimes(1);
      expect(result.preferredSports?.sports[0].sport[0].value).toBe(
        'cricket-1'
      );
      expect(result.preferredSports?.sports[1].sport[0].value).toBe(
        'cricket-1'
      );
    });
  });

  // ─── Preferred Volunteering ──────────────────────────────────────────────────

  describe('preferred volunteering', () => {
    function buildVolunteeringEntry(
      overrides?: Partial<VolunteeringFormEntry>
    ): VolunteeringFormEntry {
      return {
        id: 'volunteer-1',
        isOpen: false,
        organizationName: [],
        organizationLocations: [],
        cause: [],
        causeSearch: '',
        position: '',
        ...overrides,
      };
    }

    it('resolves USER_CREATED cause and organizationName fields', async () => {
      const form = buildBaseForm({
        preferredVolunteering: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          volunteering: [
            buildVolunteeringEntry({
              cause: [
                { value: 'temp-c', label: 'New Cause', source: 'USER_CREATED' },
              ],
              organizationName: [
                { value: 'temp-o', label: 'New Org', source: 'USER_CREATED' },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createCause: vi
          .fn()
          .mockResolvedValue(pendingItem('cause-v1', 'New Cause')),
        createOrganization: vi
          .fn()
          .mockResolvedValue(pendingItem('org-v1', 'New Org')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createCause).toHaveBeenCalledWith('New Cause');
      expect(deps.createOrganization).toHaveBeenCalledWith('New Org');

      const entry = result.preferredVolunteering?.volunteering[0];
      expect(entry?.cause[0]).toEqual({
        value: 'cause-v1',
        label: 'New Cause',
        source: 'PENDING',
      });
      expect(entry?.organizationName[0]).toEqual({
        value: 'org-v1',
        label: 'New Org',
        source: 'PENDING',
      });
    });

    it('falls back to searchCauses on MST-403 for the cause field', async () => {
      const form = buildBaseForm({
        preferredVolunteering: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          volunteering: [
            buildVolunteeringEntry({
              cause: [
                {
                  value: 'temp-c',
                  label: 'Duplicate Cause',
                  source: 'USER_CREATED',
                },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createCause: vi.fn().mockRejectedValue(mst403Error()),
      });
      (causeService.getAllCauses as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeApiResponse([
          { id: 'cause-existing', label: 'Duplicate Cause', source: 'MASTER' },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(causeService.getAllCauses).toHaveBeenCalledWith('Duplicate Cause');
      expect(result.preferredVolunteering?.volunteering[0].cause[0]).toEqual({
        value: 'cause-existing',
        label: 'Duplicate Cause',
        source: 'MASTER',
      });
    });

    it('leaves volunteering unchanged when nothing is USER_CREATED', async () => {
      const form = buildBaseForm({
        preferredVolunteering: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          volunteering: [
            buildVolunteeringEntry({
              cause: [{ value: 'c1', label: 'Existing', source: 'MASTER' }],
            }),
          ],
        },
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createCause).not.toHaveBeenCalled();
      expect(result.preferredVolunteering?.volunteering[0].cause[0]).toEqual({
        value: 'c1',
        label: 'Existing',
        source: 'MASTER',
      });
    });
  });

  // ─── Preferred Club Societies ────────────────────────────────────────────────

  describe('preferred club societies', () => {
    function buildClubSocietyEntry(
      overrides?: Partial<ClubSocietyFormEntry>
    ): ClubSocietyFormEntry {
      return {
        id: 'club-1',
        isOpen: false,
        clubSociety: [],
        clubSocietySearch: '',
        representedOrganization: [],
        organizationLocations: [],
        position: '',
        ...overrides,
      };
    }

    it('resolves USER_CREATED clubSociety and representedOrganization fields', async () => {
      const form = buildBaseForm({
        preferredClubSocieties: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          clubSocieties: [
            buildClubSocietyEntry({
              clubSociety: [
                {
                  value: 'temp-cs',
                  label: 'New Society',
                  source: 'USER_CREATED',
                },
              ],
              representedOrganization: [
                { value: 'temp-o', label: 'New Org', source: 'USER_CREATED' },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createSociety: vi
          .fn()
          .mockResolvedValue(pendingItem('society-1', 'New Society')),
        createOrganization: vi
          .fn()
          .mockResolvedValue(pendingItem('org-cs1', 'New Org')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createSociety).toHaveBeenCalledWith('New Society');
      expect(deps.createOrganization).toHaveBeenCalledWith('New Org');

      const entry = result.preferredClubSocieties?.clubSocieties[0];
      expect(entry?.clubSociety[0]).toEqual({
        value: 'society-1',
        label: 'New Society',
        source: 'PENDING',
      });
      expect(entry?.representedOrganization[0]).toEqual({
        value: 'org-cs1',
        label: 'New Org',
        source: 'PENDING',
      });
    });

    it('falls back to searchSocieties on MST-403 for the clubSociety field', async () => {
      const form = buildBaseForm({
        preferredClubSocieties: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          clubSocieties: [
            buildClubSocietyEntry({
              clubSociety: [
                {
                  value: 'temp-cs',
                  label: 'Duplicate Society',
                  source: 'USER_CREATED',
                },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createSociety: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        societyService.getSocieties as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        makeApiResponse([
          {
            id: 'society-existing',
            label: 'Duplicate Society',
            source: 'MASTER',
          },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(societyService.getSocieties).toHaveBeenCalledWith(
        'Duplicate Society'
      );
      expect(
        result.preferredClubSocieties?.clubSocieties[0].clubSociety[0]
      ).toEqual({
        value: 'society-existing',
        label: 'Duplicate Society',
        source: 'MASTER',
      });
    });
  });

  // ─── Projects Requirements ───────────────────────────────────────────────────

  describe('projects requirements', () => {
    function buildProjectEntry(
      overrides?: Partial<ProjectFormEntry>
    ): ProjectFormEntry {
      return {
        id: 'project-1',
        isOpen: false,
        relatedIndustry: [],
        organizationLocations: [],
        organizations: [],
        ...overrides,
      };
    }

    it('resolves USER_CREATED relatedIndustry and organizations fields', async () => {
      const form = buildBaseForm({
        projectsRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          projects: [
            buildProjectEntry({
              relatedIndustry: [
                {
                  value: 'temp-i',
                  label: 'New Industry',
                  source: 'USER_CREATED',
                },
              ],
              organizations: [
                { value: 'temp-o', label: 'New Org', source: 'USER_CREATED' },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createIndustry: vi
          .fn()
          .mockResolvedValue(pendingItem('industry-p1', 'New Industry')),
        createOrganization: vi
          .fn()
          .mockResolvedValue(pendingItem('org-p1', 'New Org')),
      });

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createIndustry).toHaveBeenCalledWith('New Industry');
      expect(deps.createOrganization).toHaveBeenCalledWith('New Org');

      const entry = result.projectsRequirements?.projects[0];
      expect(entry?.relatedIndustry[0]).toEqual({
        value: 'industry-p1',
        label: 'New Industry',
        source: 'PENDING',
      });
      expect(entry?.organizations[0]).toEqual({
        value: 'org-p1',
        label: 'New Org',
        source: 'PENDING',
      });
    });

    it('leaves projects unchanged when nothing is USER_CREATED', async () => {
      const form = buildBaseForm({
        projectsRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          projects: [
            buildProjectEntry({
              organizations: [
                { value: 'org-1', label: 'Existing Org', source: 'MASTER' },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps();

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(deps.createOrganization).not.toHaveBeenCalled();
      expect(result.projectsRequirements?.projects[0].organizations[0]).toEqual(
        {
          value: 'org-1',
          label: 'Existing Org',
          source: 'MASTER',
        }
      );
    });

    it('falls back to searchIndustries on MST-403 for the relatedIndustry field', async () => {
      const form = buildBaseForm({
        projectsRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          projects: [
            buildProjectEntry({
              relatedIndustry: [
                {
                  value: 'temp-i',
                  label: 'Duplicate Industry',
                  source: 'USER_CREATED',
                },
              ],
            }),
          ],
        },
      });
      const deps = buildDeps({
        createIndustry: vi.fn().mockRejectedValue(mst403Error()),
      });
      (
        industryService.getIndustries as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        makeApiResponse([
          {
            id: 'industry-existing',
            label: 'Duplicate Industry',
            source: 'MASTER',
          },
        ])
      );

      const result = await resolveDraftUserCreatedEntries(form, deps);

      expect(industryService.getIndustries).toHaveBeenCalledWith(
        'Duplicate Industry'
      );
      expect(
        result.projectsRequirements?.projects[0].relatedIndustry[0]
      ).toEqual({
        value: 'industry-existing',
        label: 'Duplicate Industry',
        source: 'MASTER',
      });
    });
  });
});
