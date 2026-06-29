import { beforeEach, describe, expect, it, vi } from 'vitest';

import { careerPathService } from '@/views/vacancies/services/career-path.service';
import { disciplineService } from '@/views/vacancies/services/discipline.service';
import { employmentTypeService } from '@/views/vacancies/services/employment-type.service';
import { engagementModelService } from '@/views/vacancies/services/engagement-model.service';
import { jobLevelService } from '@/views/vacancies/services/job-level.service';
import { jobTitleService } from '@/views/vacancies/services/job-title.service';
import { roleService } from '@/views/vacancies/services/role.service';
import { workScheduleService } from '@/views/vacancies/services/work-schedule.service';
import type {
  ApiResponse,
  CreatePendingApiResponse,
  DisciplineItem,
  EmploymentTypeItem,
  EngagementModelItem,
  JobLevelItem,
  JobTitleItem,
  RoleItem,
  SingleRecordApiResponse,
  WorkScheduleItem,
} from '@/views/vacancies/types';

// ── Mock @cgp/data-access ──────────────────────────────────────────────────

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: mockGet,
    post: mockPost,
  },
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

const pagedResponse = <T>(content: T[]): ApiResponse<T[]> => ({
  requestId: 'req-001',
  success: true,
  message: 'Success',
  data: {
    type: 'TEST',
    items: {
      content,
      number: 0,
      size: 50,
      totalElements: content.length,
      empty: content.length === 0,
      first: true,
      last: true,
      numberOfElements: content.length,
      totalPages: 1,
      pageable: {
        offset: 0,
        pageNumber: 0,
        pageSize: 50,
        paged: true,
        unpaged: false,
        sort: { sorted: false, empty: true, unsorted: true },
      },
      sort: { sorted: false, empty: true, unsorted: true },
    },
  },
});

const pendingResponse: CreatePendingApiResponse = {
  requestId: 'req-002',
  success: true,
  message: 'Created',
  data: {
    pendingId: 'pending-123',
    type: 'TEST',
    value: 'Test Item',
    status: 'PENDING',
  },
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Job Requirements Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── disciplineService ─────────────────────────────────────────────────────

  describe('disciplineService', () => {
    describe('getAllDisciplines', () => {
      it('calls GET /disciplines with search and size params', async () => {
        const mockData = pagedResponse<DisciplineItem>([
          { id: 'd1', label: 'Engineering', source: 'MASTER' },
        ]);
        mockGet.mockResolvedValue({ data: mockData });

        const result = await disciplineService.getAllDisciplines('eng');

        expect(mockGet).toHaveBeenCalledWith('/disciplines', {
          params: { search: 'eng', size: 50 },
        });
        expect(result).toEqual(mockData);
      });

      it('uses empty string as default search', async () => {
        mockGet.mockResolvedValue({ data: pagedResponse([]) });

        await disciplineService.getAllDisciplines();

        expect(mockGet).toHaveBeenCalledWith('/disciplines', {
          params: { search: '', size: 50 },
        });
      });
    });

    describe('addDiscipline', () => {
      it('calls POST /disciplines with correct payload', async () => {
        mockPost.mockResolvedValue({ data: pendingResponse });

        const result = await disciplineService.addDiscipline('New Discipline');

        expect(mockPost).toHaveBeenCalledWith('/disciplines', {
          type: 'DISCIPLINE',
          displayValue: 'New Discipline',
        });
        expect(result).toEqual(pendingResponse);
      });
    });
  });

  // ── careerPathService (addCareerPath) ─────────────────────────────────────

  describe('careerPathService.addCareerPath', () => {
    it('calls POST /career-paths without discipline when not provided', async () => {
      mockPost.mockResolvedValue({ data: pendingResponse });

      const result = await careerPathService.addCareerPath({
        displayValue: 'New Path',
      });

      expect(mockPost).toHaveBeenCalledWith('/career-paths', {
        type: 'CAREER_PATH',
        displayValue: 'New Path',
      });
      expect(result).toEqual(pendingResponse);
    });

    it('calls POST /career-paths with discipline payload when provided', async () => {
      mockPost.mockResolvedValue({ data: pendingResponse });

      await careerPathService.addCareerPath({
        displayValue: 'New Path',
        discipline: { id: 'disc-1', source: 'MASTER' },
      });

      expect(mockPost).toHaveBeenCalledWith('/career-paths', {
        type: 'CAREER_PATH',
        displayValue: 'New Path',
        payload: {
          disciplineRefId: 'disc-1',
          disciplineSource: 'MASTER',
        },
      });
    });
  });

  // ── careerPathService.getAllCareerPaths (discipline filter) ────────────────

  describe('careerPathService.getAllCareerPaths', () => {
    it('includes disciplineId when provided', async () => {
      mockGet.mockResolvedValue({ data: pagedResponse([]) });

      await careerPathService.getAllCareerPaths('test', 'disc-1');

      expect(mockGet).toHaveBeenCalledWith('/career-paths', {
        params: { search: 'test', disciplineId: 'disc-1' },
      });
    });

    it('omits disciplineId when not provided', async () => {
      mockGet.mockResolvedValue({ data: pagedResponse([]) });

      await careerPathService.getAllCareerPaths('test');

      expect(mockGet).toHaveBeenCalledWith('/career-paths', {
        params: { search: 'test' },
      });
    });
  });

  // ── roleService ───────────────────────────────────────────────────────────

  describe('roleService', () => {
    describe('getAllRoles', () => {
      it('calls GET /job-roles with search and size', async () => {
        const mockData = pagedResponse<RoleItem>([
          { id: 'r1', label: 'Developer', source: 'MASTER' },
        ]);
        mockGet.mockResolvedValue({ data: mockData });

        const result = await roleService.getAllRoles('dev');

        expect(mockGet).toHaveBeenCalledWith('/job-roles', {
          params: { search: 'dev', size: 50 },
        });
        expect(result).toEqual(mockData);
      });

      it('includes careerPathId when provided', async () => {
        mockGet.mockResolvedValue({ data: pagedResponse([]) });

        await roleService.getAllRoles('', 'cp-1');

        expect(mockGet).toHaveBeenCalledWith('/job-roles', {
          params: { search: '', size: 50, careerPathId: 'cp-1' },
        });
      });

      it('includes levelId when provided', async () => {
        mockGet.mockResolvedValue({ data: pagedResponse([]) });

        await roleService.getAllRoles('', undefined, 'level-1');

        expect(mockGet).toHaveBeenCalledWith('/job-roles', {
          params: { search: '', size: 50, levelId: 'level-1' },
        });
      });

      it('includes both careerPathId and levelId when provided', async () => {
        mockGet.mockResolvedValue({ data: pagedResponse([]) });

        await roleService.getAllRoles('test', 'cp-1', 'level-1');

        expect(mockGet).toHaveBeenCalledWith('/job-roles', {
          params: {
            search: 'test',
            size: 50,
            careerPathId: 'cp-1',
            levelId: 'level-1',
          },
        });
      });
    });

    describe('addRole', () => {
      it('calls POST /job-roles without careerPath when not provided', async () => {
        mockPost.mockResolvedValue({ data: pendingResponse });

        const result = await roleService.addRole({
          displayValue: 'New Role',
        });

        expect(mockPost).toHaveBeenCalledWith('/job-roles', {
          type: 'JOB_ROLE',
          displayValue: 'New Role',
        });
        expect(result).toEqual(pendingResponse);
      });

      it('calls POST /job-roles with careerPath payload when provided', async () => {
        mockPost.mockResolvedValue({ data: pendingResponse });

        await roleService.addRole({
          displayValue: 'New Role',
          careerPath: { id: 'cp-1', source: 'MASTER' },
        });

        expect(mockPost).toHaveBeenCalledWith('/job-roles', {
          type: 'JOB_ROLE',
          displayValue: 'New Role',
          payload: {
            careerPathRefId: 'cp-1',
            careerPathSource: 'MASTER',
          },
        });
      });

      it('calls POST /job-roles with level payload when provided', async () => {
        mockPost.mockResolvedValue({ data: pendingResponse });

        await roleService.addRole({
          displayValue: 'Assistant',
          level: {
            id: 'e984a9f6-5150-4225-9433-9b4540f7cdc4',
            source: 'MASTER',
          },
        });

        expect(mockPost).toHaveBeenCalledWith('/job-roles', {
          type: 'JOB_ROLE',
          displayValue: 'Assistant',
          payload: {
            levelRefId: 'e984a9f6-5150-4225-9433-9b4540f7cdc4',
          },
        });
      });

      it('calls POST /job-roles with both careerPath and level payload when provided', async () => {
        mockPost.mockResolvedValue({ data: pendingResponse });

        await roleService.addRole({
          displayValue: 'Software Engineer',
          careerPath: {
            id: '10000000-0000-0000-0000-000000000001',
            source: 'MASTER',
          },
          level: {
            id: 'e984a9f6-5150-4225-9433-9b4540f7cdc4',
            source: 'MASTER',
          },
        });

        expect(mockPost).toHaveBeenCalledWith('/job-roles', {
          type: 'JOB_ROLE',
          displayValue: 'Software Engineer',
          payload: {
            careerPathRefId: '10000000-0000-0000-0000-000000000001',
            careerPathSource: 'MASTER',
            levelRefId: 'e984a9f6-5150-4225-9433-9b4540f7cdc4',
          },
        });
      });
    });
  });

  // ── jobTitleService ───────────────────────────────────────────────────────

  describe('jobTitleService', () => {
    describe('getAllJobTitles', () => {
      it('calls GET /job-titles with search and size params', async () => {
        const mockData = pagedResponse<JobTitleItem>([
          { id: 'jt1', label: 'Software Engineer', source: 'MASTER' },
        ]);
        mockGet.mockResolvedValue({ data: mockData });

        const result = await jobTitleService.getAllJobTitles('soft');

        expect(mockGet).toHaveBeenCalledWith('/job-titles', {
          params: { search: 'soft', size: 50 },
        });
        expect(result).toEqual(mockData);
      });

      it('uses empty string as default search', async () => {
        mockGet.mockResolvedValue({ data: pagedResponse([]) });

        await jobTitleService.getAllJobTitles();

        expect(mockGet).toHaveBeenCalledWith('/job-titles', {
          params: { search: '', size: 50 },
        });
      });
    });

    describe('addJobTitle', () => {
      it('calls POST /job-titles with correct payload', async () => {
        mockPost.mockResolvedValue({ data: pendingResponse });

        const result = await jobTitleService.addJobTitle('New Title');

        expect(mockPost).toHaveBeenCalledWith('/job-titles', {
          type: 'JOB_TITLE',
          displayValue: 'New Title',
        });
        expect(result).toEqual(pendingResponse);
      });
    });
  });

  // ── employmentTypeService ─────────────────────────────────────────────────

  describe('employmentTypeService', () => {
    it('calls GET /employment-types with search and size params', async () => {
      const mockData = pagedResponse<EmploymentTypeItem>([
        { id: 'et1', label: 'Full-time', source: 'MASTER' },
      ]);
      mockGet.mockResolvedValue({ data: mockData });

      const result = await employmentTypeService.getAllEmploymentTypes('full');

      expect(mockGet).toHaveBeenCalledWith('/employment-types', {
        params: { search: 'full', size: 50 },
      });
      expect(result).toEqual(mockData);
    });

    it('uses empty string as default search', async () => {
      mockGet.mockResolvedValue({ data: pagedResponse([]) });

      await employmentTypeService.getAllEmploymentTypes();

      expect(mockGet).toHaveBeenCalledWith('/employment-types', {
        params: { search: '', size: 50 },
      });
    });
  });

  // ── workScheduleService ───────────────────────────────────────────────────

  describe('workScheduleService', () => {
    it('calls GET /work-schedules with search and size params', async () => {
      const mockData = pagedResponse<WorkScheduleItem>([
        { id: 'ws1', label: 'Morning Shift', source: 'MASTER' },
      ]);
      mockGet.mockResolvedValue({ data: mockData });

      const result = await workScheduleService.getAllWorkSchedules('morn');

      expect(mockGet).toHaveBeenCalledWith('/work-schedules', {
        params: { search: 'morn', size: 50 },
      });
      expect(result).toEqual(mockData);
    });

    it('uses empty string as default search', async () => {
      mockGet.mockResolvedValue({ data: pagedResponse([]) });

      await workScheduleService.getAllWorkSchedules();

      expect(mockGet).toHaveBeenCalledWith('/work-schedules', {
        params: { search: '', size: 50 },
      });
    });
  });

  // ── engagementModelService ────────────────────────────────────────────────

  describe('engagementModelService', () => {
    it('calls GET /engagement-models with search and size params', async () => {
      const mockData = pagedResponse<EngagementModelItem>([
        { id: 'em1', label: 'Freelance', source: 'MASTER' },
      ]);
      mockGet.mockResolvedValue({ data: mockData });

      const result =
        await engagementModelService.getAllEngagementModels('free');

      expect(mockGet).toHaveBeenCalledWith('/engagement-models', {
        params: { search: 'free', size: 50 },
      });
      expect(result).toEqual(mockData);
    });

    it('uses empty string as default search', async () => {
      mockGet.mockResolvedValue({ data: pagedResponse([]) });

      await engagementModelService.getAllEngagementModels();

      expect(mockGet).toHaveBeenCalledWith('/engagement-models', {
        params: { search: '', size: 50 },
      });
    });
  });

  // ── jobLevelService ───────────────────────────────────────────────────────

  describe('jobLevelService', () => {
    it('calls GET /levels without params', async () => {
      const mockData: SingleRecordApiResponse<JobLevelItem[]> = {
        requestId: 'req-001',
        success: true,
        message: 'Success',
        data: [
          { id: 'l1', name: 'Junior' },
          { id: 'l2', name: 'Senior' },
        ],
      };
      mockGet.mockResolvedValue({ data: mockData });

      const result = await jobLevelService.getAllJobLevels();

      expect(mockGet).toHaveBeenCalledWith('/levels');
      expect(result).toEqual(mockData);
      expect(result.data).toHaveLength(2);
    });
  });
});
