import api from '../api';

export interface VerificationData {
  type: 'email' | 'phone' | 'identity';
  token?: string;
  code?: string;
  documentUrl?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  verificationStatus?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };
}

const verificationService = {
  // Send verification email
  sendVerificationEmail: async () => {
    const response = await api.post('/verification/send-email');
    return response.data;
  },

  // Verify email with token
  verifyEmail: async (token: string): Promise<VerificationResponse> => {
    const response = await api.post('/verification/verify-email', { token });
    return response.data;
  },

  // Resend verification email
  resendVerificationEmail: async () => {
    const response = await api.post('/verification/resend-email');
    return response.data;
  },

  // Send phone verification code
  sendPhoneVerificationCode: async (phone: string) => {
    const response = await api.post('/verification/send-phone-code', { phone });
    return response.data;
  },

  // Verify phone with code
  verifyPhone: async (phone: string, code: string): Promise<VerificationResponse> => {
    const response = await api.post('/verification/verify-phone', { phone, code });
    return response.data;
  },

  // Submit identity verification
  submitIdentityVerification: async (documentUrl: string, documentType: string) => {
    const response = await api.post('/verification/submit-identity', {
      documentUrl,
      documentType,
    });
    return response.data;
  },

  // Get verification status
  getVerificationStatus: async () => {
    const response = await api.get('/verification/status');
    return response.data;
  },

  // Get verification history
  getVerificationHistory: async () => {
    const response = await api.get('/verification/history');
    return response.data;
  },

  // Check if user is verified
  isUserVerified: async (userId: string) => {
    const response = await api.get(`/verification/user/${userId}`);
    return response.data;
  },
};

export default verificationService;
