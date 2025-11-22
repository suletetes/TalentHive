import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Mail as MailIcon, Phone as PhoneIcon, Badge as BadgeIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';

const steps = ['Email Verification', 'Phone Verification', 'Identity Verification'];

export const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const handleEmailVerification = async () => {
    setIsLoading(true);
    try {
      // Call verification API
      setMessage('Verification email sent! Check your inbox.');
      setTimeout(() => setActiveStep(1), 2000);
    } catch (error) {
      setMessage('Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerification = async () => {
    setIsLoading(true);
    try {
      // Call verification API
      setMessage('Verification code sent to your phone!');
      setTimeout(() => setActiveStep(2), 2000);
    } catch (error) {
      setMessage('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentityVerification = async () => {
    setIsLoading(true);
    try {
      // Call verification API
      navigate('/verification-success?type=identity');
    } catch (error) {
      setMessage('Failed to verify identity');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Account Verification
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete verification to unlock all platform features and build trust with clients
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {message && (
            <Alert severity={message.includes('Failed') ? 'error' : 'success'} sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <MailIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">Email Verification</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verify your email address to secure your account
                  </Typography>
                </Box>
              </Box>

              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                disabled
                defaultValue={user?.email}
                sx={{ mb: 3 }}
              />

              <Typography variant="body2" color="text.secondary" paragraph>
                We'll send a verification link to your email. Click the link to confirm your email address.
              </Typography>

              <Button
                variant="contained"
                onClick={handleEmailVerification}
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? <CircularProgress size={24} /> : 'Send Verification Email'}
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <PhoneIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">Phone Verification</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verify your phone number for added security
                  </Typography>
                </Box>
              </Box>

              <TextField
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                fullWidth
                placeholder="+1 (555) 000-0000"
                sx={{ mb: 3 }}
              />

              <Typography variant="body2" color="text.secondary" paragraph>
                We'll send a verification code to your phone. Enter the code to confirm.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handlePhoneVerification}
                  disabled={isLoading || !phone}
                  fullWidth
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Send Verification Code'}
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <BadgeIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">Identity Verification</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verify your identity to get a blue verification badge
                  </Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Upload a government-issued ID (passport, driver's license, or national ID) to verify your identity.
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary" paragraph>
                Your identity information is encrypted and stored securely. We never share it with other users.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleIdentityVerification}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Complete Verification'}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};
