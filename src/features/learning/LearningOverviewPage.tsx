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
import {
  CheckCircle,
  PlayArrow,
  Lock,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';

// Simplified data - just the essentials
const concepts = [
  {
    id: 'database',
    name: 'What is a Database?',
    prerequisites: [],
  },
  {
    id: 'database-table', 
    name: 'Database Tables',
    prerequisites: ['database'],
  },
  {
    id: 'data-types',
    name: 'Data Types',
    prerequisites: ['database-table'],
  },
  {
    id: 'database-keys',
    name: 'Database Keys', 
    prerequisites: ['database-table'],
  },
];

const skills = [
  {
    id: 'filter-rows',
    name: 'Filter Rows',
    prerequisites: ['data-types'],
  },
  {
    id: 'filter-rows-multiple',
    name: 'Filter Multiple Criteria',
    prerequisites: ['filter-rows'],
  },
  {
    id: 'choose-columns',
    name: 'Choose Columns', 
    prerequisites: [],
  },
  {
    id: 'sort-rows',
    name: 'Sort Rows',
    prerequisites: ['data-types'],
  },
  {
    id: 'join-tables',
    name: 'Join Tables',
    prerequisites: ['database-keys', 'choose-columns'],
  },
];

export default function LearningOverviewPage() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);

  const isCompleted = (id: string) => {
    return user?.progress[id]?.completed || false;
  };

  const canAccess = (prerequisites: string[]) => {
    return prerequisites.every(prereq => isCompleted(prereq));
  };

  const renderItem = (item: any, type: 'concept' | 'skill') => {
    const completed = isCompleted(item.id);
    const accessible = canAccess(item.prerequisites);
    
    return (
      <Grid item xs={12} sm={6} md={4} key={item.id}>
        <Card 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': accessible ? {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            } : {},
            opacity: accessible ? 1 : 0.5,
          }}
        >
          <CardContent sx={{ pb: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexGrow: 1 }}>
              <Box sx={{ mt: 0.5 }}>
                {!accessible ? (
                  <Lock color="disabled" fontSize="small" />
                ) : completed ? (
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
                    Needs: {item.prerequisites.join(', ')}
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
              disabled={!accessible}
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