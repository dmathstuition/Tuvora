/**
 * Gamification presets — reward categories, quick point values, avatars, themes
 * and the level curve. These power the tutor award/sanction controls and the
 * colourful learner portal. Values are presentation config, safe on the client.
 */

export const REWARD_CATEGORIES = [
  { value: 'achievement', label: 'Achievement', emoji: '🏆' },
  { value: 'effort', label: 'Effort', emoji: '💪' },
  { value: 'homework', label: 'Homework', emoji: '📚' },
  { value: 'behaviour', label: 'Behaviour', emoji: '🌟' },
  { value: 'participation', label: 'Participation', emoji: '🙋' },
  { value: 'other', label: 'Other', emoji: '✨' },
] as const;

export const SANCTION_CATEGORIES = [
  { value: 'behaviour', label: 'Behaviour', emoji: '⚠️' },
  { value: 'homework', label: 'Missed homework', emoji: '❌' },
  { value: 'lateness', label: 'Lateness', emoji: '⏰' },
  { value: 'other', label: 'Other', emoji: '➖' },
] as const;

/** Quick-pick point amounts (always positive; sign is applied by kind). */
export const REWARD_POINTS = [5, 10, 20, 50] as const;
export const SANCTION_POINTS = [5, 10, 20] as const;

/** Avatar presets — emoji + a gradient class pair for the portal. */
export const AVATARS = [
  { key: 'fox', emoji: '🦊', label: 'Fox' },
  { key: 'owl', emoji: '🦉', label: 'Owl' },
  { key: 'rocket', emoji: '🚀', label: 'Rocket' },
  { key: 'star', emoji: '⭐', label: 'Star' },
  { key: 'panda', emoji: '🐼', label: 'Panda' },
  { key: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  { key: 'lion', emoji: '🦁', label: 'Lion' },
  { key: 'robot', emoji: '🤖', label: 'Robot' },
  { key: 'dragon', emoji: '🐲', label: 'Dragon' },
  { key: 'dolphin', emoji: '🐬', label: 'Dolphin' },
  { key: 'wizard', emoji: '🧙', label: 'Wizard' },
  { key: 'butterfly', emoji: '🦋', label: 'Butterfly' },
] as const;

export const DEFAULT_AVATAR = 'star';

/** Portal themes — each is a from/to gradient using literal Tailwind classes. */
export const THEMES = [
  { key: 'indigo', label: 'Indigo', gradient: 'from-indigo-500 to-violet-600' },
  { key: 'ocean', label: 'Ocean', gradient: 'from-sky-500 to-blue-600' },
  { key: 'sunset', label: 'Sunset', gradient: 'from-orange-500 to-pink-600' },
  { key: 'forest', label: 'Forest', gradient: 'from-emerald-500 to-teal-600' },
  { key: 'grape', label: 'Grape', gradient: 'from-fuchsia-500 to-purple-600' },
  { key: 'candy', label: 'Candy', gradient: 'from-pink-500 to-rose-500' },
] as const;

export const DEFAULT_THEME = 'indigo';

/** League tiers by cumulative points, with the next threshold for the meter. */
export const TIERS = [
  { key: 'bronze', label: 'Bronze', min: 0, color: '#b45309' },
  { key: 'silver', label: 'Silver', min: 100, color: '#64748b' },
  { key: 'gold', label: 'Gold', min: 300, color: '#f59e0b' },
  { key: 'platinum', label: 'Platinum', min: 600, color: '#22d3ee' },
  { key: 'diamond', label: 'Diamond', min: 1000, color: '#818cf8' },
] as const;

export function tierFor(points: number): {
  index: number;
  label: string;
  color: string;
  nextLabel: string | null;
  toNext: number;
  progress: number;
} {
  const p = Math.max(0, points);
  let i = 0;
  for (let k = TIERS.length - 1; k >= 0; k--) {
    if (p >= TIERS[k]!.min) {
      i = k;
      break;
    }
  }
  const cur = TIERS[i]!;
  const next = TIERS[i + 1];
  const toNext = next ? next.min - p : 0;
  const span = next ? next.min - cur.min : 1;
  const into = p - cur.min;
  return {
    index: i,
    label: cur.label,
    color: cur.color,
    nextLabel: next?.label ?? null,
    toNext,
    progress: next ? Math.min(100, Math.round((into / span) * 100)) : 100,
  };
}

/** Fun achievement badges, earned from points / level / rank. Presentation only. */
export const BADGES = [
  { key: 'first_points', emoji: '✨', label: 'First Sparks', hint: 'Earn your first points' },
  { key: 'fifty', emoji: '🎮', label: 'Game On', hint: 'Reach 50 points' },
  { key: 'century', emoji: '💯', label: 'Century', hint: 'Reach 100 points' },
  { key: 'level5', emoji: '🏅', label: 'High Five', hint: 'Reach level 5' },
  { key: 'podium', emoji: '🏆', label: 'On the Podium', hint: 'Reach the top 3' },
  { key: 'champion', emoji: '👑', label: 'Champion', hint: 'Be #1 in your academy' },
] as const;

export type Badge = (typeof BADGES)[number] & { earned: boolean };

/** Which badges a learner has earned, plus the still-locked ones (for display). */
export function badgesFor(points: number, level: number, rank: number | null): Badge[] {
  return BADGES.map((b) => {
    let earned = false;
    switch (b.key) {
      case 'first_points':
        earned = points >= 1;
        break;
      case 'fifty':
        earned = points >= 50;
        break;
      case 'century':
        earned = points >= 100;
        break;
      case 'level5':
        earned = level >= 5;
        break;
      case 'podium':
        earned = rank != null && rank <= 3;
        break;
      case 'champion':
        earned = rank === 1;
        break;
    }
    return { ...b, earned };
  });
}

export function avatarFor(key: string | null | undefined): (typeof AVATARS)[number] {
  return AVATARS.find((a) => a.key === key) ?? AVATARS.find((a) => a.key === DEFAULT_AVATAR)!;
}

export function themeFor(key: string | null | undefined): (typeof THEMES)[number] {
  return THEMES.find((t) => t.key === key) ?? THEMES.find((t) => t.key === DEFAULT_THEME)!;
}

/**
 * Level curve: level N requires 100 * N * (N-1) / 2 cumulative points
 * (i.e. 0, 100, 300, 600, 1000, …). Returns level + progress to the next.
 */
export function levelFromPoints(points: number): {
  level: number;
  intoLevel: number;
  forNext: number;
  progress: number;
} {
  const p = Math.max(0, points);
  let level = 1;
  while ((100 * level * (level + 1)) / 2 <= p) level++;
  const base = (100 * (level - 1) * level) / 2;
  const next = (100 * level * (level + 1)) / 2;
  const intoLevel = p - base;
  const forNext = next - base;
  return { level, intoLevel, forNext, progress: Math.round((intoLevel / forNext) * 100) };
}
