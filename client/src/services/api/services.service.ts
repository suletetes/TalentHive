import { apiCore } from './core';

export interface ServicePackage {
  _id: string;
  freelancer: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: number;
  revisions: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface CreateServicePackageDto {
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: number;
  revisions: number;
  features: string[];
}

export interface ProjectTemplate {
  _id: string;
  name: string;
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
}

export class ServicesService {
  private basePath = '/services';

  async createPackage(data: CreateServicePackageDto): Promise<{ data: ServicePackage }> {
    return apiCore.post<{ data: ServicePackage }>(`${this.basePath}/packages`, data);
  }

  async getPackages(params?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ data: ServicePackage[] }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get<{ data: ServicePackage[] }>(
      `${this.basePath}/packages?${queryParams.toString()}`
    );
  }

  async getPackage(id: string): Promise<{ data: ServicePackage }> {
    return apiCore.get<{ data: ServicePackage }>(`${this.basePath}/packages/${id}`);
  }

  async updatePackage(
    id: string,
    data: Partial<CreateServicePackageDto>
  ): Promise<{ data: ServicePackage }> {
    return apiCore.put<{ data: ServicePackage }>(`${this.basePath}/packages/${id}`, data);
  }

  async deletePackage(id: string): Promise<{ message: string }> {
    return apiCore.delete<{ message: string }>(`${this.basePath}/packages/${id}`);
  }

  async purchasePackage(id: string): Promise<{ data: any }> {
    return apiCore.post<{ data: any }>(`${this.basePath}/packages/${id}/order`);
  }

  async orderPackage(id: string, data?: { requirements?: string; message?: string }): Promise<{ data: any }> {
    return apiCore.post<{ data: any }>(`${this.basePath}/packages/${id}/order`, data || {});
  }

  async getPackageStats(): Promise<{ data: any }> {
    return apiCore.get<{ data: any }>(`${this.basePath}/packages/stats`);
  }

  async createTemplate(data: Omit<ProjectTemplate, '_id'>): Promise<{ data: ProjectTemplate }> {
    return apiCore.post<{ data: ProjectTemplate }>(`${this.basePath}/templates`, data);
  }

  async getTemplates(): Promise<{ data: ProjectTemplate[] }> {
    return apiCore.get<{ data: ProjectTemplate[] }>(`${this.basePath}/templates`);
  }
}

export const servicesService = new ServicesService();
