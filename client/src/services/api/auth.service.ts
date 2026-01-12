import { apiCore } from './core';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  RefreshTokenResponse, 
  VerifyEmailResponse,
  ChangePasswordData,
  AuthUser,
  AuthTokens
} from '@/types/auth';

export class AuthService {
  private basePath = '/auth';

  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    return apiCore.post<{ user: AuthUser; tokens: AuthTokens }>(`${this.basePath}/login`, credentials);
  }

  async register(data: RegisterData): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    return apiCore.post<{ user: AuthUser; tokens: AuthTokens }>(`${this.basePath}/register`, data);
  }

  async logout(): Promise<{ message: string }> {
    return apiCore.post<{ message: string }>(`${this.basePath}/logout`, {});
  }

  async refreshToken(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    return apiCore.post<{ tokens: AuthTokens }>(`${this.basePath}/refresh-token`, {
      refreshToken,
    });
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiCore.get<{ message: string }>(`${this.basePath}/verify-email/${token}`);
  }

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return apiCore.post<{ message: string }>(`${this.basePath}/change-password`, data);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiCore.post<{ message: string }>(`${this.basePath}/forgot-password`, { email });
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<{ message: string }> {
    return apiCore.post<{ message: string }>(`${this.basePath}/reset-password`, {
      token,
      password,
      confirmPassword,
    });
  }
}

export const authService = new AuthService();
