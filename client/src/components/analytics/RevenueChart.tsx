import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData {
  _id: string;
  totalRevenue: number;
  platformCommission: number;
  processingFees: number;
  tax: number;
  freelancerPayouts: number;
  transactionCount: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  isLoading?: boolean;
  title?: string;
  type?: 'line' | 'area';
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  isLoading = false,
  title = 'Revenue Overview',
  type = 'area',
}) => {
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No revenue data available</Typography>
      </Paper>
    );
  }

  // Transform data for chart
  const chartData = data.map((item) => ({
    date: item._id,
    revenue: item.totalRevenue / 100, // Convert cents to dollars
    commission: item.platformCommission / 100,
    fees: item.processingFees / 100,
    payouts: item.freelancerPayouts / 100,
    transactions: item.transactionCount,
  }));

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <DataComponent
              type="monotone"
              dataKey="revenue"
              stroke="#4F46E5"
              fill="#4F46E5"
              fillOpacity={0.6}
              name="Total Revenue"
            />
            <DataComponent
              type="monotone"
              dataKey="commission"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.6}
              name="Platform Commission"
            />
            <DataComponent
              type="monotone"
              dataKey="payouts"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.6}
              name="Freelancer Payouts"
            />
          </ChartComponent>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
