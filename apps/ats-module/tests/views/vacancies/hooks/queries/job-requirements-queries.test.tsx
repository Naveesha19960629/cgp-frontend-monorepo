import { useCareerPathsQuery } from '@/views/vacancies/hooks/queries/use-career-paths-query';
import { useDisciplinesQuery } from '@/views/vacancies/hooks/queries/use-disciplines-query';
import { useEmploymentTypesQuery } from '@/views/vacancies/hooks/queries/use-employment-types-query';
import { useEngagementModelsQuery } from '@/views/vacancies/hooks/queries/use-engagement-models-query';
import { useJobLevelsQuery } from '@/views/vacancies/hooks/queries/use-job-levels-query';
import { useJobTitlesQuery } from '@/views/vacancies/hooks/queries/use-job-titles-query';
import { useRolesQuery } from '@/views/vacancies/hooks/queries/use-roles-query';
import { useWorkSchedulesQuery } from '@/views/vacancies/hooks/queries/use-work-schedules-query';

// -- Mock @tanstack/react-query -------------------------------------------

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options) as unknown,
}));

// -- Mock services ----------------------------------------------------------

const mockGetDisciplines = vi.fn();
const mockGetCareerPaths = vi.fn();
const mockGetRoles = vi.fn();
const mockGetJobTitles = vi.fn();
const mockGetEmploymentTypes = vi.fn();
const mockGetWorkSchedules = vi.fn();
const mockGetEngagementModels = vi.fn();
const mockGetJobLevels = vi.fn();

vi.mock('@/views/vacancies/services', () => ({
  disciplineService: {
    getAllDisciplines: (...args: unknown[]) =>
      mockGetDisciplines(...args) as unknown,
  },
  careerPathService: {
    getAllCareerPaths: (...args: unknown[]) =>
      mockGetCareerPaths(...args) as unknown,
  },
  roleService: {
    getAllRoles: (...args: unknown[]) => mockGetRoles(...args) as unknown,
  },
  jobTitleService: {
    getAllJobTitles: (...args: unknown[]) =>
      mockGetJobTitles(...args) as unknown,
  },
  employmentTypeService: {
    getAllEmploymentTypes: (...args: unknown[]) =>
      mockGetEmploymentTypes(...args) as unknown,
  },
  workScheduleService: {
    getAllWorkSchedules: (...args: unknown[]) =>
      mockGetWorkSchedules(...args) as unknown,
  },
  engagementModelService: {
    getAllEngagementModels: (...args: unknown[]) =>
      mockGetEngagementModels(...args) as unknown,
  },
  jobLevelService: {
    getAllJobLevels: (...args: unknown[]) =>
      mockGetJobLevels(...args) as unknown,
  },
}));

// Need a separate mock for career-path since it's imported via '@/views/vacancies'
vi.mock('@/views/vacancies', () => ({
  careerPathService: {
    getAllCareerPaths: (...args: unknown[]) =>
      mockGetCareerPaths(...args) as unknown,
  },
}));

// -- Setup ------------------------------------------------------------------

describe('job requirement query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  // -- useDisciplinesQuery ----------------------------------------------------

  describe('useDisciplinesQuery', () => {
    it('passes correct queryKey with search', () => {
      useDisciplinesQuery('eng');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['disciplines', 'eng'] })
      );
    });

    it('defaults search to empty string', () => {
      useDisciplinesQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['disciplines', ''] })
      );
    });

    it('queryFn calls disciplineService.getAllDisciplines', async () => {
      mockGetDisciplines.mockResolvedValue({ data: {} });
      useDisciplinesQuery('test');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetDisciplines).toHaveBeenCalledWith('test');
    });
  });

  // -- useCareerPathsQuery ----------------------------------------------------

  describe('useCareerPathsQuery', () => {
    it('passes correct queryKey with search and disciplineId', () => {
      useCareerPathsQuery('test', 'disc-1');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['career-paths', 'test', 'disc-1'],
        })
      );
    });

    it('uses empty string for missing disciplineId in queryKey', () => {
      useCareerPathsQuery('test');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['career-paths', 'test', ''],
        })
      );
    });

    it('passes enabled flag', () => {
      useCareerPathsQuery('', undefined, false);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      );
    });

    it('queryFn calls careerPathService.getAllCareerPaths', async () => {
      mockGetCareerPaths.mockResolvedValue({ data: {} });
      useCareerPathsQuery('test', 'disc-1');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetCareerPaths).toHaveBeenCalledWith('test', 'disc-1');
    });
  });

  // -- useRolesQuery ----------------------------------------------------------

  describe('useRolesQuery', () => {
    it('passes correct queryKey with all params', () => {
      useRolesQuery('dev', 'cp-1', 'level-1');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['job-roles', 'dev', 'cp-1', 'level-1'],
        })
      );
    });

    it('uses empty strings for missing optional params in queryKey', () => {
      useRolesQuery('dev');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['job-roles', 'dev', '', ''],
        })
      );
    });

    it('passes enabled flag', () => {
      useRolesQuery('', undefined, undefined, false);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false })
      );
    });

    it('queryFn calls roleService.getAllRoles with all params', async () => {
      mockGetRoles.mockResolvedValue({ data: {} });
      useRolesQuery('dev', 'cp-1', 'level-1');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetRoles).toHaveBeenCalledWith('dev', 'cp-1', 'level-1');
    });
  });

  // -- useJobTitlesQuery ------------------------------------------------------

  describe('useJobTitlesQuery', () => {
    it('passes correct queryKey with search', () => {
      useJobTitlesQuery('soft');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['job-titles', 'soft'] })
      );
    });

    it('defaults search to empty string', () => {
      useJobTitlesQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['job-titles', ''] })
      );
    });

    it('queryFn calls jobTitleService.getAllJobTitles', async () => {
      mockGetJobTitles.mockResolvedValue({ data: {} });
      useJobTitlesQuery('test');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetJobTitles).toHaveBeenCalledWith('test');
    });
  });

  // -- useEmploymentTypesQuery ------------------------------------------------

  describe('useEmploymentTypesQuery', () => {
    it('passes correct queryKey with search', () => {
      useEmploymentTypesQuery('full');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['employment-types', 'full'] })
      );
    });

    it('defaults search to empty string', () => {
      useEmploymentTypesQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['employment-types', ''] })
      );
    });

    it('queryFn calls employmentTypeService.getAllEmploymentTypes', async () => {
      mockGetEmploymentTypes.mockResolvedValue({ data: {} });
      useEmploymentTypesQuery('test');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetEmploymentTypes).toHaveBeenCalledWith('test');
    });
  });

  // -- useWorkSchedulesQuery --------------------------------------------------

  describe('useWorkSchedulesQuery', () => {
    it('passes correct queryKey with search', () => {
      useWorkSchedulesQuery('morn');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['work-schedules', 'morn'] })
      );
    });

    it('defaults search to empty string', () => {
      useWorkSchedulesQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['work-schedules', ''] })
      );
    });

    it('queryFn calls workScheduleService.getAllWorkSchedules', async () => {
      mockGetWorkSchedules.mockResolvedValue({ data: {} });
      useWorkSchedulesQuery('test');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetWorkSchedules).toHaveBeenCalledWith('test');
    });
  });

  // -- useEngagementModelsQuery -----------------------------------------------

  describe('useEngagementModelsQuery', () => {
    it('passes correct queryKey with search', () => {
      useEngagementModelsQuery('free');
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['engagement-models', 'free'] })
      );
    });

    it('defaults search to empty string', () => {
      useEngagementModelsQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['engagement-models', ''] })
      );
    });

    it('queryFn calls engagementModelService.getAllEngagementModels', async () => {
      mockGetEngagementModels.mockResolvedValue({ data: {} });
      useEngagementModelsQuery('test');
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetEngagementModels).toHaveBeenCalledWith('test');
    });
  });

  // -- useJobLevelsQuery ------------------------------------------------------

  describe('useJobLevelsQuery', () => {
    it('passes correct queryKey', () => {
      useJobLevelsQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['levels'] })
      );
    });

    it('sets staleTime to Infinity', () => {
      useJobLevelsQuery();
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({ staleTime: Infinity })
      );
    });

    it('queryFn calls jobLevelService.getAllJobLevels', async () => {
      mockGetJobLevels.mockResolvedValue({ data: [] });
      useJobLevelsQuery();
      const { queryFn } = mockUseQuery.mock.calls[0][0] as {
        queryFn: () => Promise<unknown>;
      };
      await queryFn();
      expect(mockGetJobLevels).toHaveBeenCalledTimes(1);
    });
  });
}); // end: job requirement query hooks
