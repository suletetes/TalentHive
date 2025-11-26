import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Grid,
  FormHelperText,
} from '@mui/material';
import { Check } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '@/services/api';
import { useToast } from '@/components/ui/ToastProvider';

interface WorkLogFormProps {
  contracts?: any[];
  onLogCreated?: () => void;
}

const validationSchema = Yup.object({
  contractId: Yup.string().required('Please select a contract'),
  date: Yup.string().required('Please select a date'),
  startTime: Yup.string()
    .required('Please enter start time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: Yup.string()
    .required('Please enter end time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
    .test('is-after-start', 'End time must be after start time', function (value) {
      const { startTime } = this.parent;
      if (!startTime || !value) return true;
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = value.split(':').map(Number);
      return endH * 60 + endM > startH * 60 + startM;
    }),
  description: Yup.string().max(500, 'Description must be 500 characters or less'),
});

const WorkLogForm: React.FC<WorkLogFormProps> = ({ contracts = [], onLogCreated }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  const activeContracts = contracts.filter((c) => c.status === 'active');

  const formik = useFormik({
    initialValues: {
      contractId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const createRes: any = await api.post('/work-logs', {
          contractId: values.contractId,
          date: values.date,
          startTime: values.startTime,
          description: values.description,
        });

        const workLogId = createRes?.data?.workLog?._id;

        if (!workLogId) {
          throw new Error('Failed to get work log ID from response');
        }

        await api.patch(`/work-logs/${workLogId}/complete`, {
          endTime: values.endTime,
          description: values.description,
        });

        toast.success('Work log created successfully!');
        resetForm();
        formik.setFieldValue('date', new Date().toISOString().split('T')[0]);
        onLogCreated?.();
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Failed to create work log';
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (user?.role !== 'freelancer') {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Only freelancers can log work hours. Clients can view work logs in the list below.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Log Work Hours
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Record your work hours by selecting the date and time range
        </Typography>

        {activeContracts.length === 0 ? (
          <Alert severity="warning">
            No active contracts found. You need an active contract to log work hours.
          </Alert>
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <Box display="flex" flexDirection="column" gap={2}>
              <FormControl
                fullWidth
                error={formik.touched.contractId && Boolean(formik.errors.contractId)}
              >
                <InputLabel>Select Contract</InputLabel>
                <Select
                  name="contractId"
                  value={formik.values.contractId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Select Contract"
                >
                  {activeContracts.map((contract) => (
                    <MenuItem key={contract._id} value={contract._id}>
                      {contract.title} - {contract.project?.title || 'Project'}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.contractId && formik.errors.contractId && (
                  <FormHelperText>{formik.errors.contractId}</FormHelperText>
                )}
              </FormControl>

              <TextField
                fullWidth
                type="date"
                name="date"
                label="Date"
                value={formik.values.date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.date && Boolean(formik.errors.date)}
                helperText={formik.touched.date && formik.errors.date}
                InputLabelProps={{ shrink: true }}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    name="startTime"
                    label="Start Time"
                    value={formik.values.startTime}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.startTime && Boolean(formik.errors.startTime)}
                    helperText={formik.touched.startTime && formik.errors.startTime}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    name="endTime"
                    label="End Time"
                    value={formik.values.endTime}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.endTime && Boolean(formik.errors.endTime)}
                    helperText={formik.touched.endTime && formik.errors.endTime}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                name="description"
                label="Description (optional)"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
                multiline
                rows={2}
                placeholder="What did you work on?"
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Check />}
                disabled={formik.isSubmitting || !formik.isValid}
                size="large"
              >
                {formik.isSubmitting ? 'Saving...' : 'Save Work Log'}
              </Button>
            </Box>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkLogForm;
