// API service for project operations
import { GameProject } from './types';

const API_BASE_URL = 'http://localhost:3001/api';

class ProjectAPI {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async createProject(projectData: Partial<GameProject>): Promise<GameProject> {
    console.log('🚀 Creating project via API:', projectData.title);
    
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        title: projectData.title,
        description: projectData.description,
        prompt: projectData.prompt,
        status: this.mapFrontendStatusToBackend(projectData.status || 'concept'),
        progress: projectData.progress || 0,
        thumbnail: projectData.thumbnail,
        storyContent: projectData.story,
        assetsContent: projectData.assets,
        gameplayContent: projectData.gameplay,
        qaContent: projectData.qa,
        publishingContent: projectData.publishing,
        pipelineStages: projectData.pipeline,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error:', response.status, errorData);
      throw new Error(errorData.message || `Failed to create project: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Project created successfully:', result.data.id);
    
    // Convert backend project to frontend format
    return this.transformBackendProject(result.data);
  }

  async updateProject(id: string, projectData: Partial<GameProject>): Promise<GameProject> {
    console.log('📝 Updating project via API:', id);
    
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        title: projectData.title,
        description: projectData.description,
        prompt: projectData.prompt,
        status: this.mapFrontendStatusToBackend(projectData.status || 'concept'),
        progress: projectData.progress || 0,
        thumbnail: projectData.thumbnail,
        storyContent: projectData.story,
        assetsContent: projectData.assets,
        gameplayContent: projectData.gameplay,
        qaContent: projectData.qa,
        publishingContent: projectData.publishing,
        pipelineStages: projectData.pipeline,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update project: ${response.status}`);
    }

    const result = await response.json();
    return this.transformBackendProject(result.data);
  }

  async getUserProjects(): Promise<GameProject[]> {
    console.log('📋 Fetching user projects from API');
    
    const response = await fetch(`${API_BASE_URL}/projects/my-projects`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Fetched ${result.data.length} projects from API`);
    
    return result.data.map((project: any) => this.transformBackendProject(project));
  }

  async deleteProject(id: string): Promise<void> {
    console.log('🗑️ Deleting project via API:', id);
    
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.status}`);
    }

    console.log('✅ Project deleted successfully');
  }

  private mapFrontendStatusToBackend(status: string): string {
    const statusMap: Record<string, string> = {
      'concept': 'DRAFT',
      'development': 'IN_PROGRESS',
      'testing': 'IN_PROGRESS',
      'complete': 'COMPLETED',
      'archived': 'ARCHIVED'
    };
    return statusMap[status] || 'DRAFT';
  }

  private mapBackendStatusToFrontend(status: string): 'concept' | 'development' | 'testing' | 'complete' {
    const statusMap: Record<string, 'concept' | 'development' | 'testing' | 'complete'> = {
      'DRAFT': 'concept',
      'IN_PROGRESS': 'development',
      'COMPLETED': 'complete',
      'ARCHIVED': 'complete'
    };
    return statusMap[status] || 'concept';
  }

  private transformBackendProject(backendProject: any): GameProject {
    return {
      id: backendProject.id,
      title: backendProject.title,
      description: backendProject.description || '',
      prompt: backendProject.prompt || '',
      status: this.mapBackendStatusToFrontend(backendProject.status),
      progress: backendProject.progress || 0,
      createdAt: backendProject.createdAt,
      updatedAt: backendProject.updatedAt,
      thumbnail: backendProject.thumbnail,
      pipeline: backendProject.pipelineStages || [],
      story: backendProject.storyContent,
      assets: backendProject.assetsContent,
      gameplay: backendProject.gameplayContent,
      qa: backendProject.qaContent,
      publishing: backendProject.publishingContent,
    };
  }
}

export const projectAPI = new ProjectAPI();
