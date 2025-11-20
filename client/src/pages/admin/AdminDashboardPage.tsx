import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { adminService, AdminUser } from '@/services/api/admin.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'deactivated'>('active');

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await adminService.getDashboardStats();
      return response.data.stats;
    },
    enabled: user?.role === 'admin',
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await adminService.getUsers({ limit: 10 });
      return response.data;
    },
    enabled: user?.role === 'admin',
  });

  // Fetch reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const response = await adminService.getReports();
      return response.data;
    },
    enabled: user?.role === 'admin',
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'suspended' | 'deactivated' }) =>
      adminService.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated successfully');
      setStatusDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });

  const handleUpdateStatus = (user: AdminUser) => {
    setSelectedUser(user);
    setNewStatus(user.accountStatus || 'active');
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedUser) {
      updateStatusMutation.mutate({
        userId: selectedUser._id,
        status: newStatus,
      });
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warning';
      case 'deactivated':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRoleColor = (role?: string) => {
    if (!role) return 'default';
    switch (role.toLowerCase()) {
      case 'admin':
        return 'error';
      case 'client':
        return 'primary';
      case 'freelancer':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </Container>
    );
  }

  if (statsLoading || usersLoading || reportsLoading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  if (statsError || usersError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={statsError || usersError} onRetry={refetchUsers} />
      </Container>
    );
  }

  const stats = statsData || {
    totalUsers: 0,
    totalProjects: 0,
    totalContracts: 0,
    totalRevenue: 0,
    activeProjects: 0,
    completedProjects: 0,
  };

  const users = usersData?.users || [];
  const reports = reportsData || { userGrowth: [], revenueData: [], projectStats: [] };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Platform overview and management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PeopleIcon color="primary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WorkIcon color="secondary" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" color="secondary">
                    {stats.totalProjects}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Projects
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {stats.activeProjects} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DescriptionIcon color="info" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {stats.totalContracts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Contracts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MoneyIcon color="success" sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" color="success.main">
                    ${stats.totalRevenue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Platform Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Management Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Management
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar
                          src={user.profile?.avatar}
                          alt={`${user.profile?.firstName} ${user.profile?.lastName}`}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Typography variant="body2">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role?.toUpperCase() || 'N/A'}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.accountStatus?.toUpperCase() || 'N/A'}
                        color={getStatusColor(user.accountStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleUpdateStatus(user)}
                      >
                        Update Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Platform Analytics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Project Status Distribution
              </Typography>
              {reports.projectStats.map((stat) => (
                <Box key={stat._id} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{stat._id}:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {stat.count}
                  </Typography>
                </Box>
              ))}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Recent User Growth
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {reports.userGrowth.length} days of data
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Revenue Trends
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {reports.revenueData.length} days of data
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Update User Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update User Status</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                User: {selectedUser.profile?.firstName} {selectedUser.profile?.lastName} ({selectedUser.email})
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Account Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Account Status"
                  onChange={(e) => setNewStatus(e.target.value as any)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="deactivated">Deactivated</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            color="primary"
            variant="contained"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
