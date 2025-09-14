import { useEffect, useState, useCallback } from 'react';
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
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { PlayArrow, CheckCircle, ArrowBack, Refresh, ArrowForward } from '@mui/icons-material';

import { SQLEditor } from '@/shared/components/SQLEditor';
import { DataTable } from '@/shared/components/DataTable';
import { useComponentState } from '@/store';
import { useExerciseDatabase } from '@/shared/hooks/useDatabase';
import { loadSkillsLibrary } from '@/features/content/contentIndex';
import type { SkillContent, Exercise as ContentExercise } from '@/features/content/types';

interface ExerciseInstance {
  id: string;
  description: string;
  points: number;
  expectedQuery?: string;
  validatorFn?: (input: string, state: any, result: any) => boolean;
  solutionTemplate?: string;
  config: { database?: string; hints?: string[] };
  state: any; // generated state from generator
}

export default function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0); // 0: Practice, 1: Theory
  
  // State management
  const [componentState, setComponentState] = useComponentState(skillId || '');
  
  // Skill content + exercise state
  const [skillContent, setSkillContent] = useState<SkillContent | null>(null);
  const [folderSkill, setFolderSkill] = useState<{
    generate?: (utils: any) => any;
    validate?: (input: string, state: any, result: any) => boolean;
    solutionTemplate?: string;
    config?: { hints?: string[] };
  } | null>(null);
  const [skillTheory, setSkillTheory] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] = useState<ExerciseInstance | null>(null);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  
  // Skill metadata
  const [skillMeta, setSkillMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Database setup - using the new exercise database hook
  const { 
    executeQuery, 
    queryResult, 
    queryError, 
    isReady: dbReady,
    isExecuting,
    tableNames,
  } = useExerciseDatabase(skillId || '');
  
  // Required exercises to mark skill as complete: cap by available exercises, default 3
  const requiredCount = folderSkill ? 3 : Math.min(3, skillContent?.exercises?.length ?? 3);
  const isCompleted = (componentState.numSolved || 0) >= requiredCount;

  // Load skill metadata + content library
  useEffect(() => {
    if (!skillId) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const indexRes = await fetch('/content/index.json').then(r => r.json());
        const skill = indexRes.find((c: any) => c.id === skillId);

        if (!skill) throw new Error('Skill not found');
        setSkillMeta(skill);

        // Prefer folder-based content if available
        if (skill.contentPath) {
          try {
            // Load theory + generator/validator code
            const [theoryRes, codeRes] = await Promise.all([
              fetch(`/content/${skill.contentPath}/theory.mdx`).catch(() => null),
              fetch(`/content/${skill.contentPath}/skill.ts`),
            ]);

            if (!codeRes.ok) throw new Error('Missing skill.ts in folder');
            const codeText = await codeRes.text();
            const transformed = codeText.replace(/^export\s+/gm, '');
            const factory = new Function(
              `${transformed}; return { generate, validate, config, solutionTemplate };`
            );
            const mod = factory();
            setFolderSkill({
              generate: typeof mod.generate === 'function' ? mod.generate : undefined,
              validate: typeof mod.validate === 'function' ? mod.validate : undefined,
              solutionTemplate: typeof mod.solutionTemplate === 'string' ? mod.solutionTemplate : undefined,
              config: mod.config || {},
            });
            if (theoryRes && theoryRes.ok) {
              setSkillTheory(await theoryRes.text());
            } else {
              setSkillTheory(null);
            }
            setSkillContent(null);
            return;
          } catch (e) {
            console.warn('Failed to load folder-based skill; falling back to JSON library.', e);
          }
        }

        // Fallback to legacy JSON
        let library: SkillContent | null = null;
        try {
          library = await fetch(`/content/skills/${skillId}.json`).then(r => r.ok ? r.json() : Promise.reject(new Error('no specific skill file')));
        } catch {
          library = await loadSkillsLibrary();
        }
        setFolderSkill(null);
        setSkillTheory((library as any)?.theory ?? null);
        setSkillContent(library as SkillContent);
      } catch (err) {
        console.error('Failed to load skill content:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();

    // Update component type
    if (componentState.type !== 'skill') {
      setComponentState({ type: 'skill' });
    }
  }, [skillId, setComponentState, componentState.type]);

  // Restore saved tab
  useEffect(() => {
    if (componentState.tab) {
      const tabIndex = ['practice', 'theory'].indexOf(componentState.tab as string);
      if (tabIndex >= 0) setCurrentTab(tabIndex);
    }
  }, [componentState.tab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    const tabNames = ['practice', 'theory'];
    setComponentState({ tab: tabNames[newValue] });
  };

  const formatContent = (content: string) => {
    if (!content) return null;
    const lines = content.trim().split('\n');
    let inCode = false;
    const chunks: any[] = [];
    let codeBuffer: string[] = [];

    lines.forEach((line, index) => {
      if (line.trim().startsWith('```')) {
        if (!inCode) {
          inCode = true;
          codeBuffer = [];
        } else {
          chunks.push(
            <Paper key={`code-${index}`} sx={{ p: 1, bgcolor: 'action.hover', overflow: 'auto' }}>
              <pre style={{ margin: 0 }}>
                <code>{codeBuffer.join('\n')}</code>
              </pre>
            </Paper>
          );
          inCode = false;
          codeBuffer = [];
        }
        return;
      }
      if (inCode) {
        codeBuffer.push(line);
        return;
      }
      if (line.startsWith('## ')) {
        chunks.push(
          <Typography key={`h-${index}`} variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
            {line.replace('## ', '')}
          </Typography>
        );
      } else if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
        chunks.push(
          <Typography key={`li-${index}`} variant="body1" sx={{ ml: 2, mb: 0.5 }}>
            {match ? (<><strong>{match[1]}</strong>: {match[2]}</>) : line}
          </Typography>
        );
      } else if (line.trim() === '') {
        chunks.push(<br key={`br-${index}`} />);
      } else {
        chunks.push(
          <Typography key={`p-${index}`} variant="body1" paragraph>
            {line}
          </Typography>
        );
      }
    });
    return chunks;
  };

  // Utilities available to content generators
  const genUtils = {
    selectRandomly: <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)],
    generateRandomNumber: (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min,
  };

  const compileGenerator = (src: string): ((utils: typeof genUtils) => any) | null => {
    try {
      // src is a full function string like "function generate(utils) { ... }"
      // Return the function instance
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${src});`)();
      return typeof fn === 'function' ? fn : null;
    } catch (e) {
      console.error('Failed to compile generator:', e);
      return null;
    }
  };

  const compileValidator = (src: string): ((input: string, state: any, result: any) => boolean) | null => {
    try {
      // src is a full function string like "function validate(input, state, result) { ... }"
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${src});`)();
      return typeof fn === 'function' ? fn : null;
    } catch (e) {
      console.error('Failed to compile validator:', e);
      return null;
    }
  };

  // Generate a new exercise
  const generateExercise = useCallback(() => {
    if (folderSkill && folderSkill.generate) {
      const state = folderSkill.generate(genUtils) || {};
      const instance: ExerciseInstance = {
        id: state?.id || 'exercise',
        description: state?.description || 'Solve the exercise',
        points: 10,
        expectedQuery: state?.expectedQuery,
        validatorFn: folderSkill.validate,
        solutionTemplate: folderSkill.solutionTemplate,
        config: { hints: folderSkill.config?.hints },
        state,
      };
      setCurrentExercise(instance);
    } else {
      if (!skillContent?.exercises || skillContent.exercises.length === 0) return;

      // Get exercise history to avoid repeats
      const history = componentState.exerciseHistory || [];
      const lastExerciseIds = history.slice(-2).map((h: any) => h?.id);

      const pool: ContentExercise[] = skillContent.exercises.filter(
        (ex) => !lastExerciseIds.includes(ex.id)
      );
      const choiceList = pool.length > 0 ? pool : skillContent.exercises;
      const base = choiceList[Math.floor(Math.random() * choiceList.length)];

      // Compile and run generator
      const gen = compileGenerator(base.generator);
      const state = gen ? gen(genUtils) : {};

      // Prepare instance
      const validatorFn = base.validator ? compileValidator(base.validator) : null;
      const instance: ExerciseInstance = {
        id: base.id,
        description: state?.description || base.id,
        points: base.points ?? 10,
        expectedQuery: state?.expectedQuery,
        validatorFn: validatorFn || undefined,
        solutionTemplate: base.solutionTemplate,
        config: { database: base.config?.database, hints: base.config?.hints },
        state,
      };
      setCurrentExercise(instance);
    }
    setQuery('');
    setFeedback(null);
    setShowHint(false);
    setExerciseCompleted(false);
  }, [skillContent, componentState.exerciseHistory, genUtils, folderSkill]);

  // Initialize first exercise when DB ready
  useEffect(() => {
    if (dbReady && !currentExercise) {
      generateExercise();
    }
  }, [dbReady, currentExercise, generateExercise]);

  // Check answer
  const handleExecute = async (override?: string) => {
    const effectiveQuery = (override ?? query).trim();
    if (!currentExercise || !effectiveQuery) return;
    // Prevent counting multiple completions on the same exercise instance
    if (exerciseCompleted) {
      setFeedback({ message: 'Already completed. Click Next Exercise to continue.', type: 'info' });
      return;
    }
    if (!dbReady) {
      setFeedback({ message: 'Database is still loading. Please try again in a moment.', type: 'info' });
      return;
    }

    try {
      const result = await executeQuery(effectiveQuery);
      
      let isCorrect = false;
      
      // Prefer content-provided validator if available
      if (currentExercise.validatorFn) {
        isCorrect = !!currentExercise.validatorFn(effectiveQuery, currentExercise.state, result);
      } 
      // Check if exercise has expected query
      else if (currentExercise.expectedQuery) {
        // Simple check - in real app would need better SQL comparison
        const normalize = (s: string) => s
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/;$/, '');
        const normalizedQuery = normalize(effectiveQuery);
        const normalizedExpected = normalize(currentExercise.expectedQuery);
        isCorrect = normalizedQuery === normalizedExpected || 
                   (result && result.length > 0 && result[0].values.length > 0);
      }
      // Default: check if query returned results
      else {
        isCorrect = result && result.length > 0;
      }
      
      if (isCorrect) {
        // Update progress
        const nextSolved = Math.min(requiredCount, (componentState.numSolved || 0) + 1);
        const newHistory = [
          ...(componentState.exerciseHistory || []),
          { id: currentExercise.id, solved: true, timestamp: new Date() }
        ];
        
        setComponentState({ 
          numSolved: nextSolved,
          exerciseHistory: newHistory 
        });
        
        setFeedback({ 
          message: `Excellent! Exercise completed successfully! (${nextSolved}/${requiredCount})`, 
          type: 'success' 
        });
        // Mark current exercise as completed; require explicit click to continue
        setExerciseCompleted(true);
      } else {
        setFeedback({
          message: 'Not quite right. Check your query and try again!',
          type: 'info'
        });
      }
    } catch (error: any) {
      setFeedback({
        message: `Query error: ${error?.message || 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  // Autocomplete solution for the current exercise
  const handleAutoComplete = async () => {
    if (!currentExercise) return;

    // Prefer explicit expectedQuery if provided by generator
    let solution = currentExercise.expectedQuery;

    // Otherwise use solution template if available
    if (!solution && currentExercise.solutionTemplate) {
      solution = currentExercise.solutionTemplate.replace(/{{(.*?)}}/g, (_m, p1) => {
        const key = String(p1).trim();
        const v = currentExercise.state?.[key];
        return v !== undefined && v !== null ? String(v) : '';
      });
    }

    if (!solution) {
      setFeedback({ message: 'No auto-solution available for this exercise.', type: 'info' });
      return;
    }

    setQuery(solution);
    setFeedback({ message: 'Solution inserted. Press Run & Check to execute.', type: 'info' });
  };

  // New exercise
  const handleNewExercise = () => {
    generateExercise();
  };

  // Show hint
  const handleShowHint = () => {
    setShowHint(true);
    const hint = currentExercise?.config?.hints?.[0];
    if (hint) {
      setFeedback({
        message: `Hint: ${hint}`,
        type: 'info'
      });
    }
  };

  if (isLoading) {
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
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Practice" />
          <Tab label="Theory" />
        </Tabs>
      </Box>

      {/* Progress */}
      {currentTab === 0 && (
        <Alert severity={isCompleted ? 'success' : 'info'} sx={{ mb: 2 }}>
          Progress: {Math.min(componentState.numSolved || 0, requiredCount)}/{requiredCount} exercises completed
          {isCompleted && ' - Skill mastered!'}
        </Alert>
      )}

      {/* Database Info */}
      {currentTab === 0 && tableNames.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Available tables:</strong> {tableNames.join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Exercise Description */}
      {currentTab === 0 && currentExercise && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Exercise {Math.min((componentState.numSolved || 0) + 1, requiredCount)}
            </Typography>
            <Typography variant="body1">
              {currentExercise.description}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* SQL Editor */}
      {currentTab === 0 && (
      <Card sx={{ mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderBottom: 1, 
          borderColor: 'divider', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant="subtitle2" sx={{ ml: 1 }}>
            Write your SQL query:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={handleShowHint}
              disabled={showHint || !(currentExercise?.config?.hints && currentExercise.config.hints.length > 0)}
            >
              Show Hint
            </Button>
            <Button
              size="small"
              onClick={handleAutoComplete}
              startIcon={<CheckCircle />}
              disabled={!currentExercise || isExecuting}
            >
              Auto-complete
            </Button>
            {!exerciseCompleted ? (
              <Button
                size="small"
                startIcon={<Refresh />}
                onClick={handleNewExercise}
                disabled={isExecuting}
                title="Try a different exercise"
              >
                Try Another
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<ArrowForward />}
                onClick={handleNewExercise}
                title="Proceed to the next exercise"
              >
                Next Exercise
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrow />}
              onClick={() => { void handleExecute(); }}
              disabled={!currentExercise || !query.trim() || isExecuting || exerciseCompleted || !dbReady}
            >
              Run & Check
            </Button>
          </Box>
        </Box>
        <CardContent sx={{ p: 0 }}>
          <SQLEditor 
            value={query} 
            onChange={setQuery} 
            height="200px" 
            onExecute={handleExecute}
            showResults={false}
          />
        </CardContent>
      </Card>
      )}

      {/* Results */}
      {currentTab === 0 && (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Query Results
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
      )}

      {/* Theory */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Theory
            </Typography>
            {skillTheory ? (
              formatContent(skillTheory)
            ) : (
              <Typography variant="body1" color="text.secondary">Theory coming soon.</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback Snackbar */}
      <Snackbar
        open={!!feedback}
        autoHideDuration={6000}
        onClose={() => setFeedback(null)}
      >
        <Alert 
          onClose={() => setFeedback(null)} 
          severity={feedback?.type} 
          sx={{ width: '100%' }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
