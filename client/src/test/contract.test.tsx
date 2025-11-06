import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

import { ContractCard } from '../components/contracts/ContractCard';
import { ContractForm } from '../components/contracts/ContractForm';
import { MilestoneManager } from '../components/contracts/MilestoneManager';
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
const mockContract = {
  _id: 'contract-1',
  title: 'Web Development Contract',
  totalAmount: 2000,
  currency: 'USD',
  startDate: '2024-01-15T00:00:00Z',
  endDate: '2024-02-15T00:00:00Z',
  status: 'active' as const,
  progress: 50,
  totalPaid: 1000,
  remainingAmount: 1000,
  client: {
    _id: 'client-1',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
  },
  freelancer: {
    _id: 'freelancer-1',
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
      avatar: 'https://example.com/avatar2.jpg',
    },
    freelancerProfile: {
      title: 'Full Stack Developer',
    },
    rating: 4.8,
  },
  project: {
    title: 'E-commerce Website',
  },
  milestones: [
    {
      _id: 'milestone-1',
      title: 'Frontend Development',
      status: 'approved',
      dueDate: '2024-01-30T00:00:00Z',
      amount: 1000,
    },
    {
      _id: 'milestone-2',
      title: 'Backend Development',
      status: 'in_progress',
      dueDate: '2024-02-15T00:00:00Z',
      amount: 1000,
    },
  ],
  nextMilestone: {
    _id: 'milestone-2',
    title: 'Backend Development',
    dueDate: '2024-02-15T00:00:00Z',
  },
  overdueMilestones: [],
  signatures: [
    {
      signedBy: 'client-1',
      signedAt: '2024-01-15T10:00:00Z',
    },
    {
      signedBy: 'freelancer-1',
      signedAt: '2024-01-15T11:00:00Z',
    },
  ],
};

const mockProposal = {
  _id: 'proposal-1',
  project: {
    title: 'E-commerce Website',
  },
  freelancer: {
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
    },
  },
  bidAmount: 2000,
  timeline: {
    duration: 4,
    unit: 'weeks' as const,
  },
  milestones: [
    {
      title: 'Frontend Development',
      description: 'Build responsive frontend',
      amount: 1000,
      dueDate: '2024-01-30T00:00:00Z',
    },
    {
      title: 'Backend Development',
      description: 'Develop API and database',
      amount: 1000,
      dueDate: '2024-02-15T00:00:00Z',
    },
  ],
};

describe('ContractCard', () => {
  it('renders contract card for client view', () => {
    render(
      <TestWrapper>
        <ContractCard contract={mockContract} viewMode="client" />
      </TestWrapper>
    );

    expect(screen.getByText('Web Development Contract')).toBeInTheDocument();
    expect(screen.getByText('E-commerce Website')).toBeInTheDocument();
    expect(screen.getByText('Freelancer: Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('$2000 USD')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders contract card for freelancer view', () => {
    render(
      <TestWrapper>
        <ContractCard contract={mockContract} viewMode="freelancer" />
      </TestWrapper>
    );

    expect(screen.getByText('Client: John Doe')).toBeInTheDocument();
  });

  it('shows progress bar for active contracts', () => {
    render(
      <TestWrapper>
        <ContractCard contract={mockContract} viewMode="client" />
      </TestWrapper>
    );

    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Paid: $1000')).toBeInTheDocument();
    expect(screen.getByText('Remaining: $1000')).toBeInTheDocument();
  });

  it('shows next milestone information', () => {
    render(
      <TestWrapper>
        <ContractCard contract={mockContract} viewMode="client" />
      </TestWrapper>
    );

    expect(screen.getByText('Next: Backend Development')).toBeInTheDocument();
  });

  it('shows signature status for draft contracts', () => {
    const draftContract = {
      ...mockContract,
      status: 'draft' as const,
      signatures: [
        {
          signedBy: 'client-1',
          signedAt: '2024-01-15T10:00:00Z',
        },
      ],
    };

    render(
      <TestWrapper>
        <ContractCard contract={draftContract} viewMode="client" />
      </TestWrapper>
    );

    expect(screen.getByText('Signatures (1/2)')).toBeInTheDocument();
    expect(screen.getByText('Client ✓')).toBeInTheDocument();
    expect(screen.getByText('Freelancer ○')).toBeInTheDocument();
  });

  it('calls action handlers', () => {
    const onView = jest.fn();
    const onSign = jest.fn();

    const draftContract = {
      ...mockContract,
      status: 'draft' as const,
      signatures: [],
    };

    render(
      <TestWrapper>
        <ContractCard 
          contract={draftContract} 
          viewMode="client" 
          onView={onView}
          onSign={onSign}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('View Details'));
    expect(onView).toHaveBeenCalledWith('contract-1');

    fireEvent.click(screen.getByText('Sign Contract'));
    expect(onSign).toHaveBeenCalledWith('contract-1');
  });
});

describe('ContractForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders contract form with proposal data', () => {
    render(
      <TestWrapper>
        <ContractForm proposal={mockProposal} />
      </TestWrapper>
    );

    expect(screen.getByText('Create Contract')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Contract for E-commerce Website')).toBeInTheDocument();
    expect(screen.getByText('Creating contract for proposal from Jane Smith')).toBeInTheDocument();
  });

  it('navigates through form steps', () => {
    render(
      <TestWrapper>
        <ContractForm proposal={mockProposal} />
      </TestWrapper>
    );

    // Should start at step 0
    expect(screen.getByText('Contract Basic Information')).toBeInTheDocument();

    // Click Next to go to milestones
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Project Milestones')).toBeInTheDocument();

    // Click Next to go to terms
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();

    // Click Next to go to review
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Contract Review')).toBeInTheDocument();

    // Click Back
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    render(
      <TestWrapper>
        <ContractForm proposal={mockProposal} />
      </TestWrapper>
    );

    // Clear title and try to proceed
    const titleInput = screen.getByLabelText('Contract Title');
    fireEvent.change(titleInput, { target: { value: '' } });
    fireEvent.blur(titleInput);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('manages milestones', () => {
    render(
      <TestWrapper>
        <ContractForm proposal={mockProposal} />
      </TestWrapper>
    );

    // Navigate to milestones step
    fireEvent.click(screen.getByText('Next'));

    // Should show existing milestones from proposal
    expect(screen.getByDisplayValue('Frontend Development')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Backend Development')).toBeInTheDocument();

    // Add new milestone
    fireEvent.click(screen.getByText('Add Milestone'));
    expect(screen.getByText('Milestone 3')).toBeInTheDocument();
  });

  it('submits contract successfully', async () => {
    mockApiService.post.mockResolvedValueOnce({
      data: { status: 'success', data: { contract: mockContract } },
    });

    const onSuccess = jest.fn();

    render(
      <TestWrapper>
        <ContractForm proposal={mockProposal} onSuccess={onSuccess} />
      </TestWrapper>
    );

    // Navigate to final step
    fireEvent.click(screen.getByText('Next')); // Milestones
    fireEvent.click(screen.getByText('Next')); // Terms
    fireEvent.click(screen.getByText('Next')); // Review

    // Submit contract
    fireEvent.click(screen.getByText('Create Contract'));

    await waitFor(() => {
      expect(mockApiService.post).toHaveBeenCalledWith(
        `/contracts/proposal/${mockProposal._id}`,
        expect.objectContaining({
          title: expect.any(String),
          description: expect.any(String),
          startDate: expect.any(String),
          endDate: expect.any(String),
          terms: expect.any(Object),
          customMilestones: expect.any(Array),
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Contract created successfully!');
      expect(onSuccess).toHaveBeenCalledWith(mockContract);
    });
  });
});

describe('MilestoneManager', () => {
  const mockContractWithMilestones = {
    ...mockContract,
    milestones: [
      {
        _id: 'milestone-1',
        title: 'Frontend Development',
        description: 'Build responsive frontend',
        amount: 1000,
        dueDate: '2024-01-30T00:00:00Z',
        status: 'approved' as const,
        submittedAt: '2024-01-28T00:00:00Z',
        approvedAt: '2024-01-29T00:00:00Z',
        clientFeedback: 'Great work!',
        deliverables: [
          {
            _id: 'deliverable-1',
            title: 'Frontend Code',
            description: 'React application',
            type: 'file' as const,
            content: 'https://github.com/repo',
            status: 'approved',
            submittedAt: '2024-01-28T00:00:00Z',
          },
        ],
      },
      {
        _id: 'milestone-2',
        title: 'Backend Development',
        description: 'Develop API and database',
        amount: 1000,
        dueDate: '2024-02-15T00:00:00Z',
        status: 'in_progress' as const,
        deliverables: [],
      },
    ],
  };

  it('renders milestone manager with progress', () => {
    render(
      <TestWrapper>
        <MilestoneManager contract={mockContractWithMilestones} userRole="freelancer" />
      </TestWrapper>
    );

    expect(screen.getByText('Project Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 milestones completed')).toBeInTheDocument();
  });

  it('shows milestone details', () => {
    render(
      <TestWrapper>
        <MilestoneManager contract={mockContractWithMilestones} userRole="freelancer" />
      </TestWrapper>
    );

    expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    expect(screen.getByText('Backend Development')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
  });

  it('shows submit button for freelancer on eligible milestones', () => {
    render(
      <TestWrapper>
        <MilestoneManager contract={mockContractWithMilestones} userRole="freelancer" />
      </TestWrapper>
    );

    // Should show submit button for in_progress milestone
    const submitButtons = screen.getAllByText('Submit Milestone');
    expect(submitButtons).toHaveLength(1);
  });

  it('shows approve/reject buttons for client on submitted milestones', () => {
    const contractWithSubmittedMilestone = {
      ...mockContractWithMilestones,
      milestones: [
        ...mockContractWithMilestones.milestones,
        {
          _id: 'milestone-3',
          title: 'Testing',
          description: 'Test the application',
          amount: 500,
          dueDate: '2024-02-20T00:00:00Z',
          status: 'submitted' as const,
          submittedAt: '2024-02-18T00:00:00Z',
          deliverables: [],
        },
      ],
    };

    render(
      <TestWrapper>
        <MilestoneManager contract={contractWithSubmittedMilestone} userRole="client" />
      </TestWrapper>
    );

    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('handles milestone submission', async () => {
    mockApiService.post.mockResolvedValueOnce({
      data: { status: 'success', data: { milestone: mockContractWithMilestones.milestones[1] } },
    });

    render(
      <TestWrapper>
        <MilestoneManager contract={mockContractWithMilestones} userRole="freelancer" />
      </TestWrapper>
    );

    // Click submit milestone
    fireEvent.click(screen.getByText('Submit Milestone'));

    // Should open dialog
    expect(screen.getByText('Submit Milestone')).toBeInTheDocument();
    expect(screen.getByText('Backend Development')).toBeInTheDocument();

    // Add deliverable
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'API Documentation' },
    });
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: 'Complete API documentation' },
    });
    fireEvent.click(screen.getByText('Add Deliverable'));

    // Submit
    fireEvent.click(screen.getAllByText('Submit Milestone')[1]); // The button in dialog

    await waitFor(() => {
      expect(mockApiService.post).toHaveBeenCalledWith(
        `/contracts/${mockContract._id}/milestones/milestone-2/submit`,
        expect.objectContaining({
          deliverables: expect.arrayContaining([
            expect.objectContaining({
              title: 'API Documentation',
              content: 'Complete API documentation',
            }),
          ]),
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Milestone submitted successfully!');
    });
  });

  it('handles milestone approval', async () => {
    mockApiService.post.mockResolvedValueOnce({
      data: { status: 'success', data: { milestone: mockContractWithMilestones.milestones[0] } },
    });

    const contractWithSubmittedMilestone = {
      ...mockContractWithMilestones,
      milestones: [
        {
          ...mockContractWithMilestones.milestones[0],
          status: 'submitted' as const,
        },
        mockContractWithMilestones.milestones[1],
      ],
    };

    render(
      <TestWrapper>
        <MilestoneManager contract={contractWithSubmittedMilestone} userRole="client" />
      </TestWrapper>
    );

    // Click approve
    fireEvent.click(screen.getByText('Approve'));

    // Should open dialog
    expect(screen.getByText('Approve Milestone')).toBeInTheDocument();

    // Add feedback and approve
    fireEvent.change(screen.getByLabelText('Approval Message (Optional)'), {
      target: { value: 'Excellent work!' },
    });
    fireEvent.click(screen.getByText('Approve Milestone'));

    await waitFor(() => {
      expect(mockApiService.post).toHaveBeenCalledWith(
        `/contracts/${mockContract._id}/milestones/milestone-1/approve`,
        { clientFeedback: 'Excellent work!' }
      );
      expect(mockToast.success).toHaveBeenCalledWith('Milestone approved successfully!');
    });
  });

  it('shows deliverables in accordion', () => {
    render(
      <TestWrapper>
        <MilestoneManager contract={mockContractWithMilestones} userRole="client" />
      </TestWrapper>
    );

    // Expand deliverables accordion
    fireEvent.click(screen.getByText('Deliverables (1)'));

    expect(screen.getByText('Frontend Code')).toBeInTheDocument();
    expect(screen.getByText('React application')).toBeInTheDocument();
  });

  it('shows client feedback', () => {
    render(
      <TestWrapper>
        <MilestoneManager contract={mockContractWithMilestones} userRole="freelancer" />
      </TestWrapper>
    );

    expect(screen.getByText('Client Feedback:')).toBeInTheDocument();
    expect(screen.getByText('Great work!')).toBeInTheDocument();
  });
});