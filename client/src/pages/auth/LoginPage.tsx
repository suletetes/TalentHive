import React from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useSelector } from 'react-redux';

import { useAuth } from '@/hooks/useAuth';
import { RootState } from '@/store';

const validationSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const { login, isLoginLoading } = useAuth();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: (values) => {
      login(values);
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome Back
          </Typography>
          <Typography color="text.secondary">
            Sign in to your TalentHive account
          </Typography>
        </Box>

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
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
            disabled={isLoginLoading}
            autoFocus
          />
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            margin="normal"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            disabled={isLoginLoading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoginLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoginLoading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>

          <Box textAlign="center">
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Forgot your password?
            </Link>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box textAlign="center">
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register">
                Sign up here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};