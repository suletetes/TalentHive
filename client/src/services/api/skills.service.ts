import { apiCore } from './core';
import { dataExtractor } from '@/utils/dataExtractor';

export interface Skill {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  isActive: boolean;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillsResponse {
  skills: Skill[];
  total: number;
}

export class SkillsService {
  private basePath = '/skills';

  async getSkills(): Promise<{ data: Skill[] }> {
    console.log('[SKILLS SERVICE] Fetching skills...');
    const response = await apiCore.get<any>(this.basePath);
    console.log('[SKILLS SERVICE] Raw response:', response);

    // Use robust data extraction with multiple fallback paths
    const skills = dataExtractor.extractArray<Skill>(response, [
      'skills', 'data.skills', 'data', 'items', 'data.items'
    ]);

    console.log('[SKILLS SERVICE] Extracted skills:', skills.length);
    return { data: skills };
  }

  async getSkillsByCategory(category: string): Promise<{ data: Skill[] }> {
    const response = await apiCore.get<any>(`${this.basePath}/category/${category}`);
    const skills = dataExtractor.extractArray<Skill>(response, [
      'skills', 'data.skills', 'data'
    ]);
    return { data: skills };
  }

  async searchSkills(query: string): Promise<{ data: Skill[] }> {
    const response = await apiCore.get<any>(`${this.basePath}/search?q=${encodeURIComponent(query)}`);
    const skills = dataExtractor.extractArray<Skill>(response, [
      'skills', 'data.skills', 'data', 'results', 'data.results'
    ]);
    return { data: skills };
  }

  async getPopularSkills(limit: number = 50): Promise<{ data: Skill[] }> {
    const response = await apiCore.get<any>(`${this.basePath}/popular?limit=${limit}`);
    const skills = dataExtractor.extractArray<Skill>(response, [
      'skills', 'data.skills', 'data'
    ]);
    return { data: skills };
  }

  async createSkill(skillData: Partial<Skill>): Promise<{ data: Skill }> {
    const response = await apiCore.post<any>(this.basePath, skillData);
    const skill = dataExtractor.extractObject<Skill>(response, [
      'skill', 'data.skill', 'data'
    ]);
    
    if (!skill) {
      throw new Error('Failed to create skill');
    }
    
    return { data: skill };
  }

  async updateSkill(id: string, skillData: Partial<Skill>): Promise<{ data: Skill }> {
    const response = await apiCore.put<any>(`${this.basePath}/${id}`, skillData);
    const skill = dataExtractor.extractObject<Skill>(response, [
      'skill', 'data.skill', 'data'
    ]);
    
    if (!skill) {
      throw new Error('Failed to update skill');
    }
    
    return { data: skill };
  }

  async deleteSkill(id: string): Promise<{ message: string }> {
    const response = await apiCore.delete<any>(`${this.basePath}/${id}`);
    return { message: response.message || 'Skill deleted successfully' };
  }
}

export const skillsService = new SkillsService();