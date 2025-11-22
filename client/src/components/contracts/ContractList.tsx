import React, { useState } from 'react';
import {
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
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Eye as EyeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Contract {
  _id: string;
  title: string;
  client: { _id: string; profile: { firstName: string; lastName: string } };
  freelancer: { _id: string; profile: { firstName: string; lastName: string } };
  totalAmount: number;
  status: string;
  startDate: string;
  endDate: string;
  progress?: number;
}

interface ContractListProps {
  contracts: Contract[];
  isLoading?: boolean;
  error?: string;
}

export const ContractList: React.FC<ContractListProps> = ({
  contracts,
  isLoading = false,
  error,
}) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredContracts = contracts.filter((contract) => {
    const matchesStatus = !statusFilter || contract.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.client.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.freelancer.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search contracts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ width: 150 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
          <MenuItem value="disputed">Disputed</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Title</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Freelancer</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Progress</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  No contracts found
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{contract.title}</TableCell>
                  <TableCell>
                    {contract.client.profile.firstName} {contract.client.profile.lastName}
                  </TableCell>
                  <TableCell>
                    {contract.freelancer.profile.firstName} {contract.freelancer.profile.lastName}
                  </TableCell>
                  <TableCell align="right">${contract.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={contract.status.toUpperCase()}
                      color={getStatusColor(contract.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{contract.progress || 0}%</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<EyeIcon />}
                      onClick={() => navigate(`/dashboard/contracts/${contract._id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
