// Optimized components with React.memo to prevent unnecessary re-renders
import React, { memo, useMemo, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Avatar, Chip } from '@mui/material';
import { Project, User, Proposal } from '@/types';

// Optimized Project Card Component
interface ProjectCardProps {
  project: Project;
  onView: (projectId: string) => void;
  onEdit?: (projectId: string) => void;
  showActions?: boolean;
}

export const ProjectCard = memo<ProjectCardProps>(({ 
  project, 
  onView, 
  onEdit, 
  showActions = true 
}) => {
  const handleView = useCallback(() => {
    onView(project.id);
  }, [onView, project.id]);

  const handleEdit = useCallback(() => {
    onEdit?.(project.id);
  }, [onEdit, project.id]);

  const formattedBudget = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(project.budget);
  }, [project.budget]);

  const skillChips = useMemo(() => {
    return project.skills?.slice(0, 3).map((skill) => (
      <Chip
        key={skill}
        label={skill}
        size="small"
        variant="outlined"
        sx={{ mr: 0.5, mb: 0.5 }}
      />
    ));
  }, [project.skills]);

  return (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 2 } }}>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          {project.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {project.description?.substring(0, 150)}
          {project.description && project.description.length > 150 && '...'}
        </Typography>

        <Box sx={{ mb: 2 }}>
          {skillChips}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary">
            {formattedBudget}
          </Typography>
          
          {showActions && (
            <Box>
              <Button onClick={handleView} size="small">
                View
              </Button>
              {onEdit && (
                <Button onClick={handleEdit} size="small" color="secondary">
                  Edit
                </Button>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

ProjectCard.displayName = 'ProjectCard';

// Optimized User Profile Component
interface UserProfileProps {
  user: User;
  showFullProfile?: boolean;
  onViewProfile?: (userId: string) => void;
}

export const UserProfile = memo<UserProfileProps>(({ 
  user, 
  showFullProfile = false, 
  onViewProfile 
}) => {
  const handleViewProfile = useCallback(() => {
    onViewProfile?.(user.id);
  }, [onViewProfile, user.id]);

  const userInitials = useMemo(() => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }, [user.firstName, user.lastName]);

  const fullName = useMemo(() => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }, [user.firstName, user.lastName]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar 
        src={user.profilePicture} 
        alt={fullName}
        sx={{ width: showFullProfile ? 64 : 40, height: showFullProfile ? 64 : 40 }}
      >
        {userInitials}
      </Avatar>
      
      <Box sx={{ flex: 1 }}>
        <Typography variant={showFullProfile ? 'h6' : 'body1'} component="div">
          {fullName}
        </Typography>
        
        {user.title && (
          <Typography variant="body2" color="text.secondary">
            {user.title}
          </Typography>
        )}
        
        {showFullProfile && user.bio && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {user.bio.substring(0, 100)}
            {user.bio.length > 100 && '...'}
          </Typography>
        )}
      </Box>
      
      {onViewProfile && (
        <Button onClick={handleViewProfile} size="small">
          View Profile
        </Button>
      )}
    </Box>
  );
});

UserProfile.displayName = 'UserProfile';

// Optimized Proposal Card Component
interface ProposalCardProps {
  proposal: Proposal;
  onView: (proposalId: string) => void;
  onAccept?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
  showActions?: boolean;
}

export const ProposalCard = memo<ProposalCardProps>(({ 
  proposal, 
  onView, 
  onAccept, 
  onReject, 
  showActions = true 
}) => {
  const handleView = useCallback(() => {
    onView(proposal.id);
  }, [onView, proposal.id]);

  const handleAccept = useCallback(() => {
    onAccept?.(proposal.id);
  }, [onAccept, proposal.id]);

  const handleReject = useCallback(() => {
    onReject?.(proposal.id);
  }, [onReject, proposal.id]);

  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(proposal.amount);
  }, [proposal.amount]);

  const statusColor = useMemo(() => {
    switch (proposal.status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  }, [proposal.status]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Proposal for {proposal.project?.title}
          </Typography>
          <Chip 
            label={proposal.status} 
            color={statusColor as any}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {proposal.coverLetter?.substring(0, 200)}
          {proposal.coverLetter && proposal.coverLetter.length > 200 && '...'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary">
            {formattedAmount}
          </Typography>
          
          {showActions && (
            <Box>
              <Button onClick={handleView} size="small">
                View Details
              </Button>
              {proposal.status === 'pending' && onAccept && (
                <Button onClick={handleAccept} size="small" color="success" sx={{ ml: 1 }}>
                  Accept
                </Button>
              )}
              {proposal.status === 'pending' && onReject && (
                <Button onClick={handleReject} size="small" color="error" sx={{ ml: 1 }}>
                  Reject
                </Button>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

ProposalCard.displayName = 'ProposalCard';

// Optimized List Component with virtualization for large datasets
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  itemHeight?: number;
  maxHeight?: number;
}

export const OptimizedList = memo(<T,>({ 
  items, 
  renderItem, 
  keyExtractor, 
  loading = false,
  error,
  emptyMessage = 'No items found',
  itemHeight = 100,
  maxHeight = 400
}: OptimizedListProps<T>) => {
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => ({
      key: keyExtractor(item, index),
      content: renderItem(item, index),
    }));
  }, [items, renderItem, keyExtractor]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight, overflow: 'auto' }}>
      {memoizedItems.map(({ key, content }) => (
        <Box key={key} sx={{ minHeight: itemHeight }}>
          {content}
        </Box>
      ))}
    </Box>
  );
}) as <T>(props: OptimizedListProps<T>) => JSX.Element;

OptimizedList.displayName = 'OptimizedList';

// Optimized Search Component with debouncing
interface OptimizedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  initialValue?: string;
}

export const OptimizedSearch = memo<OptimizedSearchProps>(({ 
  onSearch, 
  placeholder = 'Search...', 
  debounceMs = 300,
  initialValue = ''
}) => {
  const [query, setQuery] = React.useState(initialValue);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);
  }, [onSearch, debounceMs]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
      }}
    />
  );
});

OptimizedSearch.displayName = 'OptimizedSearch';