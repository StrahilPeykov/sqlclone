import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Check as CheckIcon,
  Lightbulb as HintIcon,
  Refresh as ResetIcon,
} from '@mui/icons-material';
import { SQLEditor } from '@/shared/components/SQLEditor';
import { DataTable } from '@/shared/components/DataTable';
import { useDatabase } from '@/shared/hooks/useDatabase';

interface ExerciseCardProps {
  exercise: {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    hints?: string[];
    database: string;
    schema: string;
    expectedResult?: any;
  };
  onComplete: (correct: boolean, attempts: number) => void;
}

export function ExerciseCard({ exercise, onComplete }: ExerciseCardProps) {
  const [query, setQuery] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  // Initialize database with provided schema
  const { executeQuery, queryResult, queryError, isExecuting } = useDatabase(
    exercise.schema
  );
  
  const handleSubmit = async () => {
    setAttempts((prev) => prev + 1);
    setFeedback(null);
    
    try {
      const result = await executeQuery(query);
      
      // Validate result against expected
      const isCorrect = validateResult(result, exercise.expectedResult);
      
      if (isCorrect) {
        setFeedback({
          type: 'success',
          message: 'Excellent! Your query is correct.',
        });
        onComplete(true, attempts + 1);
      } else {
        setFeedback({
          type: 'error',
          message: 'Not quite right. Check your query and try again.',
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: `Query error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };
  
  const handleShowHint = () => {
    setShowHint(true);
    setFeedback({
      type: 'info',
      message: exercise.hints?.[Math.min(attempts, exercise.hints.length - 1)] || 'No hints available',
    });
  };
  
  const handleReset = () => {
    setQuery('');
    setAttempts(0);
    setShowHint(false);
    setFeedback(null);
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2">
            {exercise.title}
          </Typography>
          <Box display="flex" gap={1}>
            <Chip
              label={exercise.difficulty}
              size="small"
              color={getDifficultyColor(exercise.difficulty)}
            />
            <Chip label={`${exercise.points} pts`} size="small" />
          </Box>
        </Box>
        
        {/* Description */}
        <Typography variant="body1" color="text.secondary" mb={3}>
          {exercise.description}
        </Typography>
        
        {/* Progress */}
        {attempts > 0 && (
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary">
              Attempts: {attempts}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min((attempts / 5) * 100, 100)}
              sx={{ mt: 0.5 }}
            />
          </Box>
        )}
        
        {/* SQL Editor */}
        <Box mb={2}>
          <SQLEditor
            value={query}
            onChange={setQuery}
            placeholder="Write your SQL query here..."
            height="200px"
          />
        </Box>
        
        {/* Action Buttons */}
        <Box display="flex" gap={2} mb={2}>
          <Button
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={handleSubmit}
            disabled={!query.trim() || isExecuting}
          >
            Run Query
          </Button>
          
          {exercise.hints && exercise.hints.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<HintIcon />}
              onClick={handleShowHint}
              disabled={showHint}
            >
              Show Hint ({exercise.hints.length - Math.min(attempts, exercise.hints.length - 1)} left)
            </Button>
          )}
          
          <Button
            variant="text"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            color="secondary"
          >
            Reset
          </Button>
        </Box>
        
        {/* Feedback */}
        {feedback && (
          <Alert severity={feedback.type} sx={{ mb: 2 }}>
            {feedback.message}
          </Alert>
        )}
        
        {/* Query Result */}
        {queryResult && queryResult.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Query Result:
            </Typography>
            <DataTable data={queryResult[0]} />
          </Box>
        )}
        
        {/* Query Error */}
        {queryError && (
          <Alert severity="error">
            {queryError instanceof Error ? queryError.message : 'Query execution failed'}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function validateResult(actual: any, expected: any): boolean {
  // Simple validation - can be made more sophisticated
  if (!actual || !expected) return false;
  
  // Compare results
  try {
    return JSON.stringify(actual) === JSON.stringify(expected);
  } catch {
    return false;
  }
}
