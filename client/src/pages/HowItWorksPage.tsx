import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, Step, Stepper, StepLabel } from '@mui/material';
import { Work, Search, Payment, Star } from '@mui/icons-material';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      icon: <Search sx={{ fontSize: 48 }} />,
      title: 'Post a Project or Find Work',
      description: 'Clients post projects with detailed requirements. Freelancers browse available opportunities.',
    },
    {
      icon: <Work sx={{ fontSize: 48 }} />,
      title: 'Submit or Review Proposals',
      description: 'Freelancers submit custom proposals. Clients review and select the best fit.',
    },
    {
      icon: <Payment sx={{ fontSize: 48 }} />,
      title: 'Work & Get Paid Securely',
      description: 'Collaborate on milestones. Payments held in escrow for security.',
    },
    {
      icon: <Star sx={{ fontSize: 48 }} />,
      title: 'Review & Build Reputation',
      description: 'Leave feedback after completion. Build your reputation on the platform.',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        How TalentHive Works
      </Typography>
      <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 6 }}>
        Simple steps to connect, collaborate, and succeed
      </Typography>

      <Grid container spacing={4}>
        {steps.map((step, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%', p: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box sx={{ color: 'primary.main', mr: 2 }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h5">
                    {index + 1}. {step.title}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {step.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HowItWorksPage;
