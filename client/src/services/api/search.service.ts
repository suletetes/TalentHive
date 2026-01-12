import { apiCore } from './core';

export interface SearchResult {
  type: 'project' | 'freelancer' | 'service';
  data: any;
  score: number;
}

export interface SearchFilters {
  type?: 'project' | 'freelancer' | 'service';
  category?: string;
  skills?: string[];
  minBudget?: number;
  maxBudget?: number;
  location?: string;
}

export class SearchService {
  private basePath = '/search';

  async search(
    query: string,
    filters?: SearchFilters
  ): Promise<{ data: SearchResult[]; total: number }> {
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
    return apiCore.get<{ data: SearchResult[]; total: number }>(
      `${this.basePath}?${params.toString()}`
    );
  }

  async advancedSearch(filters: SearchFilters): Promise<{ data: SearchResult[]; total: number }> {
    return apiCore.post<{ data: SearchResult[]; total: number }>(
      `${this.basePath}/advanced`,
      filters
    );
  }

  async getSearchSuggestions(query: string): Promise<{ data: string[] }> {
    return apiCore.get<{ data: string[] }>(
      `${this.basePath}/suggestions?q=${encodeURIComponent(query)}`
    );
  }
}

export const searchService = new SearchService();
