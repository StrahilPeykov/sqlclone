import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  TrendingUp,
  School,
  Code,
  Timer,
  EmojiEvents,
  CalendarMonth,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useAllComponents } from '@/features/content/ContentLoader';

interface ProgressStats {
  totalConcepts: number;
  completedConcepts: number;
  totalSkills: number;
  completedSkills: number;
  totalExercises: number;
  totalPoints: number;
  totalTime: number;
  currentStreak: number;
  longestStreak: number;
  lastActive: Date | null;
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const { data: components = [], isLoading } = useAllComponents();
  
  // Calculate statistics
  const stats: ProgressStats = {
    totalConcepts: components.filter((c) => c.type === 'concept').length,
    completedConcepts: Object.values(user?.progress || {}).filter(
      (p) => p.type === 'concept' && p.completed
    ).length,
    totalSkills: components.filter((c) => c.type === 'skill').length,
    completedSkills: Object.values(user?.progress || {}).filter(
      (p) => p.type === 'skill' && p.completed
    ).length,
    totalExercises: Object.values(user?.progress || {})
      .filter((p) => p.type === 'skill')
      .reduce((sum, p) => sum + (p.exercisesCompleted || 0), 0),
    totalPoints: 245, // This would be calculated from exercise scores
    totalTime: 720, // This would be tracked in minutes
    currentStreak: 7,
    longestStreak: 14,
    lastActive: new Date(),
  };
  
  const overallProgress =
    ((stats.completedConcepts + stats.completedSkills) /
      (stats.totalConcepts + stats.totalSkills)) *
    100;
  
  const conceptProgress = (stats.completedConcepts / stats.totalConcepts) * 100;
  const skillProgress = (stats.completedSkills / stats.totalSkills) * 100;
  
  // Get recent activity
  const recentActivity = Object.entries(user?.progress || {})
    .filter((entry) => entry[1].lastAccessed)
    .sort((a, b) => {
      const dateA = new Date(a[1].lastAccessed!).getTime();
      const dateB = new Date(b[1].lastAccessed!).getTime();
      return dateB - dateA;
    })
    .slice(0, 5)
    .map(([id, progress]) => ({
      id,
      ...progress,
      component: components.find((c) => c.id === id),
    }));
  
  // Get achievements
  const achievements = [
    {
      id: 'first-concept',
      name: 'First Steps',
      description: 'Complete your first concept',
      earned: stats.completedConcepts >= 1,
      icon: School,
    },
    {
      id: 'five-skills',
      name: 'Skill Builder',
      description: 'Complete 5 skills',
      earned: stats.completedSkills >= 5,
      icon: Code,
    },
    {
      id: 'week-streak',
      name: 'Week Warrior',
      description: 'Practice for 7 days in a row',
      earned: stats.currentStreak >= 7,
      icon: TrendingUp,
    },
    {
      id: 'hundred-exercises',
      name: 'Century Club',
      description: 'Complete 100 exercises',
      earned: stats.totalExercises >= 100,
      icon: EmojiEvents,
    },
  ];
  
  const handleExportProgress = () => {
    const data = {
      user,
      stats,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sql-valley-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Your Progress
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your learning journey and achievements
        </Typography>
      </Box>
      
      {/* Overall Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overall Progress
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {stats.completedConcepts + stats.completedSkills} of{' '}
                {stats.totalConcepts + stats.totalSkills} completed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(overallProgress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={overallProgress}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          
          {/* Separate progress bars */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Concepts: {stats.completedConcepts}/{stats.totalConcepts}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={conceptProgress}
                color="primary"
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Skills: {stats.completedSkills}/{stats.totalSkills}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={skillProgress}
                color="secondary"
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h5">{stats.totalPoints}</Typography>
            <Typography variant="caption" color="text.secondary">
              Total Points
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Timer sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h5">
              {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Time Spent
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h5">{stats.currentStreak}</Typography>
            <Typography variant="caption" color="text.secondary">
              Day Streak
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Code sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5">{stats.totalExercises}</Typography>
            <Typography variant="caption" color="text.secondary">
              Exercises Done
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              
              {recentActivity.length > 0 ? (
                <List>
                  {recentActivity.map((activity) => (
                    <ListItem
                      key={activity.id}
                      button
                      onClick={() => navigate(`/learn/${activity.id}`)}
                    >
                      <ListItemIcon>
                        {activity.completed ? (
                          <CheckCircle color="success" />
                        ) : (
                          <RadioButtonUnchecked />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.component?.name || activity.componentId}
                        secondary={
                          activity.lastAccessed
                            ? new Date(activity.lastAccessed).toLocaleDateString()
                            : 'Never accessed'
                        }
                      />
                      <Chip
                        label={activity.type}
                        size="small"
                        color={activity.type === 'concept' ? 'primary' : 'secondary'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No recent activity. Start learning to track your progress!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Achievements */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Achievements
              </Typography>
              
              <List>
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <ListItem key={achievement.id}>
                      <ListItemIcon>
                        <Icon
                          sx={{
                            color: achievement.earned
                              ? 'warning.main'
                              : 'action.disabled',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={achievement.name}
                        secondary={achievement.description}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: achievement.earned
                              ? 'text.primary'
                              : 'text.disabled',
                          },
                          '& .MuiListItemText-secondary': {
                            color: achievement.earned
                              ? 'text.secondary'
                              : 'text.disabled',
                          },
                        }}
                      />
                      {achievement.earned && (
                        <CheckCircle color="success" />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Export Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExportProgress}
        >
          Export Progress Data
        </Button>
      </Box>
    </Box>
  );
}