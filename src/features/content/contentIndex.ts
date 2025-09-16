import type { ContentMeta } from '@/features/learning/content';
import { contentIndex } from '@/features/learning/content';

export type ContentType = ContentMeta['type'];
export type ContentEntryMeta = ContentMeta;

export async function loadContentIndex(): Promise<ContentEntryMeta[]> {
  return contentIndex;
}

export { contentIndex };
