import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Alert, Button, Card, CardContent } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';
import { authService } from '@/services/api/auth.service';

export const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [hasAttempted, setHasAttempted] = React.useState(false);

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    // Prevent double verification attempts
    if (hasAttempted) {
      return;
    }

    const verifyEmail = async () => {
      try {
        // Extract token from URL search params
        const params = new URLSearchParams(location.search);
        let token = params.get('token');

        if (!token) {
          if (isMounted) {
            setStatus('error');
            setMessage('No verification token provided. Please check your email link.');
            setHasAttempted(true);
          }
          return;
        }

        // Decode the token in case it's URL-encoded
        token = decodeURIComponent(token);

        console.log('🔍 [EMAIL_VERIFY_PAGE] Token extracted:', token);
        console.log('🔍 [EMAIL_VERIFY_PAGE] Token length:', token.length);

        // Call verification API
        await authService.verifyEmail(token);

        if (isMounted) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setHasAttempted(true);

          // Redirect after 2 seconds
          timer = setTimeout(() => {
            if (isMounted) {
              navigate('/login');
            }
          }, 2000);
        }
      } catch (error: any) {
        if (isMounted) {
          console.error('❌ [EMAIL_VERIFY_PAGE] Verification error:', error);
          console.error('📋 [EMAIL_VERIFY_PAGE] Error response:', error.response?.data);
          console.error('📋 [EMAIL_VERIFY_PAGE] Error status:', error.response?.status);
          setStatus('error');
          setMessage(error.response?.data?.message || 'Failed to verify email. The link may have expired.');
          setHasAttempted(true);
        }
      }
    };

    verifyEmail();

    return () => {
      isMounted = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [location.search, navigate, hasAttempted]);

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

export default EmailVerificationPage;
