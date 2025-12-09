import { Box, Typography, TextField } from '@mui/material';

interface ClientOnboardingStepsProps {
  step: number;
  data: any;
  onChange: (data: any) => void;
}

export const ClientOnboardingSteps = ({ step, data, onChange }: ClientOnboardingStepsProps) => {
  switch (step) {
    case 0:
      return (
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Welcome to TalentHive!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Let's set up your client profile. This will help you post projects and hire talented freelancers.
          </Typography>
          <TextField
            fullWidth
            label="Company Name (Optional)"
            placeholder="Your Company Name"
            value={data.companyName || ''}
            onChange={(e) => onChange({ ...data, companyName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Location"
            placeholder="City, Country"
            value={data.location || ''}
            onChange={(e) => onChange({ ...data, location: e.target.value })}
          />
        </Box>
      );

    case 1:
      return (
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Tell Us About Your Company
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Share information about your company or yourself to help freelancers understand who they'll be working with.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Company Description"
            placeholder="Describe your company, industry, and the type of projects you typically work on..."
            value={data.companyDescription || ''}
            onChange={(e) => onChange({ ...data, companyDescription: e.target.value })}
          />
        </Box>
      );

    case 2:
      return (
        <Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            You're All Set!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your profile is ready. You can now start posting projects and hiring freelancers.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Complete" to finish the onboarding process and explore the platform.
          </Typography>
        </Box>
      );

    default:
      return null;
  }
};
