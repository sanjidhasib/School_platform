'use client';

import { Menu, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';
import { NotificationBell } from './NotificationBell';
import { t } from '@/lib/i18n';

/**
 * Plain surface with a bottom border. No blur, no translucency — the content
 * scrolling underneath should not show through and shimmer.
 */
export function Topbar({
  title,
  onMenuClick,
  onSearchClick,
}: {
  title: string;
  onMenuClick: () => void;
  onSearchClick: () => void;
}) {
  return (
    <header className="chrome chrome-bar sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label={t('Open navigation')}
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-btn text-ink-muted transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-section text-ink">{title}</h1>

      <button
        type="button"
        onClick={onSearchClick}
        className="hidden items-center gap-2 rounded-btn border border-line px-2.5 py-1.5 text-meta text-ink-subtle transition-colors hover:border-line-strong hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:flex"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span>{t('Search')}</span>
        <kbd className="ml-3 rounded border border-line bg-surface-sunken px-1.5 py-0.5 font-sans text-[10px] font-medium text-ink-subtle">
          {t('Ctrl K')}
        </kbd>
      </button>

      <button
        type="button"
        onClick={onSearchClick}
        aria-label={t('Search')}
        className="flex h-8 w-8 items-center justify-center rounded-btn text-ink-subtle transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:hidden"
      >
        <Search className="h-4 w-4" strokeWidth={1.75} />
      </button>

      <NotificationBell />
      <LanguageToggle compact />
      <ThemeToggle />
    </header>
  );
}
