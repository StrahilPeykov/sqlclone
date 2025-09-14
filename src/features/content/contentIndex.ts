// Centralized loader for content JSON under `/content` served by viteStaticCopy.
// We fetch JSON at runtime to avoid module MIME issues.

export type ContentType = 'concept' | 'skill';

export interface ContentEntryMeta {
  id: string;
  name: string;
  type: ContentType;
  description: string;
  prerequisites: string[];
  contentPath?: string; // optional folder-based content location
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
    // Try folder-based content first by looking up index for contentPath
    const index = await fetchJSON<any[]>('/content/index.json');
    const entry = index.find(e => e.id === id);
    if (entry && entry.contentPath) {
      try {
        const [theoryRes, quickRes] = await Promise.all([
          fetch(`/content/${entry.contentPath}/index.mdx`),
          fetch(`/content/${entry.contentPath}/quick.mdx`),
        ]);
        const [theory, summary] = await Promise.all([
          theoryRes.ok ? theoryRes.text() : Promise.resolve(''),
          quickRes.ok ? quickRes.text() : Promise.resolve(''),
        ]);
        // Return only text content; structural meta is handled elsewhere
        return { theory, summary };
      } catch (_) {
        // Fall through to legacy JSON below
      }
    }

    // Legacy JSON fallback
    return await fetchJSON<any>(`/content/concepts/${id}.json`);
  } catch {
    return null;
  }
}

export async function loadSkillsLibrary(): Promise<any> {
  return fetchJSON<any>('/content/skills/content.json');
}
