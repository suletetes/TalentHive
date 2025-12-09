import { Box, Stepper, Step, StepLabel } from '@mui/material';

interface OnboardingProgressProps {
  steps: string[];
  activeStep: number;
}

export const OnboardingProgress = ({ steps, activeStep }: OnboardingProgressProps) => {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};
