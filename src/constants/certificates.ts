/** Certificate types offered to tutors. Presentation config, client-safe. */
export const CERTIFICATE_TYPES = [
  { value: 'achievement', label: 'Achievement', emoji: '🏆' },
  { value: 'completion', label: 'Completion', emoji: '🎓' },
  { value: 'excellence', label: 'Excellence', emoji: '⭐' },
  { value: 'participation', label: 'Participation', emoji: '🙌' },
  { value: 'term_report', label: 'Term report', emoji: '📄' },
] as const;
