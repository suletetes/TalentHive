import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useUpdateOrganization } from '@/hooks/useOrganization';

interface BudgetManagerProps {
  organizationId: string;
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  isOwner: boolean;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  organizationId,
  budget,
  isOwner,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(budget.total.toString());

  const updateOrganizationMutation = useUpdateOrganization();

  const budgetPercentage = (budget.spent / budget.total) * 100;
  const isLowBudget = budgetPercentage > 80;

  const handleUpdateBudget = async () => {
    try {
      await updateOrganizationMutation.mutateAsync({
        id: organizationId,
        data: {
          budget: {
            total: parseFloat(newBudget),
          },
        },
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update budget:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Budget Overview</Typography>
          {isOwner && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
            >
              Edit Budget
            </Button>
          )}
        </Box>

        {isLowBudget && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Budget is running low! {budgetPercentage.toFixed(1)}% of total budget has been spent.
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h4">{formatCurrency(budget.total)}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Spent
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" color="error.main">
                  {formatCurrency(budget.spent)}
                </Typography>
                <TrendingUpIcon color="error" />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {budgetPercentage.toFixed(1)}% of total
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Remaining
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(budget.remaining)}
                </Typography>
                <TrendingDownIcon color="success" />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {(100 - budgetPercentage).toFixed(1)}% available
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Budget Usage</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {budgetPercentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={budgetPercentage}
                color={isLowBudget ? 'error' : 'primary'}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Edit Budget Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Budget</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Total Budget"
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
                helperText={`Current: ${formatCurrency(budget.total)}`}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateBudget}
              variant="contained"
              disabled={!newBudget || updateOrganizationMutation.isPending}
            >
              Update Budget
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
