import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Search, Work, Payment, Star } from '@mui/icons-material';

export const HomePage: React.FC = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Find the perfect freelancer for your project
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Connect with skilled professionals from around the world and get
                your work done efficiently and affordably.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={Link}
                  to="/register"
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ color: 'white', borderColor: 'white' }}
                  component={Link}
                  to="/projects"
                >
                  Browse Projects
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h4" gutterBottom>
                  Join 1M+ Users
                </Typography>
                <Typography variant="body1">
                  Trusted by businesses and freelancers worldwide
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom>
          How TalentHive Works
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          Get started in three simple steps
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Search fontSize="large" />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                1. Post Your Project
              </Typography>
              <Typography color="text.secondary">
                Describe your project requirements and budget. Our platform will
                match you with qualified freelancers.
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
              <Avatar
                sx={{
                  bgcolor: 'secondary.main',
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Work fontSize="large" />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                2. Choose Your Freelancer
              </Typography>
              <Typography color="text.secondary">
                Review proposals, check portfolios, and interview candidates to
                find the perfect match for your project.
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
              <Avatar
                sx={{
                  bgcolor: 'success.main',
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Payment fontSize="large" />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                3. Pay Securely
              </Typography>
              <Typography color="text.secondary">
                Use our secure escrow system to pay for milestones. Your money
                is protected until you're satisfied with the work.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Featured Freelancers Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom>
            Featured Freelancers
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Meet some of our top-rated professionals
          </Typography>

          <Grid container spacing={4}>
            {[1, 2, 3].map((index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Avatar
                    sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                    src={`https://images.unsplash.com/photo-${1500000000000 + index}?w=150&h=150&fit=crop&crop=face`}
                  />
                  <Typography variant="h6" gutterBottom>
                    Freelancer {index}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    Full Stack Developer
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <Rating value={5} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      5.0 (50+ reviews)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Starting at $50/hour
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          Ready to get started?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Join thousands of businesses and freelancers who trust TalentHive
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/register?type=client"
          >
            Hire Freelancers
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            to="/register?type=freelancer"
          >
            Find Work
          </Button>
        </Box>
      </Container>
    </Box>
  );
};