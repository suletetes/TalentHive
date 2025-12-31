// Authentication-related types

export type UserRole = 'admin' | 'freelancer' | 'client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyName?: string;
  title?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  _id: string; // Alias for backward compatibility
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  isVerified: boolean;
  profileSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
}

export interface RefreshTokenResponse {
  status: string;
  data: {
    tokens: AuthTokens;
  };
}

export interface VerifyEmailResponse {
  status: string;
  message: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}