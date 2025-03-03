// src/components/common/Navbar.jsx
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InsightsIcon from '@mui/icons-material/Insights';

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
    handleCloseUserMenu();
  };

  return (
    <AppBar position="static" className="navbar">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo/Title - Desktop */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/dashboard"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
            }}
            className="navbar-logo"
          >
            NxtStride Goals
          </Typography>

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
              className="navbar-menu-button"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              className="mobile-menu"
            >
              <MenuItem 
                onClick={() => {
                  handleCloseNavMenu();
                  navigate('/dashboard');
                }}
                className="navbar-menu-item"
              >
                <Typography textAlign="center">Dashboard</Typography>
              </MenuItem>
              
              {(userRole === 'manager' || userRole === 'admin') && (
                <MenuItem 
                  onClick={() => {
                    handleCloseNavMenu();
                    navigate('/team');
                  }}
                  className="navbar-menu-item"
                >
                  <Typography textAlign="center">Team</Typography>
                </MenuItem>
              )}
              
              {(userRole === 'manager' || userRole === 'admin') && (
                <MenuItem 
                  onClick={() => {
                    handleCloseNavMenu();
                    navigate('/analytics');
                  }}
                  className="navbar-menu-item"
                >
                  <Typography textAlign="center">Analytics</Typography>
                </MenuItem>
              )}
              
              {(userRole === 'manager' || userRole === 'admin') && (
                <MenuItem 
                  onClick={() => {
                    handleCloseNavMenu();
                    navigate('/admin');
                  }}
                  className="navbar-menu-item"
                >
                  <Typography textAlign="center">Admin</Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>

          {/* Logo/Title - Mobile */}
          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/dashboard"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
            }}
            className="navbar-logo"
          >
            NxtStride Goals
          </Typography>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button
              startIcon={<DashboardIcon />}
              onClick={() => navigate('/dashboard')}
              className="desktop-menu-button"
            >
              Dashboard
            </Button>
            
            {(userRole === 'manager' || userRole === 'admin') && (
              <Button
                startIcon={<PeopleIcon />}
                onClick={() => navigate('/team')}
                className="desktop-menu-button"
              >
                Team
              </Button>
            )}
            
            {(userRole === 'manager' || userRole === 'admin') && (
              <Button
                startIcon={<InsightsIcon />}
                onClick={() => navigate('/analytics')}
                className="desktop-menu-button"
              >
                Analytics
              </Button>
            )}
            
            {(userRole === 'manager' || userRole === 'admin') && (
              <Button
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => navigate('/admin')}
                className="desktop-menu-button"
              >
                Admin
              </Button>
            )}
          </Box>

          {/* User menu */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Account settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar 
                  alt={currentUser?.displayName || ''} 
                  src={currentUser?.photoURL || ''}
                  className="navbar-user-avatar"
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleCloseUserMenu}>
                <Typography textAlign="center">
                  {currentUser?.displayName || 'User'}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}