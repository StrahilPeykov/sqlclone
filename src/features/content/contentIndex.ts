// Centralized loader for content JSON under `/content` served by viteStaticCopy.
// We fetch JSON at runtime to avoid module MIME issues.

export type ContentType = 'concept' | 'skill';

export interface ContentEntryMeta {
  id: string;
  name: string;
  type: ContentType;
  description: string;
  prerequisites: string[];
}

const cache: Record<string, any> = {};

async function fetchJSON<T = unknown>(path: string): Promise<T> {
  if (cache[path]) return cache[path] as T;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const data = (await res.json()) as T;
  cache[path] = data;
  return data;
}

export async function loadContentIndex(): Promise<ContentEntryMeta[]> {
  return fetchJSON<ContentEntryMeta[]>('/content/index.json');
}

export async function getConceptDetails(id: string): Promise<any | null> {
  try {
    return await fetchJSON<any>(`/content/concepts/${id}.json`);
  } catch {
    return null;
  }
}

export async function loadSkillsLibrary(): Promise<any> {
  return fetchJSON<any>('/content/skills/content.json');
}
