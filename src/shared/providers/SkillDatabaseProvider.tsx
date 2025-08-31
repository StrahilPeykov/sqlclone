import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Database } from 'sql.js';

interface SkillDatabaseContextType {
  skillDatabaseCollection: Database[][][]; // [practice/test][small/large][databases by skill]
  setSkillDatabaseCollection: React.Dispatch<React.SetStateAction<Database[][][]>>;
}

const SkillDatabaseContext = createContext<SkillDatabaseContextType>({
  skillDatabaseCollection: [],
  setSkillDatabaseCollection: () => {},
});

export function useSkillDatabaseContext() {
  return useContext(SkillDatabaseContext);
}

interface SkillDatabaseProviderProps {
  children: ReactNode;
}

export function SkillDatabaseProvider({ children }: SkillDatabaseProviderProps) {
  // Structure: [practice/test][small/large][skill databases]
  // This creates a 2x2 grid of database collections for different purposes:
  // - practice vs test environments
  // - small vs large datasets
  const [skillDatabaseCollection, setSkillDatabaseCollection] = useState<Database[][][]>([
    [[], []], // Practice: [small databases, large databases]
    [[], []], // Test: [small databases, large databases]
  ]);

  return (
    <SkillDatabaseContext.Provider
      value={{
        skillDatabaseCollection,
        setSkillDatabaseCollection,
      }}
    >
      {children}
    </SkillDatabaseContext.Provider>
  );
}

// Hook to get databases for a specific skill
export function useSkillDatabase(
  skillId: string,
  isTest: boolean = false,
  useLargeDatabase: boolean = false
) {
  const { skillDatabaseCollection, setSkillDatabaseCollection } = useSkillDatabaseContext();
  
  // Get the appropriate database collection
  const collectionIndex = isTest ? 1 : 0;
  const sizeIndex = useLargeDatabase ? 1 : 0;
  const databases = skillDatabaseCollection[collectionIndex]?.[sizeIndex] || [];
  
  // Find database for this skill (this is a simplified version)
  const database = databases.find((db: any) => db._skillId === skillId);
  
  const setDatabase = (newDatabase: Database) => {
    // Add skill ID to database for tracking
    (newDatabase as any)._skillId = skillId;
    
    setSkillDatabaseCollection(prev => {
      const updated = [...prev];
      if (!updated[collectionIndex]) updated[collectionIndex] = [[], []];
      if (!updated[collectionIndex][sizeIndex]) updated[collectionIndex][sizeIndex] = [];
      
      // Replace existing database or add new one
      const existingIndex = updated[collectionIndex][sizeIndex].findIndex(
        (db: any) => db._skillId === skillId
      );
      
      if (existingIndex >= 0) {
        updated[collectionIndex][sizeIndex][existingIndex] = newDatabase;
      } else {
        updated[collectionIndex][sizeIndex].push(newDatabase);
      }
      
      return updated;
    });
  };

  return {
    database,
    setDatabase,
    resetDatabase: () => {
      // Remove database from collection to force recreation
      setSkillDatabaseCollection(prev => {
        const updated = [...prev];
        if (updated[collectionIndex]?.[sizeIndex]) {
          updated[collectionIndex][sizeIndex] = updated[collectionIndex][sizeIndex].filter(
            (db: any) => db._skillId !== skillId
          );
        }
        return updated;
      });
    },
  };
}