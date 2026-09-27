import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Grid3X3,
  BookOpen,
  ClipboardList,
  CalendarDays,
  UserCheck,
  ClipboardCheck,
  BarChart3,
  Bell,
  Trophy,
  Settings,
  BookMarked,
  CheckSquare,
  MessageSquare,
  FileText,
  Library,
  Sheet,
  Timer,
  type LucideIcon,
} from 'lucide-react';

/**
 * One definition of navigation per role, shared by the sidebar, the mobile
 * bottom bar and the command palette — so those three can never disagree about
 * where a role is allowed to go.
 *
 * Items are grouped under quiet section headings rather than listed flat, which
 * is what keeps a nine-item admin sidebar calm.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown on the mobile bottom bar. At most four per role. */
  primary?: boolean;
}

export interface NavGroup {
  /** Undefined for the ungrouped items that sit above the first heading. */
  title?: string;
  items: NavItem[];
}

const adminNav: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, primary: true }],
  },
  {
    title: 'People',
    items: [
      { label: 'Students', href: '/admin/students', icon: GraduationCap, primary: true },
      { label: 'Teachers', href: '/admin/teachers', icon: Users, primary: true },
    ],
  },
  {
    title: 'Academics',
    items: [
      { label: 'Classes', href: '/admin/classes', icon: Grid3X3 },
      { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
      { label: 'Assignments', href: '/admin/assignments', icon: ClipboardList },
      { label: 'Timetable', href: '/admin/timetable', icon: CalendarDays, primary: true },
      { label: 'Textbooks', href: '/admin/textbooks', icon: Library },
    ],
  },
  {
    title: 'Records',
    items: [
      { label: 'Attendance', href: '/admin/attendance', icon: UserCheck },
      { label: 'Homework', href: '/admin/homework', icon: ClipboardCheck },
      { label: 'Results', href: '/admin/results', icon: BarChart3 },
    ],
  },
  {
    title: 'School',
    items: [
      { label: 'Notices', href: '/admin/notices', icon: Bell },
      { label: 'Achievements', href: '/admin/achievements', icon: Trophy },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

const teacherNav: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard, primary: true }],
  },
  {
    title: 'Teaching',
    items: [
      { label: 'Attendance', href: '/teacher/attendance', icon: UserCheck, primary: true },
      { label: 'Attendance register', href: '/teacher/register', icon: Sheet },
      { label: 'Homework', href: '/teacher/homework', icon: ClipboardCheck, primary: true },
      { label: 'Class tests', href: '/teacher/tests', icon: Timer },
      { label: 'Results', href: '/teacher/results', icon: BarChart3 },
      { label: 'Schedule', href: '/teacher/schedule', icon: CalendarDays, primary: true },
    ],
  },
];

const studentNav: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, primary: true }],
  },
  {
    title: 'My work',
    items: [
      { label: 'Homework', href: '/student/homework', icon: BookMarked, primary: true },
      { label: 'Attendance', href: '/student/attendance', icon: CheckSquare },
      { label: 'Results', href: '/student/results', icon: BarChart3, primary: true },
      { label: 'Class tests', href: '/student/tests', icon: Timer },
    ],
  },
  {
    title: 'More',
    items: [
      { label: 'AI Learning', href: '/student/ai-learning', icon: MessageSquare, primary: true },
      { label: 'Library', href: '/student/library', icon: Library },
      { label: 'Notifications', href: '/student/notifications', icon: Bell },
    ],
  },
];

const guardianNav: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', href: '/guardian/dashboard', icon: LayoutDashboard, primary: true }],
  },
  {
    title: 'My children',
    items: [
      { label: 'Attendance', href: '/guardian/attendance', icon: CheckSquare, primary: true },
      { label: 'Results', href: '/guardian/results', icon: BarChart3, primary: true },
      { label: 'Reports', href: '/guardian/reports', icon: FileText },
    ],
  },
  {
    title: 'More',
    items: [{ label: 'Notifications', href: '/guardian/notifications', icon: Bell, primary: true }],
  },
];

export const NAV_BY_ROLE: Record<string, NavGroup[]> = {
  ADMIN: adminNav,
  TEACHER: teacherNav,
  STUDENT: studentNav,
  GUARDIAN: guardianNav,
};

export function navForRole(role?: string | null): NavGroup[] {
  return NAV_BY_ROLE[role ?? ''] ?? [];
}

export function flatNav(role?: string | null): NavItem[] {
  return navForRole(role).flatMap((g) => g.items);
}

export function primaryNav(role?: string | null): NavItem[] {
  return flatNav(role).filter((i) => i.primary);
}

/** The page title shown in the topbar, derived from the nav so it never drifts. */
export function titleForPath(role: string | null | undefined, pathname: string): string {
  const match = flatNav(role)
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (match) return match.label;
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'SchoolOS';
}
