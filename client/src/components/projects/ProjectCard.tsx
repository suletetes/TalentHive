import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Schedule,
  AttachMoney,
  Visibility,
  Bookmark,
  BookmarkBorder,
  Flag,
  Person,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// Helper function to get category display name
const getCategoryDisplay = (category: any): string => {
  if (!category) return 'General';
  
  // If category is an object with name property (populated)
  if (typeof category === 'object' && category?.name) {
    return category.name;
  }
  
  // If category is a string
  if (typeof category === 'string') {
    // Check if it looks like a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[a-f\d]{24}$/i.test(category);
    if (isObjectId) {
      return 'General'; // Return default instead of showing ID
    }
    // It's a regular string (category name)
    return category;
  }
  
  return 'General';
};

// Helper function to get skill display name
const getSkillDisplay = (skill: any): string => {
  if (!skill) return '';
  
  // If skill is an object with name property (populated)
  if (typeof skill === 'object' && skill?.name) {
    return skill.name;
  }
  
  // If skill is a string
  if (typeof skill === 'string') {
    // Check if it looks like a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[a-f\d]{24}$/i.test(skill);
    if (isObjectId) {
      return ''; // Return empty to filter out
    }
    return skill;
  }
  
  return '';
};

interface ProjectCardProps {
  project: {
    _id: string;
    title: string;
    description: string;
    category: string;
    skills: string[];
    budget: {
      type: 'fixed' | 'hourly';
      min: number;
      max: number;
    };
    timeline: {
      duration: number;
      unit: 'days' | 'weeks' | 'months';
    };
    client: {
      _id: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
      rating: {
        average: number;
        count: number;
      };
      clientProfile?: {
        companyName?: string;
      };
    };
    proposalCount?: number;
    viewCount: number;
    isUrgent: boolean;
    isFeatured: boolean;
    status?: string;
    isDraft?: boolean;
    createdAt: string;
    applicationDeadline?: string;
  };
  onBookmark?: (projectId: string) => void;
  isBookmarked?: boolean;
  showBookmark?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onBookmark,
  isBookmarked = false,
  showBookmark = false,
}) => {
  // Log category and skills for debugging
  React.useEffect(() => {
    console.log(`[PROJECT CARD] Project: ${project.title}`);
    console.log(`[PROJECT CARD] Category:`, project.category);
    console.log(`[PROJECT CARD] Category type:`, typeof project.category);
    if (typeof project.category === 'object') {
      console.log(`[PROJECT CARD] Category name:`, project.category?.name);
    }
    console.log(`[PROJECT CARD] Skills:`, project.skills);
    console.log(`[PROJECT CARD] Skills type:`, typeof project.skills);
  }, [project._id]);

  const getBudgetDisplay = () => {
    const { type, min, max } = project.budget;
    const suffix = type === 'hourly' ? '/hr' : '';
    return min === max ? `$${min}${suffix}` : `$${min} - $${max}${suffix}`;
  };

  const getTimelineDisplay = () => {
    const { duration, unit } = project.timeline;
    return `${duration} ${unit}`;
  };

  const isDeadlineApproaching = () => {
    if (!project.applicationDeadline) return false;
    const deadline = new Date(project.applicationDeadline);
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff <= 3 && daysDiff > 0;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease',
        border: project.isFeatured ? '2px solid' : '1px solid',
        borderColor: project.isFeatured ? 'primary.main' : 'divider',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      {/* Draft Badge */}
      {(project.isDraft || project.status === 'draft') && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'warning.main',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 1,
          }}
        >
          DRAFT
        </Box>
      )}

      {/* Featured Badge */}
      {project.isFeatured && !(project.isDraft || project.status === 'draft') && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'primary.main',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 1,
          }}
        >
          FEATURED
        </Box>
      )}

      {/* Bookmark Button */}
      {showBookmark && onBookmark && (
        <IconButton
          onClick={() => onBookmark(project._id)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'grey.100' },
            zIndex: 1,
          }}
          size="small"
        >
          {isBookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
        </IconButton>
      )}

      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            {project.isUrgent && (
              <Tooltip title="Urgent project">
                <Flag color="warning" fontSize="small" />
              </Tooltip>
            )}
            <Typography variant="body2" color="text.secondary">
              {getCategoryDisplay(project.category)}
            </Typography>
            {isDeadlineApproaching() && (
              <Chip
                label="Deadline Soon"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
          
          <Typography variant="h6" component="h3" gutterBottom>
            {project.title}
          </Typography>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 2,
            }}
          >
            {project.description}
          </Typography>
        </Box>

        {/* Skills */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {project.skills
              .map((skill) => getSkillDisplay(skill))
              .filter((s) => s) // Filter out empty strings (ObjectIds)
              .slice(0, 5)
              .map((skillName) => (
                <Chip
                  key={skillName}
                  label={skillName}
                  size="small"
                  variant="outlined"
                />
              ))}
            {project.skills.filter((s) => getSkillDisplay(s)).length > 5 && (
              <Chip
                label={`+${project.skills.filter((s) => getSkillDisplay(s)).length - 5} more`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
        </Box>

        {/* Budget and Timeline */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <AttachMoney fontSize="small" color="action" />
            <Typography variant="body2" fontWeight="medium">
              {getBudgetDisplay()}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={0.5}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {getTimelineDisplay()}
            </Typography>
          </Box>
        </Box>

        {/* Client Info */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              src={project.client?.profile?.avatar}
              alt={`${project.client?.profile?.firstName || ''} ${project.client?.profile?.lastName || ''}`}
              sx={{ width: 24, height: 24 }}
            >
              {project.client?.profile?.firstName?.[0] || 'C'}
            </Avatar>
            <Typography variant="body2">
              {project.client?.clientProfile?.companyName ||
                `${project.client?.profile?.firstName || ''} ${project.client?.profile?.lastName || ''}`}
            </Typography>
            {project.client?.rating?.count > 0 && (
              <Typography variant="body2" color="text.secondary">
                ★ {project.client.rating.average.toFixed(1)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Stats */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Person fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {project.proposalCount || 0} proposals
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={0.5}>
            <Visibility fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {project.viewCount} views
            </Typography>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
          </Typography>
        </Box>

        {/* Deadline */}
        {project.applicationDeadline && (
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Deadline: {new Date(project.applicationDeadline).toLocaleDateString()}
          </Typography>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            component={Link}
            to={`/projects/${project._id}`}
            fullWidth
            size="small"
          >
            View Details
          </Button>
          
          {/* View Proposals Button for Clients */}
          {project.proposalCount > 0 && project.client && (
            <Button
              variant="outlined"
              component={Link}
              to={`/dashboard/projects/${project._id}/proposals`}
              fullWidth
              size="small"
              color="secondary"
            >
              Proposals ({project.proposalCount})
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};