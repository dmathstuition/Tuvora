import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  Trophy,
  FolderOpen,
  MessagesSquare,
  Calendar,
  Wallet,
  Receipt,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/constants/roles';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to see this item; omitted = always visible to members. */
  permission?: Permission;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Dashboard navigation. Items are filtered by the viewer's permissions in the
 * sidebar, so an accountant never sees teaching tools they can't use, etc.
 */
export const DASHBOARD_NAV: NavSection[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Teaching',
    items: [
      { title: 'Learners', href: '/dashboard/learners', icon: Users, permission: 'learners.view' },
      { title: 'Classes', href: '/dashboard/classes', icon: GraduationCap, permission: 'classes.view' },
      { title: 'Courses', href: '/dashboard/courses', icon: BookOpen, permission: 'courses.view' },
      { title: 'Assignments', href: '/dashboard/assignments', icon: FileText, permission: 'assignments.view' },
      { title: 'Assessments', href: '/dashboard/assessments', icon: ClipboardList, permission: 'assessments.view' },
      { title: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck, permission: 'attendance.view' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { title: 'Reports', href: '/dashboard/reports', icon: BarChart3, permission: 'reports.view' },
      { title: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy, permission: 'rewards.view' },
      { title: 'Resources', href: '/dashboard/resources', icon: FolderOpen, permission: 'resources.view' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Messages', href: '/dashboard/messages', icon: MessagesSquare, permission: 'messages.view' },
      { title: 'Calendar', href: '/dashboard/calendar', icon: Calendar, permission: 'calendar.view' },
      { title: 'Payments', href: '/dashboard/payments', icon: Wallet, permission: 'payments.view' },
      { title: 'Invoices', href: '/dashboard/invoices', icon: Receipt, permission: 'invoices.view' },
    ],
  },
  {
    label: 'Account',
    items: [
      { title: 'Subscription', href: '/dashboard/subscription', icon: CreditCard, permission: 'billing.view' },
      { title: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];
