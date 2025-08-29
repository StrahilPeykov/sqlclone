import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Divider,
  Typography,
  Chip,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  CheckCircle,
  RadioButtonUnchecked,
  Book,
  Code,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useAllComponents } from '@/features/content/ContentLoader';

interface SidebarProps {
  open: boolean;
}

export function Sidebar({ open }: SidebarProps) {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    concepts: true,
    skills: true,
  });
  
  const user = useAppStore((state) => state.user);
  const { data: components = [], isLoading } = useAllComponents();
  
  // Group components by type
  const groupedComponents = useMemo(() => {
    const concepts = components.filter((c) => c.type === 'concept');
    const skills = components.filter((c) => c.type === 'skill');
    return { concepts, skills };
  }, [components]);
  
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  const handleNavigate = (componentId: string) => {
    navigate(`/learn/${componentId}`);
  };
  
  const isCompleted = (componentId: string) => {
    return user?.progress[componentId]?.completed || false;
  };
  
  const getProgress = (componentId: string) => {
    const progress = user?.progress[componentId];
    if (!progress) return null;
    
    if (progress.type === 'skill' && progress.exercisesCompleted) {
      return `${progress.exercisesCompleted}/3`;
    }
    
    return null;
  };
  
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? 240 : 72,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? 240 : 72,
          boxSizing: 'border-box',
          top: 64, // Account for header height
          transition: 'width 0.3s',
          overflowX: 'hidden',
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
        },
      }}
    >
      {open ? (
        <Box sx={{ overflow: 'auto' }}>
          {/* Concepts Section */}
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => toggleSection('concepts')}>
                <ListItemIcon>
                  <Book />
                </ListItemIcon>
                <ListItemText
                  primary="Concepts"
                  secondary={`${groupedComponents.concepts.filter(c => isCompleted(c.id)).length}/${groupedComponents.concepts.length}`}
                />
                {expandedSections.concepts ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={expandedSections.concepts} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {groupedComponents.concepts.map((concept) => (
                  <ListItem
                    key={concept.id}
                    disablePadding
                    sx={{ pl: 2 }}
                  >
                    <ListItemButton
                      onClick={() => handleNavigate(concept.id)}
                      sx={{
                        py: 0.5,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {isCompleted(concept.id) ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <RadioButtonUnchecked fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={concept.name}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          color: isCompleted(concept.id)
                            ? 'text.secondary'
                            : 'text.primary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </List>
          
          <Divider />
          
          {/* Skills Section */}
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => toggleSection('skills')}>
                <ListItemIcon>
                  <Code />
                </ListItemIcon>
                <ListItemText
                  primary="Skills"
                  secondary={`${groupedComponents.skills.filter(c => isCompleted(c.id)).length}/${groupedComponents.skills.length}`}
                />
                {expandedSections.skills ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={expandedSections.skills} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {groupedComponents.skills.map((skill) => {
                  const progress = getProgress(skill.id);
                  
                  return (
                    <ListItem
                      key={skill.id}
                      disablePadding
                      sx={{ pl: 2 }}
                    >
                      <ListItemButton
                        onClick={() => handleNavigate(skill.id)}
                        sx={{
                          py: 0.5,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {isCompleted(skill.id) ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <RadioButtonUnchecked fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={skill.name}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            color: isCompleted(skill.id)
                              ? 'text.secondary'
                              : 'text.primary',
                          }}
                        />
                        {progress && (
                          <Chip
                            label={progress}
                            size="small"
                            color={isCompleted(skill.id) ? 'success' : 'default'}
                            sx={{ height: 20, fontSize: '0.75rem' }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </List>
          
          {/* Stats Summary */}
          <Box sx={{ p: 2, mt: 'auto' }}>
            <Typography variant="caption" color="text.secondary">
              Progress Summary
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Concepts: {groupedComponents.concepts.filter(c => isCompleted(c.id)).length}/{groupedComponents.concepts.length}
              </Typography>
              <Typography variant="body2">
                Skills: {groupedComponents.skills.filter(c => isCompleted(c.id)).length}/{groupedComponents.skills.length}
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        /* Collapsed Sidebar */
        <List>
          <ListItem disablePadding>
            <ListItemButton
              sx={{ justifyContent: 'center' }}
              onClick={() => navigate('/learn')}
            >
              <ListItemIcon sx={{ justifyContent: 'center' }}>
                <Book />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              sx={{ justifyContent: 'center' }}
              onClick={() => navigate('/practice')}
            >
              <ListItemIcon sx={{ justifyContent: 'center' }}>
                <Code />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </List>
      )}
    </Drawer>
  );
}