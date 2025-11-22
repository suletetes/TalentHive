import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useContract } from '@/hooks/api/useContracts';
import { ContractTimeline } from '@/components/contracts/ContractTimeline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [amendmentDialogOpen, setAmendmentDialogOpen] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState('');

  const { data: contract, isLoading, error, refetch } = useContract(id || '');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      case 'disputed':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleAmendmentSubmit = () => {
    // Handle amendment submission
    setAmendmentDialogOpen(false);
    setAmendmentReason('');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading contract details..." />;
  }

  if (error || !contract) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={refetch} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/contracts')}
          sx={{ mb: 2 }}
        >
          Back to Contracts
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {contract.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip
                label={contract.status.toUpperCase()}
                color={getStatusColor(contract.status)}
              />
              <Typography variant="body2" color="text.secondary">
                Contract ID: {contract._id}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download
            </Button>
            <Button variant="contained" startIcon={<EditIcon />}>
              Edit
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h5">${contract.totalAmount.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Client
              </Typography>
              <Typography variant="h6">
                {contract.client.profile.firstName} {contract.client.profile.lastName}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Freelancer
              </Typography>
              <Typography variant="h6">
                {contract.freelancer.profile.firstName} {contract.freelancer.profile.lastName}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Progress
              </Typography>
              <Typography variant="h5">{contract.progress}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Timeline" />
            <Tab label="Terms" />
            <Tab label="Amendments" />
            <Tab label="Documents" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <ContractTimeline milestones={contract.milestones} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {Object.entries(contract.terms).map(([key, value]) => (
              <Grid item xs={12} key={key}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" paragraph>
              No amendments yet
            </Typography>
            <Button
              variant="contained"
              onClick={() => setAmendmentDialogOpen(true)}
            >
              Propose Amendment
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No documents uploaded yet
            </Typography>
          </Box>
        </TabPanel>
      </Card>

      {/* Amendment Dialog */}
      <Dialog
        open={amendmentDialogOpen}
        onClose={() => setAmendmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Propose Amendment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Amendment Reason"
              multiline
              rows={4}
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAmendmentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAmendmentSubmit} variant="contained">
            Propose
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
