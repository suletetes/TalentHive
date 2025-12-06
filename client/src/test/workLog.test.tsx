import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
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
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>{component}</BrowserRouter>
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
    expect(screen.getByText('Log Work Hours')).toBeInTheDocument();
    expect(screen.getByText('Save Work Log')).toBeInTheDocument();
  });

  it('should show warning when no active contracts', () => {
    renderWithProviders(<WorkLogForm contracts={[]} />);
    expect(screen.getByText(/No active contracts found/)).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText('Select Contract'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Start Time'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('End Time'), { target: { value: '12:00' } });

    fireEvent.click(screen.getByText('Save Work Log'));

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
