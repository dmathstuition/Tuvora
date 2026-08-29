import {
  LayoutDashboard,
  LayoutGrid,
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  Wallet,
  Receipt,
  Package,
  ToggleRight,
  TicketPercent,
  ArrowLeftRight,
  TrendingUp,
  BarChart3,
  UserMinus,
  FileText,
  LifeBuoy,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}
export interface AdminNavSection {
  label: string;
  items: AdminNavItem[];
}

/** Super-admin navigation (mirrors the platform command centre). */
export const ADMIN_NAV: AdminNavSection[] = [
  {
    label: 'Platform',
    items: [
      { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { title: 'Organizations', href: '/admin/organizations', icon: Building2 },
      { title: 'Tutors', href: '/admin/tutors', icon: Users },
      { title: 'Learners', href: '/admin/learners', icon: GraduationCap },
      { title: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { title: 'Payments', href: '/admin/payments', icon: Wallet },
      { title: 'Invoices', href: '/admin/invoices', icon: Receipt },
      { title: 'Plans', href: '/admin/plans', icon: Package },
      { title: 'Features', href: '/admin/features', icon: ToggleRight },
      { title: 'Coupons', href: '/admin/coupons', icon: TicketPercent },
      { title: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Revenue', href: '/admin/revenue', icon: TrendingUp },
      { title: 'Usage Analytics', href: '/admin/usage', icon: BarChart3 },
      { title: 'Churn & Retention', href: '/admin/churn', icon: UserMinus },
      { title: 'Reports', href: '/admin/reports', icon: FileText },
    ],
  },
  {
    label: 'Support & System',
    items: [
      { title: 'Learner Features', href: '/admin/learner-features', icon: LayoutGrid },
      { title: 'Support Tickets', href: '/admin/support', icon: LifeBuoy },
      { title: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
      { title: 'System Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];
