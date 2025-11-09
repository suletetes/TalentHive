import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
} from '@mui/material';
import { Email, Phone, LocationOn, Send } from '@mui/icons-material';

const inquiryTypes = [
  'General Inquiry',
  'Technical Support',
  'Billing Question',
  'Report an Issue',
  'Partnership Opportunity',
  'Other',
];

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    inquiryType: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    alert('Thank you for contacting us! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      subject: '',
      inquiryType: '',
      message: '',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" gutterBottom>
          Contact Us
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                <Email sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Email Us
              </Typography>
              <Typography color="text.secondary">
                support@talenthive.com
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                We'll respond within 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                <Phone sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Call Us
              </Typography>
              <Typography color="text.secondary">
                +1 (555) 123-4567
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Mon-Fri, 9am-6pm EST
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                <LocationOn sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Visit Us
              </Typography>
              <Typography color="text.secondary">
                123 Business Street
              </Typography>
              <Typography color="text.secondary">
                San Francisco, CA 94105
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 6, p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Send us a Message
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Your Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Inquiry Type"
                name="inquiryType"
                value={formData.inquiryType}
                onChange={handleChange}
                required
              >
                {inquiryTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                name="message"
                multiline
                rows={6}
                value={formData.message}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<Send />}
              >
                Send Message
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Container>
  );
};
