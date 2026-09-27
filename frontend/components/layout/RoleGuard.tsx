'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardShell } from './DashboardShell';
import { LogoMark } from './Logo';
import { t } from '@/lib/i18n';

/**
 * The role check each dashboard layout already performed, lifted into one place
 * so all four layouts behave identically. The rule itself is unchanged: wait
 * for /auth/me, then send anyone without the required role to /login.
 */
export function RoleGuard({ role, children }: { role: string; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== role)) router.replace('/login');
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) return <ShellLoading />;

  return <DashboardShell>{children}</DashboardShell>;
}

function ShellLoading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-btn bg-brand text-brand-contrast">
          <LogoMark className="h-6 w-6" />
        </span>
        <span className="sr-only">{t('Loading')}</span>
        <span className="h-1 w-24 overflow-hidden rounded-full bg-line">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-brand" />
        </span>
      </div>
    </div>
  );
}
