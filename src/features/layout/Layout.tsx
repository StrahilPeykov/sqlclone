import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/store';

export function Layout() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Sidebar open={sidebarOpen} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8, // Account for header height
          pl: sidebarOpen ? '240px' : '72px',
          transition: 'padding-left 0.3s',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}