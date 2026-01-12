import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, People, Work, Support, Analytics, Settings } from '@mui/icons-material';

interface AdminOnboardingStepsProps {
  step: number;
}

export const AdminOnboardingSteps = ({ step }: AdminOnboardingStepsProps) => {
  switch (step) {
    case 0:
      return (
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Welcome, Admin!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            As an administrator, you have access to powerful tools to manage the TalentHive platform.
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><Dashboard color="primary" /></ListItemIcon>
              <ListItemText primary="Dashboard" secondary="Monitor platform activity and key metrics" />
            </ListItem>
            <ListItem>
              <ListItemIcon><People color="primary" /></ListItemIcon>
              <ListItemText primary="User Management" secondary="Manage freelancers, clients, and other admins" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Work color="primary" /></ListItemIcon>
              <ListItemText primary="Project Oversight" secondary="Review and manage all projects on the platform" />
            </ListItem>
          </List>
        </Box>
      );

    case 1:
      return (
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Admin Tools
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Explore the administrative features available to you.
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><Support color="primary" /></ListItemIcon>
              <ListItemText primary="Support Tickets" secondary="Respond to user inquiries and resolve issues" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Analytics color="primary" /></ListItemIcon>
              <ListItemText primary="Analytics" secondary="View detailed reports and platform statistics" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Settings color="primary" /></ListItemIcon>
              <ListItemText primary="Platform Settings" secondary="Configure commission rates and platform policies" />
            </ListItem>
          </List>
        </Box>
      );

    case 2:
      return (
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            You're Ready!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            You now have access to all administrative features. Start by exploring the admin dashboard.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Complete" to finish the onboarding and access the admin panel.
          </Typography>
        </Box>
      );

    default:
      return null;
  }
};
