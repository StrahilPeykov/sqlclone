import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

export type ContentType = 'concept' | 'skill';

export interface ContentMeta {
  id: string;
  name: string;
  type: ContentType;
  description: string;
  prerequisites: string[];
}

export type ContentComponentMap = Record<string, LazyExoticComponent<ComponentType<any>>>;

export const contentIndex: ContentMeta[] = [
  {
    id: 'database',
    name: 'What is a Database?',
    type: 'concept',
    description: 'Understanding databases, tables, and database management systems',
    prerequisites: [],
  },
  {
    id: 'database-table',
    name: 'Database Tables',
    type: 'concept',
    description: 'Learn about rows, columns, and how data is structured in tables',
    prerequisites: ['database'],
  },
  {
    id: 'data-types',
    name: 'Data Types',
    type: 'concept',
    description: 'Different types of data that can be stored in database columns',
    prerequisites: ['database-table'],
  },
  {
    id: 'database-keys',
    name: 'Database Keys',
    type: 'concept',
    description: 'Primary keys, foreign keys, and unique identifiers',
    prerequisites: ['database-table'],
  },
  {
    id: 'filter-rows',
    name: 'Filter Rows',
    type: 'skill',
    description: 'Use WHERE clause to filter data based on conditions',
    prerequisites: ['sql', 'data-types'],
  },
];

export const contentComponents: Record<string, ContentComponentMap> = {
  database: {
    Theory: lazy(() => import('./concepts/database/Theory')),
    Summary: lazy(() => import('./concepts/database/Summary')),
    Story: lazy(() => import('./concepts/database/Story')),
  },
  'database-table': {
    Theory: lazy(() => import('./concepts/database-table/Theory')),
    Summary: lazy(() => import('./concepts/database-table/Summary')),
    Story: lazy(() => import('./concepts/database-table/Story')),
  },
  'data-types': {
    Theory: lazy(() => import('./concepts/data-types/Theory')),
    Summary: lazy(() => import('./concepts/data-types/Summary')),
    Story: lazy(() => import('./concepts/data-types/Story')),
  },
  'database-keys': {
    Theory: lazy(() => import('./concepts/database-keys/Theory')),
    Summary: lazy(() => import('./concepts/database-keys/Summary')),
    Story: lazy(() => import('./concepts/database-keys/Story')),
  },
  'filter-rows': {
    Theory: lazy(() => import('./skills/filter-rows/Theory')),
    Story: lazy(() => import('./skills/filter-rows/Story')),
  },
};

export const skillExerciseLoaders = {
  'filter-rows': () => import('./skills/filter-rows/exercise'),
};
