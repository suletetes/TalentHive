import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import { People, TrendingUp, Public, EmojiEvents } from '@mui/icons-material';

export const AboutPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h3" gutterBottom>
          About TalentHive
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Connecting talented professionals with businesses worldwide to create amazing things together
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mb: 8 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            Our Mission
          </Typography>
          <Typography color="text.secondary" paragraph>
            At TalentHive, we believe that talent knows no boundaries. Our mission is to create a global marketplace where businesses can find the perfect freelancer for any project, and where talented professionals can showcase their skills and build successful careers.
          </Typography>
          <Typography color="text.secondary" paragraph>
            We're committed to making freelancing accessible, secure, and rewarding for everyone. By providing the tools, protection, and support needed for successful collaborations, we're helping to shape the future of work.
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            Our Story
          </Typography>
          <Typography color="text.secondary" paragraph>
            Founded in 2024, TalentHive was born from a simple idea: connecting great talent with great opportunities should be easy, secure, and beneficial for everyone involved.
          </Typography>
          <Typography color="text.secondary" paragraph>
            What started as a small platform has grown into a thriving community of over 1 million users worldwide. Today, we facilitate thousands of successful projects every month, helping businesses grow and freelancers thrive.
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" textAlign="center" gutterBottom sx={{ mb: 4 }}>
          By the Numbers
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <People fontSize="large" />
              </Avatar>
              <Typography variant="h4" gutterBottom>
                1M+
              </Typography>
              <Typography color="text.secondary">
                Active Users
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <EmojiEvents fontSize="large" />
              </Avatar>
              <Typography variant="h4" gutterBottom>
                500K+
              </Typography>
              <Typography color="text.secondary">
                Projects Completed
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <Public fontSize="large" />
              </Avatar>
              <Typography variant="h4" gutterBottom>
                150+
              </Typography>
              <Typography color="text.secondary">
                Countries
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <TrendingUp fontSize="large" />
              </Avatar>
              <Typography variant="h4" gutterBottom>
                $100M+
              </Typography>
              <Typography color="text.secondary">
                Paid to Freelancers
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 8 }}>
        <Typography variant="h4" textAlign="center" gutterBottom sx={{ mb: 4 }}>
          Our Values
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', p: 3 }}>
              <Typography variant="h5" gutterBottom color="primary">
                Trust & Transparency
              </Typography>
              <Typography color="text.secondary">
                We build trust through transparency in all our operations. From secure payments to clear communication, we ensure every interaction is honest and straightforward.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', p: 3 }}>
              <Typography variant="h5" gutterBottom color="primary">
                Quality & Excellence
              </Typography>
              <Typography color="text.secondary">
                We're committed to maintaining high standards. Our platform connects businesses with top-tier talent and provides the tools needed for exceptional results.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', p: 3 }}>
              <Typography variant="h5" gutterBottom color="primary">
                Innovation & Growth
              </Typography>
              <Typography color="text.secondary">
                We continuously evolve our platform with new features and improvements, helping our community stay ahead in the ever-changing world of work.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Card sx={{ p: 6, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          Join Our Community
        </Typography>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Whether you're looking to hire talent or showcase your skills, TalentHive is the place to be.
        </Typography>
        <Typography variant="body1">
          Start your journey today and be part of the future of work.
        </Typography>
      </Card>
    </Container>
  );
};

export default AboutPage;
