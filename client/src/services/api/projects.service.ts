import { apiCore } from './core';

export interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    type: 'fixed' | 'hourly';
    min: number;
    max: number;
    currency: string;
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
    startDate?: Date;
    endDate?: Date;
  };
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  client: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  requirements: string[];
  attachments: string[];
  proposalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDto {
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    type: 'fixed' | 'hourly';
    min: number;
    max: number;
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
  };
  requirements: string[];
  attachments?: string[];
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ProjectFilters {
  category?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: 'fixed' | 'hourly';
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

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

    const response = await apiCore.get<{ status: string; data: { projects: Project[]; pagination: any } }>(
      `${this.basePath}?${params.toString()}`
    );
    
    // Transform API response to expected format
    return {
      data: response.data.projects,
      pagination: response.data.pagination,
    };
  }

  async getProjectById(id: string): Promise<{ data: Project }> {
    const response = await apiCore.get<{ status: string; data: { project: Project } }>(`${this.basePath}/${id}`);
    return { data: response.data.project };
  }

  async createProject(data: CreateProjectDto): Promise<{ data: Project }> {
    const response = await apiCore.post<{ status: string; data: { project: Project } }>(this.basePath, data);
    return { data: response.data.project };
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<{ data: Project }> {
    const response = await apiCore.put<{ status: string; data: { project: Project } }>(`${this.basePath}/${id}`, data);
    return { data: response.data.project };
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/${id}`);
  }

  async getMyProjects(): Promise<{ data: Project[] }> {
    const response = await apiCore.get<{ status: string; data: { projects: Project[]; pagination: any } }>(`${this.basePath}/my/projects`);
    return { data: response.data.projects };
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

    return apiCore.get<PaginatedResponse<Project>>(
      `${this.basePath}/search?${params.toString()}`
    );
  }

  async toggleProjectStatus(id: string): Promise<{ data: Project }> {
    const response = await apiCore.patch<{ status: string; data: { project: Project } }>(`${this.basePath}/${id}/status`);
    return { data: response.data.project };
  }

  async getProjectStats(): Promise<{ data: any }> {
    return apiCore.get<{ data: any }>(`${this.basePath}/my/stats`);
  }

  async getProjectCategories(): Promise<{ data: string[] }> {
    return apiCore.get<{ data: string[] }>(`${this.basePath}/categories`);
  }
}

export const projectsService = new ProjectsService();
