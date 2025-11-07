import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TimeTracker from '@/components/timeTracking/TimeTracker';
import TimeEntryList from '@/components/timeTracking/TimeEntryList';
import TimeReport from '@/components/timeTracking/TimeReport';
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
        _id: '123',
        email: 'freelancer@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'freelancer',
      },
      token: 'mock-token',
      isAuthenticated: true,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('TimeTracker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render time tracker', () => {
    renderWithProviders(<TimeTracker />);
    expect(screen.getByText('Time Tracker')).toBeInTheDocument();
    expect(screen.getByText('Start Tracking')).toBeInTheDocument();
  });

  it('should display timer in correct format', () => {
    renderWithProviders(<TimeTracker />);
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it('should start tracking when button clicked', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { data: { projects: [{ _id: '1', title: 'Test Project' }] } },
    });
    (api.get as any).mockResolvedValueOnce({
      data: { data: { contracts: [{ _id: '1', title: 'Test Contract' }] } },
    });
    (api.post as any).mockResolvedValueOnce({
      data: { data: { session: { _id: '1', status: 'active' } } },
    });

    renderWithProviders(<TimeTracker />);

    await waitFor(() => {
      expect(screen.getByLabelText('Project')).toBeInTheDocument();
    });

    // Select project and contract
    const projectSelect = screen.getByLabelText('Project');
    const contractSelect = screen.getByLabelText('Contract');
    
    fireEvent.change(projectSelect, { target: { value: '1' } });
    fireEvent.change(contractSelect, { target: { value: '1' } });

    const startButton = screen.getByText('Start Tracking');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/time-tracking/sessions/start', {
        projectId: '1',
        contractId: '1',
      });
    });
  });

  it('should stop tracking and save entry', async () => {
    (api.get as any).mockResolvedValue({
      data: { data: { projects: [], contracts: [] } },
    });
    (api.post as any).mockResolvedValueOnce({
      data: { data: { session: { _id: '1', status: 'active' } } },
    });
    (api.patch as any).mockResolvedValueOnce({
      data: { data: { session: { _id: '1', status: 'completed' } } },
    });
    (api.post as any).mockResolvedValueOnce({
      data: { data: { timeEntry: { _id: '1' } } },
    });

    renderWithProviders(<TimeTracker projectId="1" contractId="1" />);

    // Start tracking first
    const startButton = screen.getByText('Start Tracking');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Stop & Save')).toBeInTheDocument();
    });

    // Stop tracking
    const stopButton = screen.getByText('Stop & Save');
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith('/time-tracking/entries', expect.any(Object));
    });
  });
});

describe('TimeEntryList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render time entry list', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          timeEntries: [
            {
              _id: '1',
              startTime: new Date().toISOString(),
              project: { title: 'Test Project' },
              description: 'Working on feature',
              duration: 3600,
              billableAmount: 50,
              status: 'approved',
            },
          ],
        },
      },
    });

    renderWithProviders(<TimeEntryList />);

    await waitFor(() => {
      expect(screen.getByText('Time Entries')).toBeInTheDocument();
      expect(screen.getByText('Working on feature')).toBeInTheDocument();
    });
  });

  it('should submit selected entries', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          timeEntries: [
            {
              _id: '1',
              startTime: new Date().toISOString(),
              project: { title: 'Test Project' },
              description: 'Entry 1',
              duration: 3600,
              billableAmount: 50,
              status: 'stopped',
            },
          ],
        },
      },
    });
    (api.post as any).mockResolvedValueOnce({
      data: { status: 'success' },
    });

    renderWithProviders(<TimeEntryList />);

    await waitFor(() => {
      expect(screen.getByText('Entry 1')).toBeInTheDocument();
    });

    // Select entry
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Submit
    const submitButton = screen.getByText(/Submit Selected/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/time-tracking/entries/submit', {
        entryIds: ['1'],
      });
    });
  });
});

describe('TimeReport Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render time report', () => {
    renderWithProviders(<TimeReport />);
    expect(screen.getByText('Time Report')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('should generate report', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          report: {
            entriesCount: 2,
            totalHours: 3,
            totalAmount: 150,
            entries: [
              {
                _id: '1',
                startTime: new Date().toISOString(),
                project: { title: 'Project 1' },
                description: 'Entry 1',
                duration: 3600,
                billableAmount: 50,
              },
              {
                _id: '2',
                startTime: new Date().toISOString(),
                project: { title: 'Project 2' },
                description: 'Entry 2',
                duration: 7200,
                billableAmount: 100,
              },
            ],
          },
        },
      },
    });

    renderWithProviders(<TimeReport />);

    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    const generateButton = screen.getByText('Generate Report');

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/time-tracking/reports', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
      expect(screen.getByText('2')).toBeInTheDocument(); // entries count
      expect(screen.getByText('3.00')).toBeInTheDocument(); // total hours
      expect(screen.getByText('$150.00')).toBeInTheDocument(); // total amount
    });
  });

  it('should export report to CSV', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          report: {
            entriesCount: 1,
            totalHours: 1,
            totalAmount: 50,
            entries: [
              {
                _id: '1',
                startTime: new Date().toISOString(),
                project: { title: 'Test Project' },
                description: 'Test entry',
                duration: 3600,
                billableAmount: 50,
              },
            ],
          },
        },
      },
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();

    renderWithProviders(<TimeReport />);

    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    const generateButton = screen.getByText('Generate Report');

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
