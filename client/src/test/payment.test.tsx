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

import { PaymentForm } from '../components/payments/PaymentForm';
import { PaymentHistory } from '../components/payments/PaymentHistory';
import { EscrowAccountSetup } from '../components/payments/EscrowAccountSetup';
import { PayoutManager } from '../components/payments/PayoutManager';
import { theme } from '../theme';
import { apiService } from '../services/api';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('../services/api');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));
vi.mock('@stripe/stripe-js');
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => children,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    createPaymentMethod: vi.fn(),
    confirmCardPayment: vi.fn(),
  }),
  useElements: () => ({
    getElement: vi.fn(() => ({})),
  }),
}));

const mockApiService = apiService as any;
const mockToast = toast as any;

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
  freelancer: {
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
    },
  },
};

const mockMilestone = {
  _id: 'milestone-1',
  title: 'Frontend Development',
  description: 'Build responsive frontend',
  amount: 1000,
  dueDate: '2024-02-15T00:00:00Z',
};

const mockPayments = [
  {
    _id: 'payment-1',
    amount: 1000,
    currency: 'USD',
    status: 'completed',
    type: 'milestone_payment',
    platformFee: 50,
    freelancerAmount: 950,
    createdAt: '2024-01-15T10:00:00Z',
    client: {
      profile: { firstName: 'John', lastName: 'Doe' },
    },
    freelancer: {
      profile: { firstName: 'Jane', lastName: 'Smith' },
    },
    contract: {
      title: 'Web Development Project',
    },
    metadata: {
      description: 'Milestone payment for frontend development',
    },
  },
];

const mockEscrowAccount = {
  escrowAccount: {
    _id: 'escrow-1',
    accountType: 'freelancer',
    balance: 2500,
    currency: 'USD',
    status: 'active',
    verificationStatus: 'verified',
    payoutMethods: [
      {
        _id: 'payout-1',
        type: 'bank_account',
        isDefault: true,
        details: {
          last4: '1234',
          bankName: 'Test Bank',
        },
        status: 'active',
      },
    ],
  },
  stripeAccount: {
    id: 'acct_test_123',
    charges_enabled: true,
    payouts_enabled: true,
    details_submitted: true,
  },
};

describe('PaymentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment form correctly', () => {
    render(
      <TestWrapper>
        <PaymentForm contract={mockContract} milestone={mockMilestone} />
      </TestWrapper>
    );

    expect(screen.getByText('Complete Payment')).toBeInTheDocument();
    expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    expect(screen.getByText('$1000.00')).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
  });

  it('calculates platform fee correctly', () => {
    render(
      <TestWrapper>
        <PaymentForm contract={mockContract} milestone={mockMilestone} />
      </TestWrapper>
    );

    expect(screen.getByText('Platform Fee (5%):')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // 5% of 1000
  });

  it('shows security and escrow notices', () => {
    render(
      <TestWrapper>
        <PaymentForm contract={mockContract} milestone={mockMilestone} />
      </TestWrapper>
    );

    expect(screen.getByText(/Your payment is secured by Stripe/)).toBeInTheDocument();
    expect(screen.getByText(/Funds will be held in escrow/)).toBeInTheDocument();
  });

  it('handles payment submission', async () => {
    const mockStripe = {
      createPaymentMethod: vi.fn().mockResolvedValue({
        error: null,
        paymentMethod: { id: 'pm_test_123' },
      }),
    };

    const mockElements = {
      getElement: vi.fn().mockReturnValue({}),
    };

    // Mock the Stripe hooks
    require('@stripe/react-stripe-js').useStripe.mockReturnValue(mockStripe);
    require('@stripe/react-stripe-js').useElements.mockReturnValue(mockElements);

    mockApiService.post.mockResolvedValueOnce(
      createMockResponse({
        status: 'success',
        data: {
          payment: { _id: 'payment-1' },
          paymentIntent: {
            id: 'pi_test_123',
            status: 'succeeded',
            client_secret: 'pi_test_123_secret',
          },
        },
      })
    );

    const onSuccess = vi.fn();

    render(
      <TestWrapper>
        <PaymentForm 
          contract={mockContract} 
          milestone={mockMilestone} 
          onSuccess={onSuccess}
        />
      </TestWrapper>
    );

    // Submit the form
    fireEvent.click(screen.getByText('Pay $1000.00'));

    await waitFor(() => {
      expect(mockStripe.createPaymentMethod).toHaveBeenCalled();
      expect(mockApiService.post).toHaveBeenCalledWith(
        '/payments/intent',
        expect.objectContaining({
          contractId: mockContract._id,
          milestoneId: mockMilestone._id,
          amount: mockMilestone.amount,
          paymentMethodId: 'pm_test_123',
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Payment completed successfully!');
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

describe('PaymentHistory', () => {
  beforeEach(() => {
    mockApiService.get.mockResolvedValue(
      createMockResponse({
        status: 'success',
        data: {
          payments: mockPayments,
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

  it('renders payment history correctly', async () => {
    render(
      <TestWrapper>
        <PaymentHistory userRole="client" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Payment History')).toBeInTheDocument();
      expect(screen.getByText('1 payment found')).toBeInTheDocument();
    });
  });

  it('displays payment details', async () => {
    render(
      <TestWrapper>
        <PaymentHistory userRole="client" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Milestone payment for frontend development')).toBeInTheDocument();
      expect(screen.getByText('$1000.00 USD')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument(); // Platform fee
      expect(screen.getByText('$950.00')).toBeInTheDocument(); // Net amount
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
  });

  it('filters payments by status', async () => {
    render(
      <TestWrapper>
        <PaymentHistory userRole="client" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Payment History')).toBeInTheDocument();
    });

    // Find the Status select by its label
    const statusSelect = screen.getByRole('combobox', { name: /Status/i });
    fireEvent.mouseDown(statusSelect);

    await waitFor(() => {
      const completedOption = screen.getByText('Completed');
      fireEvent.click(completedOption);
    });

    await waitFor(() => {
      expect(mockApiService.get).toHaveBeenCalledWith(
        expect.stringContaining('status=completed')
      );
    });
  });

  it('shows empty state when no payments', async () => {
    mockApiService.get.mockResolvedValueOnce(
      createMockResponse({
        status: 'success',
        data: {
          payments: [],
          pagination: { total: 0 },
        },
      })
    );

    render(
      <TestWrapper>
        <PaymentHistory userRole="freelancer" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No payments found')).toBeInTheDocument();
      expect(screen.getByText('You haven\'t received any payments yet.')).toBeInTheDocument();
    });
  });
});

describe('EscrowAccountSetup', () => {
  it('renders setup form for new account', async () => {
    mockApiService.get.mockRejectedValueOnce({
      response: { status: 404 },
    });

    render(
      <TestWrapper>
        <EscrowAccountSetup userRole="freelancer" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Escrow Account Setup')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Create Escrow Account')).toBeInTheDocument();
    });
  });

  it('shows account details for existing account', async () => {
    mockApiService.get.mockResolvedValueOnce(
      createMockResponse({ status: 'success', data: mockEscrowAccount })
    );

    render(
      <TestWrapper>
        <EscrowAccountSetup userRole="freelancer" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('freelancer')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('VERIFIED')).toBeInTheDocument();
    });
  });

  it('handles account creation', async () => {
    mockApiService.get.mockRejectedValueOnce({
      response: { status: 404 },
    });

    mockApiService.post.mockResolvedValueOnce(
      createMockResponse({
        status: 'success',
        data: {
          escrowAccount: mockEscrowAccount.escrowAccount,
          onboardingUrl: 'https://connect.stripe.com/setup/test',
        },
      })
    );

    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(
      <TestWrapper>
        <EscrowAccountSetup userRole="freelancer" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Escrow Account')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Escrow Account'));

    await waitFor(() => {
      expect(mockApiService.post).toHaveBeenCalledWith(
        '/payments/escrow/account',
        { accountType: 'freelancer' }
      );
      expect(window.location.href).toBe('https://connect.stripe.com/setup/test');
    });
  });
});

describe('PayoutManager', () => {
  beforeEach(() => {
    mockApiService.get.mockImplementation((url) => {
      if (url === '/payments/escrow/account') {
        return Promise.resolve(
          createMockResponse({ status: 'success', data: mockEscrowAccount })
        );
      }
      if (url.includes('/payments/history')) {
        return Promise.resolve(
          createMockResponse({
            status: 'success',
            data: { payments: [] },
          })
        );
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders payout manager correctly', async () => {
    render(
      <TestWrapper>
        <PayoutManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Payout Management')).toBeInTheDocument();
      expect(screen.getByText('Available Balance')).toBeInTheDocument();
      expect(screen.getByText('$2500.00')).toBeInTheDocument();
    });
  });

  it('shows payout methods', async () => {
    render(
      <TestWrapper>
        <PayoutManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Payout Methods')).toBeInTheDocument();
      expect(screen.getByText('Bank Account')).toBeInTheDocument();
      expect(screen.getByText('Test Bank • ****1234')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  it('handles payout request', async () => {
    mockApiService.post.mockResolvedValueOnce(
      createMockResponse({
        status: 'success',
        data: {
          payment: { _id: 'payment-1', amount: 1000 },
          transfer: { id: 'tr_test_123', status: 'pending' },
        },
      })
    );

    render(
      <TestWrapper>
        <PayoutManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Payout Management')).toBeInTheDocument();
    });

    // Click request payout button (use getAllByRole to handle multiple buttons)
    const payoutButtons = screen.getAllByRole('button', { name: /Request Payout/i });
    fireEvent.click(payoutButtons[0]);

    // Should open dialog
    await waitFor(() => {
      expect(screen.getByLabelText(/Payout Amount/i)).toBeInTheDocument();
    });

    // Fill amount and submit
    fireEvent.change(screen.getByLabelText(/Payout Amount/i), {
      target: { value: '1000' },
    });

    // Find and click the submit button in the dialog
    const submitButtons = screen.getAllByRole('button', { name: /Request Payout/i });
    fireEvent.click(submitButtons[submitButtons.length - 1]); // Last button is in dialog

    await waitFor(() => {
      expect(mockApiService.post).toHaveBeenCalledWith(
        '/payments/payout',
        expect.objectContaining({
          amount: 1000,
          payoutMethodId: mockEscrowAccount.escrowAccount.payoutMethods[0]._id,
        })
      );
      expect(mockToast.success).toHaveBeenCalledWith('Payout requested successfully!');
    });
  });

  it('shows minimum payout warning', async () => {
    const lowBalanceAccount = {
      ...mockEscrowAccount,
      escrowAccount: {
        ...mockEscrowAccount.escrowAccount,
        balance: 5, // Below minimum
      },
    };

    mockApiService.get.mockImplementation((url) => {
      if (url === '/payments/escrow/account') {
        return Promise.resolve(
          createMockResponse({ status: 'success', data: lowBalanceAccount })
        );
      }
      return Promise.resolve(
        createMockResponse({ status: 'success', data: { payments: [] } })
      );
    });

    render(
      <TestWrapper>
        <PayoutManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Minimum payout amount is $10.00')).toBeInTheDocument();
      expect(screen.getByText('Request Payout')).toBeDisabled();
    });
  });
});