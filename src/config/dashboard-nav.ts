import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Video,
  FileText,
  ClipboardList,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  LineChart,
  MessagesSquare,
  Megaphone,
  Gift,
  Award,
  Layers,
  Calendar,
  Wallet,
  Receipt,
  CreditCard,
  UserCog,
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
    items: [{ title: 'Overview', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Teach',
    items: [
      { title: 'Learners', href: '/dashboard/learners', icon: Users, permission: 'learners.view' },
      { title: 'Classes', href: '/dashboard/classes', icon: GraduationCap, permission: 'classes.view' },
      { title: 'Online lessons', href: '/dashboard/lessons', icon: Video, permission: 'lessons.view' },
      { title: 'Revision cards', href: '/dashboard/revision', icon: Layers, permission: 'lessons.view' },
      { title: 'Assignments', href: '/dashboard/assignments', icon: FileText, permission: 'assignments.view' },
      { title: 'Assessments', href: '/dashboard/assessments', icon: ClipboardList, permission: 'assessments.view' },
    ],
  },
  {
    label: 'Track',
    items: [
      { title: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck, permission: 'attendance.view' },
      { title: 'Grades', href: '/dashboard/grades', icon: ClipboardCheck, permission: 'grades.view' },
      { title: 'Progress', href: '/dashboard/progress', icon: TrendingUp, permission: 'progress.view' },
      { title: 'Reports', href: '/dashboard/reports', icon: BarChart3, permission: 'reports.view' },
      { title: 'Analytics', href: '/dashboard/analytics', icon: LineChart, permission: 'reports.view' },
      { title: 'Rewards shop', href: '/dashboard/shop', icon: Gift, permission: 'rewards.view' },
      { title: 'Certificates', href: '/dashboard/certificates', icon: Award, permission: 'reports.view' },
    ],
  },
  {
    label: 'Engage',
    items: [
      { title: 'Messages', href: '/dashboard/messages', icon: MessagesSquare, permission: 'messages.view' },
      { title: 'Announcements', href: '/dashboard/announcements', icon: Megaphone, permission: 'messages.view' },
      { title: 'Calendar', href: '/dashboard/calendar', icon: Calendar, permission: 'calendar.view' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { title: 'Payments', href: '/dashboard/payments', icon: Wallet, permission: 'payments.view' },
      { title: 'Invoices', href: '/dashboard/invoices', icon: Receipt, permission: 'invoices.view' },
      { title: 'Subscription', href: '/dashboard/subscription', icon: CreditCard, permission: 'billing.view' },
      { title: 'Staff', href: '/dashboard/settings/team', icon: UserCog, permission: 'members.view' },
      { title: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];
