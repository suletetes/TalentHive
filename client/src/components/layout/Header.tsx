import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AccountCircle, Notifications } from '@mui/icons-material';
import { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';

interface NavigationItem {
  label: string;
  path: string;
  roles?: ('admin' | 'freelancer' | 'client')[];
}

const navigationConfig: NavigationItem[] = [
  // Freelancer-specific
  { label: 'Find Work', path: '/projects', roles: ['freelancer'] },
  { label: 'My Proposals', path: '/dashboard/proposals', roles: ['freelancer'] },
  { label: 'My Contracts', path: '/dashboard/contracts', roles: ['freelancer'] },
  
  // Client-specific
  { label: 'Post Project', path: '/dashboard/projects/new', roles: ['client'] },
  { label: 'My Projects', path: '/dashboard/projects', roles: ['client'] },
  { label: 'My Contracts', path: '/dashboard/contracts', roles: ['client'] },
  { label: 'Find Talent', path: '/freelancers', roles: ['client'] },
  
  // Admin-specific
  { label: 'Admin Dashboard', path: '/admin/dashboard', roles: ['admin'] },
  { label: 'Users', path: '/admin/users', roles: ['admin'] },
  { label: 'Projects', path: '/admin/projects', roles: ['admin'] },
  
  // Common authenticated
  { label: 'Messages', path: '/dashboard/messages', roles: ['freelancer', 'client', 'admin'] },
  
  // Unauthenticated
  { label: 'Find Work', path: '/projects' },
  { label: 'Find Talent', path: '/freelancers' },
  { label: 'About', path: '/about' },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  // Filter navigation items based on user role
  const getNavigationItems = () => {
    if (!isAuthenticated || !user) {
      // Show unauthenticated menu
      return navigationConfig.filter(item => !item.roles);
    }
    
    // Show role-specific menu
    return navigationConfig.filter(item => 
      item.roles && item.roles.includes(user.role as any)
    );
  };

  const navItems = getNavigationItems();

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo */}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              mr: 4,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            TalentHive
          </Typography>

          {/* Navigation Links */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                component={Link}
                to={item.path}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* User Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <>
                <IconButton color="inherit">
                  <Notifications />
                </IconButton>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  {user?.profile?.avatar ? (
                    <Avatar
                      src={user.profile.avatar}
                      alt={user.profile.firstName}
                      sx={{ width: 32, height: 32 }}
                    />
                  ) : (
                    <AccountCircle />
                  )}
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={() => { navigate('/dashboard'); handleClose(); }}>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/dashboard/profile'); handleClose(); }}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/dashboard/projects'); handleClose(); }}>
                    My Projects
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/login">
                  Login
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  to="/register"
                  sx={{ ml: 1 }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};