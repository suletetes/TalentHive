import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { projectsService } from '@/services/api/projects.service';

interface ProjectFilters {
  status?: string;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  skills?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

interface CreateProjectDto {
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
  };
  requirements: string[];
}

interface UpdateProjectDto extends Partial<CreateProjectDto> {}

// Query keys for cache management
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: any) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  my: () => [...projectKeys.all, 'my'] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
  categories: () => [...projectKeys.all, 'categories'] as const,
};

// Fetch projects with filters
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => projectsService.getProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single project
export function useProject(id: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsService.getProjectById(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch my projects
export function useMyProjects() {
  return useQuery({
    queryKey: projectKeys.my(),
    queryFn: () => projectsService.getMyProjects(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch project categories
export function useProjectCategories() {
  return useQuery({
    queryKey: projectKeys.categories(),
    queryFn: () => projectsService.getProjectCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  });
}

// Fetch project stats
export function useProjectStats() {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: () => projectsService.getProjectStats(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Search projects
export function useSearchProjects(query: string, filters?: ProjectFilters) {
  return useQuery({
    queryKey: [...projectKeys.lists(), 'search', query, filters],
    queryFn: () => projectsService.searchProjects(query, filters),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

// Create project mutation
export function useCreateProject(options?: any) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDto) => projectsService.createProject(data),
    onSuccess: (response, variables, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.my() });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() });
      
      if (!options?.onSuccess) {
        toast.success('Project created successfully!');
      } else {
        options.onSuccess(response, variables, context);
      }
    },
    onError: options?.onError || ((error: any) => {
      const message = error.response?.data?.message || 'Failed to create project';
      toast.error(message);
    }),
  });
}

// Update project mutation with optimistic update
export function useUpdateProject(options?: any) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) => {
      // Clean the data before sending to API
      const cleanedData = { ...data };
      
      // Remove empty string organization field (optional field)
      if (cleanedData.organization === '' || cleanedData.organization === undefined) {
        delete cleanedData.organization;
      }
      
      return projectsService.updateProject(id, cleanedData);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      // Snapshot previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(projectKeys.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, ...data },
      }));

      return { previousProject };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(variables.id), context.previousProject);
      }
      
      if (options?.onError) {
        options.onError(error, variables, context);
      } else {
        const message = error.response?.data?.message || 'Failed to update project';
        toast.error(message);
      }
    },
    onSuccess: (response, variables, context) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.my() });
      
      if (!options?.onSuccess) {
        toast.success('Project updated successfully!');
      } else {
        options.onSuccess(response, variables, context);
      }
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsService.deleteProject(id),
    onSuccess: (response, id) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.my() });
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() });
      toast.success('Project deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete project';
      toast.error(message);
    },
  });
}

// Toggle project status mutation
export function useToggleProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsService.toggleProjectStatus(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.my() });
      toast.success('Project status updated!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update project status';
      toast.error(message);
    },
  });
}
