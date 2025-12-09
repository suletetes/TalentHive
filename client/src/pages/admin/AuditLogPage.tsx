import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Avatar,
} from '@mui/material';
import {
  History as HistoryIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import rbacService, { AuditLog } from '@/services/api/rbac.service';
import { format } from 'date-fns';

const actionIcons: Record<string, any> = {
  role_assigned: <PersonAddIcon />,
  role_removed: <PersonRemoveIcon />,
  permission_granted: <SecurityIcon />,
  permission_revoked: <BlockIcon />,
};

const actionColors: Record<string, any> = {
  role_assigned: 'success',
  role_removed: 'warning',
  permission_granted: 'info',
  permission_revoked: 'error',
};

export const AuditLogPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [actionFilter, setActionFilter] = useState('');

  // Fetch audit logs
  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['auditLogs', page, rowsPerPage, actionFilter],
    queryFn: async () => {
      const response = await rbacService.getAuditLogs({
        page: page + 1,
        limit: rowsPerPage,
        action: actionFilter || undefined,
      });
      return response.data;
    },
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getUserName = (user: any) => {
    if (!user) return 'Unknown';
    return `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message="Failed to load audit logs" />;
  }

  const logs = logsData?.logs || [];
  const total = logsData?.pagination?.total || 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <HistoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">Audit Logs</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Filter by Action"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(0);
                }}
                size="small"
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="role_assigned">Role Assigned</MenuItem>
                <MenuItem value="role_removed">Role Removed</MenuItem>
                <MenuItem value="permission_granted">Permission Granted</MenuItem>
                <MenuItem value="permission_revoked">Permission Revoked</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Performed By</TableCell>
                  <TableCell>Target User</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No audit logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: AuditLog) => (
                    <TableRow key={log._id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={actionIcons[log.action]}
                          label={getActionLabel(log.action)}
                          size="small"
                          color={actionColors[log.action]}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                            {getUserName(log.performedBy).charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{getUserName(log.performedBy)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.performedBy?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                            {getUserName(log.targetUser).charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{getUserName(log.targetUser)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.targetUser?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.resourceType}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.resourceName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          IP: {log.ipAddress}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
