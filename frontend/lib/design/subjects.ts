/**
 * Subject colour is keyed by the subject `code` that the API returns
 * (BAN, ENG, MAT, SCI, ICT, BGS, HSS, REL), never by array position, so the
 * mapping survives a reseed and a subject keeps its colour everywhere it
 * appears: timetable blocks, subject chips, homework headers, report cards.
 *
 * Each tint is a background that carries `ink` text, so a single foreground
 * colour stays AA-readable on all eight in both themes.
 */

export type SubjectCode = 'BAN' | 'ENG' | 'MAT' | 'SCI' | 'ICT' | 'BGS' | 'HSS' | 'REL';

const TINTS: Record<SubjectCode, string> = {
  BAN: 'bg-subject-ban',
  ENG: 'bg-subject-eng',
  MAT: 'bg-subject-mat',
  SCI: 'bg-subject-sci',
  ICT: 'bg-subject-ict',
  BGS: 'bg-subject-bgs',
  HSS: 'bg-subject-hss',
  REL: 'bg-subject-rel',
};

/**
 * Subjects seeded before `code` was populated, or any future subject the school
 * adds, fall back to a stable tint derived from the name rather than to a
 * single grey — so a new subject still reads as its own thing.
 */
const FALLBACK_ORDER: SubjectCode[] = ['MAT', 'ENG', 'SCI', 'BAN', 'ICT', 'HSS', 'BGS', 'REL'];

function hashToIndex(value: string, buckets: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % buckets;
}

export interface SubjectLike {
  code?: string | null;
  name?: string | null;
  nameBn?: string | null;
}

/** Tailwind background class for a subject's tint. */
export function subjectTint(subject?: SubjectLike | null): string {
  if (!subject) return 'bg-surface-sunken';
  const code = subject.code?.toUpperCase();
  if (code && code in TINTS) return TINTS[code as SubjectCode];
  const key = subject.name || code || '';
  if (!key) return 'bg-surface-sunken';
  return TINTS[FALLBACK_ORDER[hashToIndex(key, FALLBACK_ORDER.length)]];
}

/** The Bangla name, only when it differs from the English one. */
export function subjectBn(subject?: SubjectLike | null): string | null {
  const bn = subject?.nameBn?.trim();
  if (!bn) return null;
  if (bn === subject?.name?.trim()) return null;
  return bn;
}
