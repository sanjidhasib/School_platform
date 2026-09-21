'use client';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { usePathname } from 'next/navigation';

const titleMap: Record<string, string> = {
  '/admin/dashboard': 'Dashboard', '/admin/teachers': 'Teachers', '/admin/students': 'Students',
  '/admin/classes': 'Classes', '/admin/subjects': 'Subjects', '/admin/assignments': 'Teacher Assignments',
  '/admin/timetable': 'Timetable', '/admin/notices': 'Notices', '/admin/achievements': 'Achievements',
  '/teacher/dashboard': 'Dashboard', '/teacher/attendance': 'Attendance',
  '/teacher/homework': 'Homework', '/teacher/results': 'Results',
  '/student/dashboard': 'Dashboard', '/student/attendance': 'Attendance',
  '/student/homework': 'Homework', '/student/results': 'Results',
  '/student/notifications': 'Notifications', '/student/ai-learning': 'AI Learning',
  '/guardian/dashboard': 'Dashboard', '/guardian/reports': 'Reports',
  '/profile': 'Profile',
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const title = titleMap[pathname] || 'SchoolOS';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0"><Sidebar /></div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex h-full w-60"><Sidebar onClose={() => setSidebarOpen(false)} /></div>
        </div>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
