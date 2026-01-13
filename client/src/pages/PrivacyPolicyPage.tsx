import React from 'react';
import { Box, Container, Typography, Divider } from '@mui/material';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>
        Privacy Policy
      </Typography>
      <Typography color="text.secondary" paragraph>
        Last Updated: November 9, 2024
      </Typography>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        1. Introduction
      </Typography>
      <Typography paragraph>
        Welcome to TalentHive ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        2. Information We Collect
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        2.1 Personal Information
      </Typography>
      <Typography paragraph>
        We collect personal information that you voluntarily provide to us when you register on the platform, including:
      </Typography>
      <Typography component="div" paragraph>
        <ul>
          <li>Name and contact information (email address, phone number)</li>
          <li>Account credentials (username and password)</li>
          <li>Profile information (bio, skills, portfolio)</li>
          <li>Payment information (processed securely through Stripe)</li>
          <li>Identity verification documents (when required)</li>
        </ul>
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        2.2 Automatically Collected Information
      </Typography>
      <Typography paragraph>
        When you use our platform, we automatically collect certain information, including:
      </Typography>
      <Typography component="div" paragraph>
        <ul>
          <li>Device information (IP address, browser type, operating system)</li>
          <li>Usage data (pages visited, time spent, features used)</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        3. How We Use Your Information
      </Typography>
      <Typography paragraph>
        We use the information we collect to:
      </Typography>
      <Typography component="div" paragraph>
        <ul>
          <li>Provide, operate, and maintain our platform</li>
          <li>Process transactions and send related information</li>
          <li>Send administrative information, updates, and security alerts</li>
          <li>Respond to your comments, questions, and provide customer service</li>
          <li>Improve and personalize your experience</li>
          <li>Monitor and analyze usage and trends</li>
          <li>Detect, prevent, and address technical issues and fraudulent activity</li>
          <li>Comply with legal obligations</li>
        </ul>
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        4. Information Sharing and Disclosure
      </Typography>
      <Typography paragraph>
        We may share your information in the following situations:
      </Typography>
      <Typography component="div" paragraph>
        <ul>
          <li><strong>With Other Users:</strong> Your profile information is visible to other users to facilitate connections</li>
          <li><strong>Service Providers:</strong> We share information with third-party vendors who perform services on our behalf (payment processing, data analysis, email delivery)</li>
          <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          <li><strong>With Your Consent:</strong> We may share your information for any other purpose with your consent</li>
        </ul>
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        5. Data Security
      </Typography>
      <Typography paragraph>
        We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        6. Your Privacy Rights
      </Typography>
      <Typography paragraph>
        Depending on your location, you may have the following rights:
      </Typography>
      <Typography component="div" paragraph>
        <ul>
          <li>Access and receive a copy of your personal information</li>
          <li>Correct inaccurate or incomplete information</li>
          <li>Request deletion of your personal information</li>
          <li>Object to or restrict processing of your information</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        7. Cookies and Tracking Technologies
      </Typography>
      <Typography paragraph>
        We use cookies and similar tracking technologies to track activity on our platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        8. Third-Party Links
      </Typography>
      <Typography paragraph>
        Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        9. Children's Privacy
      </Typography>
      <Typography paragraph>
        Our platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        10. International Data Transfers
      </Typography>
      <Typography paragraph>
        Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        11. Changes to This Privacy Policy
      </Typography>
      <Typography paragraph>
        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        12. Contact Us
      </Typography>
      <Typography paragraph>
        If you have questions or concerns about this Privacy Policy, please contact us at:
      </Typography>
      <Typography paragraph>
        Email: privacy@talenthive.com<br />
        Address: 123 Business Street, San Francisco, CA 94105
      </Typography>

      <Box sx={{ mt: 6, p: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          By using TalentHive, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
        </Typography>
      </Box>
    </Container>
  );
};

export default PrivacyPolicyPage;
