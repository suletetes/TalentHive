import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Report } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { disputesService } from '@/services/api/disputes.service';

interface CreateDisputeDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  contractId?: string;
  transactionId?: string;
  respondentId?: string;
}

const disputeTypes = [
  { value: 'project', label: 'Project Issue' },
  { value: 'contract', label: 'Contract Dispute' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'user', label: 'User Behavior' },
  { value: 'other', label: 'Other' },
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const CreateDisputeDialog: React.FC<CreateDisputeDialogProps> = ({
  open,
  onClose,
  projectId,
  contractId,
  transactionId,
  respondentId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('other');
  const [priority, setPriority] = useState<string>('medium');
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const createDisputeMutation = useMutation({
    mutationFn: disputesService.createDispute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute filed successfully. An admin will review it shortly.');
      handleClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create dispute');
    },
  });

  const handleSubmit = () => {
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    createDisputeMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      type: type as any,
      priority: priority as any,
      project: projectId,
      contract: contractId,
      transaction: transactionId,
      respondent: respondentId,
    });
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setType('other');
    setPriority('medium');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Report color="error" />
          <Typography variant="h6">File a Dispute</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Describe the issue you're experiencing. An admin will review your dispute and help resolve it.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="Brief summary of the issue"
            sx={{ mb: 2 }}
            helperText={`${title.length}/200 characters (minimum 5)`}
            inputProps={{ maxLength: 200 }}
          />

          <TextField
            fullWidth
            select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            sx={{ mb: 2 }}
          >
            {disputeTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            sx={{ mb: 2 }}
          >
            {priorities.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={6}
            label="Description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
            placeholder="Provide detailed information about the issue..."
            helperText={`${description.length}/2000 characters (minimum 20)`}
            inputProps={{ maxLength: 2000 }}
          />

          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="caption" color="warning.contrastText">
              ⚠️ Note: Filing false disputes may result in account suspension. Please provide accurate information.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={createDisputeMutation.isPending}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          color="error"
          onClick={handleSubmit}
          loading={createDisputeMutation.isPending}
          disabled={title.trim().length < 5 || description.trim().length < 20}
        >
          File Dispute
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
