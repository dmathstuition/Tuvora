/**
 * The catalogue of learner-app features. This single source drives the student
 * "More" menu, the bottom-nav, and the feature toggles in the teacher (per
 * academy) and super-admin (platform) portals.
 *
 * `status: 'live'` features are wired to a real page; `'soon'` features render
 * as elegant "coming soon" tiles until built. Teachers can hide any feature for
 * their academy; the platform admin controls which are globally available.
 */
import {
  LayoutGrid,
  Video,
  PencilLine,
  FileText,
  BookOpen,
  GraduationCap,
  CalendarCheck,
  Target,
  Zap,
  Sigma,
  Users,
  Trophy,
  MessageSquareText,
  Compass,
  CircleCheck,
  Code2,
  Sparkles,
  TrendingUp,
  BarChart3,
  Medal,
  CalendarDays,
  MessageSquare,
  Bell,
  Calendar,
  CreditCard,
  User,
  HelpCircle,
  Map,
  type LucideIcon,
} from 'lucide-react';

export type FeatureStatus = 'live' | 'soon';

export interface LearnerFeature {
  key: string;
  label: string;
  group: 'Learn' | 'Play' | 'AI Tools' | 'Progress' | 'Account';
  href: string;
  status: FeatureStatus;
  icon: LucideIcon;
  /** Tailwind gradient (from/to) for the coloured tile. */
  accent: string;
  /** Short tagline for the big Play & Learn cards. */
  tagline?: string;
}

export const LEARNER_FEATURES: LearnerFeature[] = [
  // Learn
  { key: 'dashboard', label: 'Dashboard', group: 'Learn', href: '/portal', status: 'live', icon: LayoutGrid, accent: 'from-brand-600 to-brand-800' },
  { key: 'classes', label: 'My classes', group: 'Learn', href: '/portal/learn', status: 'live', icon: Video, accent: 'from-sky-500 to-blue-600' },
  { key: 'assignments', label: 'Assignments', group: 'Learn', href: '/portal/learn', status: 'soon', icon: PencilLine, accent: 'from-amber-500 to-orange-600' },
  { key: 'materials', label: 'Materials', group: 'Learn', href: '/portal/learn', status: 'soon', icon: FileText, accent: 'from-indigo-500 to-violet-600' },
  { key: 'curriculum', label: 'Curriculum', group: 'Learn', href: '/portal/learn', status: 'soon', icon: BookOpen, accent: 'from-teal-500 to-emerald-600' },
  { key: 'mock_exam', label: 'Mock exam', group: 'Learn', href: '/portal/exams', status: 'live', icon: GraduationCap, accent: 'from-rose-500 to-pink-600' },
  { key: 'my_plan', label: 'My plan', group: 'Learn', href: '/portal/learn', status: 'soon', icon: CalendarCheck, accent: 'from-cyan-500 to-sky-600' },

  // Play
  { key: 'practice', label: 'Practice', group: 'Play', href: '/portal/games/practice', status: 'live', icon: Target, accent: 'from-blue-600 to-indigo-700', tagline: 'Earn points' },
  { key: 'math_sprint', label: 'Math Sprint', group: 'Play', href: '/portal/games/sprint', status: 'live', icon: Zap, accent: 'from-violet-600 to-purple-700', tagline: 'Beat the clock' },
  { key: 'mathle', label: 'Mathle', group: 'Play', href: '/portal/learn', status: 'soon', icon: Sigma, accent: 'from-teal-600 to-emerald-700', tagline: 'Daily puzzle' },
  { key: 'quiz_duel', label: 'Quiz Duel', group: 'Play', href: '/portal/learn', status: 'soon', icon: Users, accent: 'from-orange-600 to-amber-700', tagline: 'Challenge a pal' },
  { key: 'boss_battle', label: 'Boss Battle', group: 'Play', href: '/portal/learn', status: 'soon', icon: Trophy, accent: 'from-red-600 to-rose-700', tagline: 'Weekly boss' },
  { key: 'revision_cards', label: 'Revision cards', group: 'Play', href: '/portal/revision', status: 'live', icon: MessageSquareText, accent: 'from-emerald-600 to-green-700', tagline: 'Flip & learn' },
  { key: 'focus_mode', label: 'Focus mode', group: 'Play', href: '/portal/learn', status: 'soon', icon: Zap, accent: 'from-slate-600 to-slate-800', tagline: 'Deep work' },

  // AI Tools
  { key: 'ai_tutor', label: 'Tuvora A.I', group: 'AI Tools', href: '/portal/solver', status: 'live', icon: Compass, accent: 'from-brand-500 to-violet-700' },
  { key: 'question_solver', label: 'Question solver', group: 'AI Tools', href: '/portal/solver', status: 'live', icon: Sigma, accent: 'from-indigo-500 to-blue-700' },
  { key: 'check_work', label: 'Check my work', group: 'AI Tools', href: '/portal/solver', status: 'live', icon: CircleCheck, accent: 'from-emerald-500 to-teal-700' },
  { key: 'code_playground', label: 'Code playground', group: 'AI Tools', href: '/portal/more', status: 'soon', icon: Code2, accent: 'from-fuchsia-500 to-purple-700' },
  { key: 'math_lab', label: 'Math Lab', group: 'AI Tools', href: '/portal/more', status: 'soon', icon: Sigma, accent: 'from-cyan-500 to-blue-700' },
  { key: 'knowledge_map', label: 'Knowledge map', group: 'AI Tools', href: '/portal/more', status: 'soon', icon: Map, accent: 'from-amber-500 to-orange-700' },

  // Progress
  { key: 'my_progress', label: 'My progress', group: 'Progress', href: '/portal/progress', status: 'live', icon: TrendingUp, accent: 'from-emerald-500 to-teal-600' },
  { key: 'my_report', label: 'My report', group: 'Progress', href: '/portal/progress', status: 'live', icon: BarChart3, accent: 'from-blue-500 to-indigo-600' },
  { key: 'report_cards', label: 'Report cards', group: 'Progress', href: '/portal/report-cards', status: 'live', icon: BarChart3, accent: 'from-violet-500 to-purple-600' },
  { key: 'badges', label: 'Badges', group: 'Progress', href: '/portal/progress', status: 'live', icon: Medal, accent: 'from-amber-500 to-yellow-600' },
  { key: 'leagues', label: 'Leagues', group: 'Progress', href: '/portal/leagues', status: 'live', icon: Trophy, accent: 'from-orange-500 to-amber-600' },
  { key: 'leaderboard', label: 'Leaderboard', group: 'Progress', href: '/portal/progress', status: 'live', icon: Users, accent: 'from-pink-500 to-rose-600' },
  { key: 'attendance', label: 'Attendance', group: 'Progress', href: '/portal/progress', status: 'live', icon: CalendarDays, accent: 'from-sky-500 to-cyan-600' },
  { key: 'my_behaviour', label: 'My behaviour', group: 'Progress', href: '/portal/behaviour', status: 'live', icon: CircleCheck, accent: 'from-teal-500 to-emerald-600' },
  { key: 'certificates', label: 'Certificates', group: 'Progress', href: '/portal/certificates', status: 'live', icon: GraduationCap, accent: 'from-indigo-500 to-blue-600' },

  // Account
  { key: 'messages', label: 'Messages', group: 'Account', href: '/portal/messages', status: 'live', icon: MessageSquare, accent: 'from-blue-500 to-indigo-600' },
  { key: 'notices', label: 'Notices', group: 'Account', href: '/portal', status: 'live', icon: Bell, accent: 'from-amber-500 to-orange-600' },
  { key: 'notifications', label: 'Notifications', group: 'Account', href: '/portal/notifications', status: 'live', icon: Bell, accent: 'from-rose-500 to-pink-600' },
  { key: 'calendar', label: 'Calendar', group: 'Account', href: '/portal/calendar', status: 'live', icon: Calendar, accent: 'from-sky-500 to-blue-600' },
  { key: 'rewards_shop', label: 'Rewards shop', group: 'Account', href: '/portal/shop', status: 'live', icon: CreditCard, accent: 'from-violet-500 to-purple-600' },
  { key: 'my_payments', label: 'My payments', group: 'Account', href: '/portal/payments', status: 'live', icon: CreditCard, accent: 'from-emerald-500 to-teal-600' },
  { key: 'avatar_studio', label: 'Avatar Studio', group: 'Account', href: '/portal/profile', status: 'live', icon: Sparkles, accent: 'from-fuchsia-500 to-pink-600' },
  { key: 'profile', label: 'Profile', group: 'Account', href: '/portal/profile', status: 'live', icon: User, accent: 'from-slate-500 to-slate-700' },
  { key: 'help_support', label: 'Help & support', group: 'Account', href: '/portal/more', status: 'soon', icon: HelpCircle, accent: 'from-cyan-500 to-sky-600' },
];

export const FEATURE_GROUP_ORDER = ['Learn', 'Play', 'AI Tools', 'Progress', 'Account'] as const;

/** Features a teacher may toggle (everything except the always-on Dashboard). */
export const TOGGLEABLE_FEATURES = LEARNER_FEATURES.filter((f) => f.key !== 'dashboard');

export function featureByKey(key: string): LearnerFeature | undefined {
  return LEARNER_FEATURES.find((f) => f.key === key);
}
