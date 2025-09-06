import { ComponentMeta, ConceptContent, SkillContent } from './types';

class ContentService {
  private static instance: ContentService;
  private contentIndex: ComponentMeta[] | null = null;
  private contentCache: Map<string, any> = new Map();
  
  private constructor() {}
  
  static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }
  
  /**
   * Load the main content index
   */
  async loadContentIndex(): Promise<ComponentMeta[]> {
    if (this.contentIndex) {
      return this.contentIndex;
    }
    
    try {
      const response = await fetch('/content/index.json');
      if (!response.ok) {
        throw new Error(`Failed to load content index: ${response.status}`);
      }
      
      const data = (await response.json()) as ComponentMeta[];
      this.contentIndex = data;
      return data;
    } catch (error) {
      console.error('Failed to load content index:', error);
      throw error;
    }
  }
  
  /**
   * Get component metadata by ID
   */
  async getComponentMeta(componentId: string): Promise<ComponentMeta | null> {
    const index = await this.loadContentIndex();
    return index.find(item => item.id === componentId) || null;
  }
  
  /**
   * Load concept details
   */
  async getConceptContent(conceptId: string): Promise<ConceptContent | null> {
    const cacheKey = `concept:${conceptId}`;
    
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }
    
    try {
      const response = await fetch(`/content/concepts/${conceptId}.json`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to load concept ${conceptId}: ${response.status}`);
      }
      
      const content = await response.json();
      this.contentCache.set(cacheKey, content);
      return content;
    } catch (error) {
      console.error(`Failed to load concept ${conceptId}:`, error);
      return null;
    }
  }
  
  /**
   * Load skill content including exercises
   */
  async getSkillContent(skillId: string): Promise<SkillContent | null> {
    const cacheKey = `skill:${skillId}`;
    
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey);
    }
    
    try {
      const response = await fetch('/content/skills/content.json');
      if (!response.ok) {
        throw new Error(`Failed to load skills content: ${response.status}`);
      }
      
      const skillsLibrary = await response.json();
      
      // For now, return the first exercise as example
      // In a real implementation, you'd filter by skillId
      const content: SkillContent = {
        theory: skillsLibrary.theory || '',
        exercises: skillsLibrary.exercises || [],
        reference: skillsLibrary.reference,
      };
      
      this.contentCache.set(cacheKey, content);
      return content;
    } catch (error) {
      console.error(`Failed to load skill ${skillId}:`, error);
      return null;
    }
  }
  
  /**
   * Get components by type
   */
  async getComponentsByType(type: 'concept' | 'skill'): Promise<ComponentMeta[]> {
    const index = await this.loadContentIndex();
    return index.filter(item => item.type === type);
  }
  
  /**
   * Get component dependencies
   */
  async getComponentDependencies(componentId: string): Promise<{
    prerequisites: ComponentMeta[];
    followUps: ComponentMeta[];
  }> {
    const index = await this.loadContentIndex();
    const component = index.find(item => item.id === componentId);
    
    if (!component) {
      return { prerequisites: [], followUps: [] };
    }
    
    const prerequisites = index.filter(item => 
      component.prerequisites.includes(item.id)
    );
    
    const followUps = index.filter(item =>
      item.prerequisites.includes(componentId)
    );
    
    return { prerequisites, followUps };
  }
  
  /**
   * Get recommended next components based on completed ones
   */
  async getRecommendations(completedIds: string[]): Promise<ComponentMeta[]> {
    const index = await this.loadContentIndex();
    const completed = new Set(completedIds);
    
    const recommendations = index.filter(component => {
      if (completed.has(component.id)) return false;
      return component.prerequisites.every(prereq => completed.has(prereq));
    });
    
    // Return top 3 recommendations, prioritizing by type and difficulty
    return recommendations
      .sort((a, b) => {
        // Concepts first, then skills
        if (a.type !== b.type) {
          return a.type === 'concept' ? -1 : 1;
        }
        
        // Then by difficulty
        const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
        const aDiff = difficultyOrder.indexOf(a.difficulty || 'beginner');
        const bDiff = difficultyOrder.indexOf(b.difficulty || 'beginner');
        return aDiff - bDiff;
      })
      .slice(0, 3);
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.contentCache.clear();
    this.contentIndex = null;
  }
}

export const contentService = ContentService.getInstance();

// React hooks for content
import { useQuery } from '@tanstack/react-query';

export function useContentIndex() {
  return useQuery({
    queryKey: ['content', 'index'],
    queryFn: () => contentService.loadContentIndex(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useComponentMeta(componentId: string) {
  return useQuery({
    queryKey: ['content', 'meta', componentId],
    queryFn: () => contentService.getComponentMeta(componentId),
    enabled: !!componentId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useConceptContent(conceptId: string) {
  return useQuery({
    queryKey: ['content', 'concept', conceptId],
    queryFn: () => contentService.getConceptContent(conceptId),
    enabled: !!conceptId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSkillContent(skillId: string) {
  return useQuery({
    queryKey: ['content', 'skill', skillId],
    queryFn: () => contentService.getSkillContent(skillId),
    enabled: !!skillId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useComponentsByType(type: 'concept' | 'skill') {
  return useQuery({
    queryKey: ['content', 'by-type', type],
    queryFn: () => contentService.getComponentsByType(type),
    staleTime: 1000 * 60 * 10,
  });
}

export function useComponentDependencies(componentId: string) {
  return useQuery({
    queryKey: ['content', 'dependencies', componentId],
    queryFn: () => contentService.getComponentDependencies(componentId),
    enabled: !!componentId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useRecommendations(completedIds: string[]) {
  return useQuery({
    queryKey: ['content', 'recommendations', completedIds],
    queryFn: () => contentService.getRecommendations(completedIds),
    staleTime: 1000 * 60 * 5,
  });
}
