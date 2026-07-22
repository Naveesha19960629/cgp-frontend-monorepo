import { beforeEach, describe, expect, it, vi } from 'vitest';

import { projectService } from '@/views/vacancies/services/project.service';
import type {
  Project,
  ProjectApiData,
  ProjectEntry,
  ProjectRequirement,
  ProjectResponse,
} from '@/views/vacancies/types';

// -- Mock @cgp/data-access --------------------------------------------------

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

// -- Setup ------------------------------------------------------------------

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- createProjectRequirement -----------------------------------------------

  describe('projectService.createProjectRequirement', () => {
    it('returns empty content when dataTakenFromCandidate is true', () => {
      const content: ProjectEntry[] = [
        {
          relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
          organization: [{ source: 'MASTER', id: 'org-1' }],
          organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
          startDate: '2020-01-01',
          endDate: '2023-12-31',
        },
      ];

      const result = projectService.createProjectRequirement(
        true,
        true,
        content
      );

      expect(result).toEqual({
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: [], // Content should be empty
      });
    });

    it('includes content when dataTakenFromCandidate is false', () => {
      const content: ProjectEntry[] = [
        {
          relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
          organization: [{ source: 'MASTER', id: 'org-1' }],
          organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
          startDate: '2020-01-01',
          endDate: '2023-12-31',
        },
      ];

      const result = projectService.createProjectRequirement(
        true,
        false,
        content
      );

      expect(result).toEqual({
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: content, // Content should be included
      });
    });

    it('handles disabled state', () => {
      const result = projectService.createProjectRequirement(false, false, []);

      expect(result).toEqual({
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      });
    });

    it('returns empty content when dataTakenFromCandidate is true regardless of provided content', () => {
      const content: ProjectEntry[] = [
        {
          relatedIndustry: [{ source: 'PENDING', id: 'ind-2' }],
          organization: [{ source: 'PENDING', id: 'org-2' }],
          organizationLocations: [{ source: 'MASTER', id: 'loc-2' }],
          startDate: '2018-06-15',
          endDate: '2021-08-20',
        },
        {
          relatedIndustry: [{ source: 'MASTER', id: 'ind-3' }],
          organization: [{ source: 'MASTER', id: 'org-3' }],
          organizationLocations: [{ source: 'MASTER', id: 'loc-3' }],
          startDate: '2019-03-01',
          endDate: '2022-11-30',
        },
      ];

      const result = projectService.createProjectRequirement(
        true,
        true,
        content
      );

      expect(result.content).toEqual([]);
      expect(result.content).toHaveLength(0);
    });
  });

  // -- validateProjectRequirement ---------------------------------------------

  describe('projectService.validateProjectRequirement', () => {
    it('returns valid when isEnabled is false', () => {
      const requirement: ProjectRequirement = {
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns valid when dataTakenFromCandidate is true with empty content', () => {
      const requirement: ProjectRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: [],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when dataTakenFromCandidate is false with empty content', () => {
      const requirement: ProjectRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project content is required when not using candidate data'
      );
    });

    it('returns valid when content has all required fields', () => {
      const requirement: ProjectRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
            organization: [{ source: 'MASTER', id: 'org-1' }],
            organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
            startDate: '2020-01-01',
            endDate: '2023-12-31',
          },
        ],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when organization is missing', () => {
      const requirement: ProjectRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
            organization: [], // Empty
            organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
            startDate: '2020-01-01',
            endDate: '2023-12-31',
          },
        ],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project 1: Organization is required');
    });

    it('returns invalid when organizationLocations is missing', () => {
      const requirement: ProjectRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
            organization: [{ source: 'MASTER', id: 'org-1' }],
            organizationLocations: [], // Empty
            startDate: '2020-01-01',
            endDate: '2023-12-31',
          },
        ],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Project 1: Organization location is required'
      );
    });

    it('returns invalid when startDate is missing', () => {
      const requirement: ProjectRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
            organization: [{ source: 'MASTER', id: 'org-1' }],
            organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
            startDate: '', // Empty
            endDate: '2023-12-31',
          },
        ],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project 1: Start date is required');
    });

    it('returns invalid when endDate is missing', () => {
      const requirement: ProjectRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
            organization: [{ source: 'MASTER', id: 'org-1' }],
            organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
            startDate: '2020-01-01',
            endDate: '', // Empty
          },
        ],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project 1: End date is required');
    });

    it('returns multiple errors for multiple missing fields', () => {
      const requirement: ProjectRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
            organization: [], // Missing
            organizationLocations: [], // Missing
            startDate: '', // Missing
            endDate: '', // Missing
          },
        ],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('Project 1: Organization is required');
      expect(result.errors).toContain(
        'Project 1: Organization location is required'
      );
      expect(result.errors).toContain('Project 1: Start date is required');
      expect(result.errors).toContain('Project 1: End date is required');
    });

    it('validates multiple project entries correctly', () => {
      const requirement: ProjectRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
            organization: [{ source: 'MASTER', id: 'org-1' }],
            organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
            startDate: '2020-01-01',
            endDate: '2023-12-31',
          },
          {
            relatedIndustry: [{ source: 'MASTER', id: 'ind-2' }],
            organization: [], // Missing
            organizationLocations: [{ source: 'MASTER', id: 'loc-2' }],
            startDate: '2018-01-01',
            endDate: '', // Missing
          },
        ],
      };

      const result = projectService.validateProjectRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project 2: Organization is required');
      expect(result.errors).toContain('Project 2: End date is required');
    });
  });

  // -- getProjectsData --------------------------------------------------------

  describe('projectService.getProjectsData', () => {
    it('fetches projects for a user', async () => {
      const mockResponse: ProjectResponse<Project[]> = {
        message: [],
        statusCode: 200,
        data: [
          {
            id: 'proj-1',
            name: 'Project Alpha',
            organization: 'Tech Corp',
            organizationLocation: 'New York',
            location: 'New York',
            industry: 'Technology',
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            durationLabel: '4 years',
            description: 'A great project',
            skills: ['React', 'TypeScript'],
          },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await projectService.getProjectsData('user-123');

      expect(mockGet).toHaveBeenCalledWith('/candidates/user-123/projects');
      expect(result).toEqual(mockResponse);
    });

    it('handles empty project list', async () => {
      const mockResponse: ProjectResponse<Project[]> = {
        message: [],
        statusCode: 200,
        data: [],
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await projectService.getProjectsData('user-456');

      expect(result.data).toEqual([]);
    });

    it('maps backend response with projectId to id', async () => {
      const mockResponse = {
        message: [],
        statusCode: 200,
        data: [
          {
            projectId: 'backend-proj-1',
            projectName: 'Backend Project',
            organization: 'Company Inc',
            organizationLocation: 'London',
            industry: 'Finance',
            startDate: '2019-06-01',
            endDate: '2022-05-31',
            durationLabel: '3 years',
            description: 'Backend work',
            skills: ['Node.js', 'MongoDB'],
          },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await projectService.getProjectsData('user-789');

      expect(result.data[0].id).toBe('backend-proj-1');
      expect(result.data[0].name).toBe('Backend Project');
    });
  });

  // -- createProject ----------------------------------------------------------

  describe('projectService.createProject', () => {
    it('creates a new project', async () => {
      const projectData: ProjectApiData = {
        name: 'New Project',
        organization: 'Startup Inc',
        location: 'San Francisco',
        industry: 'Technology',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        description: 'A new project',
        skills: ['Vue', 'Python'],
      };

      const mockResponse: ProjectResponse<{ id: string; name: string }> = {
        message: ['Project created successfully'],
        statusCode: 201,
        data: { id: 'new-proj-123', name: 'New Project' },
      };

      mockPost.mockResolvedValue({ data: mockResponse });

      const result = await projectService.createProject(
        'user-123',
        projectData
      );

      expect(mockPost).toHaveBeenCalledWith(
        '/candidates/user-123/projects',
        projectData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // -- getProjectById ---------------------------------------------------------

  describe('projectService.getProjectById', () => {
    it('fetches a specific project by id', async () => {
      const mockResponse: ProjectResponse<ProjectApiData> = {
        message: [],
        statusCode: 200,
        data: {
          name: 'Specific Project',
          organization: 'Enterprise Corp',
          location: 'Chicago',
          industry: 'Healthcare',
          startDate: '2021-03-15',
          endDate: '2023-09-20',
          description: 'Healthcare project',
          skills: ['Angular', 'Java'],
        },
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await projectService.getProjectById(
        'user-123',
        'proj-456'
      );

      expect(mockGet).toHaveBeenCalledWith(
        '/candidates/user-123/projects/proj-456'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // -- updateProject ----------------------------------------------------------

  describe('projectService.updateProject', () => {
    it('updates an existing project', async () => {
      const projectData: ProjectApiData = {
        name: 'Updated Project',
        organization: 'Updated Corp',
        location: 'Boston',
        industry: 'Education',
        startDate: '2022-01-01',
        endDate: '2024-12-31',
        description: 'Updated description',
        skills: ['React', 'Node.js', 'GraphQL'],
      };

      const mockResponse: ProjectResponse<{ id: string; name: string }> = {
        message: ['Project updated successfully'],
        statusCode: 200,
        data: { id: 'proj-789', name: 'Updated Project' },
      };

      mockPut.mockResolvedValue({ data: mockResponse });

      const result = await projectService.updateProject(
        'user-123',
        'proj-789',
        projectData
      );

      expect(mockPut).toHaveBeenCalledWith(
        '/candidates/user-123/projects/proj-789',
        projectData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // -- deleteProject ----------------------------------------------------------

  describe('projectService.deleteProject', () => {
    it('deletes a project', async () => {
      const mockResponse: ProjectResponse<void> = {
        message: ['Project deleted successfully'],
        statusCode: 200,
        data: undefined,
      };

      mockDelete.mockResolvedValue({ data: mockResponse });

      const result = await projectService.deleteProject('user-123', 'proj-999');

      expect(mockDelete).toHaveBeenCalledWith(
        '/candidates/user-123/projects/proj-999'
      );
      expect(result).toEqual(mockResponse);
    });
  });
}); // end: projectService
