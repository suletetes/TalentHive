import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// Helper function to create proper Axios response mock
const createMockResponse = (data: any): AxiosResponse => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

import { ProposalForm } from '../components/proposals/ProposalForm';
import { ProposalCard } from '../components/proposals/ProposalCard';
import { ProposalList } from '../components/proposals/ProposalList';
import { ProposalDetailModal } from '../components/proposals/ProposalDetailModal';
import { theme } from '../theme';
import { apiService } from '../services/api';

// Mock dependencies
jest.mock('../services/api');
jest.mock('react-hot-toast');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const store = configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }) => state,
    },
  });

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

// Mock data
const mockProject = {
  _id: 'project-1',
  title: 'Test Project',
  budget: {
    type: 'fixed' as const,
    min: 1000,
    max: 2000,
  },
  timeline: {
    duration: 2,
    unit: 'weeks' as const,
  },
};

const mockProposal = {
  _id: 'proposal-1',
  coverLetter: 'I am very interested in this project and have the required skills to complete it successfully.',
  bidAmount: 1500,
  timeline: {
    duration: 10,
    unit: 'days' as const,
  },
  status: 'submitted' as const,
  submittedAt: '2024-01-15T10:00:00Z',
  freelancer: {
    _id: 'freelancer-1',
    profile: {
      firstName: 'Jane',
      lastName: 'Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    rating: 4.5,
    freelancerProfile: {
      title: 'Full Stack Developer',
      hourlyRate: 50,
      completedProjects: 15,
    },
  },
  project: mockProject,
  milestones: [
    {
      title: 'Initial Setup',
      description: 'Set up project structure',
      amount: 500,
      dueDate: '2024-01-22T00:00:00Z',
    },
    {
      title: 'Feature Development',
      description: 'Implement main features',
      amount: 1000,
      dueDate: '2024-01-29T00:00:00Z',
    },
  ],
};

describe('ProposalForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders proposal form correctly', () => {
    render(
      <TestWrapper>
        <ProposalForm project={mockProject} />
      </TestWrapper>
    );

    expect(screen.getByText('Submit Proposal')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Cover Letter')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Bid')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration')).toBeInTheDocument();
  });

  it('validates cover letter length', async () => {
    render(
      <TestWrapper>
        <ProposalForm project={mockProject} />
      </TestWrapper>
    );

    const coverLetterInput = screen.getByLabelText('Cover Letter');
    const submitButton = screen.getByText('Submit Proposal');

    // Enter short cover letter
    fireEvent.change(coverLetterInput, { target: { value: 'Too short' } });
    fireEvent.blur(coverLetterInput);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Cover letter must be at least 50 characters')).toBeInTheDocument();
    });
  });

  it('submits proposal successfully', async () => {
    mockApiService.post.mockResolvedValueOnce(
      createMockResponse({ status: 'success', data: { proposal: mockProposal } })
    );

    const onSuccess = jest.fn();

    render(
      <TestWrapper>
        <ProposalForm project={mockProject} onSuccess={onSuccess} />
      </TestWrapper>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Cover Letter'), {
      target: { value: 'I am very interested in this project and have the required skills to complete it successfully. I have extensive experience in web development.' },
    });
    fireEvent.change(screen.getByLabelText('Your Bid'), {
      target: { value: '1500' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Submit Proposal'));

    await waitFor(() => {
      expect(mockApiService.post).toHaveBeenCalledWith(
        `/proposals/project/${mockProject._id}`,
        expect.objectContaining({
          coverLetter: expect.any(String),
          bidAmount: 1500,
          timeline: expect.any(Object),
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Proposal submitted successfully!');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('adds and removes milestones', () => {
    render(
      <TestWrapper>
        <ProposalForm project={mockProject} />
      </TestWrapper>
    );

    // Add milestone
    fireEvent.change(screen.getByLabelText('Milestone Title'), {
      target: { value: 'Test Milestone' },
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '500' },
    });
    fireEvent.change(screen.getByLabelText('Milestone Description'), {
      target: { value: 'Test milestone description' },
    });

    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByText('Test Milestone')).toBeInTheDocument();
    expect(screen.getByText('Test milestone description')).toBeInTheDocument();

    // Remove milestone
    fireEvent.click(screen.getByTestId('DeleteIcon'));

    expect(screen.queryByText('Test Milestone')).not.toBeInTheDocument();
  });
});

describe('ProposalCard', () => {
  it('renders proposal card for client view', () => {
    render(
      <TestWrapper>
        <ProposalCard proposal={mockProposal} viewMode="client" />
      </TestWrapper>
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
    expect(screen.getByText('$1500')).toBeInTheDocument();
    expect(screen.getByText('10 days')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('renders proposal card for freelancer view', () => {
    render(
      <TestWrapper>
        <ProposalCard proposal={mockProposal} viewMode="freelancer" />
      </TestWrapper>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Budget: $1000 - $2000')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('shows milestones preview', () => {
    render(
      <TestWrapper>
        <ProposalCard proposal={mockProposal} viewMode="client" />
      </TestWrapper>
    );

    expect(screen.getByText('2 milestones')).toBeInTheDocument();
    expect(screen.getByText('Initial Setup - $500')).toBeInTheDocument();
    expect(screen.getByText('Feature Development - $1000')).toBeInTheDocument();
  });

  it('calls action handlers', () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();

    render(
      <TestWrapper>
        <ProposalCard 
          proposal={mockProposal} 
          viewMode="client" 
          onAccept={onAccept}
          onReject={onReject}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Accept'));
    expect(onAccept).toHaveBeenCalledWith('proposal-1');

    fireEvent.click(screen.getByText('Reject'));
    expect(onReject).toHaveBeenCalledWith('proposal-1');
  });
});

describe('ProposalList', () => {
  beforeEach(() => {
    mockApiService.get.mockResolvedValue(
      createMockResponse({
        status: 'success',
        data: {
          proposals: [mockProposal],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            pages: 1,
          },
        },
      })
    );
  });

  it('renders proposal list for client', async () => {
    render(
      <TestWrapper>
        <ProposalList projectId="project-1" viewMode="client" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Project Proposals')).toBeInTheDocument();
      expect(screen.getByText('1 proposal found')).toBeInTheDocument();
    });
  });

  it('renders proposal list for freelancer', async () => {
    render(
      <TestWrapper>
        <ProposalList viewMode="freelancer" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('My Proposals')).toBeInTheDocument();
    });
  });

  it('filters proposals by status', async () => {
    render(
      <TestWrapper>
        <ProposalList viewMode="client" projectId="project-1" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'submitted' },
    });

    await waitFor(() => {
      expect(mockApiService.get).toHaveBeenCalledWith(
        expect.stringContaining('status=submitted')
      );
    });
  });

  it('searches proposals', async () => {
    render(
      <TestWrapper>
        <ProposalList viewMode="client" projectId="project-1" />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search proposals...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    await waitFor(() => {
      expect(mockApiService.get).toHaveBeenCalledWith(
        expect.stringContaining('search=test%20search')
      );
    });
  });
});

describe('ProposalDetailModal', () => {
  it('renders proposal details', () => {
    render(
      <TestWrapper>
        <ProposalDetailModal
          open={true}
          onClose={jest.fn()}
          proposal={mockProposal}
          viewMode="client"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Proposal Details')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('$1500')).toBeInTheDocument();
    expect(screen.getByText('10 days')).toBeInTheDocument();
    expect(screen.getByText('Cover Letter')).toBeInTheDocument();
  });

  it('shows milestones accordion', () => {
    render(
      <TestWrapper>
        <ProposalDetailModal
          open={true}
          onClose={jest.fn()}
          proposal={mockProposal}
          viewMode="client"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Project Milestones (2)')).toBeInTheDocument();
    
    // Expand accordion
    fireEvent.click(screen.getByText('Project Milestones (2)'));
    
    expect(screen.getByText('Initial Setup')).toBeInTheDocument();
    expect(screen.getByText('Feature Development')).toBeInTheDocument();
  });

  it('handles proposal acceptance', async () => {
    mockApiService.post.mockResolvedValueOnce(
      createMockResponse({ status: 'success', data: { proposal: { ...mockProposal, status: 'accepted' } } })
    );

    const onAction = jest.fn();

    render(
      <TestWrapper>
        <ProposalDetailModal
          open={true}
          onClose={jest.fn()}
          proposal={mockProposal}
          viewMode="client"
          onAction={onAction}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Accept Proposal'));

    // Should show feedback form
    expect(screen.getByText('Acceptance Message (Optional):')).toBeInTheDocument();

    // Add feedback and submit
    fireEvent.change(screen.getByPlaceholderText(/Provide feedback/), {
      target: { value: 'Great proposal!' },
    });
    fireEvent.click(screen.getByText('Accept Proposal'));

    await waitFor(() => {
      expect(mockApiService.post).toHaveBeenCalledWith(
        `/proposals/${mockProposal._id}/accept`,
        { clientFeedback: 'Great proposal!' }
      );
      expect(mockToast.success).toHaveBeenCalledWith('Proposal accepted successfully!');
      expect(onAction).toHaveBeenCalledWith('accept');
    });
  });

  it('handles proposal withdrawal', async () => {
    mockApiService.delete.mockResolvedValueOnce(
      createMockResponse({ status: 'success' })
    );

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    const onAction = jest.fn();

    render(
      <TestWrapper>
        <ProposalDetailModal
          open={true}
          onClose={jest.fn()}
          proposal={mockProposal}
          viewMode="freelancer"
          onAction={onAction}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Withdraw Proposal'));

    await waitFor(() => {
      expect(mockApiService.delete).toHaveBeenCalledWith(`/proposals/${mockProposal._id}`);
      expect(mockToast.success).toHaveBeenCalledWith('Proposal withdrawn successfully');
      expect(onAction).toHaveBeenCalledWith('withdraw');
    });

    // Restore window.confirm
    window.confirm = originalConfirm;
  });
});