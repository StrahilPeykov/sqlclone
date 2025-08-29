import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Paper,
} from '@mui/material';
import {
  PlayArrow,
  School,
  Code,
  Timeline,
  EmojiEvents,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useRecommendations } from '@/features/content/ContentLoader';

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  
  // Calculate overall progress
  const completedComponents = Object.values(user?.progress || {}).filter(
    (p) => p.completed
  ).length;
  const totalComponents = 30; // This should come from content loader
  const progressPercentage = (completedComponents / totalComponents) * 100;
  
  // Get recommendations based on completed components
  const completedIds = Object.keys(user?.progress || {}).filter(
    (id) => user?.progress[id].completed
  );
  const { data: recommendations = [] } = useRecommendations(completedIds);
  
  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          p: 6,
          mb: 4,
          background: 'linear-gradient(135deg, #c81919 0%, #960000 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Typography variant="h2" gutterBottom fontWeight="bold">
          Welcome to SQL Valley
        </Typography>
        <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
          Master SQL through interactive exercises and real-world scenarios
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
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
      
      {/* Progress Overview */}
      {user && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Progress
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {completedComponents} of {totalComponents} completed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            
            {/* Quick Stats */}
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <EmojiEvents sx={{ fontSize: 40, color: 'warning.main' }} />
                  <Typography variant="h4">{completedComponents}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                  <Typography variant="h4">7</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Day Streak
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <School sx={{ fontSize: 40, color: 'info.main' }} />
                  <Typography variant="h4">245</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Points Earned
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Timeline sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Typography variant="h4">12h</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Time Spent
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* Learning Paths */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <School sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                SQL Fundamentals
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Start with the basics: SELECT, WHERE, JOIN, and more.
              </Typography>
              <Chip label="Beginner" color="success" size="small" />
              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/learn/database')}
                >
                  Start Path
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Code sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Advanced Queries
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Master subqueries, CTEs, window functions, and optimization.
              </Typography>
              <Chip label="Intermediate" color="warning" size="small" />
              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/learn/advanced-queries')}
                  disabled
                >
                  Coming Soon
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Timeline sx={{ fontSize: 40, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Database Design
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Learn normalization, indexing, and performance tuning.
              </Typography>
              <Chip label="Advanced" color="error" size="small" />
              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/learn/database-design')}
                  disabled
                >
                  Coming Soon
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recommended Next Steps */}
      {recommendations.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recommended Next Steps
            </Typography>
            <Grid container spacing={2}>
              {recommendations.slice(0, 3).map((component) => (
                <Grid item xs={12} md={4} key={component.id}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => navigate(`/learn/${component.id}`)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {component.type === 'concept' ? (
                        <School sx={{ mr: 1, color: 'primary.main' }} />
                      ) : (
                        <Code sx={{ mr: 1, color: 'primary.main' }} />
                      )}
                      <Typography variant="subtitle1" fontWeight="medium">
                        {component.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {component.description || 'No description available'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={component.difficulty || 'beginner'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {component.estimatedTime && (
                        <Chip
                          label={`${component.estimatedTime} min`}
                          size="small"
                        />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}