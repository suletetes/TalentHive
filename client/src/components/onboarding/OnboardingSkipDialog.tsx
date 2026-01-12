import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface OnboardingSkipDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const OnboardingSkipDialog = ({ open, onClose, onConfirm }: OnboardingSkipDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Skip Onboarding?</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to skip the onboarding process? You can always complete it later from your profile settings.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="warning">
          Skip Onboarding
        </Button>
      </DialogActions>
    </Dialog>
  );
};
