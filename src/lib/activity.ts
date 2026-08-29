import {
  Sparkles,
  UserPlus,
  CreditCard,
  Rocket,
  FileText,
  GraduationCap,
  Users,
  Receipt,
  Settings,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import type { Tone } from '@/components/dashboard/widgets';

export interface ActivityView {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  subtitle?: string;
  time: string;
}

/** Human-friendly relative time (e.g. "2 mins ago", "3 hours ago"). */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

const MAP: { match: RegExp; icon: LucideIcon; tone: Tone; title: string }[] = [
  { match: /organization\.created|org\.created/, icon: Rocket, tone: 'indigo', title: 'Organization created' },
  { match: /member\.(joined|added)|user\.joined/, icon: UserPlus, tone: 'blue', title: 'A member joined' },
  { match: /subscription/, icon: CreditCard, tone: 'purple', title: 'Subscription updated' },
  { match: /payment/, icon: Receipt, tone: 'emerald', title: 'Payment recorded' },
  { match: /invoice/, icon: Receipt, tone: 'amber', title: 'Invoice updated' },
  { match: /learner\.(created|intake)/, icon: Users, tone: 'blue', title: 'Learner updated' },
  { match: /class/, icon: GraduationCap, tone: 'green', title: 'Class updated' },
  { match: /assignment|assessment|placement/, icon: FileText, tone: 'red', title: 'Coursework updated' },
  { match: /settings|org\.updated/, icon: Settings, tone: 'slate', title: 'Settings changed' },
];

/** Map a raw audit action + timestamp to a display-ready activity item. */
export function activityView(action: string, createdAt: string): ActivityView {
  const hit = MAP.find((m) => m.match.test(action));
  const base = hit ?? { icon: Activity, tone: 'slate' as Tone, title: 'Activity' };
  return {
    icon: base.icon,
    tone: base.tone,
    title: base.title,
    subtitle: action.replace(/[._]/g, ' '),
    time: relativeTime(createdAt),
  };
}

export { Sparkles };
