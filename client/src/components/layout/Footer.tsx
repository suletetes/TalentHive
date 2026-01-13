import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'white',
        py: { xs: 4, sm: 6 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, sm: 4 }}>
          {/* Company Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              TalentHive
            </Typography>
            <Typography 
              variant="body2" 
              color="grey.400"
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                lineHeight: 1.6,
                pr: { md: 2 }
              }}
            >
              Connect with skilled freelancers and find your next project on the
              world's leading freelancing platform.
            </Typography>
          </Grid>
          
          {/* For Clients */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
            >
              For Clients
            </Typography>
            <Stack spacing={{ xs: 1.5, sm: 1 }}>
              <Link 
                component={RouterLink} 
                to="/dashboard/projects/new" 
                color="grey.400"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': { color: 'white' },
                  display: 'block',
                  py: 0.5
                }}
              >
                Post a Project
              </Link>
              <Link 
                component={RouterLink} 
                to="/freelancers" 
                color="grey.400"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': { color: 'white' },
                  display: 'block',
                  py: 0.5
                }}
              >
                Find Freelancers
              </Link>
              <Link 
                component={RouterLink} 
                to="/how-it-works" 
                color="grey.400"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': { color: 'white' },
                  display: 'block',
                  py: 0.5
                }}
              >
                How It Works
              </Link>
            </Stack>
          </Grid>
          
          {/* For Freelancers */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
            >
              For Freelancers
            </Typography>
            <Stack spacing={{ xs: 1.5, sm: 1 }}>
              <Link 
                component={RouterLink} 
                to="/find-work" 
                color="grey.400"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': { color: 'white' },
                  display: 'block',
                  py: 0.5
                }}
              >
                Find Work
              </Link>
              <Link 
                component={RouterLink} 
                to="/create-profile" 
                color="grey.400"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': { color: 'white' },
                  display: 'block',
                  py: 0.5
                }}
              >
                Create Profile
              </Link>
              <Link 
                component={RouterLink} 
                to="/success-stories" 
                color="grey.400"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': { color: 'white' },
                  display: 'block',
                  py: 0.5
                }}
              >
                Success Stories
              </Link>
            </Stack>
          </Grid>
          
          {/* Support */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
            >
              Support
            </Typography>
            <Stack spacing={{ xs: 1.5, sm: 1 }}>
              <Link 
                component={RouterLink} 
                to="/help" 
                color="grey.400"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': { color: 'white' },
                  display: 'block',
                  py: 0.5
                }}
              >
                Help Center
              </Link>
              <Link 
                component={RouterLink} 
                to="/contact" 
                color="grey.400"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': { color: 'white' },
                  display: 'block',
                  py: 0.5
                }}
              >
                Contact Us
              </Link>
              <Link 
                component={RouterLink} 
                to="/trust-safety" 
                color="grey.400"
                sx={{ 
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': { color: 'white' },
                  display: 'block',
                  py: 0.5
                }}
              >
                Trust & Safety
              </Link>
            </Stack>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: { xs: 3, sm: 4 }, borderColor: 'grey.700' }} />
        
        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'center' },
            gap: { xs: 2, sm: 2 },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Typography 
            variant="body2" 
            color="grey.400"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              order: { xs: 2, sm: 1 }
            }}
          >
            © 2026 TalentHive. All rights reserved.
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 3 },
              alignItems: 'center',
              order: { xs: 1, sm: 2 }
            }}
          >
            <Link 
              component={RouterLink} 
              to="/privacy" 
              color="grey.400"
              sx={{ 
                textDecoration: 'none',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '&:hover': { color: 'white' },
                py: { xs: 0.5, sm: 0 }
              }}
            >
              Privacy Policy
            </Link>
            <Link 
              component={RouterLink} 
              to="/terms" 
              color="grey.400"
              sx={{ 
                textDecoration: 'none',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '&:hover': { color: 'white' },
                py: { xs: 0.5, sm: 0 }
              }}
            >
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};