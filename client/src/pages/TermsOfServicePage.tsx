import React from 'react';
import { Box, Container, Typography, Divider } from '@mui/material';

export const TermsOfServicePage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>
        Terms of Service
      </Typography>
      <Typography color="text.secondary" paragraph>
        Last Updated: November 9, 2024
      </Typography>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        1. Acceptance of Terms
      </Typography>
      <Typography paragraph>
        By accessing and using TalentHive ("the Platform"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Platform.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        2. Description of Service
      </Typography>
      <Typography paragraph>
        TalentHive is an online marketplace that connects clients with freelancers for project-based work. We provide the platform and tools to facilitate these connections but are not a party to the actual agreements between clients and freelancers.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        3. User Accounts
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        3.1 Registration
      </Typography>
      <Typography paragraph>
        To use certain features of the Platform, you must register for an account. You agree to:
      </Typography>
      <Typography component="div" paragraph>
        <ul>
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and update your information to keep it accurate</li>
          <li>Maintain the security of your password</li>
          <li>Accept responsibility for all activities under your account</li>
          <li>Notify us immediately of any unauthorized use</li>
        </ul>
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        3.2 Eligibility
      </Typography>
      <Typography paragraph>
        You must be at least 18 years old to use this Platform. By using the Platform, you represent and warrant that you meet this requirement.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        4. User Conduct
      </Typography>
      <Typography paragraph>
        You agree not to:
      </Typography>
      <Typography component="div" paragraph>
        <ul>
          <li>Violate any laws or regulations</li>
          <li>Infringe on intellectual property rights</li>
          <li>Post false, misleading, or fraudulent content</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Attempt to circumvent platform fees</li>
          <li>Use automated systems to access the Platform</li>
          <li>Interfere with the Platform's operation</li>
          <li>Impersonate any person or entity</li>
        </ul>
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        5. Fees and Payments
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        5.1 Platform Fees
      </Typography>
      <Typography paragraph>
        TalentHive charges a service fee of 5% on all transactions. This fee helps us maintain and improve the Platform.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        5.2 Payment Processing
      </Typography>
      <Typography paragraph>
        All payments are processed through our secure payment partner, Stripe. You agree to comply with Stripe's terms and conditions.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        5.3 Escrow System
      </Typography>
      <Typography paragraph>
        Payments for projects are held in escrow and released to freelancers upon milestone approval by the client.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        6. Contracts and Disputes
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        6.1 User Agreements
      </Typography>
      <Typography paragraph>
        Contracts between clients and freelancers are independent agreements. TalentHive is not a party to these contracts and is not responsible for their enforcement.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        6.2 Dispute Resolution
      </Typography>
      <Typography paragraph>
        In the event of a dispute, we encourage users to resolve issues directly. If needed, our support team can provide mediation services. Our decisions in disputes are final.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        7. Intellectual Property
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        7.1 Platform Content
      </Typography>
      <Typography paragraph>
        The Platform and its original content, features, and functionality are owned by TalentHive and are protected by international copyright, trademark, and other intellectual property laws.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        7.2 User Content
      </Typography>
      <Typography paragraph>
        You retain ownership of content you post on the Platform. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your content in connection with the Platform.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        8. Termination
      </Typography>
      <Typography paragraph>
        We may terminate or suspend your account and access to the Platform immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Platform will immediately cease.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        9. Disclaimers
      </Typography>
      <Typography paragraph>
        THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        10. Limitation of Liability
      </Typography>
      <Typography paragraph>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, TALENTHIVE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE PLATFORM.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        11. Indemnification
      </Typography>
      <Typography paragraph>
        You agree to indemnify and hold harmless TalentHive and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising out of your use of the Platform or violation of these Terms.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        12. Governing Law
      </Typography>
      <Typography paragraph>
        These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        13. Changes to Terms
      </Typography>
      <Typography paragraph>
        We reserve the right to modify these Terms at any time. We will notify users of any material changes. Your continued use of the Platform after changes constitutes acceptance of the new Terms.
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        14. Contact Information
      </Typography>
      <Typography paragraph>
        If you have questions about these Terms, please contact us at:
      </Typography>
      <Typography paragraph>
        Email: legal@talenthive.com<br />
        Address: 123 Business Street, San Francisco, CA 94105
      </Typography>

      <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          By using TalentHive, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </Typography>
      </Box>
    </Container>
  );
};
