import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Link as RouterLink, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useSelector } from 'react-redux';
import { Person, Business, AdminPanelSettings, Visibility, VisibilityOff } from '@mui/icons-material';

import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store';

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get('type') as 'freelancer' | 'client' | null;
  const [userType, setUserType] = useState<'freelancer' | 'client' | 'admin'>(initialRole || 'freelancer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, isRegisterLoading } = useAuth();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Navigate to onboarding after successful registration
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const getOnboardingPath = (role: string): string => {
        switch (role) {
          case 'freelancer':
            return '/onboarding/freelancer';
          case 'client':
            return '/onboarding/client';
          case 'admin':
            return '/onboarding/admin';
          default:
            return '/dashboard';
        }
      };
      
      const onboardingPath = getOnboardingPath(user.role);
      navigate(onboardingPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      title: '',
    },
    validationSchema,
    onSubmit: (values) => {
      const { confirmPassword, ...registerData } = values;
      register({
        ...registerData,
        role: userType,
        companyName: userType === 'client' ? values.companyName : undefined,
        title: userType === 'freelancer' ? values.title : undefined,
      });
    },
  });

  // Quick test data fill function
  const fillTestData = () => {
    const timestamp = Date.now();
    const testData = {
      freelancer: {
        firstName: 'John',
        lastName: 'Freelancer',
        email: `freelancer${timestamp}@test.com`,
        password: 'Test123456',
        confirmPassword: 'Test123456',
        title: 'Full Stack Developer',
        companyName: '',
      },
      client: {
        firstName: 'Jane',
        lastName: 'Client',
        email: `client${timestamp}@test.com`,
        password: 'Test123456',
        confirmPassword: 'Test123456',
        title: '',
        companyName: 'Tech Corp Inc',
      },
      admin: {
        firstName: 'Admin',
        lastName: 'User',
        email: `admin${timestamp}@test.com`,
        password: 'Test123456',
        confirmPassword: 'Test123456',
        title: '',
        companyName: '',
      },
    };

    formik.setValues(testData[userType]);
  };

  const handleUserTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newUserType: 'freelancer' | 'client' | 'admin'
  ) => {
    if (newUserType !== null) {
      setUserType(newUserType);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Join TalentHive
          </Typography>
          <Typography color="text.secondary">
            Create your account and start your journey
          </Typography>
          
          {/* Test Data Button - Only show in development */}
          {import.meta.env.DEV && (
            <Button
              variant="outlined"
              size="small"
              onClick={fillTestData}
              sx={{ mt: 2 }}
              color="secondary"
            >
              Fill Test Data
            </Button>
          )}
        </Box>

        {/* User Type Selection */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom textAlign="center">
            I want to:
          </Typography>
          <ToggleButtonGroup
            value={userType}
            exclusive
            onChange={handleUserTypeChange}
            aria-label="user type"
            fullWidth
            sx={{ mb: 3 }}
          >
            <ToggleButton value="freelancer" aria-label="freelancer">
              <Person sx={{ mr: 1 }} />
              Find Work as a Freelancer
            </ToggleButton>
            <ToggleButton value="client" aria-label="client">
              <Business sx={{ mr: 1 }} />
              Hire Freelancers
            </ToggleButton>
          
            {/* <ToggleButton value="admin" aria-label="admin">
              <AdminPanelSettings sx={{ mr: 1 }} />
              Admin Access
            </ToggleButton> */}
          </ToggleButtonGroup>
        
        </Box>

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                disabled={isRegisterLoading}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                disabled={isRegisterLoading}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email Address"
            type="email"
            margin="normal"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            disabled={isRegisterLoading}
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            disabled={isRegisterLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            margin="normal"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            disabled={isRegisterLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={handleClickShowConfirmPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {userType === 'client' && (
            <TextField
              fullWidth
              id="companyName"
              name="companyName"
              label="Company Name (Optional)"
              margin="normal"
              value={formik.values.companyName}
              onChange={formik.handleChange}
              disabled={isRegisterLoading}
            />
          )}

          {userType === 'freelancer' && (
            <TextField
              fullWidth
              id="title"
              name="title"
              label="Professional Title"
              margin="normal"
              placeholder="e.g., Full Stack Developer, Graphic Designer"
              value={formik.values.title}
              onChange={formik.handleChange}
              disabled={isRegisterLoading}
            />
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isRegisterLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isRegisterLoading ? <CircularProgress size={24} /> : 'Create Account'}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              By creating an account, you agree to our{' '}
              <Link component={RouterLink} to="/terms">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link component={RouterLink} to="/privacy">
                Privacy Policy
              </Link>
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box textAlign="center">
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;