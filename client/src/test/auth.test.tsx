import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import authReducer from '@/store/slices/authSlice';
import uiReducer from '@/store/slices/uiSlice';
import userReducer from '@/store/slices/userSlice';

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      user: userReducer,
    },
    preloadedState: initialState,
  });
};

const TestWrapper = ({ children, initialState = {} }: any) => {
  const store = createTestStore(initialState);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

describe('Authentication Components', () => {
  describe('LoginPage', () => {
    it('renders login form correctly', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email', async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
      });
    });

    it('redirects to dashboard when already authenticated', () => {
      const initialState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', email: 'test@example.com' },
          token: 'fake-token',
          refreshToken: 'fake-refresh-token',
          isLoading: false,
        },
      };

      render(
        <TestWrapper initialState={initialState}>
          <LoginPage />
        </TestWrapper>
      );

      // Should not render login form when authenticated
      expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
    });
  });

  describe('RegisterPage', () => {
    it('renders registration form correctly', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      expect(screen.getByText('Join TalentHive')).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows role selection buttons', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      expect(screen.getByText('Find Work as a Freelancer')).toBeInTheDocument();
      expect(screen.getByText('Hire Freelancers')).toBeInTheDocument();
      expect(screen.getByText('Admin Access')).toBeInTheDocument();
    });

    it('shows company name field for client role', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const clientButton = screen.getByText('Hire Freelancers');
      fireEvent.click(clientButton);

      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    });

    it('shows professional title field for freelancer role', () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const freelancerButton = screen.getByText('Find Work as a Freelancer');
      fireEvent.click(freelancerButton);

      expect(screen.getByLabelText(/professional title/i)).toBeInTheDocument();
    });

    it('shows validation errors for required fields', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('shows password confirmation validation', async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText('Passwords must match')).toBeInTheDocument();
      });
    });
  });
});