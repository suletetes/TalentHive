import { apiCore } from './core';

export interface TimeEntry {
  _id: string;
  user: string;
  project: string;
  contract?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  isManual: boolean;
  screenshots?: string[];
  createdAt: Date;
}

export interface CreateTimeEntryDto {
  project: string;
  contract?: string;
  description: string;
}

export interface TimeReport {
  totalHours: number;
  entries: TimeEntry[];
  breakdown: {
    project: string;
    hours: number;
  }[];
}

export class TimeTrackingService {
  private basePath = '/time-tracking';

  async startTimeEntry(data: CreateTimeEntryDto): Promise<{ data: TimeEntry }> {
    return apiCore.post<{ data: TimeEntry }>(`${this.basePath}/entries`, data);
  }

  async stopTimeEntry(entryId: string): Promise<{ data: TimeEntry }> {
    return apiCore.patch<{ data: TimeEntry }>(`${this.basePath}/entries/${entryId}/stop`);
  }

  async getTimeEntries(params?: {
    project?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: TimeEntry[] }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    return apiCore.get<{ data: TimeEntry[] }>(
      `${this.basePath}/entries?${queryParams.toString()}`
    );
  }

  async getActiveTimer(): Promise<{ data: TimeEntry | null }> {
    return apiCore.get<{ data: TimeEntry | null }>(`${this.basePath}/entries/active`);
  }

  async createManualEntry(data: {
    project: string;
    contract?: string;
    description: string;
    startTime: Date;
    endTime: Date;
  }): Promise<{ data: TimeEntry }> {
    return apiCore.post<{ data: TimeEntry }>(`${this.basePath}/entries/manual`, data);
  }

  async getTimeReports(params: {
    startDate: string;
    endDate: string;
    project?: string;
  }): Promise<{ data: TimeReport }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    return apiCore.get<{ data: TimeReport }>(
      `${this.basePath}/reports?${queryParams.toString()}`
    );
  }

  async uploadScreenshot(entryId: string, file: File): Promise<{ data: { url: string } }> {
    const formData = new FormData();
    formData.append('screenshot', file);
    return apiCore.post<{ data: { url: string } }>(
      `${this.basePath}/entries/${entryId}/screenshots`,
      formData
    );
  }
}

export const timeTrackingService = new TimeTrackingService();
