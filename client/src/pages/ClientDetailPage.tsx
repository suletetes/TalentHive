import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Grid,
  Avatar,
  Rating,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Pagination,
} from '@mui/material';
import {
  LocationOn,
  Verified,
  Business,
  Work,
  AttachMoney,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiService } from '@/services/api';
import { format } from 'date-fns';
import { MessageButton } from '@/components/messaging/MessageButton';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const PROJECTS_PER_PAGE = 5;
const REVIEWS_PER_PAGE = 5;

export const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isFreelancer = user?.role === 'freelancer';
  
  const [projectsPage, setProjectsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);

  // Fetch client profile data (includes user, stats, projects from backend)
  const { data: clientResponse, isLoading, error } = useQuery({
    queryKey: ['client-profile', id],
    queryFn: async () => {
      const response = await apiService.get(`/users/clients/${id}/profile`);
      // Backend returns { success: true, data: { user, stats, ratingDistribution, projects } }
      return response.data?.data || response.data || response;
    },
    enabled: !!id,
  });

  // Fetch reviews given by this client
  const { data: reviewsData } = useQuery({
    queryKey: ['client-reviews', id],
    queryFn: async () => {
      const response = await apiService.get(`/reviews/client/${id}`);
      const reviews = response.data?.data || response.data || [];
      return Array.isArray(reviews) ? reviews : [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !clientResponse) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Client not found
        </Typography>
      </Container>
    );
  }

  // Extract data from the response
  const client = clientResponse.user || clientResponse;
  const stats = clientResponse.stats || {};
  const projects = clientResponse.projects || [];
  const reviews = reviewsData || [];

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), 'MMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 3, mb: 4 }}>
          <Avatar
            src={client.profile?.avatar}
            sx={{ width: 120, height: 120, bgcolor: 'primary.main' }}
          >
            {client.profile?.firstName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h4">
                {client.profile?.firstName} {client.profile?.lastName}
              </Typography>
              {client.isVerified && <Verified color="primary" />}
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {client.clientProfile?.companyName || 'Client'}
            </Typography>
            {client.profile?.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {client.profile.location}
                </Typography>
              </Box>
            )}
            {(client.rating?.count || 0) > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Rating value={client.rating?.average || 0} readOnly precision={0.1} />
                <Typography variant="body2">
                  {(client.rating?.average || 0).toFixed(1)} ({client.rating?.count || 0} reviews from freelancers)
                </Typography>
              </Box>
            )}
            {client.clientProfile?.industry && (
              <Chip
                icon={<Business />}
                label={client.clientProfile.industry}
                variant="outlined"
              />
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {isFreelancer && (
              <MessageButton userId={client._id} size="large" />
            )}
          </Box>
        </Box>

        {/* About Section */}
        {client.profile?.bio && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Typography variant="body1">
              {client.profile.bio}
            </Typography>
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Statistics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Projects Posted:</Typography>
                  <Typography fontWeight="bold">{stats.totalProjects || projects.length}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Completed Projects:</Typography>
                  <Typography fontWeight="bold">{stats.completedProjects || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Total Reviews:</Typography>
                  <Typography fontWeight="bold">{stats.totalReviews || client.rating?.count || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Average Rating:</Typography>
                  <Typography fontWeight="bold">
                    {(stats.totalReviews || client.rating?.count) > 0
                      ? `${(stats.averageRating || client.rating?.average || 0).toFixed(1)}/5.0`
                      : 'No ratings yet'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Member Since:</Typography>
                  <Typography fontWeight="bold">
                    {formatDate(client.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Posted Projects */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Work color="primary" />
                <Typography variant="h6">Posted Projects ({projects.length})</Typography>
              </Box>
              {projects.length > 0 ? (
                <>
                  <List>
                    {projects
                      .slice((projectsPage - 1) * PROJECTS_PER_PAGE, projectsPage * PROJECTS_PER_PAGE)
                      .map((project: any, index: number) => (
                        <Box key={project._id}>
                          <ListItem
                            sx={{ px: 0, cursor: 'pointer' }}
                            onClick={() => navigate(`/projects/${project._id}`)}
                          >
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {project.title}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {project.description?.slice(0, 150)}
                                    {project.description?.length > 150 ? '...' : ''}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Chip
                                      size="small"
                                      label={project.status}
                                      color={project.status === 'completed' ? 'success' : 'default'}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <AttachMoney fontSize="small" />
                                      <Typography variant="body2">
                                        ${project.budget?.min} - ${project.budget?.max}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < Math.min(PROJECTS_PER_PAGE, projects.slice((projectsPage - 1) * PROJECTS_PER_PAGE, projectsPage * PROJECTS_PER_PAGE).length) - 1 && <Divider />}
                        </Box>
                      ))}
                  </List>
                  {Math.ceil(projects.length / PROJECTS_PER_PAGE) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Pagination
                        count={Math.ceil(projects.length / PROJECTS_PER_PAGE)}
                        page={projectsPage}
                        onChange={(e, value) => setProjectsPage(value)}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No projects posted yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Reviews Given */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reviews Given ({reviews.length})
              </Typography>
              {reviews.length > 0 ? (
                <>
                  <List>
                    {reviews
                      .slice((reviewsPage - 1) * REVIEWS_PER_PAGE, reviewsPage * REVIEWS_PER_PAGE)
                      .map((review: any, index: number) => (
                        <Box key={review._id}>
                          <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Avatar
                                    src={review.freelancer?.profile?.avatar}
                                    sx={{ width: 40, height: 40 }}
                                  >
                                    {review.freelancer?.profile?.firstName?.[0]}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle1">
                                      {review.freelancer?.profile?.firstName}{' '}
                                      {review.freelancer?.profile?.lastName}
                                    </Typography>
                                    <Rating value={review.rating} readOnly size="small" />
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <Box component="span">
                                  <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                                    {review.feedback || review.comment}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    component="span"
                                    sx={{ display: 'block', mt: 1 }}
                                  >
                                    {formatDate(review.createdAt)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < Math.min(REVIEWS_PER_PAGE, reviews.slice((reviewsPage - 1) * REVIEWS_PER_PAGE, reviewsPage * REVIEWS_PER_PAGE).length) - 1 && <Divider />}
                        </Box>
                      ))}
                  </List>
                  {Math.ceil(reviews.length / REVIEWS_PER_PAGE) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Pagination
                        count={Math.ceil(reviews.length / REVIEWS_PER_PAGE)}
                        page={reviewsPage}
                        onChange={(e, value) => setReviewsPage(value)}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No reviews given yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
