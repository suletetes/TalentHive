import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Alert, Button, Card, CardContent } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';
import { authService } from '@/services/api/auth.service';

export const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Prevent double verification using ref
    if (verificationAttempted.current) {
      console.log('⚠️ [EMAIL_VERIFY] Verification already attempted, skipping...');
      return;
    }

    const verifyEmail = async () => {
      try {
        console.log('🔍 [EMAIL_VERIFY] Starting verification process');
        
        // Extract token from URL search params
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        console.log('📍 [EMAIL_VERIFY] Location search:', location.search);
        console.log('🔑 [EMAIL_VERIFY] Token extracted:', token);
        
        if (!token) {
          console.log('❌ [EMAIL_VERIFY] No token found in URL');
          setStatus('error');
          setMessage('No verification token provided. Please check your email link.');
          return;
        }

        console.log('📤 [EMAIL_VERIFY] Calling verification API...');
        await authService.verifyEmail(token);
        
        console.log('✅ [EMAIL_VERIFY] Verification successful');
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        
        setTimeout(() => {
          console.log('🔄 [EMAIL_VERIFY] Redirecting to login...');
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        console.error('❌ [EMAIL_VERIFY] Verification error:', error);
        console.error('📋 [EMAIL_VERIFY] Error response:', error.response?.data);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify email. The link may have expired.');
      } finally {
        verificationAttempted.current = true;
      }
    };

    verifyEmail();
  }, [location.search, navigate]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {status === 'loading' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={60} />
              <Typography variant="h6">{message}</Typography>
            </Box>
          )}

          {status === 'success' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />
              <Typography variant="h6" color="success.main">
                {message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You will be redirected to login shortly...
              </Typography>
            </Box>
          )}

          {status === 'error' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />
              <Alert severity="error" sx={{ width: '100%' }}>
                {message}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', width: '100%' }}>
                <Button variant="outlined" onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
                <Button variant="contained" onClick={() => navigate('/register')}>
                  Register Again
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};
