import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Alert,
  Avatar,
  Rating,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Message as MessageIcon,
  Description as ProposalIcon,
  FlashOn as HireNowIcon,
  Storefront as ServiceIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { contractsService, Contract } from '@/services/api/contracts.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 5;

export const ContractsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Helper to get the other party in the contract
  const getOtherParty = (contract: Contract) => {
    if (user?.role === 'client') {
      return contract.freelancer;
    }
    return contract.client;
  };

  // Fetch contracts
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: async () => {
      console.log('[CONTRACTS] Fetching contracts...');
      const response = await contractsService.getMyContracts();
      console.log('[CONTRACTS] Response:', response);
      const contracts = response.data || [];
      console.log('[CONTRACTS] Contracts count:', contracts.length);
      return contracts;
    },
  });

  // Sign contract mutation
  const signMutation = useMutation({
    mutationFn: async (contractId: string) => {
      console.log('[CONTRACT SIGN] Starting sign request for contract:', contractId);
      const response = await contractsService.signContract(contractId, {
        ipAddress: 'client-side',
        userAgent: navigator.userAgent,
      });
      console.log('[CONTRACT SIGN] Sign response:', response);
      return response;
    },
    onSuccess: (response: any) => {
      console.log('[CONTRACT SIGN] Success:', response);
      queryClient.invalidateQueries({ queryKey: ['my-contracts'] });
      
      const isFullySigned = response?.data?.isFullySigned;
      if (isFullySigned) {
        toast.success('Contract signed and activated! Both parties have signed.');
      } else {
        toast.success('Contract signed successfully. Waiting for other party to sign.');
      }
      
      setSignDialogOpen(false);
      setSelectedContract(null);
    },
    onError: (error: any) => {
      console.error('[CONTRACT SIGN] Error:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to sign contract';
      toast.error(message);
    },
  });

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
  };

  const handleSignClick = (contract: Contract) => {
    setSelectedContract(contract);
    setSignDialogOpen(true);
  };

  const handleSignConfirm = () => {
    if (selectedContract) {
      signMutation.mutate(selectedContract._id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'in_progress':
        return 'info';
      case 'submitted':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateProgress = (contract: Contract) => {
    if (!contract.milestones || contract.milestones.length === 0) return 0;
    const completed = contract.milestones.filter(m => m.status === 'approved').length;
    return (completed / contract.milestones.length) * 100;
  };

  const needsSignature = (contract: Contract) => {
    // Signatures is an array of { signedBy, signedAt, ... }
    const signatures = contract.signatures || [];
    const userId = user?._id;
    
    // Check if current user has already signed
    const userHasSigned = signatures.some(
      (sig: any) => sig.signedBy === userId || sig.signedBy?._id === userId
    );
    
    // Check if both parties have signed
    const clientId = typeof contract.client === 'string' ? contract.client : contract.client?._id;
    const freelancerId = typeof contract.freelancer === 'string' ? contract.freelancer : contract.freelancer?._id;
    
    const clientSigned = signatures.some(
      (sig: any) => sig.signedBy === clientId || sig.signedBy?._id === clientId
    );
    const freelancerSigned = signatures.some(
      (sig: any) => sig.signedBy === freelancerId || sig.signedBy?._id === freelancerId
    );
    const isFullySigned = clientSigned && freelancerSigned;
    
    console.log('[CONTRACT] needsSignature check:', {
      contractId: contract._id,
      userId,
      clientId,
      freelancerId,
      signatures: signatures.length,
      userHasSigned,
      clientSigned,
      freelancerSigned,
      isFullySigned,
      contractStatus: contract.status,
    });
    
    // User needs to sign if:
    // 1. They haven't signed yet
    // 2. Contract is not completed or cancelled
    // 3. Contract is not fully signed by both parties
    return !userHasSigned && !['completed', 'cancelled'].includes(contract.status) && !isFullySigned;
  };

  // ALL HOOKS MUST BE BEFORE CONDITIONAL RETURNS
  const contracts = data || [];
  
  // Filter contracts
  const filteredContracts = useMemo(() => {
    const filtered = contracts.filter((c: Contract) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      
      // Handle source filter with special case for service_request
      let matchesSource = false;
      if (sourceFilter === 'all') {
        matchesSource = true;
      } else if (sourceFilter === 'service_request') {
        // Service requests are hire_now contracts with "Service Request:" in title
        matchesSource = (c as any).sourceType === 'hire_now' && c.title?.startsWith('Service Request:');
      } else if (sourceFilter === 'hire_now') {
        // Direct hire excludes service requests
        matchesSource = (c as any).sourceType === 'hire_now' && !c.title?.startsWith('Service Request:');
      } else {
        matchesSource = (c as any).sourceType === sourceFilter;
      }
      
      return matchesStatus && matchesSource;
    });
    
    return filtered;
  }, [contracts, statusFilter, sourceFilter]);
  
  // Pagination - useMemo MUST be before conditional returns
  const totalPages = Math.ceil(filteredContracts.length / ITEMS_PER_PAGE);
  const paginatedContracts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredContracts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContracts, page]);

  // Helper to get source type display
  const getSourceInfo = (contract: Contract) => {
    const sourceType = (contract as any).sourceType || 'proposal';
    
    // Check if title starts with "Service Request:" - these are service requests via hire now
    const isServiceRequest = contract.title?.startsWith('Service Request:');
    
    switch (sourceType) {
      case 'hire_now':
        if (isServiceRequest) {
          return { label: 'Service Request', color: 'info' as const, icon: <ServiceIcon fontSize="small" /> };
        }
        return { label: 'Direct Hire', color: 'secondary' as const, icon: <HireNowIcon fontSize="small" /> };
      case 'service':
        return { label: 'Service Package', color: 'info' as const, icon: <ServiceIcon fontSize="small" /> };
      default:
        return { label: 'Proposal', color: 'default' as const, icon: <ProposalIcon fontSize="small" /> };
    }
  };

  // Conditional returns AFTER all hooks
  if (isLoading) {
    return <LoadingSpinner message="Loading contracts..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState 
          message={error?.message || 'Failed to load contracts'} 
          onRetry={refetch} 
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Contracts
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View and manage all your contracts
      </Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Source</InputLabel>
          <Select
            value={sourceFilter}
            label="Source"
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="all">All Sources</MenuItem>
            <MenuItem value="proposal">Proposal</MenuItem>
            <MenuItem value="hire_now">Direct Hire</MenuItem>
            <MenuItem value="service_request">Service Request</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', ml: 'auto' }}>
          {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              You don't have any contracts yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
        <Grid container spacing={3}>
          {paginatedContracts.map((contract) => (
            <Grid item xs={12} key={contract._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {contract.title}
                      </Typography>
                      <Box display="flex" gap={1} alignItems="center" mb={1} flexWrap="wrap">
                        <Chip
                          label={contract.status.toUpperCase()}
                          color={getStatusColor(contract.status)}
                          size="small"
                        />
                        {(() => {
                          const source = getSourceInfo(contract);
                          return (
                            <Chip
                              icon={source.icon}
                              label={source.label}
                              color={source.color}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })()}
                        {needsSignature(contract) && (
                          <Chip
                            label="NEEDS YOUR SIGNATURE"
                            color="warning"
                            size="small"
                          />
                        )}
                        {(() => {
                          // Show "Waiting for other party" if user signed but other hasn't
                          const signatures = contract.signatures || [];
                          const userId = user?._id;
                          const userHasSigned = signatures.some(
                            (sig: any) => sig.signedBy === userId || sig.signedBy?._id === userId
                          );
                          const clientId = typeof contract.client === 'string' ? contract.client : contract.client?._id;
                          const freelancerId = typeof contract.freelancer === 'string' ? contract.freelancer : contract.freelancer?._id;
                          const clientSigned = signatures.some((sig: any) => sig.signedBy === clientId || sig.signedBy?._id === clientId);
                          const freelancerSigned = signatures.some((sig: any) => sig.signedBy === freelancerId || sig.signedBy?._id === freelancerId);
                          
                          if (userHasSigned && !(clientSigned && freelancerSigned)) {
                            return <Chip label="WAITING FOR OTHER PARTY" color="info" size="small" />;
                          }
                          return null;
                        })()}
                      </Box>
                      
                      {/* Other Party Info */}
                      {(() => {
                        const otherParty = getOtherParty(contract);
                        if (!otherParty) return null;
                        return (
                          <Box display="flex" alignItems="center" gap={1.5} mt={1.5}>
                            <Avatar
                              src={(otherParty as any)?.profile?.avatar}
                              sx={{ width: 40, height: 40 }}
                            >
                              {(otherParty as any)?.profile?.firstName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {user?.role === 'client' ? 'Freelancer' : 'Client'}: {(otherParty as any)?.profile?.firstName} {(otherParty as any)?.profile?.lastName}
                              </Typography>
                              {(otherParty as any)?.rating?.average > 0 && (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Rating value={(otherParty as any)?.rating?.average || 0} readOnly size="small" precision={0.5} />
                                  <Typography variant="caption" color="text.secondary">
                                    ({(otherParty as any)?.rating?.count || 0})
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })()}
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h6" color="primary">
                        ${contract.totalAmount || contract.budget?.amount || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {contract.budget?.type === 'hourly' ? '/hour' : 'total'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Milestone Progress
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {contract.milestones?.filter(m => m.status === 'approved').length || 0} / {contract.milestones?.length || 0} completed
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculateProgress(contract)}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Started: {format(new Date(contract.startDate), 'MMM dd, yyyy')}
                    {contract.endDate && ` • Ends: ${format(new Date(contract.endDate), 'MMM dd, yyyy')}`}
                  </Typography>

                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/dashboard/contracts/${contract._id}`)}
                    >
                      Manage Contract
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(contract)}
                    >
                      Quick View
                    </Button>
                    {needsSignature(contract) && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleSignClick(contract)}
                      >
                        Sign Contract
                      </Button>
                    )}
                    {/* Message Button */}
                    {(() => {
                      const otherParty = getOtherParty(contract);
                      if (!otherParty) return null;
                      return (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<MessageIcon />}
                          onClick={() => navigate(`/dashboard/messages?userId=${(otherParty as any)?._id}`)}
                        >
                          Message
                        </Button>
                      );
                    })()}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
        </>
      )}

      {/* Contract Details Dialog */}
      <Dialog
        open={!!selectedContract && !signDialogOpen}
        onClose={() => setSelectedContract(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedContract && (
          <>
            <DialogTitle>
              Contract Details
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Title
                </Typography>
                <Typography variant="body1">
                  {selectedContract.title}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={selectedContract.status.toUpperCase()}
                  color={getStatusColor(selectedContract.status)}
                  size="small"
                />
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedContract.description}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Budget
                </Typography>
                <Typography variant="h6" color="primary">
                  ${selectedContract.totalAmount || selectedContract.budget?.amount || 0}
                  {selectedContract.budget?.type === 'hourly' ? '/hour' : ' (total)'}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Timeline
                </Typography>
                <Typography variant="body1">
                  Start: {format(new Date(selectedContract.startDate), 'MMMM dd, yyyy')}
                </Typography>
                {selectedContract.endDate && (
                  <Typography variant="body1">
                    End: {format(new Date(selectedContract.endDate), 'MMMM dd, yyyy')}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Signatures
                </Typography>
                {(() => {
                  const signatures = selectedContract.signatures || [];
                  const clientId = typeof selectedContract.client === 'string' 
                    ? selectedContract.client 
                    : selectedContract.client?._id;
                  const freelancerId = typeof selectedContract.freelancer === 'string'
                    ? selectedContract.freelancer
                    : selectedContract.freelancer?._id;
                  
                  const clientSigned = signatures.some(
                    (sig: any) => (sig.signedBy === clientId || sig.signedBy?._id === clientId)
                  );
                  const freelancerSigned = signatures.some(
                    (sig: any) => (sig.signedBy === freelancerId || sig.signedBy?._id === freelancerId)
                  );
                  
                  return (
                    <Box display="flex" gap={2}>
                      <Chip
                        label={`Client: ${clientSigned ? 'Signed' : 'Pending'}`}
                        color={clientSigned ? 'success' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={`Freelancer: ${freelancerSigned ? 'Signed' : 'Pending'}`}
                        color={freelancerSigned ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  );
                })()}
              </Box>

              {selectedContract.milestones && selectedContract.milestones.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Milestones
                  </Typography>
                  {selectedContract.milestones.map((milestone, index) => (
                    <Card key={milestone._id || index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="subtitle1">
                            {milestone.title}
                          </Typography>
                          <Chip
                            label={milestone.status.toUpperCase()}
                            color={getMilestoneStatusColor(milestone.status)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {milestone.description}
                        </Typography>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            Amount: ${milestone.amount}
                          </Typography>
                          <Typography variant="body2">
                            Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedContract(null)}>Close</Button>
              {needsSignature(selectedContract) && (
                <Button
                  onClick={() => {
                    setSignDialogOpen(true);
                  }}
                  variant="contained"
                  color="primary"
                >
                  Sign Contract
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Sign Contract Confirmation Dialog */}
      <Dialog
        open={signDialogOpen}
        onClose={() => setSignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sign Contract</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            By signing this contract, you agree to the terms and conditions outlined in the contract details.
          </Alert>
          <Typography>
            Are you sure you want to sign this contract?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSignConfirm}
            color="primary"
            variant="contained"
            disabled={signMutation.isPending}
          >
            {signMutation.isPending ? 'Signing...' : 'Sign Contract'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ContractsPage;
