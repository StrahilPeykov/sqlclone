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
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  School,
  Lightbulb,
  MenuBook,
} from '@mui/icons-material';

import { useComponentState } from '@/store';

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
  
  // Load concept metadata
  const [conceptMeta, setConceptMeta] = useState<any>(null);
  const [conceptContent, setConceptContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conceptId) return;
    
    // Load metadata from index
    fetch('/content/index.json')
      .then(res => res.json())
      .then(data => {
        const concept = data.find((c: any) => c.id === conceptId);
        if (concept) {
          setConceptMeta(concept);
          
          // Try to load concept content
          return fetch(`/content/concepts/${conceptId}.json`);
        }
        throw new Error('Concept not found');
      })
      .then(res => res.json())
      .then(content => {
        setConceptContent(content);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load concept:', err);
        setError(err.message);
        setIsLoading(false);
      });
      
    // Update last accessed
    if (componentState.type !== 'concept') {
      setComponentState({ type: 'concept' });
    }
  }, [conceptId, setComponentState, componentState.type]);

  // Restore saved tab
  useEffect(() => {
    if (componentState.tab) {
      const tabIndex = ['theory', 'summary'].indexOf(componentState.tab);
      if (tabIndex >= 0) setCurrentTab(tabIndex);
    }
  }, [componentState.tab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    const tabNames = ['theory', 'summary'];
    setComponentState({ tab: tabNames[newValue] });
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
        {/* Estimated time removed */}
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
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Examples</Typography>
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
          
          {conceptContent?.nextConcepts?.[0] && (
            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => navigate(`/concept/${conceptContent.nextConcepts[0]}`)}
            >
              Next Concept
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}
