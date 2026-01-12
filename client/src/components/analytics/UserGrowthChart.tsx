import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UserGrowthData {
  date: string;
  freelancers: number;
  clients: number;
  admins: number;
  total: number;
}

interface UserGrowthChartProps {
  data: UserGrowthData[];
  isLoading?: boolean;
  title?: string;
}

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({
  data,
  isLoading = false,
  title = 'User Growth',
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
        <Typography color="text.secondary">No user growth data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="freelancers" fill="#4F46E5" name="Freelancers" />
            <Bar dataKey="clients" fill="#10B981" name="Clients" />
            <Bar dataKey="admins" fill="#F59E0B" name="Admins" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
