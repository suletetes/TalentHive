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

const TimeReport: React.FC = () => {
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
      const response = await api.get('/time-tracking/reports', {
        params: { startDate, endDate },
      });
      setReport(response.data.data.report);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;

    // Create CSV content
    const headers = ['Date', 'Project', 'Description', 'Duration (hours)', 'Amount'];
    const rows = report.entries.map((entry: any) => [
      new Date(entry.startTime).toLocaleDateString(),
      entry.project?.title || '',
      entry.description,
      (entry.duration / 3600).toFixed(2),
      entry.billableAmount?.toFixed(2) || '0.00',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(',')),
      '',
      `Total Hours,${report.totalHours.toFixed(2)}`,
      `Total Amount,$${report.totalAmount.toFixed(2)}`,
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Assessment color="primary" />
          <Typography variant="h6">Time Report</Typography>
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
              Generate Report
            </Button>
          </Grid>
        </Grid>

        {report && (
          <>
            {/* Summary */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Entries
                  </Typography>
                  <Typography variant="h4">{report.entriesCount}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Hours
                  </Typography>
                  <Typography variant="h4">
                    {report.totalHours.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h4">
                    ${report.totalAmount.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Export Button */}
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExport}
              >
                Export CSV
              </Button>
            </Box>

            {/* Entries Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Duration</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.entries.map((entry: any) => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        {new Date(entry.startTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{entry.project?.title}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell align="right">
                        {formatDuration(entry.duration)}
                      </TableCell>
                      <TableCell align="right">
                        ${entry.billableAmount?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <strong>Total</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{report.totalHours.toFixed(2)}h</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>${report.totalAmount.toFixed(2)}</strong>
                    </TableCell>
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

export default TimeReport;
