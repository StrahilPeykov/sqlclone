import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { PlayArrow, CheckCircle, ArrowBack } from '@mui/icons-material';

import { SQLEditor } from '@/shared/components/SQLEditor';
import { DataTable } from '@/shared/components/DataTable';
import { useAppStore } from '@/store';
import { useComponentMeta, useSkillContent } from '@/features/content/ContentService';
import { exerciseService, ExerciseState } from '@/features/exercises/ExerciseService';
import { getDatabaseConfigForSkill } from '@/features/database/schemas';
import { useDatabase } from '@/features/database/hooks/useDatabase';

export default function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const updateProgress = useAppStore((s) => s.updateProgress);
  const user = useAppStore((s) => s.user);

  // Content loading
  const { data: skillMeta, isLoading: metaLoading } = useComponentMeta(skillId || '');
  const { data: skillContent, isLoading: contentLoading } = useSkillContent(skillId || '');

  // Exercise state
  const [exerciseState, setExerciseState] = useState<ExerciseState | null>(null);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Database setup
  const dbConfig = getDatabaseConfigForSkill(skillId || '');
  const { executeQuery, queryResult, queryError, isLoading: isExecuting } = useDatabase(dbConfig);

  const isCompleted = user?.progress[skillId || '']?.completed || false;

  useEffect(() => {
    if (skillId) {
      updateProgress(skillId, { type: 'skill' });
    }
  }, [skillId, updateProgress]);

  // Generate exercise when skill content loads
  useEffect(() => {
    if (skillContent && skillContent.exercises && skillContent.exercises.length > 0) {
      const firstExercise = skillContent.exercises[0];
      exerciseService.generateExercise(firstExercise)
        .then((state) => {
          setExerciseState(state);
          
          // Set initial query from solution template if available
          if (firstExercise.solutionTemplate && state.state) {
            const template = firstExercise.solutionTemplate.replace(
              /{{\s*(\w+)\s*}}/g, 
              (_, key) => String(state.state[key] ?? '')
            );
            setQuery(template);
          }
        })
        .catch((error) => {
          console.error('Failed to generate exercise:', error);
          setFeedback({ 
            message: 'Failed to generate exercise', 
            type: 'error' 
          });
        });
    }
  }, [skillContent]);

  const handleExecute = async () => {
    if (!exerciseState || !skillContent?.exercises?.[0]) return;

    setIsValidating(true);
    setFeedback(null);

    try {
      await executeQuery(query);
      
      // Validate the exercise
      const validation = await exerciseService.validateExercise(
        skillContent.exercises[0],
        exerciseState,
        query
      );
      
      if (validation.correct && skillId && !isCompleted) {
        updateProgress(skillId, { type: 'skill', completed: true });
        setFeedback({ 
          message: 'Excellent! Exercise completed successfully!', 
          type: 'success' 
        });
      } else {
        setFeedback({
          message: validation.feedback || 'Try again!',
          type: validation.correct ? 'success' : 'info'
        });
      }
    } catch (error: any) {
      setFeedback({
        message: error?.message || 'Query failed',
        type: 'error',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleNewExercise = async () => {
    if (!skillContent?.exercises?.[0]) return;
    
    try {
      const newState = await exerciseService.resetExercise(skillContent.exercises[0]);
      setExerciseState(newState);
      setQuery('');
      setFeedback(null);
    } catch (error) {
      console.error('Failed to generate new exercise:', error);
    }
  };

  if (metaLoading || contentLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!skillMeta) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">
          Skill not found. <Button onClick={() => navigate('/learn')}>Return to learning</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBack />} sx={{ mr: 2 }} onClick={() => navigate('/learn')}>
          Back to Learning
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {skillMeta.name}
          {isCompleted && <CheckCircle color="success" sx={{ ml: 1 }} />}
        </Typography>
      </Box>

      {/* Description */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          {skillMeta.description}
        </Typography>
        {skillMeta.estimatedTime && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Estimated time: {skillMeta.estimatedTime} minutes
          </Typography>
        )}
      </Box>

      {/* Exercise Description */}
      {exerciseState?.state?.description && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {exerciseState.state.description}
        </Alert>
      )}

      {/* Theory Section */}
      {skillContent?.theory && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Theory</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {skillContent.theory}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Editor Card */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ alignSelf: 'center', ml: 1 }}>
            Write your SQL below
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<PlayArrow />}
              onClick={handleExecute}
              disabled={!query.trim() || isExecuting || isValidating}
              variant="contained"
            >
              {isValidating ? 'Checking...' : 'Run & Check'}
            </Button>
            {exerciseState && (
              <Button variant="outlined" onClick={handleNewExercise}>
                New Exercise
              </Button>
            )}
          </Box>
        </Box>
        <CardContent sx={{ p: 0 }}>
          <SQLEditor 
            value={query} 
            onChange={setQuery} 
            height="260px" 
            onExecute={handleExecute}
            showResults={false}
          />
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          {queryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {queryError instanceof Error ? queryError.message : 'Query execution failed'}
            </Alert>
          )}
          {queryResult && queryResult.length > 0 ? (
            <DataTable data={queryResult[0]} />
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Run your query to see results
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Exercise Statistics */}
      {exerciseState && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Attempts: {exerciseState.attempts} • 
            Status: {exerciseState.completed ? 'Completed' : 'In Progress'} •
            Started: {exerciseState.startTime.toLocaleTimeString()}
          </Typography>
        </Box>
      )}

      {/* Feedback Snackbar */}
      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        message={feedback?.message}
      />
    </Container>
  );
}
