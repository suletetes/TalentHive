import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
} from '@mui/material';
import { FormatQuote } from '@mui/icons-material';

const stories = [
  {
    name: 'Sarah Johnson',
    role: 'Freelance Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    rating: 5,
    category: 'Design',
    story: 'TalentHive changed my career completely. I went from struggling to find clients to having a steady stream of high-quality projects. In my first year, I earned over $80,000 and built relationships with amazing clients from around the world.',
    achievement: 'Earned $80K+ in first year',
  },
  {
    name: 'Michael Chen',
    role: 'Software Developer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    rating: 5,
    category: 'Development',
    story: 'As a developer, I wanted flexibility and interesting projects. TalentHive gave me both. I\'ve worked on everything from mobile apps to enterprise systems, all while maintaining a work-life balance that traditional employment never offered.',
    achievement: '50+ successful projects',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Marketing Consultant',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    rating: 5,
    category: 'Marketing',
    story: 'I started on TalentHive as a side hustle and within 6 months, I was able to quit my day job. The platform\'s escrow system gave me confidence, and the quality of clients has been exceptional. I\'ve never looked back.',
    achievement: 'Built full-time business in 6 months',
  },
  {
    name: 'David Park',
    role: 'CEO, TechStart Inc.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    rating: 5,
    category: 'Client Success',
    story: 'As a startup founder, I needed top talent without the overhead of full-time employees. TalentHive connected me with incredible freelancers who helped build our MVP. We launched in 3 months and recently secured Series A funding.',
    achievement: 'Launched MVP in 3 months',
  },
  {
    name: 'Lisa Thompson',
    role: 'Content Writer',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop',
    rating: 5,
    category: 'Writing',
    story: 'After having my second child, I needed a career that offered flexibility. TalentHive allowed me to work from home, choose my hours, and still earn a great income. I\'ve written for Fortune 500 companies while being present for my family.',
    achievement: 'Perfect work-life balance',
  },
  {
    name: 'James Wilson',
    role: 'Video Editor',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    rating: 5,
    category: 'Video Production',
    story: 'I was working in a traditional production house when I discovered TalentHive. Now I work with clients globally, earn 3x more, and have creative freedom I never had before. The platform\'s payment protection is a game-changer.',
    achievement: 'Tripled income',
  },
];

export const SuccessStoriesPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h3" gutterBottom>
          Success Stories
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Real stories from real people who have transformed their careers and businesses through TalentHive
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {stories.map((story, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    src={story.avatar}
                    sx={{ width: 64, height: 64, mr: 2 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{story.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {story.role}
                    </Typography>
                    <Rating value={story.rating} readOnly size="small" sx={{ mt: 0.5 }} />
                  </Box>
                  <Chip label={story.category} color="primary" size="small" />
                </Box>

                <Box sx={{ position: 'relative', mb: 2 }}>
                  <FormatQuote
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: -10,
                      fontSize: 40,
                      color: 'primary.light',
                      opacity: 0.3,
                    }}
                  />
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic', pl: 2 }}
                  >
                    {story.story}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" color="primary">
                    Key Achievement
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {story.achievement}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Card sx={{ p: 6, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" gutterBottom>
            Your Success Story Starts Here
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Join thousands of professionals who have transformed their careers with TalentHive
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ px: 3 }}>
              <strong>1M+</strong> Users
            </Typography>
            <Typography variant="h5" sx={{ px: 3 }}>
              <strong>500K+</strong> Projects
            </Typography>
            <Typography variant="h5" sx={{ px: 3 }}>
              <strong>$100M+</strong> Earned
            </Typography>
          </Box>
        </Card>
      </Box>
    </Container>
  );
};
