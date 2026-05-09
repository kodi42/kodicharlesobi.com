/**
 * Turn a Google Doc filename into a URL slug.
 * - Lowercase
 * - Strip punctuation, keep alphanumerics + hyphens
 * - Collapse whitespace to single hyphens
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';
}

/** Minutes, assuming 220 wpm casual reading. Always at least 1. */
export function readingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 220));
}

/** Format an ISO date as "Apr 21, 2026" in the mono-meta look. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
