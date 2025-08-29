// Simple mock content loader for testing
import { useState, useEffect } from 'react';

export interface ComponentMeta {
  id: string;
  name: string;
  type: 'concept' | 'skill';
  description?: string;
  prerequisites: string[];
  estimatedTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Component {
  meta: ComponentMeta;
  content: any;
}

// Mock data for testing
const mockComponents: ComponentMeta[] = [
  {
    id: 'database',
    name: 'What is a Database?',
    type: 'concept',
    description: 'Learn the fundamentals of databases and why they are important',
    prerequisites: [],
    estimatedTime: 15,
    difficulty: 'beginner',
  },
  {
    id: 'tables',
    name: 'Database Tables',
    type: 'concept',
    description: 'Understand how data is organized in tables',
    prerequisites: ['database'],
    estimatedTime: 20,
    difficulty: 'beginner',
  },
  {
    id: 'select-basics',
    name: 'SELECT Statements',
    type: 'skill',
    description: 'Learn to query data from database tables',
    prerequisites: ['tables'],
    estimatedTime: 30,
    difficulty: 'beginner',
  },
  {
    id: 'filtering',
    name: 'Filtering Data',
    type: 'skill',
    description: 'Use WHERE clauses to filter your results',
    prerequisites: ['select-basics'],
    estimatedTime: 25,
    difficulty: 'beginner',
  },
  {
    id: 'joins',
    name: 'Table Joins',
    type: 'skill',
    description: 'Combine data from multiple tables',
    prerequisites: ['filtering'],
    estimatedTime: 45,
    difficulty: 'intermediate',
  },
];

// Mock hook implementations
export function useContent(componentId: string) {
  const [data, setData] = useState<Component | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const meta = mockComponents.find(c => c.id === componentId);
      if (meta) {
        setData({
          meta,
          content: {
            theory: `This is the theory content for ${meta.name}. In a real implementation, this would be loaded from your content files.`,
            summary: `Summary of ${meta.name}: This concept is important for understanding SQL databases.`,
            examples: [
              {
                title: 'Basic Example',
                content: `Here's how ${meta.name} works in practice.`
              }
            ]
          }
        });
      } else {
        setError('Component not found');
      }
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [componentId]);
  
  return { data, isLoading, error };
}

export function useAllComponents() {
  const [data, setData] = useState<ComponentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setData(mockComponents);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  return { data, isLoading };
}

export function useComponentDependencies(componentId: string) {
  const [data, setData] = useState<{
    prerequisites: ComponentMeta[];
    followUps: ComponentMeta[];
  }>({ prerequisites: [], followUps: [] });
  
  useEffect(() => {
    const component = mockComponents.find(c => c.id === componentId);
    if (component) {
      const prerequisites = mockComponents.filter(c => 
        component.prerequisites.includes(c.id)
      );
      const followUps = mockComponents.filter(c =>
        c.prerequisites.includes(componentId)
      );
      setData({ prerequisites, followUps });
    }
  }, [componentId]);
  
  return { data };
}

export function useRecommendations(completedIds: string[]) {
  const [data, setData] = useState<ComponentMeta[]>([]);
  
  useEffect(() => {
    const completed = new Set(completedIds);
    const recommendations = mockComponents.filter(component => {
      if (completed.has(component.id)) return false;
      return component.prerequisites.every(prereq => completed.has(prereq));
    });
    setData(recommendations.slice(0, 3)); // Top 3 recommendations
  }, [completedIds]);
  
  return { data };
}