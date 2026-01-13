import React, { useEffect } from 'react';
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
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AccountCircle, Message, Menu as MenuIcon, Close } from '@mui/icons-material';
import { RootState } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/api/useMessages';
import { socketService } from '@/services/socket';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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
  { label: 'My Services', path: '/dashboard/services', roles: ['freelancer'] },
  
  // Client-specific
  { label: 'Post Project', path: '/dashboard/projects/new', roles: ['client'] },
  { label: 'My Projects', path: '/dashboard/projects', roles: ['client'] },
  { label: 'My Contracts', path: '/dashboard/contracts', roles: ['client'] },
  { label: 'Hire Now Requests', path: '/dashboard/hire-now-requests', roles: ['client'] },
  { label: 'Find Talent', path: '/freelancers', roles: ['client'] },
  
  // Admin-specific
  { label: 'Admin Dashboard', path: '/admin/dashboard', roles: ['admin'] },
  { label: 'Users', path: '/admin/users', roles: ['admin'] },
  { label: 'Projects', path: '/admin/projects', roles: ['admin'] },
  { label: 'Support Tickets', path: '/admin/support', roles: ['admin'] },
  { label: 'Settings', path: '/admin/settings', roles: ['admin'] },
  
  // Common authenticated
  { label: 'Messages', path: '/dashboard/messages', roles: ['freelancer', 'client', 'admin'] },
  { label: 'Support', path: '/dashboard/support', roles: ['freelancer', 'client'] },
  { label: 'Time Tracking', path: '/dashboard/time-tracking', roles: ['freelancer', 'client'] },
  
  // Unauthenticated
  { label: 'Find Work', path: '/projects' },
  { label: 'Find Talent', path: '/freelancers' },
  { label: 'About', path: '/about' },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const { data: unreadCount, refetch: refetchUnreadCount } = useUnreadCount(isAuthenticated);

  // Ensure unreadCount is a valid number
  const displayUnreadCount = typeof unreadCount === 'number' ? unreadCount : 0;

  useEffect(() => {
    if (isAuthenticated) {
      // Connect socket when authenticated
      if (!socketService.isConnected()) {
        socketService.connect();
      }

      // Listen for new messages to update unread count
      const handleNewMessage = () => {
        refetchUnreadCount();
      };

      const handleMessagesRead = () => {
        refetchUnreadCount();
      };

      socketService.on('new_message', handleNewMessage);
      socketService.on('messages_read', handleMessagesRead);

      return () => {
        socketService.off('new_message', handleNewMessage);
        socketService.off('messages_read', handleMessagesRead);
      };
    }
  }, [isAuthenticated, refetchUnreadCount]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    setMobileDrawerOpen(false);
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleMobileNavClick = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
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

  // Mobile Drawer Component
  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={toggleMobileDrawer}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          TalentHive
        </Typography>
        <IconButton onClick={toggleMobileDrawer}>
          <Close />
        </IconButton>
      </Box>
      <Divider />
      
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton onClick={() => handleMobileNavClick(item.path)}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        
        {isAuthenticated && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleMobileNavClick('/dashboard')}>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleMobileNavClick('/dashboard/profile')}>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleMobileNavClick('/dashboard/messages')}>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Messages
                      {displayUnreadCount > 0 && (
                        <Badge badgeContent={displayUnreadCount} color="error" />
                      )}
                    </Box>
                  } 
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleMobileNavClick('/dashboard/support')}>
                <ListItemText primary="Support" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleMobileNavClick('/change-password')}>
                <ListItemText primary="Change Password" />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        
        {!isAuthenticated && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleMobileNavClick('/login')}>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleMobileNavClick('/register')}>
                <ListItemText primary="Sign Up" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar position="sticky" color="primary" elevation={1}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64 } }}>
            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleMobileDrawer}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                mr: { xs: 2, md: 4 },
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                flexShrink: 0,
              }}
            >
              TalentHive
            </Typography>

            {/* Desktop Navigation Links */}
            <Box sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', md: 'flex' },
              gap: 1,
              overflow: 'hidden',
            }}>
              {navItems.slice(0, 6).map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  sx={{
                    whiteSpace: 'nowrap',
                    minWidth: 'auto',
                    px: 2,
                    fontSize: '0.875rem',
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {navItems.length > 6 && (
                <Button
                  color="inherit"
                  onClick={handleMenu}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  More
                </Button>
              )}
            </Box>

            {/* User Actions */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 0.5, sm: 1 },
              flexShrink: 0,
            }}>
              <ThemeToggle />
              
              {isAuthenticated ? (
                <>
                  {/* Messages - Hide on very small screens */}
                  <IconButton 
                    color="inherit"
                    component={Link}
                    to="/dashboard/messages"
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    <Badge badgeContent={displayUnreadCount} color="error">
                      <Message />
                    </Badge>
                  </IconButton>
                  
                  {/* Notifications - Hide on very small screens */}
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <NotificationBell />
                  </Box>
                  
                  {/* User Menu */}
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    {user?.profile?.avatar ? (
                      <Avatar
                        src={user.profile.avatar}
                        alt={user.profile.firstName}
                        sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}
                      />
                    ) : (
                      <AccountCircle sx={{ fontSize: { xs: 28, sm: 32 } }} />
                    )}
                  </IconButton>
                </>
              ) : (
                <>
                  {/* Desktop Auth Buttons */}
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                    <Button 
                      color="inherit" 
                      component={Link} 
                      to="/login"
                      size="small"
                    >
                      Login
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      component={Link}
                      to="/register"
                      size="small"
                    >
                      Sign Up
                    </Button>
                  </Box>
                  
                  {/* Mobile Auth Button */}
                  <Button
                    variant="outlined"
                    color="inherit"
                    component={Link}
                    to="/login"
                    size="small"
                    sx={{ 
                      display: { xs: 'inline-flex', sm: 'none' },
                      minWidth: 'auto',
                      px: 1,
                    }}
                  >
                    Login
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Desktop User Menu */}
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
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
          }
        }}
      >
        {isAuthenticated ? (
          [
            <MenuItem key="dashboard" onClick={() => { navigate('/dashboard'); handleClose(); }}>
              Dashboard
            </MenuItem>,
            <MenuItem key="profile" onClick={() => { navigate('/dashboard/profile'); handleClose(); }}>
              Profile
            </MenuItem>,
            <MenuItem key="messages" onClick={() => { navigate('/dashboard/messages'); handleClose(); }} sx={{ display: { sm: 'none' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                Messages
                {displayUnreadCount > 0 && (
                  <Badge badgeContent={displayUnreadCount} color="error" />
                )}
              </Box>
            </MenuItem>,
            <MenuItem key="support" onClick={() => { navigate('/dashboard/support'); handleClose(); }}>
              Support
            </MenuItem>,
            <MenuItem key="password" onClick={() => { navigate('/change-password'); handleClose(); }}>
              Change Password
            </MenuItem>,
            <Divider key="divider" />,
            <MenuItem key="logout" onClick={handleLogout}>
              Logout
            </MenuItem>
          ]
        ) : (
          navItems.length > 6 ? navItems.slice(6).map((item) => (
            <MenuItem key={item.path} onClick={() => { navigate(item.path); handleClose(); }}>
              {item.label}
            </MenuItem>
          )) : []
        )}
      </Menu>

      {/* Mobile Drawer */}
      <MobileDrawer />
    </>
  );
};