import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Avatar,
} from '@mui/material';
import { PersonAdd, Delete, Edit } from '@mui/icons-material';
import api from '@/services/api';

interface TeamManagementProps {
  organizationId: string;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ organizationId }) => {
  const [organization, setOrganization] = useState<any>(null);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<any>(null);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member',
    spendingLimit: '',
  });

  useEffect(() => {
    fetchOrganization();
  }, [organizationId]);

  const fetchOrganization = async () => {
    try {
      const response = await api.get(`/organizations/${organizationId}`);
      setOrganization(response.data.data.organization);
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  };

  const handleInvite = async () => {
    try {
      await api.post(`/organizations/${organizationId}/members/invite`, {
        email: inviteData.email,
        role: inviteData.role,
        spendingLimit: inviteData.spendingLimit ? parseFloat(inviteData.spendingLimit) : undefined,
      });
      alert('Member invited successfully');
      setInviteDialog(false);
      setInviteData({ email: '', role: 'member', spendingLimit: '' });
      fetchOrganization();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/organizations/${organizationId}/members/${memberId}`);
      alert('Member removed successfully');
      fetchOrganization();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async () => {
    if (!editDialog) return;

    try {
      await api.patch(`/organizations/${organizationId}/members/${editDialog.user._id}/role`, {
        role: editDialog.role,
        spendingLimit: editDialog.spendingLimit ? parseFloat(editDialog.spendingLimit) : undefined,
      });
      alert('Member role updated successfully');
      setEditDialog(null);
      fetchOrganization();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update member role');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'error';
      case 'admin':
        return 'warning';
      case 'member':
        return 'primary';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!organization) return null;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Team Members</Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setInviteDialog(true)}
          >
            Invite Member
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Spending Limit</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organization.members.map((member: any) => (
                <TableRow key={member.user._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar src={member.user.profilePicture} />
                      <Box>
                        <Typography variant="body2">
                          {member.user.firstName} {member.user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={member.role} color={getRoleColor(member.role)} size="small" />
                  </TableCell>
                  <TableCell>
                    {member.spendingLimit ? `$${member.spendingLimit.toLocaleString()}` : 'Unlimited'}
                  </TableCell>
                  <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {member.role !== 'owner' && (
                      <>
                        <IconButton size="small" onClick={() => setEditDialog(member)}>
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMember(member.user._id)}
                        >
                          <Delete />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Invite Dialog */}
        <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              />
              <TextField
                fullWidth
                select
                label="Role"
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </TextField>
              <TextField
                fullWidth
                type="number"
                label="Spending Limit (Optional)"
                value={inviteData.spendingLimit}
                onChange={(e) => setInviteData({ ...inviteData, spendingLimit: e.target.value })}
                InputProps={{ startAdornment: '$' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInviteDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleInvite}>
              Send Invitation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Member Role</DialogTitle>
          <DialogContent>
            {editDialog && (
              <Box display="flex" flexDirection="column" gap={2} mt={2}>
                <TextField
                  fullWidth
                  select
                  label="Role"
                  value={editDialog.role}
                  onChange={(e) => setEditDialog({ ...editDialog, role: e.target.value })}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  type="number"
                  label="Spending Limit"
                  value={editDialog.spendingLimit || ''}
                  onChange={(e) => setEditDialog({ ...editDialog, spendingLimit: e.target.value })}
                  InputProps={{ startAdornment: '$' }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateRole}>
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TeamManagement;
