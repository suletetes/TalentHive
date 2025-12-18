import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
  Alert,
  Autocomplete,
  TextField,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import rbacService, { Role, Permission } from '@/services/api/rbac.service';
import toast from 'react-hot-toast';

export const UserPermissionsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  // Fetch user permissions
  const { data: userPermData, isLoading: userPermLoading, error: userPermError } = useQuery({
    queryKey: ['userPermissions', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await rbacService.getUserPermissions(userId);
      return response.data;
    },
    enabled: !!userId,
  });

  // Fetch all roles
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await rbacService.getRoles();
      return response.data;
    },
  });

  // Fetch all permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await rbacService.getPermissions({ limit: 1000 });
      return response.data;
    },
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ roleId }: { roleId: string }) => {
      if (!userId) throw new Error('User ID is required');
      return rbacService.assignRole(userId, roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermissions', userId] });
      toast.success('Role assigned successfully');
      setSelectedRole(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign role');
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: ({ roleId }: { roleId: string }) => {
      if (!userId) throw new Error('User ID is required');
      return rbacService.removeRole(userId, roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermissions', userId] });
      toast.success('Role removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove role');
    },
  });

  // Grant permission mutation
  const grantPermissionMutation = useMutation({
    mutationFn: ({ permissionId }: { permissionId: string }) => {
      if (!userId) throw new Error('User ID is required');
      return rbacService.grantPermission(userId, permissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermissions', userId] });
      toast.success('Permission granted successfully');
      setSelectedPermission(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to grant permission');
    },
  });

  // Revoke permission mutation
  const revokePermissionMutation = useMutation({
    mutationFn: ({ permissionId }: { permissionId: string }) => {
      if (!userId) throw new Error('User ID is required');
      return rbacService.revokePermission(userId, permissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPermissions', userId] });
      toast.success('Permission revoked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to revoke permission');
    },
  });

  const handleAssignRole = () => {
    if (selectedRole) {
      assignRoleMutation.mutate({ roleId: selectedRole._id });
    }
  };

  const handleRemoveRole = (roleId: string) => {
    removeRoleMutation.mutate({ roleId });
  };

  const handleGrantPermission = () => {
    if (selectedPermission) {
      grantPermissionMutation.mutate({ permissionId: selectedPermission._id });
    }
  };

  const handleRevokePermission = (permissionId: string) => {
    revokePermissionMutation.mutate({ permissionId });
  };

  if (userPermLoading) {
    return <LoadingSpinner />;
  }

  if (userPermError || !userPermData) {
    return <ErrorState message="Failed to load user permissions" />;
  }

  const { user, aggregatedPermissions } = userPermData;
  const availableRoles = rolesData?.roles?.filter(
    (role: Role) => !user.roles.some((r) => r._id === role._id)
  ) || [];
  const availablePermissions = permissionsData?.permissions?.filter(
    (perm: Permission) => !user.directPermissions.some((p) => p._id === perm._id)
  ) || [];

  // Group aggregated permissions by resource
  const groupedPermissions = aggregatedPermissions.reduce((acc: any, permission: Permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/admin/users')}>
          <ArrowBackIcon />
        </IconButton>
        <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4">User Permissions</Typography>
          <Typography variant="body2" color="text.secondary">
            {user.profile.firstName} {user.profile.lastName} ({user.email})
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Roles Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assigned Roles
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {user.roles.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No roles assigned
                  </Typography>
                ) : (
                  user.roles.map((role) => (
                    <Chip
                      key={role._id}
                      label={role.name}
                      onDelete={() => handleRemoveRole(role._id)}
                      color={role.isSystem ? 'warning' : 'primary'}
                      deleteIcon={<DeleteIcon />}
                    />
                  ))
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Assign New Role
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Autocomplete
                  fullWidth
                  size="small"
                  options={availableRoles}
                  getOptionLabel={(option: Role) => option.name}
                  value={selectedRole}
                  onChange={(_, newValue) => setSelectedRole(newValue)}
                  renderInput={(params) => <TextField {...params} placeholder="Select role" />}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAssignRole}
                  disabled={!selectedRole || assignRoleMutation.isPending}
                >
                  Assign
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Direct Permissions Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Direct Permissions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {user.directPermissions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No direct permissions granted
                  </Typography>
                ) : (
                  user.directPermissions.map((permission) => (
                    <Chip
                      key={permission._id}
                      label={permission.name}
                      onDelete={() => handleRevokePermission(permission._id)}
                      color="secondary"
                      deleteIcon={<DeleteIcon />}
                    />
                  ))
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Grant New Permission
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Autocomplete
                  fullWidth
                  size="small"
                  options={availablePermissions}
                  getOptionLabel={(option: Permission) => option.name}
                  value={selectedPermission}
                  onChange={(_, newValue) => setSelectedPermission(newValue)}
                  renderInput={(params) => <TextField {...params} placeholder="Select permission" />}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleGrantPermission}
                  disabled={!selectedPermission || grantPermissionMutation.isPending}
                >
                  Grant
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Aggregated Permissions Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Permissions ({aggregatedPermissions.length})
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                This shows all permissions the user has, including those from assigned roles and
                direct grants.
              </Alert>

              {Object.entries(groupedPermissions).map(([resource, permissions]: [string, any]) => (
                <Paper key={resource} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {resource.charAt(0).toUpperCase() + resource.slice(1)} ({permissions.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {permissions.map((permission: Permission) => {
                      const isDirect = user.directPermissions.some((p) => p._id === permission._id);
                      return (
                        <Chip
                          key={permission._id}
                          label={permission.name}
                          size="small"
                          color={isDirect ? 'secondary' : 'default'}
                          variant={isDirect ? 'filled' : 'outlined'}
                        />
                      );
                    })}
                  </Box>
                </Paper>
              ))}

              {aggregatedPermissions.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No permissions assigned
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
