'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogIn, Menu, X } from 'lucide-react';
import { SchoolBadge } from '@/components/layout/Logo';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

const LINKS = [
  { href: '#achievements', label: 'Achievements' },
  { href: '#news', label: 'News' },
  { href: '#upcoming', label: 'Upcoming' },
  { href: '#admission', label: 'Admission' },
];

/**
 * The public site's bar: school name on the left, section links in the
 * middle, sign-in on the right. On phones the links fold into a menu.
 */
export function PublicNavbar({ schoolName, logoUrl }: { schoolName: string; logoUrl?: string | null }) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={cn(
        'chrome-bar sticky top-0 z-50 border-b bg-surface transition-shadow',
        scrolled ? 'border-line shadow-card' : 'border-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5" onClick={() => setOpen(false)}>
          <SchoolBadge logoUrl={logoUrl} className="h-9 w-9" />
          <span className="truncate text-[0.96rem] font-bold tracking-tight text-ink min-[400px]:text-[1.0625rem] sm:text-lg">
            {schoolName}
          </span>
        </Link>

        <nav aria-label={t('Sections')} className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-dense font-medium text-ink-muted transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {t(l.label)}
            </a>
          ))}
        </nav>

        <LanguageToggle compact className="ml-auto md:ml-3" />

        <Link
          href="/login"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-3.5 py-2 sm:px-4 text-dense font-semibold text-brand-contrast transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 md:ml-3"
        >
          <LogIn className="hidden h-4 w-4 sm:block" strokeWidth={2} aria-hidden="true" />
          {t('Login')}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="public-menu"
          aria-label={open ? t('Close menu') : t('Open menu')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:hidden"
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
        </button>
      </div>

      {open && (
        <nav
          id="public-menu"
          aria-label={t('Sections')}
          className="animate-fade-in border-t border-line bg-surface px-4 pb-4 pt-2 shadow-popover md:hidden"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-btn px-3 py-3 text-body font-medium text-ink transition-colors hover:bg-wash"
            >
              {t(l.label)}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
