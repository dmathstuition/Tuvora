/**
 * Homework submission formats a learner may use to answer a piece of homework.
 * A tutor picks any mix of these when creating an assignment; the learner's
 * submit screen only offers the chosen ones. Kept here so the tutor form, the
 * learner submit form, and the server all agree on the same set of keys.
 */
export const HOMEWORK_FORMATS = [
  { key: 'type', label: 'Type', hint: 'Digital notebook (typed answer)' },
  { key: 'upload', label: 'Upload', hint: 'Photos, PDFs or documents' },
  { key: 'draw', label: 'Draw', hint: 'Handwriting / drawing canvas' },
  { key: 'voice', label: 'Voice', hint: 'Spoken (audio) answer' },
] as const;

export type HomeworkFormat = (typeof HOMEWORK_FORMATS)[number]['key'];

export const ALL_HOMEWORK_FORMATS: HomeworkFormat[] = HOMEWORK_FORMATS.map((f) => f.key);

/** Keep only recognised format keys, preserving canonical order. */
export function sanitizeFormats(input: string[] | null | undefined): HomeworkFormat[] {
  const set = new Set(input ?? []);
  const kept = ALL_HOMEWORK_FORMATS.filter((k) => set.has(k));
  return kept.length > 0 ? kept : ALL_HOMEWORK_FORMATS;
}
