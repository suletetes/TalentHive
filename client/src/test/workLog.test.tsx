import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkLogForm from '@/components/workLog/WorkLogForm';
import WorkLogList from '@/components/workLog/WorkLogList';
import WorkLogReport from '@/components/workLog/WorkLogReport';
import authReducer from '@/store/slices/authSlice';
import api from '@/services/api';

vi.mock('@/services/api');

const mockStore = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      user: {
        id: '123',
        email: 'freelancer@test.com',
        role: 'freelancer' as const,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        isVerified: true,
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={mockStore}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

describe('WorkLogForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render work log form', () => {
    const contracts = [{ _id: '1', title: 'Test Contract', status: 'active' }];
    renderWithProviders(<WorkLogForm contracts={contracts} />);
    
    const logWorkText = screen.queryByText('Log Work Hours') || 
                       screen.queryByText(/log.*work/i) ||
                       screen.queryByRole('heading', { name: /work/i });
    expect(logWorkText).toBeInTheDocument();
    
    const saveButton = screen.queryByText('Save Work Log') ||
                      screen.queryByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('should show warning when no active contracts', () => {
    renderWithProviders(<WorkLogForm contracts={[]} />);
    
    const warningText = screen.queryByText(/No active contracts found/i) ||
                       screen.queryByText(/no.*contracts/i) ||
                       screen.queryByText(/contracts.*found/i);
    expect(warningText).toBeInTheDocument();
  });

  it('should create work log when form submitted', async () => {
    const contracts = [{ _id: '1', title: 'Test Contract', status: 'active' }];
    (api.post as any).mockResolvedValueOnce({
      data: { data: { workLog: { _id: 'log1' } } },
    });
    (api.patch as any).mockResolvedValueOnce({
      data: { data: { workLog: { _id: 'log1', status: 'completed' } } },
    });

    renderWithProviders(<WorkLogForm contracts={contracts} />);

    // Fill form
    const contractSelect = screen.queryByLabelText('Select Contract') ||
                          screen.queryByLabelText(/contract/i) ||
                          screen.queryByRole('combobox');
    fireEvent.change(contractSelect, { target: { value: '1' } });
    
    const startTimeInput = screen.queryByLabelText('Start Time') ||
                          screen.queryByLabelText(/start/i);
    fireEvent.change(startTimeInput, { target: { value: '09:00' } });
    
    const endTimeInput = screen.queryByLabelText('End Time') ||
                        screen.queryByLabelText(/end/i);
    fireEvent.change(endTimeInput, { target: { value: '12:00' } });

    const saveButton = screen.queryByText('Save Work Log') ||
                      screen.queryByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/work-logs', expect.any(Object));
    });
  });
});

describe('WorkLogList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render work log list', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          workLogs: [
            {
              _id: '1',
              date: new Date().toISOString(),
              contract: { title: 'Test Contract' },
              startTime: '09:00',
              endTime: '12:00',
              duration: 180,
              description: 'Working on feature',
              status: 'completed',
            },
          ],
        },
      },
    });

    renderWithProviders(<WorkLogList />);

    await waitFor(() => {
      expect(screen.getByText('Work Logs')).toBeInTheDocument();
      expect(screen.getByText('Working on feature')).toBeInTheDocument();
    });
  });
});

describe('WorkLogReport Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render work log report', () => {
    renderWithProviders(<WorkLogReport />);
    expect(screen.getByText('Work Log Report')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('should generate report', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          report: {
            totalEntries: 2,
            totalHours: 5,
            workLogs: [
              {
                _id: '1',
                date: new Date().toISOString(),
                contract: { title: 'Project 1' },
                startTime: '09:00',
                endTime: '12:00',
                duration: 180,
                description: 'Entry 1',
              },
            ],
          },
        },
      },
    });

    renderWithProviders(<WorkLogReport />);

    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2024-01-31' } });
    fireEvent.click(screen.getByText('Generate Report'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/work-logs/report', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
    });
  });
});
