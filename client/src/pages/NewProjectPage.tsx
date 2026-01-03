import { Container, Typography, Paper, Box, Grid, Card, CardContent, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { 
  Description as DescriptionIcon, 
  AttachMoney as MoneyIcon, 
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon 
} from '@mui/icons-material';

export const NewProjectPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard/projects');
  };

  const tips = [
    { icon: <DescriptionIcon color="primary" />, title: 'Be Specific', desc: 'Clear descriptions attract better proposals' },
    { icon: <MoneyIcon color="success" />, title: 'Set Fair Budget', desc: 'Competitive rates get quality freelancers' },
    { icon: <ScheduleIcon color="warning" />, title: 'Realistic Timeline', desc: 'Allow enough time for quality work' },
    { icon: <CheckIcon color="info" />, title: 'List Requirements', desc: 'Define deliverables and milestones clearly' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Post a New Project
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Describe your project and start receiving proposals from talented freelancers
            </Typography>
          </Box>
          <ProjectForm onSuccess={handleSuccess} onCancel={() => navigate('/dashboard/projects')} />
        </Grid>

        {/* Sidebar Tips */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2">💡 Pro Tip</Typography>
              <Typography variant="body2">
                Projects with detailed descriptions receive 3x more proposals!
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom>
              Tips for Success
            </Typography>
            
            <Grid container spacing={2}>
              {tips.map((tip, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      {tip.icon}
                      <Box>
                        <Typography variant="subtitle2">{tip.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{tip.desc}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Paper sx={{ p: 2, mt: 3, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom>
                What happens next?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1. Your project goes live immediately<br />
                2. Freelancers submit proposals<br />
                3. Review and compare proposals<br />
                4. Hire the best fit and start working
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NewProjectPage;
