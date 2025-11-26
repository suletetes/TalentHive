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
} from '@mui/material';
import { Download, Assessment } from '@mui/icons-material';
import api from '@/services/api';

const WorkLogReport: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    try {
      setLoading(true);
      // api.get returns response.data directly
      const response: any = await api.get('/work-logs/report', {
        params: { startDate, endDate },
      });
      console.log('[WORK LOG REPORT] Response:', response);
      setReport(response?.data?.report);
    } catch (error: any) {
      alert(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;

    const headers = ['Date', 'Contract', 'Start Time', 'End Time', 'Duration (hours)', 'Description'];
    const rows = report.workLogs.map((log: any) => [
      new Date(log.date).toLocaleDateString(),
      log.contract?.title || '',
      log.startTime,
      log.endTime || '',
      (log.duration / 60).toFixed(2),
      log.description || '',
    ]);

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
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
              sx={{ height: '56px' }}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>

        {report && (
          <>
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Entries
                  </Typography>
                  <Typography variant="h4">{report.totalEntries}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Hours
                  </Typography>
                  <Typography variant="h4">{report.totalHours.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>
                Export CSV
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Contract</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell align="right">Duration</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.workLogs.map((log: any) => (
                    <TableRow key={log._id}>
                      <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                      <TableCell>{log.contract?.title || 'N/A'}</TableCell>
                      <TableCell>
                        {log.startTime} - {log.endTime}
                      </TableCell>
                      <TableCell align="right">{formatDuration(log.duration)}</TableCell>
                      <TableCell>{log.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{report.totalHours.toFixed(2)}h</strong>
                    </TableCell>
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
