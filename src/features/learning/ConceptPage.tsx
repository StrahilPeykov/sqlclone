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
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  School,
  Lightbulb,
  MenuBook,
} from '@mui/icons-material';
import { useAppStore } from '@/store';
//
import { getConceptDetails, loadContentIndex, ContentEntryMeta } from '@/features/content/contentIndex';

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
  const updateProgress = useAppStore((state) => state.updateProgress);
  const user = useAppStore((state) => state.user);

  const [conceptMeta, setConceptMeta] = useState<ContentEntryMeta | null>(null);
  const [conceptDetails, setConceptDetails] = useState<any | null>(null);
  const [metaLoading, setMetaLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    if (conceptId) {
      // Load meta from content index
      loadContentIndex().then((idx) => {
        if (!mounted) return;
        const found = idx.find((e) => e.type === 'concept' && e.id === conceptId) || null;
        setConceptMeta(found);
      }).catch(() => {/* ignore */})
      .finally(() => { if (mounted) setMetaLoading(false); });

      getConceptDetails(conceptId).then((d) => {
        if (mounted) setConceptDetails(d);
      });
    }
    return () => {
      mounted = false;
    };
  }, [conceptId]);

  useEffect(() => {
    if (conceptId) {
      updateProgress(conceptId, { 
        lastAccessed: new Date(),
        type: 'concept'
      });
    }
  }, [conceptId, updateProgress]);

  if (metaLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!conceptMeta) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Concept not found. <Button onClick={() => navigate('/learn')}>Return to learning</Button>
        </Alert>
      </Container>
    );
  }

  const isCompleted = user?.progress[conceptId!]?.completed || false;

  const handleComplete = () => {
    updateProgress(conceptId!, {
      completed: true,
      type: 'concept',
    });
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
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
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Theory" icon={<Lightbulb />} iconPosition="start" />
            <Tab label="Summary" icon={<MenuBook />} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <CardContent>
            <Typography variant="h5" gutterBottom>Theory</Typography>
            {conceptDetails?.theory ? formatContent(conceptDetails.theory) : (
              <Typography variant="body1" color="text.secondary">Theory coming soon.</Typography>
            )}
          </CardContent>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <CardContent>
            <Typography variant="h5" gutterBottom>Summary</Typography>
            {conceptDetails?.summary ? formatContent(conceptDetails.summary) : (
              <Typography variant="body1" color="text.secondary">Summary coming soon.</Typography>
            )}
            
            {conceptDetails?.examples && conceptDetails.examples.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Examples</Typography>
                {conceptDetails.examples.map((example: any, index: number) => (
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
        <div /> {/* Spacer */}
        
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
          
          {conceptDetails?.nextConcepts && conceptDetails.nextConcepts.length > 0 && (
            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => navigate(`/concept/${conceptDetails.nextConcepts[0]}`)}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}
