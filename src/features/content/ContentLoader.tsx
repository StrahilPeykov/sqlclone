import { Component, ComponentMeta, ConceptContent, SkillContent } from './types';

/**
 * ContentLoader - Manages loading and caching of educational content
 * Content is stored in JSON files for easy editing and version control
 */
class ContentLoader {
  private static instance: ContentLoader;
  private cache: Map<string, Component> = new Map();
  private metadata: Map<string, ComponentMeta> = new Map();
  
  private constructor() {}
  
  static getInstance(): ContentLoader {
    if (!ContentLoader.instance) {
      ContentLoader.instance = new ContentLoader();
    }
    return ContentLoader.instance;
  }
  
  /**
   * Initialize the content loader with metadata
   */
  async initialize(): Promise<void> {
    try {
      // Load component metadata index
      const response = await fetch('/content/index.json');
      const index = await response.json();
      
      // Store metadata for quick access
      index.forEach((meta: ComponentMeta) => {
        this.metadata.set(meta.id, meta);
      });
    } catch (error) {
      console.error('Failed to load content index:', error);
      throw new Error('Content initialization failed');
    }
  }
  
  /**
   * Get all available components metadata
   */
  getAllComponents(): ComponentMeta[] {
    return Array.from(this.metadata.values());
  }
  
  /**
   * Get components filtered by type
   */
  getComponentsByType(type: 'concept' | 'skill'): ComponentMeta[] {
    return this.getAllComponents().filter(c => c.type === type);
  }
  
  /**
   * Load a specific component
   */
  async loadComponent(id: string): Promise<Component> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    
    // Get metadata
    const meta = this.metadata.get(id);
    if (!meta) {
      throw new Error(`Component "${id}" not found`);
    }
    
    try {
      // Load content based on type
      const contentPath = `/content/${meta.type}s/${id}/content.json`;
      const response = await fetch(contentPath);
      const content = await response.json();
      
      const component: Component = {
        meta,
        content: content as ConceptContent | SkillContent,
      };
      
      // Cache the component
      this.cache.set(id, component);
      
      return component;
    } catch (error) {
      console.error(`Failed to load component "${id}":`, error);
      throw new Error(`Failed to load component "${id}"`);
    }
  }
  
  /**
   * Get component dependencies (prerequisites and follow-ups)
   */
  getComponentDependencies(id: string): {
    prerequisites: ComponentMeta[];
    followUps: ComponentMeta[];
  } {
    const component = this.metadata.get(id);
    if (!component) {
      return { prerequisites: [], followUps: [] };
    }
    
    // Get prerequisites
    const prerequisites = component.prerequisites
      .map(prereqId => this.metadata.get(prereqId))
      .filter(Boolean) as ComponentMeta[];
    
    // Get follow-ups (components that have this as prerequisite)
    const followUps = this.getAllComponents().filter(c =>
      c.prerequisites.includes(id)
    );
    
    return { prerequisites, followUps };
  }
  
  /**
   * Build a learning path from current component to target
   */
  buildLearningPath(fromId: string, toId: string): string[] {
    // Simple BFS to find path
    const visited = new Set<string>();
    const queue: { id: string; path: string[] }[] = [
      { id: fromId, path: [fromId] },
    ];
    
    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      
      if (id === toId) {
        return path;
      }
      
      if (visited.has(id)) continue;
      visited.add(id);
      
      const { followUps } = this.getComponentDependencies(id);
      for (const followUp of followUps) {
        queue.push({
          id: followUp.id,
          path: [...path, followUp.id],
        });
      }
    }
    
    return []; // No path found
  }
  
  /**
   * Get recommended next components based on completed ones
   */
  getRecommendations(completedIds: string[]): ComponentMeta[] {
    const completed = new Set(completedIds);
    const recommendations: ComponentMeta[] = [];
    
    for (const component of this.getAllComponents()) {
      // Skip if already completed
      if (completed.has(component.id)) continue;
      
      // Check if all prerequisites are completed
      const allPrerequisitesMet = component.prerequisites.every(prereq =>
        completed.has(prereq)
      );
      
      if (allPrerequisitesMet) {
        recommendations.push(component);
      }
    }
    
    // Sort by difficulty and estimated time
    recommendations.sort((a, b) => {
      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      const aDiff = difficultyOrder[a.difficulty || 'beginner'];
      const bDiff = difficultyOrder[b.difficulty || 'beginner'];
      
      if (aDiff !== bDiff) return aDiff - bDiff;
      
      return (a.estimatedTime || 0) - (b.estimatedTime || 0);
    });
    
    return recommendations;
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const contentLoader = ContentLoader.getInstance();

// React hooks for content loading
import { useQuery } from '@tanstack/react-query';

export function useContent(componentId: string) {
  return useQuery({
    queryKey: ['content', componentId],
    queryFn: () => contentLoader.loadComponent(componentId),
    staleTime: Infinity, // Content doesn't change often
  });
}

export function useAllComponents() {
  return useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      await contentLoader.initialize();
      return contentLoader.getAllComponents();
    },
    staleTime: Infinity,
  });
}

export function useComponentDependencies(componentId: string) {
  return useQuery({
    queryKey: ['dependencies', componentId],
    queryFn: () => contentLoader.getComponentDependencies(componentId),
    staleTime: Infinity,
  });
}

export function useRecommendations(completedIds: string[]) {
  return useQuery({
    queryKey: ['recommendations', completedIds],
    queryFn: () => contentLoader.getRecommendations(completedIds),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}