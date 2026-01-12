import { Box, Paper, Button, Container } from '@mui/material';
import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingSkipDialog } from './OnboardingSkipDialog';
import { useState } from 'react';

interface OnboardingWizardProps {
  steps: string[];
  activeStep: number;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextDisabled?: boolean;
}

export const OnboardingWizard = ({
  steps,
  activeStep,
  children,
  onNext,
  onBack,
  onSkip,
  onComplete,
  isFirstStep,
  isLastStep,
  nextDisabled = false,
}: OnboardingWizardProps) => {
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);

  const handleSkipClick = () => {
    setSkipDialogOpen(true);
  };

  const handleSkipConfirm = () => {
    setSkipDialogOpen(false);
    onSkip();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <OnboardingProgress steps={steps} activeStep={activeStep} />
        
        <Box sx={{ minHeight: 400, mb: 4 }}>
          {children}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleSkipClick}
            color="inherit"
          >
            Skip for Now
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!isFirstStep && (
              <Button onClick={onBack} variant="outlined">
                Back
              </Button>
            )}
            <Button
              onClick={isLastStep ? onComplete : onNext}
              variant="contained"
              disabled={nextDisabled}
            >
              {isLastStep ? 'Complete' : 'Next'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <OnboardingSkipDialog
        open={skipDialogOpen}
        onClose={() => setSkipDialogOpen(false)}
        onConfirm={handleSkipConfirm}
      />
    </Container>
  );
};
