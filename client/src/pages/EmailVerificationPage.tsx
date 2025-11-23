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

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      try {
        // Extract token from URL search params
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (!token) {
          if (isMounted) {
            setStatus('error');
            setMessage('No verification token provided. Please check your email link.');
          }
          return;
        }

        // Call verification API
        await authService.verifyEmail(token);

        if (isMounted) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');

          // Redirect after 2 seconds
          const timer = setTimeout(() => {
            navigate('/login');
          }, 2000);

          return () => clearTimeout(timer);
        }
      } catch (error: any) {
        if (isMounted) {
          setStatus('error');
          setMessage(error.response?.data?.message || 'Failed to verify email. The link may have expired.');
        }
      }
    };

    verifyEmail();

    return () => {
      isMounted = false;
    };
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
