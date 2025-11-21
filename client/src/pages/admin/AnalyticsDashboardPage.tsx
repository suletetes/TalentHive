import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  TextField,
  MenuItem,
  Skeleton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, People, Work, AttachMoney } from '@mui/icons-material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AnalyticsDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(dateRange));

  // Fetch user growth data
  const { data: userGrowthData, isLoading: loadingUserGrowth } = useQuery({
    queryKey: ['analytics-user-growth', dateRange],
    queryFn: async () => {
      const response = await apiService.get('/analytics/user-growth', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data.data;
    },
  });

  // Fetch revenue metrics
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['analytics-revenue', dateRange],
    queryFn: async () => {
      const response = await apiService.get('/analytics/revenue', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data.data;
    },
  });

  // Fetch project stats
  const { data: projectStats, isLoading: loadingProjects } = useQuery({
    queryKey: ['analytics-projects'],
    queryFn: async () => {
      const response = await apiService.get('/analytics/projects');
      return response.data.data;
    },
  });

  // Fetch top users
  const { data: topUsersData, isLoading: loadingTopUsers } = useQuery({
    queryKey: ['analytics-top-users'],
    queryFn: async () => {
      const response = await apiService.get('/analytics/top-users', {
        params: { limit: 10 },
      });
      return response.data.data;
    },
  });

  // Fetch category distribution
  const { data: categoryData, isLoading: loadingCategories } = useQuery({
    queryKey: ['analytics-categories'],
    queryFn: async () => {
      const response = await apiService.get('/analytics/categories');
      return response.data.data;
    },
  });

  const isLoading =
    loadingUserGrowth || loadingRevenue || loadingProjects || loadingTopUsers || loadingCategories;

  const revenue = revenueData || { total: 0, byCategory: [], trend: [] };
  const projects = projectStats || { total: 0, completed: 0, inProgress: 0, completionRate: 0, averageTimeline: 0 };
  const topFreelancers = topUsersData?.topFreelancers || [];
  const topClients = topUsersData?.topClients || [];
  const categories = categoryData || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Platform Analytics
        </Typography>
        <TextField
          select
          label="Date Range"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="7">Last 7 days</MenuItem>
          <MenuItem value="30">Last 30 days</MenuItem>
          <MenuItem value="90">Last 90 days</MenuItem>
          <MenuItem value="365">Last year</MenuItem>
        </TextField>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" component="div">
                    {isLoading ? <Skeleton width={100} /> : `$${revenue.total.toFixed(2)}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Work sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" component="div">
                    {isLoading ? <Skeleton width={100} /> : projects.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Projects
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" component="div">
                    {isLoading ? <Skeleton width={100} /> : `${projects.completionRate}%`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" component="div">
                    {isLoading ? <Skeleton width={100} /> : `${projects.averageTimeline} days`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Timeline
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* User Growth Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Growth
              </Typography>
              {loadingUserGrowth ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Trend Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Trend
              </Typography>
              {loadingRevenue ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenue.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#82ca9d" name="Revenue ($)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue by Category Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue by Category
              </Typography>
              {loadingRevenue ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenue.byCategory || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Category Distribution
              </Typography>
              {loadingCategories ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.category}: ${entry.percentage}%`}
                    >
                      {categories.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Users Tables */}
      <Grid container spacing={3}>
        {/* Top Freelancers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Freelancers
              </Typography>
              {loadingTopUsers ? (
                <Skeleton variant="rectangular" height={400} />
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Freelancer</TableCell>
                        <TableCell align="right">Active Contracts</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topFreelancers.map((freelancer: any) => (
                        <TableRow key={freelancer._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar src={freelancer.avatar} sx={{ mr: 2 }}>
                                {freelancer.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{freelancer.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {freelancer.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {freelancer.metric}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Clients */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Clients
              </Typography>
              {loadingTopUsers ? (
                <Skeleton variant="rectangular" height={400} />
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Client</TableCell>
                        <TableCell align="right">Projects Posted</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topClients.map((client: any) => (
                        <TableRow key={client._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar src={client.avatar} sx={{ mr: 2 }}>
                                {client.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{client.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {client.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {client.metric}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
