import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { timeTrackingService, CreateTimeEntryDto } from '@/services/api';

export const timeTrackingKeys = {
  all: ['timeTracking'] as const,
  entries: (params?: any) => [...timeTrackingKeys.all, 'entries', params] as const,
  active: () => [...timeTrackingKeys.all, 'active'] as const,
  reports: (params: any) => [...timeTrackingKeys.all, 'reports', params] as const,
};

export function useTimeEntries(params?: {
  project?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: timeTrackingKeys.entries(params),
    queryFn: () => timeTrackingService.getTimeEntries(params),
    staleTime: 1 * 60 * 1000,
  });
}

export function useActiveTimer() {
  return useQuery({
    queryKey: timeTrackingKeys.active(),
    queryFn: () => timeTrackingService.getActiveTimer(),
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  });
}

export function useTimeReports(params: {
  startDate: string;
  endDate: string;
  project?: string;
}) {
  return useQuery({
    queryKey: timeTrackingKeys.reports(params),
    queryFn: () => timeTrackingService.getTimeReports(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimeEntryDto) => timeTrackingService.startTimeEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.entries() });
      toast.success('Timer started!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start timer');
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => timeTrackingService.stopTimeEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.entries() });
      toast.success('Timer stopped!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to stop timer');
    },
  });
}

export function useCreateManualEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      project: string;
      contract?: string;
      description: string;
      startTime: Date;
      endTime: Date;
    }) => timeTrackingService.createManualEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.entries() });
      toast.success('Time entry created!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create time entry');
    },
  });
}

export function useUploadScreenshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, file }: { entryId: string; file: File }) =>
      timeTrackingService.uploadScreenshot(entryId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.entries() });
      toast.success('Screenshot uploaded!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload screenshot');
    },
  });
}
