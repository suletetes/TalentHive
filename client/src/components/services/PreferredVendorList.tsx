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
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
} from '@mui/material';
import { PersonAdd, Delete, Star } from '@mui/icons-material';
import api from '@/services/api';

const PreferredVendorList: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [addDialog, setAddDialog] = useState(false);
  const [newVendor, setNewVendor] = useState({
    freelancerId: '',
    category: '',
    rating: 5,
    notes: '',
    isPriority: false,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/services/preferred-vendors');
      setVendors(response.data.data.vendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleAddVendor = async () => {
    try {
      await api.post('/services/preferred-vendors', newVendor);
      alert('Vendor added to preferred list');
      setAddDialog(false);
      setNewVendor({
        freelancerId: '',
        category: '',
        rating: 5,
        notes: '',
        isPriority: false,
      });
      fetchVendors();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add vendor');
    }
  };

  const handleRemoveVendor = async (vendorId: string) => {
    if (!confirm('Remove this vendor from preferred list?')) return;

    try {
      await api.delete(`/services/preferred-vendors/${vendorId}`);
      alert('Vendor removed from preferred list');
      fetchVendors();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove vendor');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Preferred Vendors</Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setAddDialog(true)}
          >
            Add Vendor
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Projects</TableCell>
                <TableCell>Total Spent</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar src={vendor.freelancer.profilePicture} />
                      <Box>
                        <Typography variant="body2">
                          {vendor.freelancer.firstName} {vendor.freelancer.lastName}
                        </Typography>
                        <Rating value={vendor.freelancer.rating} readOnly size="small" />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{vendor.category || 'All'}</TableCell>
                  <TableCell>
                    <Rating value={vendor.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell>{vendor.totalProjects}</TableCell>
                  <TableCell>${vendor.totalSpent.toLocaleString()}</TableCell>
                  <TableCell>
                    {vendor.isPriority && (
                      <Chip icon={<Star />} label="Priority" color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveVendor(vendor._id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Vendor Dialog */}
        <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Preferred Vendor</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <TextField
                fullWidth
                label="Freelancer ID"
                value={newVendor.freelancerId}
                onChange={(e) => setNewVendor({ ...newVendor, freelancerId: e.target.value })}
                helperText="Enter the freelancer's user ID"
              />
              <TextField
                fullWidth
                label="Category (Optional)"
                value={newVendor.category}
                onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
              />
              <Box>
                <Typography variant="body2" gutterBottom>
                  Your Rating
                </Typography>
                <Rating
                  value={newVendor.rating}
                  onChange={(_, value) => setNewVendor({ ...newVendor, rating: value || 5 })}
                />
              </Box>
              <TextField
                fullWidth
                label="Notes"
                value={newVendor.notes}
                onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddVendor}>
              Add Vendor
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PreferredVendorList;
