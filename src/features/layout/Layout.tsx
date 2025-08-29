import { Outlet } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button,
  Container
} from '@mui/material';
import {
  Home as HomeIcon,
  School as LearnIcon,
  Code as PracticeIcon,
  Timeline as ProgressIcon,
  PlayArrow as PlaygroundIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/learn', label: 'Learn', icon: LearnIcon },
    { path: '/practice', label: 'Practice', icon: PracticeIcon },
    { path: '/progress', label: 'Progress', icon: ProgressIcon },
    { path: '/playground', label: 'Playground', icon: PlaygroundIcon },
  ];
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Container maxWidth="lg">
          <Toolbar>
            {/* Logo/Title */}
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 0,
                mr: 4,
                fontWeight: 600,
                color: 'primary.main',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              SQL Valley
            </Typography>
            
            {/* Navigation */}
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                                (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <Button
                    key={item.path}
                    startIcon={<Icon />}
                    onClick={() => navigate(item.path)}
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      fontWeight: isActive ? 600 : 400,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)', // Subtract AppBar height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}