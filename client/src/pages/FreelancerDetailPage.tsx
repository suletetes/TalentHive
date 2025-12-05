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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  LocationOn,
  Verified,
  Work,
  School,
  Language,
  CardMembership,
  OpenInNew,
  Storefront,
  AccessTime,
  Refresh,
  CheckCircle,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
  const [selectedService, setSelectedService] = useState<any>(null);
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [requestServiceOpen, setRequestServiceOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const { user } = useSelector((state: RootState) => state.auth);
  const isClient = user?.role === 'client';

  // Request service mutation
  const requestServiceMutation = useMutation({
    mutationFn: async (data: { freelancerId: string; servicePackageId: string; message: string }) => {
      const response = await apiService.post('/hire-now', {
        freelancerId: data.freelancerId,
        title: `Service Request: ${selectedService?.title}`,
        description: data.message || `I would like to request your "${selectedService?.title}" service.`,
        budget: {
          amount: selectedService?.pricing?.amount || selectedService?.pricing?.hourlyRate || 0,
          type: selectedService?.pricing?.type || 'fixed',
        },
        timeline: {
          duration: selectedService?.deliveryTime || 7,
          unit: 'days',
        },
        servicePackageId: data.servicePackageId,
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Service request sent successfully!');
      setRequestServiceOpen(false);
      setRequestMessage('');
      setSelectedService(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send request');
    },
  });

  // Fetch service packages for this freelancer
  const { data: servicesData } = useQuery({
    queryKey: ['freelancer-services', id],
    queryFn: async () => {
      const response = await apiService.get(`/services/packages?freelancerId=${id}`);
      const data = response.data?.data?.packages || response.data?.packages || response.data || [];
      return Array.isArray(data) ? data : [];
    },
    enabled: !!id,
  });

  // Fetch reviews for this freelancer
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['freelancer-reviews', id],
    queryFn: async () => {
      console.log(`[FREELANCER REVIEWS] Fetching reviews for freelancer: ${id}`);
      try {
        const response = await apiService.get(`/reviews/freelancer/${id}`);
        console.log(`[FREELANCER REVIEWS] Response:`, response.data);
        // Handle both response structures
        const reviews = response.data?.data || response.data || [];
        console.log(`[FREELANCER REVIEWS] Parsed reviews:`, reviews);
        console.log(`[FREELANCER REVIEWS] Is array:`, Array.isArray(reviews));
        console.log(`[FREELANCER REVIEWS] Count:`, Array.isArray(reviews) ? reviews.length : 0);
        return Array.isArray(reviews) ? reviews : [];
      } catch (error) {
        console.error(`[FREELANCER REVIEWS ERROR]`, error);
        throw error;
      }
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
  const services = servicesData || [];

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

        {/* Service Packages Section */}
        {services.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Storefront color="primary" />
                  <Typography variant="h6">Service Packages</Typography>
                </Box>
                <Grid container spacing={2}>
                  {services.map((pkg: any) => (
                    <Grid item xs={12} sm={6} md={4} key={pkg._id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {pkg.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                            {pkg.description?.slice(0, 100)}{pkg.description?.length > 100 ? '...' : ''}
                          </Typography>
                          <Typography variant="h5" color="primary" gutterBottom>
                            {pkg.pricing?.type === 'hourly'
                              ? `$${pkg.pricing?.hourlyRate || 0}/hr`
                              : `$${pkg.pricing?.amount || 0}`}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {pkg.deliveryTime} days
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Refresh fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {pkg.revisions} revisions
                              </Typography>
                            </Box>
                          </Box>
                          {pkg.features?.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              {pkg.features.slice(0, 3).map((feature: string, idx: number) => (
                                <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CheckCircle fontSize="small" color="success" /> {feature}
                                </Typography>
                              ))}
                              {pkg.features.length > 3 && (
                                <Typography variant="body2" color="text.secondary">
                                  +{pkg.features.length - 3} more features
                                </Typography>
                              )}
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => { setSelectedService(pkg); setServiceDetailOpen(true); }}
                            >
                              View Details
                            </Button>
                            {isClient && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => { setSelectedService(pkg); setRequestServiceOpen(true); }}
                              >
                                Request
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Work Experience Section - ISSUE #5 FIX: Changed to full width */}
        {freelancer.freelancerProfile?.workExperience && freelancer.freelancerProfile.workExperience.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Work color="primary" />
                  <Typography variant="h6">Work Experience</Typography>
                </Box>
                <List>
                  {freelancer.freelancerProfile.workExperience.map((exp: any, index: number) => (
                    <Box key={exp._id || index}>
                      <ListItem alignItems="flex-start" sx={{ px: 0, display: 'block' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {exp.title}
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                          {exp.company}
                          {exp.location && ` • ${exp.location}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                        </Typography>
                        {exp.description && (
                          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                            {exp.description}
                          </Typography>
                        )}
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
                      <ListItem alignItems="flex-start" sx={{ px: 0, display: 'block' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {edu.degree}
                        </Typography>
                        <Typography variant="body1" color="text.primary" sx={{ mb: 0.5 }}>
                          {edu.institution}
                          {edu.fieldOfStudy && ` • ${edu.fieldOfStudy}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                        </Typography>
                        {edu.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {edu.description}
                          </Typography>
                        )}
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
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
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
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Reviews ({reviews.length})
                </Typography>
                {reviews.length > 5 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.location.href = `/freelancer/${id}/reviews`}
                  >
                    View All Reviews
                  </Button>
                )}
              </Box>
              {reviewsLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading reviews...
                </Typography>
              ) : reviews.length > 0 ? (
                <>
                  <List>
                    {reviews.slice(0, 5).map((review: any, index: number) => (
                      <Box key={review._id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Avatar src={review.client?.profile?.avatar || review.reviewer?.profile?.avatar} sx={{ width: 40, height: 40 }}>
                                  {(review.client?.profile?.firstName || review.reviewer?.profile?.firstName)?.[0]}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1">
                                    {review.client?.profile?.firstName || review.reviewer?.profile?.firstName}{' '}
                                    {review.client?.profile?.lastName || review.reviewer?.profile?.lastName}
                                  </Typography>
                                  <Rating value={review.rating} readOnly size="small" />
                                </Box>
                              </Box>
                            }
                            secondary={
                              <Box component="span">
                                <Typography variant="body2" component="span" sx={{ mt: 1, display: 'block' }}>
                                  {review.feedback || review.comment}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" component="span" sx={{ mt: 1, display: 'block' }}>
                                  {formatDate(review.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < Math.min(5, reviews.length) - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                  {reviews.length > 5 && (
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Button
                        variant="text"
                        onClick={() => window.location.href = `/freelancer/${id}/reviews`}
                      >
                        Load More Reviews ({reviews.length - 5} more)
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No reviews yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hire Now Modal */}
      {isClient && (
        <HireNowModal
          open={hireNowModalOpen}
          onClose={() => setHireNowModalOpen(false)}
          freelancer={freelancer}
        />
      )}

      {/* Service Detail Dialog */}
      <Dialog
        open={serviceDetailOpen}
        onClose={() => setServiceDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedService?.title}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            {selectedService?.description}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Price</Typography>
              <Typography variant="h5" color="primary">
                ${selectedService?.pricing?.type === 'hourly'
                  ? `${selectedService?.pricing?.hourlyRate}/hr`
                  : selectedService?.pricing?.amount}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Delivery</Typography>
              <Typography variant="h6">{selectedService?.deliveryTime} days</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Revisions</Typography>
              <Typography variant="h6">{selectedService?.revisions}</Typography>
            </Box>
          </Box>

          {selectedService?.features?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>What's Included:</Typography>
              {selectedService.features.map((feature: string, idx: number) => (
                <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CheckCircle fontSize="small" color="success" /> {feature}
                </Typography>
              ))}
            </Box>
          )}

          {selectedService?.requirements?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Requirements:</Typography>
              {selectedService.requirements.map((req: string, idx: number) => (
                <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>• {req}</Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDetailOpen(false)}>Close</Button>
          {isClient && (
            <Button
              variant="contained"
              onClick={() => {
                setServiceDetailOpen(false);
                setRequestServiceOpen(true);
              }}
            >
              Request This Service
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Request Service Dialog */}
      <Dialog
        open={requestServiceOpen}
        onClose={() => setRequestServiceOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Service: {selectedService?.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Price:</strong> ${selectedService?.pricing?.amount || selectedService?.pricing?.hourlyRate}
              {selectedService?.pricing?.type === 'hourly' ? '/hr' : ''}
            </Typography>
            <Typography variant="body2">
              <strong>Delivery:</strong> {selectedService?.deliveryTime} days
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Message to Freelancer"
            multiline
            rows={4}
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="Describe your project requirements or any specific details..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestServiceOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => requestServiceMutation.mutate({
              freelancerId: id!,
              servicePackageId: selectedService?._id,
              message: requestMessage,
            })}
            disabled={requestServiceMutation.isPending}
          >
            {requestServiceMutation.isPending ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
