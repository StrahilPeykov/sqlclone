import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, PlayArrow } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';

interface ComponentMeta {
  id: string;
  name: string;
  type: 'concept' | 'skill';
  description?: string;
  prerequisites: string[];
}

export default function LearningOverviewPage() {
  const navigate = useNavigate();
  const components = useAppStore(state => state.components);
  
  const [contentIndex, setContentIndex] = useState<ComponentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load content index
  useEffect(() => {
    fetch('/content/index.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load content');
        return res.json();
      })
      .then(data => {
        setContentIndex(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const concepts = contentIndex.filter(item => item.type === 'concept');
  const skills = contentIndex.filter(item => item.type === 'skill');

  const isCompleted = (id: string) => {
    const component = components[id];
    if (!component) return false;
    
    // For concepts, check if understood
    if (concepts.find(c => c.id === id)) {
      return component.understood === true;
    }
    
    // For skills, check if completed (3+ exercises)
    return (component.numSolved || 0) >= 3;
  };

  const getProgress = (id: string) => {
    const component = components[id];
    if (!component) return null;
    
    // For skills, return exercise progress
    if (skills.find(s => s.id === id) && component.numSolved) {
      return `${component.numSolved}/3`;
    }
    
    return null;
  };

  const renderItem = (item: ComponentMeta, type: 'concept' | 'skill') => {
    const completed = isCompleted(item.id);
    const progress = getProgress(item.id);
    
    return (
      <Grid item xs={12} sm={6} md={4} key={item.id}>
        <Card 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <CardContent sx={{ pb: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexGrow: 1 }}>
              <Box sx={{ mt: 0.5 }}>
                {completed ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <PlayArrow color="action" fontSize="small" />
                )}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle1" 
                  component="h3"
                  sx={{ 
                    fontWeight: 500,
                    color: completed ? 'text.secondary' : 'text.primary',
                    mb: 1,
                  }}
                >
                  {item.name}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {item.description}
                </Typography>
                
                {progress && (
                  <Typography 
                    variant="caption" 
                    color="primary"
                    sx={{ display: 'block', fontWeight: 500 }}
                  >
                    Progress: {progress}
                  </Typography>
                )}
                
                {/* Estimated time removed */}
                
                {item.prerequisites && item.prerequisites.length > 0 && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    Prerequisites: {item.prerequisites.join(', ')}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
          
          <CardActions sx={{ pt: 0, mt: 'auto' }}>
            <Button
              size="small"
              variant={completed ? "outlined" : "contained"}
              onClick={() => navigate(`/${type}/${item.id}`)}
              fullWidth
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {completed ? 'Review' : 'Start'}
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load content: {error}
        </Alert>
      </Container>
    );
  }

  const completedConcepts = concepts.filter(c => isCompleted(c.id)).length;
  const completedSkills = skills.filter(s => isCompleted(s.id)).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Learn SQL
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Start with concepts, then practice with skills
        </Typography>
      </Box>

      {/* Progress Summary */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            {completedConcepts}/{concepts.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Concepts Completed
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            {completedSkills}/{skills.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Skills Mastered
          </Typography>
        </Box>
      </Box>

      {/* Concepts */}
      {concepts.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
            Concepts
          </Typography>
          <Grid container spacing={3}>
            {concepts.map((concept) => renderItem(concept, 'concept'))}
          </Grid>
        </Box>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
            Skills
          </Typography>
          <Grid container spacing={3}>
            {skills.map((skill) => renderItem(skill, 'skill'))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}
