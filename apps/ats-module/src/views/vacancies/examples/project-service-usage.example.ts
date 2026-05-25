// Example usage of the projectService
import { projectService } from '@/views/vacancies/services';
import type { ProjectApiData } from '@/views/vacancies/types';

// Example: Fetch all projects for a user
export async function fetchUserProjects(userId: string) {
  try {
    const response = await projectService.getProjectsData(userId);
    console.log('Projects:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

// Example: Create a new project
export async function createNewProject(userId: string) {
  const projectData: ProjectApiData = {
    name: 'New Project',
    organization: 'Tech Corp',
    location: 'New York',
    industry: 'Technology',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    description: 'A sample project description',
    skills: ['React', 'TypeScript', 'Node.js'],
  };

  try {
    const response = await projectService.createProject(userId, projectData);
    console.log('Created project:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

// Example: Get a specific project
export async function getProject(userId: string, projectId: string) {
  try {
    const response = await projectService.getProjectById(userId, projectId);
    console.log('Project details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

// Example: Update a project
export async function updateExistingProject(userId: string, projectId: string) {
  const updatedData: ProjectApiData = {
    name: 'Updated Project Name',
    organization: 'Tech Corp',
    location: 'San Francisco',
    industry: 'Technology',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    description: 'Updated project description',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
  };

  try {
    const response = await projectService.updateProject(
      userId,
      projectId,
      updatedData
    );
    console.log('Updated project:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

// Example: Delete a project
export async function deleteExistingProject(userId: string, projectId: string) {
  try {
    await projectService.deleteProject(userId, projectId);
    console.log('Project deleted successfully');
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}
