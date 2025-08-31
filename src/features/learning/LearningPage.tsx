import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  ArrowForward,
  ArrowBack,
  CheckCircle,
  School,
  Code,
} from '@mui/icons-material';
import { useAppStore } from '@/store';
import { useContent, useComponentDependencies, useAllComponents } from '@/features/content/ContentLoader';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

export default function LearningPage() {
  const { componentId } = useParams<{ componentId: string }>();
  const navigate = useNavigate();
  const updateProgress = useAppStore((state) => state.updateProgress);
  const user = useAppStore((state) => state.user);
  
  // Move ALL hook calls to the top, before any conditional logic
  const { data: component, isLoading, error } = useContent(componentId || '');
  const { data: dependencies } = useComponentDependencies(componentId || '');
  const { data: allComponents = [] } = useAllComponents();
  
  // Update last accessed
  useEffect(() => {
    if (componentId) {
      updateProgress(componentId, { lastAccessed: new Date() });
    }
  }, [componentId, updateProgress]);
  
  // If no componentId, show component list
  if (!componentId) {
    return <ComponentList allComponents={allComponents} />;
  }
  
  const progress = user?.progress[componentId];
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (error || !component) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load content for "{componentId}". Please try again later.
          <br />
          <small>Available components: database, tables, select-basics, filtering, joins</small>
        </Alert>
      </Container>
    );
  }
  
  const isCompleted = progress?.completed || false;
  const isConcept = component.meta.type === 'concept';
  const content = component.content;
  
  const handleComplete = () => {
    updateProgress(componentId, {
      completed: true,
      type: component.meta.type,
    });
  };
  
  const handlePractice = () => {
    navigate(`/practice/${componentId}`);
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {component.meta.name}
          </Typography>
          {isCompleted && (
            <CheckCircle color="success" sx={{ ml: 2 }} />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={component.meta.type}
            size="small"
            color={isConcept ? 'primary' : 'secondary'}
          />
          {component.meta.difficulty && (
            <Chip label={component.meta.difficulty} size="small" />
          )}
          {component.meta.estimatedTime && (
            <Chip label={`${component.meta.estimatedTime} min`} size="small" />
          )}
        </Box>
        
        {component.meta.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            {component.meta.description}
          </Typography>
        )}
      </Box>
      
      {/* Prerequisites Alert */}
      {dependencies?.prerequisites && dependencies.prerequisites.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Prerequisites: {dependencies.prerequisites.map(p => p.name).join(', ')}
          </Typography>
        </Alert>
      )}
      
      {/* Content */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {content.theory && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Theory
              </Typography>
              <Typography variant="body1" paragraph>
                {content.theory}
              </Typography>
            </Box>
          )}
          
          {content.summary && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body1" paragraph>
                {content.summary}
              </Typography>
            </Box>
          )}
          
          {content.examples && content.examples.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Examples
              </Typography>
              {content.examples.map((example: any, index: number) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {example.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {example.content}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/learn')}
        >
          Back to Learning
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isConcept && !isCompleted && (
            <Button
              variant="contained"
              onClick={handleComplete}
              startIcon={<CheckCircle />}
            >
              Mark as Complete
            </Button>
          )}
          
          {!isConcept && (
            <Button
              variant="contained"
              onClick={handlePractice}
              startIcon={<Code />}
            >
              Practice Exercises
            </Button>
          )}
          
          {dependencies?.followUps && dependencies.followUps.length > 0 && (
            <Button
              endIcon={<ArrowForward />}
              onClick={() => navigate(`/learn/${dependencies.followUps[0].id}`)}
            >
              Next: {dependencies.followUps[0].name}
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}

// Component to show list of available components
interface ComponentListProps {
  allComponents: any[];
}

function ComponentList({ allComponents }: ComponentListProps) {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  
  const concepts = allComponents.filter(c => c.type === 'concept');
  const skills = allComponents.filter(c => c.type === 'skill');
  
  const isCompleted = (componentId: string) => {
    return user?.progress[componentId]?.completed || false;
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Learning Path
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Master SQL through concepts and hands-on practice
      </Typography>
      
      <Grid container spacing={4}>
        {/* Concepts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Concepts</Typography>
              </Box>
              {concepts.map((concept) => (
                <Box
                  key={concept.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => navigate(`/learn/${concept.id}`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">
                      {concept.name}
                    </Typography>
                    {isCompleted(concept.id) && (
                      <CheckCircle color="success" fontSize="small" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {concept.description}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Skills */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Code sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Skills</Typography>
              </Box>
              {skills.map((skill) => (
                <Box
                  key={skill.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => navigate(`/learn/${skill.id}`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">
                      {skill.name}
                    </Typography>
                    {isCompleted(skill.id) && (
                      <CheckCircle color="success" fontSize="small" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {skill.description}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}