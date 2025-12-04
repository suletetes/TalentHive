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
  Chip,
  Paper,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Work, 
  Payment, 
  Star,
  Security,
  Speed,
  Support,
  Verified,
  TrendingUp,
  Groups,
  FormatQuote,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const HomePage: React.FC = () => {
  // Fetch featured freelancers
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-freelancers'],
    queryFn: async () => {
      const response = await apiService.get('/featured-freelancers');
      // Handle both response structures
      const freelancers = response.data?.data?.freelancers || response.data?.freelancers || [];
      return freelancers;
    },
  });

  const featuredFreelancers = featuredData || [];

  // Fallback to mock data if no featured freelancers
  const displayFreelancers = featuredFreelancers.length > 0 
    ? featuredFreelancers.slice(0, 3)
    : [
        {
          _id: '1',
          profile: { firstName: 'John', lastName: 'Doe', avatar: '' },
          freelancerProfile: { title: 'Full Stack Developer', hourlyRate: 50 },
          rating: { average: 5, count: 50 },
        },
        {
          _id: '2',
          profile: { firstName: 'Jane', lastName: 'Smith', avatar: '' },
          freelancerProfile: { title: 'UI/UX Designer', hourlyRate: 60 },
          rating: { average: 5, count: 45 },
        },
        {
          _id: '3',
          profile: { firstName: 'Mike', lastName: 'Johnson', avatar: '' },
          freelancerProfile: { title: 'Mobile Developer', hourlyRate: 55 },
          rating: { average: 5, count: 40 },
        },
      ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 6, md: 10 },
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                Hire Expert Freelancers for Any Project
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  opacity: 0.95,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                }}
              >
                Connect with top-rated professionals worldwide. From web development to design, 
                find the perfect talent to bring your vision to life.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={Link}
                  to="/register"
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                  component={Link}
                  to="/projects"
                >
                  Browse Projects
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip 
                  icon={<Verified sx={{ color: 'white !important' }} />}
                  label="Verified Professionals" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<Security sx={{ color: 'white !important' }} />}
                  label="Secure Payments" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<Support sx={{ color: 'white !important' }} />}
                  label="24/7 Support" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={8}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  p: 4,
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography variant="h3" color="primary" gutterBottom fontWeight={700}>
                  1M+
                </Typography>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  Active Users Worldwide
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="h5" color="primary" fontWeight={600}>
                      4.9/5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Rating
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" color="primary" fontWeight={600}>
                      500K+
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Projects
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" color="primary" fontWeight={600}>
                      $100M+
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paid Out
                    </Typography>
                  </Box>
                </Box>
              </Paper>
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

      {/* Features Section */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom>
            Why Choose TalentHive?
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Everything you need to succeed in the freelance marketplace
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.light',
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Security color="primary" />
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Secure Escrow System
                </Typography>
                <Typography color="text.secondary">
                  Your payments are protected with our milestone-based escrow system. 
                  Release funds only when you're satisfied with the work.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: 'secondary.light',
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Verified color="secondary" />
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Verified Professionals
                </Typography>
                <Typography color="text.secondary">
                  All freelancers are thoroughly vetted with verified skills, portfolios, 
                  and client reviews to ensure quality.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: 'success.light',
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Speed color="success" />
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Fast Hiring Process
                </Typography>
                <Typography color="text.secondary">
                  Post your project and receive proposals within hours. 
                  Use our "Hire Now" feature for instant engagement.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: 'info.light',
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Support color="info" />
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  24/7 Customer Support
                </Typography>
                <Typography color="text.secondary">
                  Our dedicated support team is always available to help you 
                  resolve any issues and ensure smooth collaboration.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: 'warning.light',
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <TrendingUp color="warning" />
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Real-Time Analytics
                </Typography>
                <Typography color="text.secondary">
                  Track project progress, monitor milestones, and manage your 
                  freelance business with comprehensive dashboards.
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: 'error.light',
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Groups color="error" />
                </Avatar>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Global Talent Pool
                </Typography>
                <Typography color="text.secondary">
                  Access millions of skilled professionals across hundreds of 
                  categories from anywhere in the world.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Statistics Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom>
            Trusted by Millions
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Join the world's largest freelancing platform
          </Typography>
          <Grid container spacing={4} textAlign="center">
            <Grid item xs={6} md={3}>
              <Box>
                <Typography variant="h2" color="primary" gutterBottom fontWeight={700}>
                  1M+
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Active Users
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Growing every day
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box>
                <Typography variant="h2" color="primary" gutterBottom fontWeight={700}>
                  500K+
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Projects Completed
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  With 98% satisfaction
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box>
                <Typography variant="h2" color="primary" gutterBottom fontWeight={700}>
                  $100M+
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Total Earnings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Paid to freelancers
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box>
                <Typography variant="h2" color="primary" gutterBottom fontWeight={700}>
                  4.9/5
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Average Rating
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  From 100K+ reviews
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom>
            What Our Users Say
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Real stories from clients and freelancers
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, height: '100%', position: 'relative' }}>
                <FormatQuote sx={{ fontSize: 48, color: 'primary.light', opacity: 0.3, position: 'absolute', top: 16, left: 16 }} />
                <Box sx={{ pt: 4 }}>
                  <Rating value={5} readOnly sx={{ mb: 2 }} />
                  <Typography variant="body1" paragraph>
                    "TalentHive made it incredibly easy to find the perfect developer for our project. 
                    The escrow system gave us peace of mind, and the quality of work exceeded our expectations."
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                    <Avatar sx={{ mr: 2 }}>S</Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Sarah Johnson
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        CEO, TechStart Inc.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, height: '100%', position: 'relative' }}>
                <FormatQuote sx={{ fontSize: 48, color: 'primary.light', opacity: 0.3, position: 'absolute', top: 16, left: 16 }} />
                <Box sx={{ pt: 4 }}>
                  <Rating value={5} readOnly sx={{ mb: 2 }} />
                  <Typography variant="body1" paragraph>
                    "As a freelancer, TalentHive has been a game-changer. The platform is intuitive, 
                    payments are always on time, and I've built lasting relationships with amazing clients."
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                    <Avatar sx={{ mr: 2 }}>M</Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Michael Chen
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Full Stack Developer
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, height: '100%', position: 'relative' }}>
                <FormatQuote sx={{ fontSize: 48, color: 'primary.light', opacity: 0.3, position: 'absolute', top: 16, left: 16 }} />
                <Box sx={{ pt: 4 }}>
                  <Rating value={5} readOnly sx={{ mb: 2 }} />
                  <Typography variant="body1" paragraph>
                    "The quality of talent on TalentHive is outstanding. We've hired multiple designers 
                    and developers, and each one has delivered exceptional work. Highly recommended!"
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                    <Avatar sx={{ mr: 2 }}>E</Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Emily Rodriguez
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Marketing Director
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Featured Freelancers Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
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

          {featuredLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LoadingSpinner />
            </Box>
          ) : (
            <Grid container spacing={4}>
              {displayFreelancers.map((freelancer: any) => (
                <Grid item xs={12} sm={6} md={4} key={freelancer._id}>
                  {(() => {
                    const isStatic = !freelancer._id || freelancer._id === '1' || freelancer._id === '2' || freelancer._id === '3';
                    return (
                      <Card 
                        sx={{ 
                          p: 3, 
                          textAlign: 'center', 
                          cursor: isStatic ? 'default' : 'pointer', 
                          height: '100%',
                          transition: isStatic ? 'none' : 'all 0.3s ease',
                          '&:hover': isStatic ? {} : { 
                            boxShadow: 6,
                            transform: 'translateY(-4px)',
                          } 
                        }}
                        component={isStatic ? 'div' : Link}
                        to={isStatic ? undefined : `/freelancer/${freelancer._id}`}
                        style={isStatic ? {} : { textDecoration: 'none' }}
                      >
                      
                    <Avatar
                      sx={{ width: 96, height: 96, mx: 'auto', mb: 2, border: 3, borderColor: 'primary.light' }}
                      src={freelancer.profile.avatar}
                    >
                      {freelancer.profile.firstName[0]}
                    </Avatar>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      {freelancer.profile.firstName} {freelancer.profile.lastName}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom sx={{ minHeight: 48 }}>
                      {freelancer.freelancerProfile?.title || 'Freelancer'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <Rating value={freelancer.rating.average} readOnly size="small" />
                      <Typography variant="body2" sx={{ ml: 1 }} fontWeight={500}>
                        {freelancer.rating.average.toFixed(1)} ({freelancer.rating.count})
                      </Typography>
                    </Box>
                    {freelancer.freelancerProfile?.hourlyRate && (
                      <Chip 
                        label={`$${freelancer.freelancerProfile.hourlyRate}/hr`}
                        color="primary"
                        size="small"
                      />
                    )}
                      </Card>
                    );
                  })()}
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/freelancers"
              sx={{ px: 4 }}
            >
              View All Freelancers
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Ready to Transform Your Business?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
            Join over 1 million businesses and freelancers who trust TalentHive 
            to connect, collaborate, and succeed together.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              component={Link}
              to="/register?type=client"
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              Hire Freelancers
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/register?type=freelancer"
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              Find Work
            </Button>
          </Box>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Verified />
              <Typography variant="body2">No credit card required</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security />
              <Typography variant="body2">100% secure platform</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Support />
              <Typography variant="body2">24/7 support available</Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};