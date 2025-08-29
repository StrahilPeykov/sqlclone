import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Refresh,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useAppStore } from '@/store';
import { useContent } from '@/features/content/ContentLoader';
import { ExerciseCard } from './components/ExerciseCard';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { databaseService } from '@/features/database/DatabaseService';
import { databaseConfigs } from '@/features/database/schemas';

interface ExerciseState {
  current: number;
  exercises: any[];
  results: {
    exerciseId: string;
    completed: boolean;
    attempts: number;
    score: number;
  }[];
}

export default function PracticePage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const updateProgress = useAppStore((state) => state.updateProgress);
  const user = useAppStore((state) => state.user);
  const progress = user?.progress[skillId!];
  
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    current: 0,
    exercises: [],
    results: [],
  });
  
  const { data: skill, isLoading, error } = useContent(skillId!);
  
  // Initialize exercises
  useEffect(() => {
    if (!skill || skill.meta.type !== 'skill') return;
    
    const content = skill.content as any;
    if (content.exercises && content.exercises.length > 0) {
      // Generate exercise instances from templates
      const exercises = content.exercises.map((template: any) => {
        try {
          // Parse and execute generator function
          const generatorFn = new Function('utils', `return (${template.generator})(utils)`);
          const utils = {
            selectRandomly: (arr: any[]) => arr[Math.floor(Math.random() * arr.length)],
            generateRandomNumber: (min: number, max: number) => 
              Math.floor(Math.random() * (max - min + 1)) + min,
          };
          
          const generated = generatorFn(utils);
          
          return {
            ...template,
            ...generated,
            id: template.id,
          };
        } catch (err) {
          console.error('Failed to generate exercise:', err);
          return null;
        }
      }).filter(Boolean);
      
      setExerciseState({
        current: 0,
        exercises,
        results: [],
      });
      
      // Initialize database for exercises
      const dbConfig = exercises[0]?.config?.database || 'basic';
      databaseService.getDatabase(databaseConfigs[dbConfig as keyof typeof databaseConfigs]);
    }
  }, [skill]);
  
  if (isLoading) {
    return <LoadingScreen message="Loading exercises..." />;
  }
  
  if (error || !skill || skill.meta.type !== 'skill') {
    return (
      <Alert severity="error">
        Failed to load exercises. Please try again later.
      </Alert>
    );
  }
  
  const { exercises, current, results } = exerciseState;
  const currentExercise = exercises[current];
  const totalExercises = exercises.length;
  const completedCount = results.filter((r) => r.completed).length;
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxScore = exercises.reduce((sum, e) => sum + e.points, 0);
  
  const handleExerciseComplete = (correct: boolean, attempts: number) => {
    const score = correct ? currentExercise.points * Math.max(0.5, 1 - (attempts - 1) * 0.1) : 0;
    
    setExerciseState((prev) => ({
      ...prev,
      results: [
        ...prev.results,
        {
          exerciseId: currentExercise.id,
          completed: correct,
          attempts,
          score,
        },
      ],
    }));
    
    // Update progress if all exercises completed successfully
    if (correct && completedCount + 1 >= 3) {
      updateProgress(skillId!, {
        completed: true,
        exercisesCompleted: completedCount + 1,
        type: 'skill',
      });
    } else if (correct) {
      updateProgress(skillId!, {
        exercisesCompleted: (progress?.exercisesCompleted || 0) + 1,
        type: 'skill',
      });
    }
  };
  
  const handleNext = () => {
    if (current < totalExercises - 1) {
      setExerciseState((prev) => ({
        ...prev,
        current: prev.current + 1,
      }));
    }
  };
  
  const handlePrevious = () => {
    if (current > 0) {
      setExerciseState((prev) => ({
        ...prev,
        current: prev.current - 1,
      }));
    }
  };
  
  const handleRestart = () => {
    window.location.reload(); // Simple restart - regenerates exercises
  };
  
  const handleFinish = () => {
    navigate(`/learn/${skillId}`);
  };
  
  if (!currentExercise) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Practice Complete!
          </Typography>
          <Typography variant="body1" paragraph>
            You've completed all exercises for {skill.meta.name}.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Your Score</Typography>
            <Typography variant="h3" color="primary">
              {Math.round(totalScore)} / {maxScore}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedCount} of {totalExercises} exercises completed successfully
            </Typography>
          </Box>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleRestart} startIcon={<Refresh />}>
              Try Again
            </Button>
            <Button variant="outlined" onClick={handleFinish} endIcon={<ArrowForward />}>
              Back to Learning
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Practice: {skill.meta.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={`Exercise ${current + 1} of ${totalExercises}`} />
          <Chip label={`Score: ${Math.round(totalScore)} / ${maxScore}`} />
          {progress?.exercisesCompleted && (
            <Chip
              label={`Progress: ${progress.exercisesCompleted}/3`}
              color={progress.exercisesCompleted >= 3 ? 'success' : 'default'}
            />
          )}
        </Box>
      </Box>
      
      {/* Progress Stepper */}
      <Stepper activeStep={current} alternativeLabel sx={{ mb: 3 }}>
        {exercises.map((exercise, index) => {
          const result = results.find((r) => r.exerciseId === exercise.id);
          return (
            <Step key={exercise.id} completed={result?.completed}>
              <StepLabel
                error={result && !result.completed}
                slots={{
                  stepIcon: result
                    ? result.completed
                      ? CheckCircle
                      : Cancel
                    : undefined
                }}
              >
                {exercise.difficulty}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      
      {/* Current Exercise */}
      <ExerciseCard
        exercise={{
          ...currentExercise,
          title: `Exercise ${current + 1}`,
          database: currentExercise.config?.database || 'basic',
          schema: databaseConfigs[currentExercise.config?.database as keyof typeof databaseConfigs || 'basic'].schema,
        }}
        onComplete={handleExerciseComplete}
      />
      
      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handlePrevious}
          disabled={current === 0}
        >
          Previous
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {results.find((r) => r.exerciseId === currentExercise.id) && (
            <>
              {current < totalExercises - 1 ? (
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={handleNext}
                >
                  Next Exercise
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleFinish}
                  startIcon={<CheckCircle />}
                >
                  Finish Practice
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}