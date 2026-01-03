import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useOrganizations } from '@/hooks/useOrganization';
import OrganizationForm from '@/components/organizations/OrganizationForm';
import { Organization } from '@/services/organizationService';

export const OrganizationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: organizations, isLoading, error } = useOrganizations();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load organizations. Please try again.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Organizations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your team organizations and budgets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Organization
        </Button>
      </Box>

      {organizations?.data?.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <BusinessIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Organizations Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create your first organization to manage team projects and budgets
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {organizations?.data?.map((org: Organization) => (
            <Grid item xs={12} md={6} lg={4} key={org._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <BusinessIcon color="primary" />
                    <Typography variant="h6" noWrap>
                      {org.name}
                    </Typography>
                  </Box>

                  {org.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {org.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {org.members?.length || 0} members
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Budget: {formatCurrency(org.budget?.total || 0)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Remaining: {formatCurrency(org.budget?.remaining || 0)}
                      </Typography>
                      <Chip
                        label={`${((org.budget?.remaining / org.budget?.total) * 100 || 0).toFixed(0)}%`}
                        size="small"
                        color={
                          (org.budget?.remaining / org.budget?.total) * 100 > 50
                            ? 'success'
                            : (org.budget?.remaining / org.budget?.total) * 100 > 20
                            ? 'warning'
                            : 'error'
                        }
                      />
                    </Box>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/dashboard/organizations/${org._id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Organization Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <OrganizationForm onSuccess={handleCreateSuccess} onCancel={() => setCreateDialogOpen(false)} />
      </Dialog>
    </Container>
  );
};

export default OrganizationListPage;
