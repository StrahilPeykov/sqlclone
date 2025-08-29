import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Book,
  Lightbulb,
  Code,
  ArrowForward,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { useAppStore } from '@/store';
import { useContent, useComponentDependencies } from '@/features/content/ContentLoader';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { SQLDisplay } from '@/shared/components/SQLEditor';

export default function LearningPage() {
  const { componentId, tab } = useParams<{ componentId: string; tab?: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(tab || 'theory');
  
  const updateProgress = useAppStore((state) => state.updateProgress);
  const user = useAppStore((state) => state.user);
  const progress = user?.progress[componentId!];
  
  // Load content and dependencies
  const { data: component, isLoading, error } = useContent(componentId!);
  const { data: dependencies } = useComponentDependencies(componentId!);
  
  useEffect(() => {
    if (tab !== currentTab) {
      navigate(`/learn/${componentId}/${currentTab}`, { replace: true });
    }
  }, [currentTab, tab, componentId, navigate]);
  
  // Update last accessed
  useEffect(() => {
    if (componentId) {
      updateProgress(componentId, { lastAccessed: new Date() });
    }
  }, [componentId, updateProgress]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (error || !component) {
    return (
      <Alert severity="error">
        Failed to load content. Please try again later.
      </Alert>
    );
  }
  
  const isCompleted = progress?.completed || false;
  const isConcept = component.meta.type === 'concept';
  const content = component.content as any;
  
  const handleComplete = () => {
    updateProgress(componentId!, {
      completed: true,
      type: component.meta.type,
    });
  };
  
  const handlePractice = () => {
    navigate(`/practice/${componentId}`);
  };
  
  const renderTabContent = () => {
    switch (currentTab) {
      case 'theory':
        return (
          <Box>
            {content.theory ? (
              <ReactMarkdown
                components={{
                  code: ({ children, className }) => {
                    const isInline = !className;
                    const language = className?.replace('language-', '');
                    
                    if (isInline) {
                      return <code className="inline-code">{children}</code>;
                    }
                    
                    if (language === 'sql') {
                      return <SQLDisplay>{String(children)}</SQLDisplay>;
                    }
                    
                    return (
                      <pre className="code-block">
                        <code>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {content.theory}
              </ReactMarkdown>
            ) : (
              <Typography>No theory content available.</Typography>
            )}
          </Box>
        );
      
      case 'summary':
        return (
          <Box>
            {content.summary ? (
              <ReactMarkdown>{content.summary}</ReactMarkdown>
            ) : (
              <Typography>No summary available.</Typography>
            )}
          </Box>
        );
      
      case 'examples':
        return (
          <Box>
            {content.examples && content.examples.length > 0 ? (
              content.examples.map((example: any, index: number) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {example.title}
                  </Typography>
                  <ReactMarkdown>{example.content}</ReactMarkdown>
                </Box>
              ))
            ) : (
              <Typography>No examples available.</Typography>
            )}
          </Box>
        );
      
      case 'reference':
        if (!content.reference) {
          return <Typography>No reference available.</Typography>;
        }
        
        return (
          <Box>
            {content.reference.syntax && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Syntax
                </Typography>
                <SQLDisplay>{content.reference.syntax}</SQLDisplay>
              </Box>
            )}
            
            {content.reference.examples && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Examples
                </Typography>
                {content.reference.examples.map((ex: any, i: number) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {ex.title}
                    </Typography>
                    <SQLDisplay>{ex.sql}</SQLDisplay>
                    {ex.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {ex.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            
            {content.reference.commonMistakes && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Common Mistakes
                </Typography>
                {content.reference.commonMistakes.map((mistake: any, i: number) => (
                  <Alert key={i} severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      ❌ {mistake.mistake}
                    </Typography>
                    <Typography variant="body2">
                      ✅ {mistake.correction}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  // Determine available tabs
  const tabs = [];
  if (content.theory) tabs.push({ value: 'theory', label: 'Theory', icon: Book });
  if (content.summary) tabs.push({ value: 'summary', label: 'Summary', icon: Lightbulb });
  if (content.examples) tabs.push({ value: 'examples', label: 'Examples', icon: Code });
  if (content.reference) tabs.push({ value: 'reference', label: 'Reference', icon: Book });
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {component.meta.name}
          </Typography>
          {isCompleted && (
            <CheckCircle color="success" sx={{ ml: 2 }} />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={component.meta.type}
            size="small"
            color={isConcept ? 'primary' : 'secondary'}
          />
          {component.meta.difficulty && (
            <Chip label={component.meta.difficulty} size="small" />
          )}
          {component.meta.estimatedTime && (
            <Chip label={`${component.meta.estimatedTime} min`} size="small" />
          )}
        </Box>
        
        {component.meta.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            {component.meta.description}
          </Typography>
        )}
      </Box>
      
      {/* Prerequisites Alert */}
      {dependencies?.prerequisites && dependencies.prerequisites.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Prerequisites: {dependencies.prerequisites.map(p => p.name).join(', ')}
          </Typography>
        </Alert>
      )}
      
      {/* Progress Bar for Skills */}
      {!isConcept && progress?.exercisesCompleted !== undefined && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Exercises Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress.exercisesCompleted}/3
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(progress.exercisesCompleted / 3) * 100}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}
      
      {/* Tabs */}
      {tabs.length > 1 && (
        <Tabs
          value={currentTab}
          onChange={(_, value) => setCurrentTab(value)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={<tab.icon />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      )}
      
      {/* Content */}
      <Box sx={{ mb: 4 }}>
        {renderTabContent()}
      </Box>
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Previous
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isConcept && !isCompleted && (
            <Button
              variant="contained"
              onClick={handleComplete}
              startIcon={<CheckCircle />}
            >
              Mark as Complete
            </Button>
          )}
          
          {!isConcept && (
            <Button
              variant="contained"
              onClick={handlePractice}
              startIcon={<Code />}
            >
              Practice Exercises
            </Button>
          )}
          
          {dependencies?.followUps && dependencies.followUps.length > 0 && (
            <Button
              endIcon={<ArrowForward />}
              onClick={() => navigate(`/learn/${dependencies.followUps[0].id}`)}
            >
              Next: {dependencies.followUps[0].name}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}