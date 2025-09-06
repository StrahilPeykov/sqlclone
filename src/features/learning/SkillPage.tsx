import { useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import { PlayArrow, CheckCircle, ArrowBack } from '@mui/icons-material';
import { SQLEditor } from '@/shared/components/SQLEditor';
import { DataTable } from '@/shared/components/DataTable';
import { useDatabase } from '@/features/database/DatabaseService';
import { databaseConfigs } from '@/features/database/schemas';
import { useAppStore } from '@/store';
import { loadSkillsLibrary } from '@/features/content/contentIndex';

export default function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const updateProgress = useAppStore((s) => s.updateProgress);
  const user = useAppStore((s) => s.user);

  // Load a simple skill exercise from content library (first filtering exercise)
  const [exerciseState, setExerciseState] = useState<any | null>(null);
  const [exerciseDef, setExerciseDef] = useState<any | null>(null);
  const [query, setQuery] = useState('');

  // Decide database config based on exercise config
  const dbConfig = useMemo(() => {
    const target = exerciseDef?.config?.database as string | undefined;
    if (target === 'companies') return databaseConfigs.basic;
    if (target === 'positions') return databaseConfigs.intermediate;
    return databaseConfigs.basic;
  }, [exerciseDef]);

  const { executeQuery, queryResult, queryError, isExecuting } = useDatabase(dbConfig);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const isCompleted = user?.progress[skillId || '']?.completed || false;

  useEffect(() => {
    // Touch progress for lastAccessed tracking
    if (skillId) {
      updateProgress(skillId, { type: 'skill' });
    }
  }, [skillId, updateProgress]);

  // Generate the exercise from content on mount/change
  useEffect(() => {
    // Only handle known skill for now
    if (!skillId) return;
    loadSkillsLibrary().then((lib) => {
      const exercises = lib?.exercises || [];
      const first = exercises[0];
      if (!first) return;

      // Build utils the content generator expects
      const utils = {
        selectRandomly: <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
        generateRandomNumber: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
      };

      try {
        // Compile generator function
        const genFn = (new Function('utils', `${first.generator}; return generate;`))(utils);
        const state = genFn(utils);
        setExerciseState(state);
        setExerciseDef(first);

        // Seed the editor with the solution template if present
        if (first.solutionTemplate) {
          // Replace handlebars-like placeholders {{var}}
          const seeded = first.solutionTemplate.replace(/{{\s*(\w+)\s*}}/g, (_m: string, key: string) => String(state?.[key] ?? ''));
          setQuery(seeded);
        }
      } catch (err) {
        console.error('Failed to initialize exercise:', err);
      }
    });
  }, [skillId]);

  const handleExecute = async () => {
    try {
      const res = await executeQuery(query);

      // Validate via content validator if available
      let ok = false;
      if (exerciseDef?.validator) {
        try {
          const validateFn = (new Function('input', 'state', 'result', `${exerciseDef.validator}; return validate(input, state, result);`));
          ok = !!validateFn(query, exerciseState, res);
        } catch (e) {
          console.error('Validator error:', e);
          ok = false;
        }
      } else {
        // Fallback: any result rows means success
        ok = Array.isArray(res) && res.length > 0 && res[0].values.length > 0;
      }

      if (ok && skillId && !isCompleted) {
        updateProgress(skillId, { type: 'skill', completed: true });
        setSnackbar({ open: true, message: 'Great job! Skill completed.', severity: 'success' });
      } else {
        setSnackbar({
          open: true,
          message: ok ? 'Query ran successfully.' : 'Query ran, but did not meet the goal.',
          severity: ok ? 'success' : 'info',
        });
      }
    } catch (e: any) {
      setSnackbar({
        open: true,
        message: e?.message || 'Query failed',
        severity: 'error',
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBack />} sx={{ mr: 2 }} onClick={() => navigate('/learn')}>
          Back to Learning
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {skillId || 'Skill'}
          {isCompleted && <CheckCircle color="success" sx={{ ml: 1 }} />}
        </Typography>
      </Box>

      {/* Description */}
      <Alert severity="info" sx={{ mb: 2 }}>
        {exerciseState?.description || 'Solve the task by writing a SQL query.'}
      </Alert>

      {/* Editor Card */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" sx={{ alignSelf: 'center', ml: 1 }}>
            Write your SQL below
          </Typography>
          <Button
            startIcon={<PlayArrow />}
            onClick={handleExecute}
            disabled={!query.trim() || isExecuting}
            variant="contained"
            sx={{ mr: 1 }}
          >
            Run
          </Button>
        </Box>
        <CardContent sx={{ p: 0 }}>
          <SQLEditor value={query} onChange={setQuery} height="260px" onExecute={handleExecute} />
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}
