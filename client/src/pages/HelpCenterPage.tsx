import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import { ExpandMore, Search, Help, Payment, Work, Person } from '@mui/icons-material';

const faqs = [
  {
    category: 'Getting Started',
    icon: <Help />,
    questions: [
      {
        question: 'How do I create an account?',
        answer: 'Click on the "Sign Up" button in the top right corner and choose whether you want to register as a client or freelancer. Fill in your details and verify your email address to get started.',
      },
      {
        question: 'Is TalentHive free to use?',
        answer: 'Creating an account and browsing projects is completely free. We charge a small platform fee on completed transactions to maintain and improve our services.',
      },
      {
        question: 'How do I find the right freelancer?',
        answer: 'Post your project with detailed requirements, review proposals from interested freelancers, check their portfolios and ratings, and interview candidates before making your decision.',
      },
    ],
  },
  {
    category: 'Payments',
    icon: <Payment />,
    questions: [
      {
        question: 'How does the escrow system work?',
        answer: 'When you fund a milestone, the money is held securely in escrow. It\'s only released to the freelancer once you approve the completed work, ensuring protection for both parties.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, debit cards, and bank transfers through our secure payment processor Stripe.',
      },
      {
        question: 'When do freelancers get paid?',
        answer: 'Freelancers receive payment once the client approves the milestone. Funds are typically available within 2-5 business days depending on the payout method.',
      },
    ],
  },
  {
    category: 'For Freelancers',
    icon: <Work />,
    questions: [
      {
        question: 'How do I submit a proposal?',
        answer: 'Browse available projects, click on one that matches your skills, and click "Submit Proposal". Write a compelling cover letter explaining why you\'re the best fit and set your price.',
      },
      {
        question: 'How can I improve my profile?',
        answer: 'Add a professional photo, complete your portfolio with past work samples, get verified skills, maintain a high rating by delivering quality work, and respond promptly to messages.',
      },
      {
        question: 'What are the platform fees?',
        answer: 'We charge a 5% service fee on your earnings. This helps us maintain the platform, provide customer support, and ensure secure payments.',
      },
    ],
  },
  {
    category: 'Account & Profile',
    icon: <Person />,
    questions: [
      {
        question: 'How do I verify my account?',
        answer: 'Go to your account settings and complete the verification process by providing a valid ID and proof of address. Verified accounts build more trust with clients.',
      },
      {
        question: 'Can I have both client and freelancer accounts?',
        answer: 'Yes! You can switch between client and freelancer modes from your dashboard. This is useful if you want to both hire and offer services.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Account > Delete Account. Please note this action is permanent and all your data will be removed after 30 days.',
      },
    ],
  },
];

export const HelpCenterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" gutterBottom>
          Help Center
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Find answers to common questions and get the help you need
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ maxWidth: 600, mx: 'auto' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {faqs.map((category, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ textAlign: 'center', p: 2, height: '100%' }}>
              <Box sx={{ color: 'primary.main', mb: 1 }}>
                {category.icon}
              </Box>
              <Typography variant="h6">{category.category}</Typography>
              <Typography variant="body2" color="text.secondary">
                {category.questions.length} articles
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Frequently Asked Questions
        </Typography>
        
        {filteredFaqs.map((category, categoryIndex) => (
          <Box key={categoryIndex} sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              {category.category}
            </Typography>
            {category.questions.map((faq, faqIndex) => (
              <Accordion
                key={faqIndex}
                expanded={expanded === `panel${categoryIndex}-${faqIndex}`}
                onChange={handleChange(`panel${categoryIndex}-${faqIndex}`)}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ))}
      </Box>

      <Card sx={{ mt: 6, p: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" gutterBottom>
          Still need help?
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Can't find what you're looking for? Our support team is here to help.
        </Typography>
        <Typography variant="body2">
          Contact us at support@talenthive.com or visit our Contact page
        </Typography>
      </Card>
    </Container>
  );
};

export default HelpCenterPage;
