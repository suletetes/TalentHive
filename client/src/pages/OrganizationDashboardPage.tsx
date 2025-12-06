import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Dialog,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useOrganization,
  useDeleteOrganization,
  useOrganizationProjects,
} from '@/hooks/useOrganization';
import { MemberManagement } from '@/components/organizations/MemberManagement';
import { BudgetManager } from '@/components/organizations/BudgetManager';
import OrganizationForm from '@/components/organizations/OrganizationForm';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

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

export const OrganizationDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const { data: organization, isLoading, error } = useOrganization(id!);
  const { data: projects } = useOrganizationProjects(id!);
  const deleteOrganizationMutation = useDeleteOrganization();

  const isOwner = organization?.data?.owner === user?._id;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        await deleteOrganizationMutation.mutateAsync(id!);
        navigate('/dashboard/organizations');
      } catch (error) {
        console.error('Failed to delete organization:', error);
      }
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !organization?.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load organization. Please try again.</Alert>
      </Container>
    );
  }

  const org = organization.data;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/organizations')}
          sx={{ mb: 2 }}
        >
          Back to Organizations
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {org.name}
            </Typography>
            {org.description && (
              <Typography variant="body1" color="text.secondary">
                {org.description}
              </Typography>
            )}
          </Box>

          {isOwner && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={() => setEditDialogOpen(true)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={handleDelete}>
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Members
              </Typography>
              <Typography variant="h3">{org.members?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Projects
              </Typography>
              <Typography variant="h3">{projects?.data?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Budget Remaining
              </Typography>
              <Typography variant="h3" color="success.main">
                ${org.budget?.remaining?.toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Overview" />
            <Tab label="Members" />
            <Tab label="Budget" />
            <Tab label="Projects" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Organization Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Require Approval
                  </Typography>
                  <Typography variant="body1">
                    {org.settings?.requireApproval ? 'Yes' : 'No'}
                  </Typography>
                </Box>
                {org.settings?.maxProjectBudget && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Max Project Budget
                    </Typography>
                    <Typography variant="body1">
                      ${org.settings.maxProjectBudget.toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <MemberManagement
            organizationId={org._id}
            members={org.members || []}
            isOwner={isOwner}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <BudgetManager
            organizationId={org._id}
            budget={org.budget}
            isOwner={isOwner}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Organization Projects
            </Typography>
            {projects?.data?.length === 0 ? (
              <Alert severity="info">No projects yet</Alert>
            ) : (
              <Grid container spacing={2}>
                {projects?.data?.map((project: any) => (
                  <Grid item xs={12} key={project._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{project.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {project.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>
      </Card>

      {/* Edit Organization Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <OrganizationForm
          organization={org}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditDialogOpen(false)}
        />
      </Dialog>
    </Container>
  );
};
