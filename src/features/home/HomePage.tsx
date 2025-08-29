import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Container,
} from '@mui/material';
import {
  PlayArrow,
  School,
  Code,
  Timeline,
  EmojiEvents,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Paper
        sx={{
          p: 6,
          mb: 4,
          background: 'linear-gradient(135deg, #c81919 0%, #960000 100%)',
          color: 'white',
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" gutterBottom fontWeight="bold">
          Welcome to SQL Valley
        </Typography>
        <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
          Master SQL through interactive exercises and real-world scenarios
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={() => navigate('/learn')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            Start Learning
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Code />}
            onClick={() => navigate('/playground')}
            sx={{
              borderColor: 'white',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            SQL Playground
          </Button>
        </Box>
      </Paper>
      
      {/* Features Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <School sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Learn Concepts
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start with the fundamentals: databases, tables, and SQL basics
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/learn')}
                fullWidth
              >
                Explore Concepts
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Code sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Practice Skills
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Apply your knowledge with interactive coding exercises
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/practice')}
                fullWidth
              >
                Start Practicing
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Timeline sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Track Progress
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Monitor your learning journey and achievements
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/progress')}
                fullWidth
              >
                View Progress
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Quick Stats */}
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Your SQL Journey Starts Here
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Join thousands of learners mastering SQL through hands-on practice
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={6} md={3}>
            <Box>
              <Typography variant="h3" color="primary.main">
                15+
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Core Concepts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box>
              <Typography variant="h3" color="secondary.main">
                50+
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Practice Exercises
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box>
              <Typography variant="h3" color="success.main">
                10+
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Skill Areas
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box>
              <Typography variant="h3" color="warning.main">
                100%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Free to Use
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}