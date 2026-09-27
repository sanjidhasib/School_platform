'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, User as UserIcon, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { primaryNav, navForRole } from '@/lib/nav';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet';
import { t } from '@/lib/i18n';

/**
 * Phones get a bottom bar of at most four destinations plus More, with 44px
 * touch targets, instead of a hamburger that hides everything.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const primary = primaryNav(user?.role).slice(0, 4);
  const groups = navForRole(user?.role);
  if (!primary.length) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav
        aria-label={t('Primary')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {primary.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors',
                    active ? 'text-brand' : 'text-ink-subtle'
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  <span className="truncate">{t(item.label)}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium text-ink-subtle"
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              {t('More')}
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t('All pages')}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-5 pb-[env(safe-area-inset-bottom)]">
            {groups.map((group, gi) => (
              <div key={group.title ?? `g-${gi}`} className="space-y-1">
                {group.title && (
                  <p className="px-1 text-meta font-medium text-ink-subtle">{group.title}</p>
                )}
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex min-h-[2.75rem] items-center gap-3 rounded-btn px-2 text-body transition-colors',
                      isActive(item.href) ? 'bg-wash font-medium text-brand' : 'text-ink'
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    {t(item.label)}
                  </Link>
                ))}
              </div>
            ))}

            <div className="space-y-1 border-t border-line pt-4">
              <Link
                href="/profile"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-[2.75rem] items-center gap-3 rounded-btn px-2 text-body text-ink"
              >
                <UserIcon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.75} />
                {t('Profile')}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
                className="flex min-h-[2.75rem] w-full items-center gap-3 rounded-btn px-2 text-left text-body text-danger"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" strokeWidth={1.75} />
                {t('Sign out')}
              </button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
