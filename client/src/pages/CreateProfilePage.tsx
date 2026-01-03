import React from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

export const CreateProfilePage: React.FC = () => {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 2,
            }}
          >
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            Complete Your Profile
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Stand out on TalentHive by creating a complete profile. Build trust with clients and unlock more opportunities.
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Benefits */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" />
                  Why Complete Your Profile?
                </Typography>
                <List>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <VerifiedIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Build Trust"
                      secondary="Complete profiles get 3x more client inquiries"
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <TrendingUpIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Increase Visibility"
                      secondary="Show up higher in search results and recommendations"
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <StarIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Showcase Your Work"
                      secondary="Display your portfolio and past projects to impress clients"
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <WorkIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Get More Proposals"
                      secondary="Clients prefer freelancers with detailed profiles"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Profile Checklist */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  Profile Checklist
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Professional Photo"
                      secondary="Add a clear, professional profile picture"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Bio & Skills"
                      secondary="Write a compelling bio and list your key skills"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Portfolio"
                      secondary="Showcase your best work and past projects"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Rates & Availability"
                      secondary="Set your hourly rate and availability status"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/dashboard/profile"
            sx={{ px: 6, py: 2, fontSize: '1.1rem', mb: 2 }}
          >
            Start Creating Your Profile
          </Button>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              component={Link}
              to="/"
            >
              Back to Home
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CreateProfilePage;
