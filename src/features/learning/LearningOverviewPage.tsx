import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
} from '@mui/material';
import { CheckCircle, PlayArrow } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { ContentEntryMeta, loadContentIndex } from '@/features/content/contentIndex';
import { useEffect, useMemo, useState } from 'react';

export default function LearningOverviewPage() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);

  const [index, setIndex] = useState<ContentEntryMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadContentIndex()
      .then((data) => {
        if (mounted) setIndex(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      mounted = false;
    };
  }, []);

  const concepts: Pick<ContentEntryMeta, 'id' | 'name' | 'prerequisites'>[] = useMemo(() => (
    (index || [])
      .filter((e) => e.type === 'concept')
      .map((e) => ({ id: e.id, name: e.name, prerequisites: e.prerequisites || [] }))
  ), [index]);

  const skills: Pick<ContentEntryMeta, 'id' | 'name' | 'prerequisites'>[] = useMemo(() => (
    (index || [])
      .filter((e) => e.type === 'skill')
      .map((e) => ({ id: e.id, name: e.name, prerequisites: e.prerequisites || [] }))
  ), [index]);

  const isCompleted = (id: string) => {
    return user?.progress[id]?.completed || false;
  };

  const renderItem = (item: any, type: 'concept' | 'skill') => {
    const completed = isCompleted(item.id);
    const accessible = true; // Always unlocked
    
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
            opacity: 1,
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
                    mb: item.prerequisites.length > 0 ? 1 : 0,
                  }}
                >
                  {item.name}
                </Typography>
                
                {item.prerequisites.length > 0 && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ display: 'block' }}
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {/* Simple Header */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Learn SQL
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Start with concepts, then practice with skills
        </Typography>
      </Box>

      {/* Concepts */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
          Concepts
        </Typography>
        <Grid container spacing={3}>
          {concepts.map((concept) => renderItem(concept, 'concept'))}
        </Grid>
      </Box>

      {/* Skills */}
      <Box>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
          Skills
        </Typography>
        <Grid container spacing={3}>
          {skills.map((skill) => renderItem(skill, 'skill'))}
        </Grid>
      </Box>
    </Container>
  );
}
