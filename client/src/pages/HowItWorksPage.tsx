import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Avatar,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  PersonAdd,
  Search,
  Description,
  Handshake,
  Payment,
  RateReview,
  Work,
  AttachMoney,
} from '@mui/icons-material';

const clientSteps = [
  {
    label: 'Create Your Account',
    description: 'Sign up as a client in just a few minutes. Provide your basic information and verify your email address.',
    icon: <PersonAdd />,
  },
  {
    label: 'Post Your Project',
    description: 'Describe your project requirements, set your budget, and specify your timeline. Be as detailed as possible to attract the right freelancers.',
    icon: <Description />,
  },
  {
    label: 'Review Proposals',
    description: 'Receive proposals from qualified freelancers. Review their profiles, portfolios, ratings, and pricing to find the perfect match.',
    icon: <Search />,
  },
  {
    label: 'Award the Project',
    description: 'Choose your freelancer and create a contract with clear milestones and deliverables. Both parties sign to make it official.',
    icon: <Handshake />,
  },
  {
    label: 'Fund Milestones',
    description: 'Add funds to escrow for each milestone. Your money is protected and only released when you approve the completed work.',
    icon: <Payment />,
  },
  {
    label: 'Review & Release Payment',
    description: 'Review the delivered work, provide feedback, and release payment. Leave a rating to help other clients.',
    icon: <RateReview />,
  },
];

const freelancerSteps = [
  {
    label: 'Create Your Profile',
    description: 'Sign up as a freelancer and build a compelling profile. Add your skills, experience, portfolio, and set your rates.',
    icon: <PersonAdd />,
  },
  {
    label: 'Browse Projects',
    description: 'Search for projects that match your skills and interests. Use filters to find opportunities that fit your expertise and availability.',
    icon: <Work />,
  },
  {
    label: 'Submit Proposals',
    description: 'Write personalized proposals explaining why you\'re the best fit. Include your approach, timeline, and competitive pricing.',
    icon: <Description />,
  },
  {
    label: 'Get Hired',
    description: 'When a client selects you, review and sign the contract. Make sure you understand all requirements and milestones.',
    icon: <Handshake />,
  },
  {
    label: 'Deliver Quality Work',
    description: 'Complete the work according to the contract terms. Submit deliverables for each milestone and communicate regularly with your client.',
    icon: <Work />,
  },
  {
    label: 'Get Paid',
    description: 'Once the client approves your work, payment is released from escrow to your account. Withdraw funds to your preferred payment method.',
    icon: <AttachMoney />,
  },
];

export const HowItWorksPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h3" gutterBottom>
          How TalentHive Works
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Getting started is easy. Follow these simple steps to begin your journey.
        </Typography>
      </Box>

      <Grid container spacing={6}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 4 }}>
              For Clients
            </Typography>
            <Stepper orientation="vertical">
              {clientSteps.map((step, index) => (
                <Step key={index} active>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        {step.icon}
                      </Avatar>
                    )}
                  >
                    <Typography variant="h6">{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {step.description}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/register?type=client"
              >
                Get Started as Client
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" gutterBottom color="secondary" sx={{ mb: 4 }}>
              For Freelancers
            </Typography>
            <Stepper orientation="vertical">
              {freelancerSteps.map((step, index) => (
                <Step key={index} active>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                        {step.icon}
                      </Avatar>
                    )}
                  >
                    <Typography variant="h6">{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      {step.description}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                component={Link}
                to="/register?type=freelancer"
              >
                Get Started as Freelancer
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 8 }}>
        <Typography variant="h4" textAlign="center" gutterBottom sx={{ mb: 4 }}>
          Why Choose TalentHive?
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
              <Typography variant="h3" color="primary" gutterBottom>
                5%
              </Typography>
              <Typography variant="h6" gutterBottom>
                Low Fees
              </Typography>
              <Typography color="text.secondary">
                One of the lowest platform fees in the industry
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
              <Typography variant="h3" color="primary" gutterBottom>
                100%
              </Typography>
              <Typography variant="h6" gutterBottom>
                Secure
              </Typography>
              <Typography color="text.secondary">
                Escrow protection for all payments
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
              <Typography variant="h3" color="primary" gutterBottom>
                24/7
              </Typography>
              <Typography variant="h6" gutterBottom>
                Support
              </Typography>
              <Typography color="text.secondary">
                Always here to help when you need us
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
              <Typography variant="h3" color="primary" gutterBottom>
                1M+
              </Typography>
              <Typography variant="h6" gutterBottom>
                Community
              </Typography>
              <Typography color="text.secondary">
                Join a thriving global community
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Card sx={{ mt: 8, p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
        <Typography variant="h4" gutterBottom>
          Ready to Get Started?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Join TalentHive today and start your success story
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/register?type=client"
          >
            Hire Talent
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
      </Card>
    </Container>
  );
};
