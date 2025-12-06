import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { RootState } from '@/store';
import { loginStart, loginSuccess, loginFailure, logout } from '@/store/slices/authSlice';
import { authService, LoginCredentials, RegisterData } from '@/services/api/auth.service';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (response) => {
      const { user, tokens } = response.data;
      dispatch(
        loginSuccess({
          user: {
            ...user,
            _id: user.id, // Add _id alias for components that use it
            role: user.role as 'admin' | 'freelancer' | 'client',
          },
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
      toast.success('Login successful!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      dispatch(loginFailure());
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterData) => authService.register(userData),
    onSuccess: (response) => {
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/login');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      dispatch(logout());
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/');
    },
    onError: () => {
      // Even if API call fails, logout locally
      dispatch(logout());
      queryClient.clear();
      navigate('/');
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      toast.success('Email verified successfully! You can now log in.');
      navigate('/login');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    verifyEmail: verifyEmailMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isVerifyEmailLoading: verifyEmailMutation.isPending,
  };
};