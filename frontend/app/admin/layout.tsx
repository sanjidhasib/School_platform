'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/login');
  }, [user, loading, router]);
  if (loading || !user) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  return <DashboardShell>{children}</DashboardShell>;
}
