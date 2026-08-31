/**
 * Choice lists for the onboarding wizard. Kept in one place so steps stay
 * declarative and new options are a one-line change.
 */

export const BUSINESS_TYPES = [
  { value: 'solo', label: 'Solo tutor', hint: 'I teach learners myself' },
  { value: 'business', label: 'Tutoring business', hint: 'I employ or manage other tutors' },
  { value: 'centre', label: 'Tutoring centre', hint: 'A physical learning centre' },
  { value: 'online', label: 'Online academy', hint: 'Fully online teaching' },
] as const;

export const AGE_GROUPS = [
  'Early years (3–5)',
  'Primary (6–11)',
  'Secondary (12–16)',
  'Sixth form / A-level (17–18)',
  'University',
  'Adult learners',
] as const;

export const CURRICULA = [
  'National (local)',
  'British / IGCSE',
  'American / SAT',
  'IB',
  'WAEC / NECO',
  'Cambridge',
  'Montessori',
  'Custom / mixed',
] as const;

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Exam preparation', 'Enrichment'] as const;

export const TEACHING_FORMATS = [
  { value: 'one_to_one', label: 'One-to-one' },
  { value: 'group', label: 'Group classes' },
  { value: 'both', label: 'Both' },
] as const;

export const DELIVERY_MODES = [
  { value: 'online', label: 'Online' },
  { value: 'physical', label: 'In person' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

export const LEARNER_RANGES = ['1–10', '11–25', '26–50', '51–100', '100+'] as const;

export const MANAGEMENT_METHODS = [
  'Spreadsheets',
  'Pen & paper',
  'WhatsApp / chat',
  'Another platform',
  'Nothing yet',
] as const;

export const GRADING_SYSTEMS = [
  { value: 'percentage', label: 'Percentage (0–100%)' },
  { value: 'letter', label: 'Letter grades (A–F)' },
  { value: 'gpa', label: 'GPA (0–4.0)' },
  { value: 'points', label: 'Points / marks' },
  { value: 'custom', label: 'Custom' },
] as const;

export const ACADEMIC_STRUCTURES = [
  { value: 'terms', label: '3 terms' },
  { value: 'semesters', label: '2 semesters' },
  { value: 'quarters', label: '4 quarters' },
  { value: 'rolling', label: 'Rolling / continuous' },
] as const;

export const WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const LESSON_DURATIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
] as const;

/** Tuvoria modules an org can choose to focus on (labels shown in the wizard). */
export const ONBOARDING_MODULES = [
  { key: 'learners', label: 'Learners', icon: 'Users' },
  { key: 'classes', label: 'Classes', icon: 'GraduationCap' },
  { key: 'lessons', label: 'Online lessons', icon: 'Video' },
  { key: 'assignments', label: 'Assignments', icon: 'FileText' },
  { key: 'assessments', label: 'Assessments', icon: 'ClipboardList' },
  { key: 'attendance', label: 'Attendance', icon: 'CalendarCheck' },
  { key: 'grades', label: 'Grades', icon: 'ClipboardCheck' },
  { key: 'progress', label: 'Progress', icon: 'TrendingUp' },
  { key: 'reports', label: 'Reports', icon: 'BarChart3' },
  { key: 'resources', label: 'Resources', icon: 'FolderOpen' },
  { key: 'messaging', label: 'Messaging', icon: 'MessagesSquare' },
  { key: 'payments', label: 'Payments', icon: 'Wallet' },
  { key: 'invoices', label: 'Invoices', icon: 'Receipt' },
  { key: 'staff', label: 'Staff', icon: 'UserCog' },
] as const;

export const INVITE_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'staff', label: 'Staff' },
] as const;
