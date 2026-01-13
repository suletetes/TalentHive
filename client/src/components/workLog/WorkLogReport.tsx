import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Download, Assessment } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/services/api';

const WorkLogReport: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isClient = user?.role === 'client';

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      const response: any = await api.get('/work-logs/report', {
        params: { startDate, endDate },
      });
      setReport(response?.data?.report);
      toast.success('Report generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;

    const headers = isClient
      ? ['Date', 'Contract', 'Freelancer', 'Start Time', 'End Time', 'Duration (hours)', 'Description']
      : ['Date', 'Contract', 'Start Time', 'End Time', 'Duration (hours)', 'Description'];

    const rows = report.workLogs.map((log: any) => {
      const freelancerName = log.freelancer?.profile
        ? `${log.freelancer.profile.firstName || ''} ${log.freelancer.profile.lastName || ''}`.trim()
        : 'Unknown';
      const startDateStr = log.startDate ? new Date(log.startDate).toLocaleDateString() : '';
      const endDateStr = log.endDate ? new Date(log.endDate).toLocaleDateString() : '';
      const dateRange = startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;
      const baseRow = [dateRange, log.contract?.title || ''];
      if (isClient) baseRow.push(freelancerName);
      baseRow.push(log.startTime, log.endTime || '', (log.duration / 60).toFixed(2), log.description || '');
      return baseRow;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(',')),
      '',
      `Total Hours,${report.totalHours.toFixed(2)}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-log-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getFreelancerName = (log: any) => {
    const profile = log.freelancer?.profile;
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return 'Unknown';
  };

  // Group by contract for summary
  const getContractSummary = () => {
    if (!report?.workLogs) return [];
    const contractMap = new Map<string, { title: string; totalMinutes: number; count: number }>();
    report.workLogs.forEach((log: any) => {
      const contractId = log.contract?._id || 'unknown';
      const title = log.contract?.title || 'Unknown';
      if (!contractMap.has(contractId)) {
        contractMap.set(contractId, { title, totalMinutes: 0, count: 0 });
      }
      const entry = contractMap.get(contractId)!;
      entry.totalMinutes += log.duration || 0;
      entry.count += 1;
    });
    return Array.from(contractMap.values());
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Assessment color="primary" />
          <Typography variant="h6">Work Log Report</Typography>
        </Box>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading}
              sx={{ height: { xs: '48px', sm: '56px' } }}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>

        {report && (
          <>
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Total Entries</Typography>
                  <Typography variant="h4">{report.totalEntries}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Total Hours</Typography>
                  <Typography variant="h4">{report.totalHours.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Contracts</Typography>
                  <Typography variant="h4">{getContractSummary().length}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Contract Summary */}
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>By Contract</Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Contract</TableCell>
                    <TableCell align="right">Entries</TableCell>
                    <TableCell align="right">Total Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getContractSummary().map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.title}</TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell align="right">{(item.totalMinutes / 60).toFixed(2)}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>
                Export CSV
              </Button>
            </Box>

            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Details</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Contract</TableCell>
                    {isClient && <TableCell>Freelancer</TableCell>}
                    <TableCell>Time</TableCell>
                    <TableCell align="right">Duration</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.workLogs.map((log: any) => {
                    const startDateStr = log.startDate ? new Date(log.startDate).toLocaleDateString() : '';
                    const endDateStr = log.endDate ? new Date(log.endDate).toLocaleDateString() : '';
                    const dateRange = startDateStr === endDateStr ? startDateStr : `${startDateStr} → ${endDateStr}`;
                    return (
                      <TableRow key={log._id}>
                        <TableCell>{dateRange}</TableCell>
                        <TableCell>{log.contract?.title || 'N/A'}</TableCell>
                        {isClient && <TableCell>{getFreelancerName(log)}</TableCell>}
                        <TableCell>{log.startTime} - {log.endTime}</TableCell>
                        <TableCell align="right">{formatDuration(log.duration)}</TableCell>
                        <TableCell>{log.description || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={isClient ? 4 : 3} align="right"><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>{report.totalHours.toFixed(2)}h</strong></TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkLogReport;
