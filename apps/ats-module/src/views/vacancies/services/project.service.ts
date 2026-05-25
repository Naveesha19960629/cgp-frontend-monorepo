import type {
  Project,
  ProjectApiData,
  ProjectEntry,
  ProjectRequirement,
  ProjectResponse,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const projectService = {
  // For vacancy form - create/update project requirements
  createProjectRequirement: (
    isEnabled: boolean,
    dataTakenFromCandidate: boolean,
    content: ProjectEntry[]
  ): ProjectRequirement => {
    // If dataTakenFromCandidate is true, content should be empty
    // because data will be pulled from candidate's profile
    return {
      isEnabled,
      dataTakenFromCandidate,
      content: dataTakenFromCandidate ? [] : content,
    };
  },

  // Validate project requirement before submission
  validateProjectRequirement: (
    requirement: ProjectRequirement
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!requirement.isEnabled) {
      return { isValid: true, errors: [] };
    }

    // If data is not taken from candidate, content must have entries
    if (
      !requirement.dataTakenFromCandidate &&
      requirement.content.length === 0
    ) {
      errors.push('Project content is required when not using candidate data');
    }

    // Validate each project entry
    requirement.content.forEach((entry, index) => {
      if (entry.organization.length === 0) {
        errors.push(`Project ${index + 1}: Organization is required`);
      }
      if (entry.organizationLocations.length === 0) {
        errors.push(`Project ${index + 1}: Organization location is required`);
      }
      if (!entry.startDate) {
        errors.push(`Project ${index + 1}: Start date is required`);
      }
      if (!entry.endDate) {
        errors.push(`Project ${index + 1}: End date is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  getProjectsData: async (
    userId: string
  ): Promise<ProjectResponse<Project[]>> => {
    const response = await httpClient.get<
      | ProjectResponse<Project[]>
      | {
          data?: {
            items?: {
              content?: Array<
                Project & {
                  projectId?: string;
                  projectName?: string;
                  organizationLocation?: string | null;
                  durationLabel?: string;
                  skills?: {
                    visibleToEveryone?: {
                      Expert?: Array<{ skillLabel?: string; rating?: number }>;
                      Competent?: Array<{
                        skillLabel?: string;
                        rating?: number;
                      }>;
                      Intermediate?: Array<{
                        skillLabel?: string;
                        rating?: number;
                      }>;
                      Beginner?: Array<{
                        skillLabel?: string;
                        rating?: number;
                      }>;
                    };
                    hiddenFromPublic?: unknown;
                  };
                }
              >;
            };
          };
          message?: string[];
          statusCode?: number;
        }
    >(`/candidates/${userId}/projects`);

    const raw = response.data;

    const backendItemsSource =
      (raw as ProjectResponse<Project[]>)?.data ??
      (raw as { data?: { items?: { content?: Project[] } } })?.data;

    const backendItems = Array.isArray(backendItemsSource)
      ? backendItemsSource
      : ((backendItemsSource as { items?: { content?: Project[] } })?.items
          ?.content ?? []);

    const mapped: Project[] = Array.isArray(backendItems)
      ? backendItems.map(item => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyItem = item as any;
          return {
            id: anyItem.projectId ?? anyItem.id,
            name: anyItem.projectName ?? anyItem.name,
            organization: anyItem.organization ?? '',
            organizationLocation:
              anyItem.organizationLocation ?? anyItem.location ?? '',
            location: anyItem.organizationLocation ?? anyItem.location ?? '',
            industry: anyItem.industry ?? '',
            startDate: anyItem.startDate ?? '',
            endDate: anyItem.endDate ?? '',
            durationLabel: anyItem.durationLabel ?? '',
            description: anyItem.description ?? '',
            skills: Array.isArray(anyItem.skills)
              ? (anyItem.skills as string[])
              : (anyItem.skills ?? []),
          };
        })
      : [];

    return {
      message: (raw as ProjectResponse<Project[]>)?.message ?? [],
      statusCode: (raw as ProjectResponse<Project[]>)?.statusCode ?? 200,
      data: mapped,
    };
  },

  createProject: async (
    userId: string,
    data: ProjectApiData
  ): Promise<ProjectResponse<{ id: string; name: string }>> => {
    const response = await httpClient.post<
      ProjectResponse<{ id: string; name: string }>
    >(`/candidates/${userId}/projects`, data);
    return response.data;
  },

  getProjectById: async (
    userId: string,
    projectId: string
  ): Promise<ProjectResponse<ProjectApiData>> => {
    const response = await httpClient.get<ProjectResponse<ProjectApiData>>(
      `/candidates/${userId}/projects/${projectId}`
    );
    return response.data;
  },

  updateProject: async (
    userId: string,
    projectId: string,
    data: ProjectApiData
  ): Promise<ProjectResponse<{ id: string; name: string }>> => {
    const response = await httpClient.put<
      ProjectResponse<{ id: string; name: string }>
    >(`/candidates/${userId}/projects/${projectId}`, data);
    return response.data;
  },

  deleteProject: async (
    userId: string,
    projectId: string
  ): Promise<ProjectResponse<void>> => {
    const response = await httpClient.delete<ProjectResponse<void>>(
      `/candidates/${userId}/projects/${projectId}`
    );
    return response.data;
  },
};
