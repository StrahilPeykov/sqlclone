import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  School,
  Lightbulb,
  MenuBook,
  Code,
} from '@mui/icons-material';

import { useComponentState } from '@/store';
import { useConceptDatabase } from '@/shared/hooks/useDatabase';
import { SQLEditor } from '@/shared/components/SQLEditor';
import { DataTable } from '@/shared/components/DataTable';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`concept-tabpanel-${index}`}
      aria-labelledby={`concept-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ConceptPage() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  
  // Use new store
  const [componentState, setComponentState] = useComponentState(conceptId || '');
  
  // Database for concept demonstrations
  const { 
    executeQuery, 
    queryResult, 
    queryError, 
    isExecuting,
    tableNames 
  } = useConceptDatabase('companies');
  
  // Demo query state for interactive examples
  const [demoQuery, setDemoQuery] = useState('SELECT * FROM companies LIMIT 5;');
  
  // Load concept metadata
  const [conceptMeta, setConceptMeta] = useState<any>(null);
  const [conceptContent, setConceptContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conceptId) return;

    const load = async () => {
      try {
        // Load metadata from index
        const indexRes = await fetch('/content/index.json');
        const indexData = await indexRes.json();
        const concept = indexData.find((c: any) => c.id === conceptId);
        if (!concept) throw new Error('Concept not found');

        // If a folder-based content path exists, load from there
        if (concept.contentPath) {
          try {
            const metaRes = await fetch(`/content/${concept.contentPath}/meta.json`);
            const meta = await metaRes.json();

            // Load MDX files as plain text
            const [theoryRes, quickRes] = await Promise.all([
              fetch(`/content/${concept.contentPath}/full.mdx`),
              fetch(`/content/${concept.contentPath}/summary.mdx`),
            ]);
            const [theory, summary] = await Promise.all([
              theoryRes.ok ? theoryRes.text() : Promise.resolve(''),
              quickRes.ok ? quickRes.text() : Promise.resolve(''),
            ]);

            setConceptMeta({ ...concept, ...meta });
            setConceptContent({ theory, summary });
            setIsLoading(false);
            return;
          } catch (e) {
            // Fall back to legacy JSON below
            console.warn('Folder-based content missing, falling back to legacy JSON.', e);
          }
        }

        // Legacy JSON fallback
        const legacyRes = await fetch(`/content/concepts/${conceptId}.json`);
        const legacyContent = await legacyRes.json();
        setConceptMeta(concept);
        setConceptContent(legacyContent);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load concept:', err);
        setError(err.message || 'Failed to load concept');
        setIsLoading(false);
      }
    };

    load();

    // Update last accessed
    if (componentState.type !== 'concept') {
      setComponentState({ type: 'concept' });
    }
  }, [conceptId, setComponentState, componentState.type]);

  // Restore saved tab
  useEffect(() => {
    if (componentState.tab) {
      const tabIndex = ['theory', 'summary', 'examples'].indexOf(componentState.tab);
      if (tabIndex >= 0) setCurrentTab(tabIndex);
    }
  }, [componentState.tab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    const tabNames = ['theory', 'summary', 'examples'];
    setComponentState({ tab: tabNames[newValue] });
  };

  const handleExecuteDemo = async () => {
    try {
      await executeQuery(demoQuery);
    } catch (error) {
      // Error is handled by the database hook
      console.error('Demo query failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !conceptMeta) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'Concept not found'}
          <Button onClick={() => navigate('/learn')}>Return to learning</Button>
        </Alert>
      </Container>
    );
  }

  const isCompleted = componentState.understood || false;

  const handleComplete = () => {
    setComponentState({ understood: true });
  };

  const formatContent = (content: string) => {
    if (!content) return null;
    
    const lines = content.trim().split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return <Typography key={index} variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>{line.replace('## ', '')}</Typography>;
      } else if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
        return match ? (
          <Typography key={index} variant="body1" sx={{ ml: 2, mb: 0.5 }}>
            • <strong>{match[1]}</strong>: {match[2]}
          </Typography>
        ) : <Typography key={index} variant="body1" sx={{ ml: 2 }}>{line}</Typography>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <Typography key={index} variant="body1" paragraph>{line}</Typography>;
      }
    });
  };

  // Demo queries based on concept
  const getDemoQueries = (conceptId: string) => {
    const demoQueries: Record<string, string[]> = {
      'database': [
        'SELECT * FROM companies LIMIT 5;',
        'SELECT COUNT(*) as total_companies FROM companies;',
        'SELECT DISTINCT country FROM companies;'
      ],
      'database-table': [
        'SELECT company_name, country FROM companies LIMIT 5;',
        'SELECT * FROM companies WHERE country = "Netherlands";',
        'SELECT company_name, num_employees FROM companies ORDER BY num_employees DESC LIMIT 3;'
      ],
      'data-types': [
        'SELECT company_name, founded_year, num_employees FROM companies LIMIT 5;',
        'SELECT typeof(company_name), typeof(founded_year), typeof(num_employees) FROM companies LIMIT 1;'
      ]
    };
    return demoQueries[conceptId] || ['SELECT * FROM companies LIMIT 5;'];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/learn')}
          sx={{ mr: 2 }}
        >
          Back to Learning
        </Button>
        <School color="primary" sx={{ mr: 1 }} />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {conceptMeta.name}
          {isCompleted && <CheckCircle color="success" sx={{ ml: 1 }} />}
        </Typography>
      </Box>

      {/* Concept Info */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {conceptMeta.description}
        </Typography>
      </Box>

      {/* Prerequisites */}
      {conceptMeta.prerequisites && conceptMeta.prerequisites.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Prerequisites:</strong> {conceptMeta.prerequisites.join(', ')}
        </Alert>
      )}

      {/* Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Theory" icon={<Lightbulb />} iconPosition="start" />
            <Tab label="Summary" icon={<MenuBook />} iconPosition="start" />
            <Tab label="Examples" icon={<Code />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <CardContent>
            <Typography variant="h5" gutterBottom>Theory</Typography>
            {conceptContent?.theory ? (
              formatContent(conceptContent.theory)
            ) : (
              <Typography variant="body1" color="text.secondary">Theory content coming soon.</Typography>
            )}
          </CardContent>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <CardContent>
            <Typography variant="h5" gutterBottom>Summary</Typography>
            {conceptContent?.summary ? (
              formatContent(conceptContent.summary)
            ) : (
              <Typography variant="body1" color="text.secondary">Summary coming soon.</Typography>
            )}
            
            {conceptContent?.examples && conceptContent.examples.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Key Examples</Typography>
                {conceptContent.examples.map((example: any, index: number) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>{example.title}</Typography>
                    <Typography variant="body2">{example.content}</Typography>
                  </Box>
                ))}
              </>
            )}
          </CardContent>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom>Interactive Examples</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Try these example queries to understand the concept better:
            </Typography>

            {/* Database Info */}
            {tableNames.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Available tables:</strong> {tableNames.join(', ')}
                </Typography>
              </Alert>
            )}

            {/* Demo Query Buttons */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Quick Examples:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {getDemoQueries(conceptId || '').map((query, index) => (
                  <Button
                    key={index}
                    size="small"
                    variant="outlined"
                    onClick={() => setDemoQuery(query)}
                    sx={{ textTransform: 'none', fontFamily: 'monospace', fontSize: '0.75rem' }}
                  >
                    {query.length > 30 ? `${query.substring(0, 30)}...` : query}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* SQL Editor */}
            <Paper sx={{ mb: 2 }}>
              <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Button
                  startIcon={<Code />}
                  onClick={handleExecuteDemo}
                  disabled={!demoQuery.trim() || isExecuting}
                  variant="contained"
                  size="small"
                >
                  Run Example
                </Button>
              </Box>
              <SQLEditor
                value={demoQuery}
                onChange={setDemoQuery}
                height="150px"
                onExecute={handleExecuteDemo}
                showResults={false}
              />
            </Paper>

            {/* Results */}
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Results
              </Typography>
              {queryError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {queryError instanceof Error ? queryError.message : 'Query execution failed'}
                </Alert>
              )}
              {queryResult && queryResult.length > 0 ? (
                <DataTable data={queryResult[0]} maxRows={10} compact />
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                  Run an example query to see results
                </Typography>
              )}
            </Paper>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <div />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isCompleted && (
            <Button
              variant="contained"
              onClick={handleComplete}
              startIcon={<CheckCircle />}
            >
              Mark as Complete
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}
