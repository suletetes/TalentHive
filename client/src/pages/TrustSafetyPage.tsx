import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Security,
  VerifiedUser,
  Payment,
  Support,
  Gavel,
  CheckCircle,
} from '@mui/icons-material';

export const TrustSafetyPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" gutterBottom>
          Trust & Safety
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Your security and peace of mind are our top priorities
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5">Secure Payments</Typography>
              </Box>
              <Typography color="text.secondary" paragraph>
                All payments are processed through our secure escrow system. Your funds are protected until you approve the completed work.
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="PCI-DSS compliant payment processing" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Milestone-based payment protection" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Encrypted financial transactions" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VerifiedUser sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5">Identity Verification</Typography>
              </Box>
              <Typography color="text.secondary" paragraph>
                We verify the identity of our users to ensure a trustworthy community of clients and freelancers.
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Email and phone verification" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Government ID verification available" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Payment method verification" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Gavel sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5">Dispute Resolution</Typography>
              </Box>
              <Typography color="text.secondary" paragraph>
                If issues arise, our dedicated team is here to help mediate and resolve disputes fairly.
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Professional mediation services" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Clear dispute resolution process" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Fair outcomes for all parties" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Support sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5">24/7 Support</Typography>
              </Box>
              <Typography color="text.secondary" paragraph>
                Our support team is always available to help you with any safety or security concerns.
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Round-the-clock customer support" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Dedicated trust & safety team" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Quick response to security issues" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>
          Safety Guidelines
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              For Clients
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Review freelancer profiles and ratings carefully"
                  secondary="Check portfolios, reviews, and completion rates before hiring"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Use milestone payments"
                  secondary="Break projects into milestones to protect your investment"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Communicate through the platform"
                  secondary="Keep all communications on TalentHive for your protection"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Report suspicious activity"
                  secondary="Contact us immediately if something doesn't feel right"
                />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              For Freelancers
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Verify project details before starting"
                  secondary="Ensure you understand all requirements and deliverables"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Use contracts for all projects"
                  secondary="Always work under a signed contract with clear terms"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Never share personal financial information"
                  secondary="All payments should go through the platform"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Document your work"
                  secondary="Keep records of all deliverables and communications"
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ mt: 6, textAlign: 'center', p: 4, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Report a Safety Concern
        </Typography>
        <Typography variant="body1">
          If you encounter any safety or security issues, please contact our Trust & Safety team immediately at safety@talenthive.com
        </Typography>
      </Box>
    </Container>
  );
};
