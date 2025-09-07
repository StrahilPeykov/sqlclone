import { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Collapse,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Lightbulb,
  Refresh,
  PlayArrow,
} from '@mui/icons-material';

import { SQLEditor } from '@/shared/components/SQLEditor/SQLEditor';
import { useDatabase } from '@/features/database/hooks/useDatabase';
import { schemas } from '@/features/database/schemas';

interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  hints?: string[];
  expectedQuery?: string;
  validateResult?: (result: any) => boolean;
  database?: string;
  schema?: string;
}

interface ExerciseRunnerProps {
  exercise: Exercise;
  onComplete: (success: boolean, attempts: number, score: number) => void;
  onNext?: () => void;
}

export function ExerciseRunner({ exercise, onComplete, onNext }: ExerciseRunnerProps) {
  const [query, setQuery] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  const { executeQuery, isReady } = useDatabase(
    exercise.schema ?? schemas.companies
  );
  const isDbLoading = !isReady;

  const handleSubmit = useCallback(async () => {
    if (!query.trim()) {
      setFeedback('Please enter a SQL query before submitting.');
      return;
    }

    setAttempts(prev => prev + 1);
    setFeedback(null);

    try {
      const result = await executeQuery(query);
      
      // Validate the result
      let correct = false;
      
      if (exercise.validateResult) {
        correct = exercise.validateResult(result);
      } else if (exercise.expectedQuery) {
        // Simple string comparison (could be enhanced)
        correct = query.trim().toLowerCase() === exercise.expectedQuery.toLowerCase();
      } else {
        // Default validation - check if query executed without error
        correct = result.length > 0 && result[0].values.length > 0;
      }

      setIsCorrect(correct);
      setIsComplete(true);

      if (correct) {
        setFeedback('🎉 Excellent! Your query is correct.');
        const score = calculateScore(attempts + 1, exercise.points);
        onComplete(true, attempts + 1, score);
      } else {
        setFeedback('Not quite right. Check your query and try again.');
      }
    } catch (error) {
      setFeedback(
        `Query Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, [query, attempts, exercise, executeQuery, onComplete]);

  const handleShowHint = useCallback(() => {
    if (!exercise.hints || exercise.hints.length === 0) return;
    
    setShowHint(true);
    setCurrentHintIndex(Math.min(currentHintIndex, exercise.hints.length - 1));
  }, [exercise.hints, currentHintIndex]);

  const handleReset = useCallback(() => {
    setQuery('');
    setAttempts(0);
    setIsComplete(false);
    setIsCorrect(false);
    setFeedback(null);
    setShowHint(false);
    setCurrentHintIndex(0);
  }, []);

  const calculateScore = (attempts: number, maxPoints: number): number => {
    // Score decreases with more attempts
    const penalty = Math.max(0, attempts - 1) * 0.1;
    return Math.round(maxPoints * Math.max(0.5, 1 - penalty));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Exercise Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h5" component="h2">
              {exercise.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={exercise.difficulty}
                size="small"
                color={getDifficultyColor(exercise.difficulty)}
              />
              <Chip
                label={`${exercise.points} pts`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            {exercise.description}
          </Typography>

          {/* Progress Indicator */}
          {attempts > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Attempts: {attempts}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((attempts / 5) * 100, 100)}
                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
              />
            </Box>
          )}
        </Box>

        {/* SQL Editor */}
        <Box sx={{ mb: 2 }}>
          <SQLEditor
            value={query}
            onChange={setQuery}
            height="200px"
            placeholder="Write your SQL query here..."
            showResults={false}
            autoFocus
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={isComplete && isCorrect ? <CheckCircle /> : <PlayArrow />}
            onClick={handleSubmit}
            disabled={!query.trim() || isDbLoading}
          >
            {isComplete && isCorrect ? 'Completed!' : 'Submit Answer'}
          </Button>

          {exercise.hints && exercise.hints.length > 0 && !isComplete && (
            <Button
              variant="outlined"
              startIcon={<Lightbulb />}
              onClick={handleShowHint}
              disabled={showHint && currentHintIndex >= exercise.hints.length - 1}
            >
              Show Hint ({currentHintIndex + 1}/{exercise.hints.length})
            </Button>
          )}

          <Button
            variant="text"
            startIcon={<Refresh />}
            onClick={handleReset}
            disabled={isDbLoading}
          >
            Reset
          </Button>
        </Box>

        {/* Feedback */}
        {feedback && (
          <Alert
            severity={
              feedback.includes('🎉') || feedback.includes('Excellent')
                ? 'success'
                : feedback.includes('Error')
                ? 'error'
                : 'info'
            }
            sx={{ mb: 2 }}
          >
            {feedback}
          </Alert>
        )}

        {/* Hints */}
        <Collapse in={showHint}>
          {exercise.hints && exercise.hints.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Hint {currentHintIndex + 1}:</strong>{' '}
                {exercise.hints[currentHintIndex]}
              </Typography>
            </Alert>
          )}
        </Collapse>

        {/* Success Actions */}
        {isComplete && isCorrect && onNext && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              onClick={onNext}
              endIcon={<CheckCircle />}
            >
              Next Exercise
            </Button>
          </Box>
        )}

        {/* Exercise Status */}
        {isComplete && (
          <Box sx={{ mt: 2, p: 2, bgcolor: isCorrect ? 'success.light' : 'error.light', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isCorrect ? (
                <CheckCircle color="success" />
              ) : (
                <Cancel color="error" />
              )}
              <Typography variant="body2" fontWeight="medium">
                {isCorrect
                  ? `Exercise completed! Score: ${calculateScore(attempts, exercise.points)}/${exercise.points} points`
                  : 'Keep trying! You can do it.'
                }
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
