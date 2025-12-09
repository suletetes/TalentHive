import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { CreateTicketData } from '@/services/api/supportTicket.service';
import { LoadingButton } from '@/components/ui/LoadingButton';

const ticketSchema = yup.object({
  subject: yup
    .string()
    .required('Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be at most 200 characters'),
  category: yup
    .string()
    .required('Category is required')
    .oneOf(['technical', 'billing', 'account', 'project', 'other'], 'Invalid category'),
  priority: yup
    .string()
    .required('Priority is required')
    .oneOf(['low', 'medium', 'high', 'urgent'], 'Invalid priority'),
  message: yup
    .string()
    .required('Message is required')
    .min(20, 'Message must be at least 20 characters')
    .max(5000, 'Message must be at most 5000 characters'),
});

interface CreateTicketFormProps {
  onSubmit: (data: CreateTicketData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const CreateTicketForm: React.FC<CreateTicketFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
}) => {
  const formik = useFormik({
    initialValues: {
      subject: '',
      category: 'technical' as const,
      priority: 'medium' as const,
      message: '',
    },
    validationSchema: ticketSchema,
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Create Support Ticket
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Describe your issue and our support team will get back to you as soon as possible.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          label="Subject"
          name="subject"
          value={formik.values.subject}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.subject && Boolean(formik.errors.subject)}
          helperText={formik.touched.subject && formik.errors.subject}
          sx={{ mb: 3 }}
          placeholder="Brief description of your issue"
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            select
            fullWidth
            label="Category"
            name="category"
            value={formik.values.category}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.category && Boolean(formik.errors.category)}
            helperText={formik.touched.category && formik.errors.category}
          >
            <MenuItem value="technical">Technical Issue</MenuItem>
            <MenuItem value="billing">Billing & Payments</MenuItem>
            <MenuItem value="account">Account Management</MenuItem>
            <MenuItem value="project">Project Related</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            label="Priority"
            name="priority"
            value={formik.values.priority}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.priority && Boolean(formik.errors.priority)}
            helperText={formik.touched.priority && formik.errors.priority}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </TextField>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={8}
          label="Message"
          name="message"
          value={formik.values.message}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.message && Boolean(formik.errors.message)}
          helperText={formik.touched.message && formik.errors.message}
          sx={{ mb: 3 }}
          placeholder="Please provide detailed information about your issue..."
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {onCancel && (
            <Button onClick={onCancel} variant="outlined" disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!formik.isValid || isSubmitting}
          >
            Create Ticket
          </LoadingButton>
        </Box>
      </Box>
    </Paper>
  );
};
