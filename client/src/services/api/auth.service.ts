import { apiCore } from './core';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'freelancer' | 'client' | 'admin';
  companyName?: string;
  title?: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      role: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
      isVerified: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface RefreshTokenResponse {
  status: string;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface VerifyEmailResponse {
  status: string;
  message: string;
}

export class AuthService {
  private basePath = '/auth';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiCore.post<AuthResponse>(`${this.basePath}/login`, credentials);
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    return apiCore.post<AuthResponse>(`${this.basePath}/register`, data);
  }

  async logout(): Promise<{ status: string; message: string }> {
    return apiCore.post<{ status: string; message: string }>(`${this.basePath}/logout`);
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return apiCore.post<RefreshTokenResponse>(`${this.basePath}/refresh-token`, {
      refreshToken,
    });
  }

  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    return apiCore.get<VerifyEmailResponse>(`${this.basePath}/verify-email/${token}`);
  }
}

export const authService = new AuthService();
