import React from 'react';
import { Box, Paper, Typography, CircularProgress, Grid } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface PaymentAnalyticsData {
  statusDistribution: Array<{ _id: string; count: number; totalAmount: number }>;
  paymentMethodDistribution: Array<{ _id: string; count: number; totalAmount: number }>;
  averages: {
    avgAmount: number;
    avgCommission: number;
  };
}

interface PaymentAnalyticsChartProps {
  data: PaymentAnalyticsData;
  isLoading?: boolean;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  held_in_escrow: 'In Escrow',
  released: 'Released',
  refunded: 'Refunded',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const METHOD_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

export const PaymentAnalyticsChart: React.FC<PaymentAnalyticsChartProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (!data) {
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No payment data available</Typography>
      </Paper>
    );
  }

  // Transform status distribution data
  const statusData = data.statusDistribution.map((item) => ({
    name: STATUS_LABELS[item._id] || item._id,
    value: item.count,
    amount: item.totalAmount / 100,
  }));

  // Transform payment method distribution data
  const methodData = data.paymentMethodDistribution.map((item) => ({
    name: METHOD_LABELS[item._id] || item._id,
    value: item.count,
    amount: item.totalAmount / 100,
  }));

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Grid container spacing={3}>
      {/* Payment Status Distribution */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Status Distribution
          </Typography>
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} transactions (${formatCurrency(props.payload.amount)})`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Payment Method Distribution */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Method Distribution
          </Typography>
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={methodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {methodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} transactions (${formatCurrency(props.payload.amount)})`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Average Statistics */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Average Transaction Statistics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="primary">
                  {formatCurrency(data.averages.avgAmount / 100)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Transaction Amount
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(data.averages.avgCommission / 100)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Platform Commission
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
