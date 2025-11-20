import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  Divider,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              TalentHive
            </Typography>
            <Typography variant="body2" color="grey.400">
              Connect with skilled freelancers and find your next project on the
              world's leading freelancing platform.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              For Clients
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link component={RouterLink} to="/post-project" color="grey.400">
                Post a Project
              </Link>
              <Link component={RouterLink} to="/find-freelancers" color="grey.400">
                Find Freelancers
              </Link>
              <Link component={RouterLink} to="/how-it-works" color="grey.400">
                How It Works
              </Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              For Freelancers
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link component={RouterLink} to="/find-work" color="grey.400">
                Find Work
              </Link>
              <Link component={RouterLink} to="/create-profile" color="grey.400">
                Create Profile
              </Link>
              <Link component={RouterLink} to="/success-stories" color="grey.400">
                Success Stories
              </Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link component={RouterLink} to="/help" color="grey.400">
                Help Center
              </Link>
              <Link component={RouterLink} to="/contact" color="grey.400">
                Contact Us
              </Link>
              <Link component={RouterLink} to="/trust-safety" color="grey.400">
                Trust & Safety
              </Link>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4, borderColor: 'grey.700' }} />
        
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="grey.400">
            © 2026 TalentHive. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link component={RouterLink} to="/privacy" color="grey.400">
              Privacy Policy
            </Link>
            <Link component={RouterLink} to="/terms" color="grey.400">
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};