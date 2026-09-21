'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, GraduationCap, BookOpen, Grid3X3, ClipboardList, Calendar, Bell, Trophy, UserCheck, ClipboardCheck, BookMarked, BarChart3, CheckSquare, Cpu, FileText, Home } from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Teachers', href: '/admin/teachers', icon: Users },
  { label: 'Students', href: '/admin/students', icon: GraduationCap },
  { label: 'Classes', href: '/admin/classes', icon: Grid3X3 },
  { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
  { label: 'Assignments', href: '/admin/assignments', icon: ClipboardList },
  { label: 'Timetable', href: '/admin/timetable', icon: Calendar },
  { label: 'Notices', href: '/admin/notices', icon: Bell },
  { label: 'Achievements', href: '/admin/achievements', icon: Trophy },
];
const teacherNav = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/teacher/attendance', icon: UserCheck },
  { label: 'Homework', href: '/teacher/homework', icon: ClipboardCheck },
  { label: 'Results', href: '/teacher/results', icon: BarChart3 },
];
const studentNav = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', href: '/student/attendance', icon: CheckSquare },
  { label: 'Homework', href: '/student/homework', icon: BookMarked },
  { label: 'Results', href: '/student/results', icon: BarChart3 },
  { label: 'Notifications', href: '/student/notifications', icon: Bell },
  { label: 'AI Learning', href: '/student/ai-learning', icon: Cpu },
];
const guardianNav = [
  { label: 'Dashboard', href: '/guardian/dashboard', icon: LayoutDashboard },
  { label: 'Reports', href: '/guardian/reports', icon: FileText },
];

const navByRole: Record<string, typeof adminNav> = { ADMIN: adminNav, TEACHER: teacherNav, STUDENT: studentNav, GUARDIAN: guardianNav };

export function Sidebar({ collapsed, onClose }: { collapsed?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const nav = navByRole[user?.role || ''] || [];

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-slate-200', collapsed ? 'w-16' : 'w-60')}>
      <div className="flex items-center h-16 px-4 border-b border-slate-200 gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
        {!collapsed && <span className="font-bold text-slate-900 text-lg">SchoolOS</span>}
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} onClick={onClose} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors', active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <Link href="/" className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100')}>
          <Home className="h-4 w-4" />{!collapsed && 'Home'}
        </Link>
      </div>
    </div>
  );
}
