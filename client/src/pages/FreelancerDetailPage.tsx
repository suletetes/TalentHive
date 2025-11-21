import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Grid,
  Avatar,
  Rating,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Link as MuiLink,
} from '@mui/material';
import {
  LocationOn,
  Verified,
  Work,
  School,
  Language,
  CardMembership,
  OpenInNew,
} from '@mui/icons-material';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFreelancer } from '@/hooks/api/useUsers';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { format } from 'date-fns';
import { HireNowModal } from '@/components/hire-now/HireNowModal';
import { MessageButton } from '@/components/messaging/MessageButton';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export const FreelancerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: freelancerResponse, isLoading, error } = useFreelancer(id || '');
  const [hireNowModalOpen, setHireNowModalOpen] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const isClient = user?.role === 'client';

  // Fetch reviews for this freelancer
  const { data: reviewsData } = useQuery({
    queryKey: ['freelancer-reviews', id],
    queryFn: async () => {
      const response = await apiService.get(`/reviews/freelancer/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !freelancerResponse?.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Freelancer not found
        </Typography>
      </Container>
    );
  }

  const freelancer = freelancerResponse.data;
  const reviews = reviewsData || [];

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), 'MMM yyyy');
    } catch {
      return 'Present';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 3, mb: 4 }}>
          <Avatar
            src={freelancer.profile.avatar}
            sx={{ width: 120, height: 120 }}
          >
            {freelancer.profile.firstName[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h4">
                {freelancer.profile.firstName} {freelancer.profile.lastName}
              </Typography>
              {freelancer.isVerified && (
                <Verified color="primary" />
              )}
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {freelancer.freelancerProfile?.title || 'Freelancer'}
            </Typography>
            {freelancer.profile.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {freelancer.profile.location}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Rating value={freelancer.rating?.average || 0} readOnly precision={0.1} />
              <Typography variant="body2">
                {(freelancer.rating?.average || 0).toFixed(1)} ({freelancer.rating?.count || 0} reviews)
              </Typography>
            </Box>
            <Chip
              label={freelancer.freelancerProfile?.availability?.status || 'Available'}
              color={freelancer.freelancerProfile?.availability?.status === 'available' ? 'success' : 'default'}
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" color="primary" gutterBottom>
              ${freelancer.freelancerProfile?.hourlyRate || 0}/hr
            </Typography>
            {isClient && (
              <>
                <Button 
                  variant="contained" 
                  size="large" 
                  sx={{ mb: 1 }}
                  onClick={() => setHireNowModalOpen(true)}
                >
                  Hire Now
                </Button>
                <MessageButton 
                  userId={freelancer._id} 
                  size="large" 
                  fullWidth 
                />
              </>
            )}
          </Box>
        </Box>

        {/* About Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            About
          </Typography>
          <Typography variant="body1">
            {freelancer.profile.bio || 'No bio available'}
          </Typography>
        </Box>

        {/* Skills Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Skills
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {freelancer.freelancerProfile?.skills?.map((skill: string) => (
              <Chip key={skill} label={skill} variant="outlined" />
            )) || <Typography variant="body2" color="text.secondary">No skills listed</Typography>}
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Statistics Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Projects Completed:</Typography>
                  <Typography fontWeight="bold">
                    {freelancer.freelancerProfile?.portfolio?.length || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Total Reviews:</Typography>
                  <Typography fontWeight="bold">
                    {freelancer.rating?.count || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Average Rating:</Typography>
                  <Typography fontWeight="bold">
                    {freelancer.rating?.count > 0 
                      ? `${(freelancer.rating.average || 0).toFixed(1)}/5.0`
                      : 'No ratings yet'
                    }
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Skills:</Typography>
                  <Typography fontWeight="bold">
                    {freelancer.freelancerProfile?.skills?.length || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Member Since:</Typography>
                  <Typography fontWeight="bold">
                    {new Date(freelancer.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Work Experience Section */}
        {freelancer.freelancerProfile?.workExperience && freelancer.freelancerProfile.workExperience.length > 0 && (
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Work color="primary" />
                  <Typography variant="h6">Work Experience</Typography>
                </Box>
                <List>
                  {freelancer.freelancerProfile.workExperience.map((exp: any, index: number) => (
                    <Box key={exp._id || index}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Typography variant="h6" component="div">
                              {exp.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body1" color="text.primary" component="div">
                                {exp.company}
                                {exp.location && ` • ${exp.location}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="div">
                                {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                              </Typography>
                              {exp.description && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {exp.description}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      {index < freelancer.freelancerProfile.workExperience.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Education Section */}
        {freelancer.freelancerProfile?.education && freelancer.freelancerProfile.education.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <School color="primary" />
                  <Typography variant="h6">Education</Typography>
                </Box>
                <List>
                  {freelancer.freelancerProfile.education.map((edu: any, index: number) => (
                    <Box key={edu._id || index}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Typography variant="h6" component="div">
                              {edu.degree}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body1" color="text.primary" component="div">
                                {edu.institution}
                                {edu.fieldOfStudy && ` • ${edu.fieldOfStudy}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="div">
                                {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                              </Typography>
                              {edu.description && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {edu.description}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      {index < freelancer.freelancerProfile.education.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Languages Section */}
        {freelancer.freelancerProfile?.languages && freelancer.freelancerProfile.languages.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Language color="primary" />
                  <Typography variant="h6">Languages</Typography>
                </Box>
                <List>
                  {freelancer.freelancerProfile.languages.map((lang: any, index: number) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={lang.language}
                        secondary={lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Certifications Section */}
        {freelancer.freelancerProfile?.certifications && freelancer.freelancerProfile.certifications.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CardMembership color="primary" />
                  <Typography variant="h6">Certifications</Typography>
                </Box>
                <List>
                  {freelancer.freelancerProfile.certifications.map((cert: any, index: number) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={cert.name}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" component="div">
                              {cert.issuer} • {formatDate(cert.dateEarned)}
                            </Typography>
                            {cert.verificationUrl && (
                              <MuiLink
                                href={cert.verificationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                              >
                                Verify <OpenInNew fontSize="small" />
                              </MuiLink>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Portfolio Section */}
        {freelancer.freelancerProfile?.portfolio && freelancer.freelancerProfile.portfolio.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Portfolio
                </Typography>
                <Grid container spacing={2}>
                  {freelancer.freelancerProfile.portfolio.map((item: any) => (
                    <Grid item xs={12} sm={6} md={4} key={item._id}>
                      <Card variant="outlined">
                        {item.images && item.images.length > 0 && (
                          <Box
                            component="img"
                            src={item.images[0]}
                            alt={item.title}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                            }}
                          />
                        )}
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {item.description}
                          </Typography>
                          {item.technologies && item.technologies.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              {item.technologies.map((tech: string) => (
                                <Chip key={tech} label={tech} size="small" />
                              ))}
                            </Box>
                          )}
                          {item.projectUrl && (
                            <MuiLink
                              href={item.projectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                            >
                              View Project <OpenInNew fontSize="small" />
                            </MuiLink>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reviews ({reviews.length})
                </Typography>
                <List>
                  {reviews.map((review: any, index: number) => (
                    <Box key={review._id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Avatar src={review.client?.profile?.avatar} sx={{ width: 40, height: 40 }}>
                                {review.client?.profile?.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1">
                                  {review.client?.profile?.firstName} {review.client?.profile?.lastName}
                                </Typography>
                                <Rating value={review.rating} readOnly size="small" />
                              </Box>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {review.comment}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {formatDate(review.createdAt)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < reviews.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Hire Now Modal */}
      {isClient && (
        <HireNowModal
          open={hireNowModalOpen}
          onClose={() => setHireNowModalOpen(false)}
          freelancer={freelancer}
        />
      )}
    </Container>
  );
};
