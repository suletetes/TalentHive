import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Pagination,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { adminService, AdminUser } from '@/services/api/admin.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminUsersPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'deactivated'>('active');

  // Fetch users
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter],
    queryFn: async () => {
      const response = await adminService.getUsers({
        page,
        limit: 20,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
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

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={refetch} />
      </Container>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage all platform users
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 250 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="client">Client</MenuItem>
                <MenuItem value="freelancer">Freelancer</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="deactivated">Deactivated</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verified</TableCell>
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
                      <Chip
                        label={user.isEmailVerified ? 'Yes' : 'No'}
                        color={user.isEmailVerified ? 'success' : 'default'}
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

          {/* Pagination */}
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={pagination.pages}
              page={pagination.page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" align="center" mt={2}>
            Showing {users.length} of {pagination.total} users
          </Typography>
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
