import { apiCore } from './core';
import { dataExtractor, extractProjects, extractProject, COMMON_PATHS } from '@/utils/dataExtractor';

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
  organization?: {
    _id: string;
    name: string;
    logo?: string;
    budget?: {
      total: number;
      spent: number;
      remaining: number;
    };
  };
  requirements: string[];
  attachments: string[];
  proposalCount: number;
  proposals?: Array<{
    _id: string;
    status: string;
    freelancer: any;
    [key: string]: any;
  }>;
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
  organization?: string;
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
  search?: string;
  sortBy?: string;
  sortOrder?: string;
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

    console.log('[PROJECTS SERVICE] ========== FETCHING PROJECTS ==========');
    console.log('[PROJECTS SERVICE] Query params:', params.toString());
    
    const response = await apiCore.get<any>(`${this.basePath}?${params.toString()}`);
    console.log('[PROJECTS SERVICE] Raw API response:', response);
    console.log('[PROJECTS SERVICE] Response structure:', {
      hasStatus: !!response?.status,
      hasData: !!response?.data,
      hasProjects: !!response?.data?.projects,
      projectsLength: Array.isArray(response?.data?.projects) ? response.data.projects.length : 'not array',
      responseKeys: Object.keys(response || {}),
      dataKeys: response?.data ? Object.keys(response.data) : 'no data',
    });
    
    // Use robust data extraction with multiple fallback paths
    const projects = extractProjects<Project>(response);
    
    // Extract pagination info
    let pagination = response?.data?.pagination || response?.pagination || {
      page: 1,
      limit: 12,
      total: projects.length,
      pages: Math.ceil(projects.length / 12),
    };

    console.log('[PROJECTS SERVICE] Extracted projects:', projects.length);
    console.log('[PROJECTS SERVICE] Pagination:', pagination);
    console.log('[PROJECTS SERVICE] ========== END FETCH ==========');
    
    return {
      data: projects,
      pagination,
    };
  }

  async getProjectById(id: string): Promise<{ data: Project }> {
    console.log('[PROJECTS SERVICE] ========== FETCHING PROJECT BY ID ==========');
    console.log('[PROJECTS SERVICE] Project ID:', id);
    
    const response = await apiCore.get<any>(`${this.basePath}/${id}`);
    console.log('[PROJECTS SERVICE] Raw project response:', response);
    console.log('[PROJECTS SERVICE] Response structure:', {
      hasStatus: !!response?.status,
      hasData: !!response?.data,
      hasProject: !!response?.data?.project,
      responseKeys: Object.keys(response || {}),
      dataKeys: response?.data ? Object.keys(response.data) : 'no data',
    });
    
    const project = extractProject<Project>(response);
    console.log('[PROJECTS SERVICE] Extracted project:', project);
    console.log('[PROJECTS SERVICE] Project title:', project?.title);
    console.log('[PROJECTS SERVICE] ========== END FETCH PROJECT ==========');
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    return { data: project };
  }

  async createProject(data: CreateProjectDto): Promise<{ data: Project }> {
    const response = await apiCore.post<any>(this.basePath, data);
    const project = extractProject<Project>(response);
    
    if (!project) {
      throw new Error('Failed to create project');
    }
    
    return { data: project };
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<{ data: Project }> {
    const response = await apiCore.put<any>(`${this.basePath}/${id}`, data);
    const project = extractProject<Project>(response);
    
    if (!project) {
      throw new Error('Failed to update project');
    }
    
    return { data: project };
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/${id}`);
  }

  async getMyProjects(): Promise<{ data: Project[] }> {
    console.log('[PROJECTS SERVICE] Fetching my projects...');
    const response = await apiCore.get<any>(`${this.basePath}/my/projects`);
    console.log('[PROJECTS SERVICE] My projects response:', response);
    
    const projects = extractProjects<Project>(response);
    console.log('[PROJECTS SERVICE] Extracted my projects:', projects.length);
    
    return { data: projects };
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

    const response = await apiCore.get<any>(`${this.basePath}/search?${params.toString()}`);
    const projects = extractProjects<Project>(response);
    
    // Extract pagination info
    let pagination = response?.data?.pagination || response?.pagination || {
      page: 1,
      limit: 12,
      total: projects.length,
      pages: Math.ceil(projects.length / 12),
    };

    return {
      data: projects,
      pagination,
    };
  }

  async toggleProjectStatus(id: string): Promise<{ data: Project }> {
    const response = await apiCore.patch<any>(`${this.basePath}/${id}/status`);
    const project = extractProject<Project>(response);
    
    if (!project) {
      throw new Error('Failed to toggle project status');
    }
    
    return { data: project };
  }

  async getProjectStats(): Promise<{ data: any }> {
    const response = await apiCore.get<any>(`${this.basePath}/my/stats`);
    return { data: dataExtractor.extractObject(response, ['data', 'stats']) || response };
  }

  async getProjectCategories(): Promise<{ data: string[] }> {
    const response = await apiCore.get<any>(`${this.basePath}/categories`);
    const categories = dataExtractor.extractArray(response, ['data', 'categories', 'data.categories']);
    return { data: categories };
  }

  async toggleProposalAcceptance(id: string): Promise<{ data: Project }> {
    const response = await apiCore.post<any>(`${this.basePath}/${id}/toggle-proposals`);
    const project = extractProject<Project>(response);
    
    if (!project) {
      throw new Error('Failed to toggle proposal acceptance');
    }
    
    return { data: project };
  }
}

export const projectsService = new ProjectsService();
