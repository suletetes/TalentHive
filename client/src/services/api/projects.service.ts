import { apiCore } from './core';
import { 
  Project, 
  CreateProjectDto, 
  UpdateProjectDto, 
  ProjectFilters,
  ProjectStats 
} from '@/types/project';
import { PaginatedResponse, ApiResponse } from '@/types/common';
import { ApiResponseHandler } from '@/utils/apiResponseHandler';

export class ProjectsService {
  private basePath = '/projects';

  async getProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await apiCore.getRaw<any>(`${this.basePath}?${params.toString()}`);
    return ApiResponseHandler.extractPaginatedData<Project>(response.data);
  }

  async getProjectById(id: string): Promise<Project> {
    return apiCore.get<Project>(`${this.basePath}/${id}`);
  }

  async createProject(data: CreateProjectDto): Promise<Project> {
    return apiCore.post<Project>(this.basePath, data);
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    return apiCore.put<Project>(`${this.basePath}/${id}`, data);
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/${id}`);
  }

  async getMyProjects(): Promise<Project[]> {
    const response = await apiCore.getRaw<any>(`${this.basePath}/my/projects`);
    const paginatedData = ApiResponseHandler.extractPaginatedData<Project>(response.data);
    return paginatedData.data;
  }

  async searchProjects(
    query: string,
    filters?: ProjectFilters
  ): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await apiCore.getRaw<any>(`${this.basePath}/search?${params.toString()}`);
    return ApiResponseHandler.extractPaginatedData<Project>(response.data);
  }

  async toggleProjectStatus(id: string): Promise<Project> {
    return apiCore.patch<Project>(`${this.basePath}/${id}/status`, {});
  }

  async getProjectStats(): Promise<ProjectStats> {
    return apiCore.get<ProjectStats>(`${this.basePath}/my/stats`);
  }

  async getProjectCategories(): Promise<string[]> {
    return apiCore.get<string[]>(`${this.basePath}/categories`);
  }

  async toggleProposalAcceptance(id: string): Promise<Project> {
    return apiCore.post<Project>(`${this.basePath}/${id}/toggle-proposals`, {});
  }
}

export const projectsService = new ProjectsService();
