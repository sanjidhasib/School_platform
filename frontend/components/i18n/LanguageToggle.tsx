'use client';

import { Languages } from 'lucide-react';
import { LANG_COOKIE, type Lang } from '@/lib/i18n';
import { useLanguage } from './LanguageProvider';
import { cn } from '@/lib/utils';

/**
 * English / বাংলা. The choice is saved for a year in a cookie, and the page
 * reloads so every part of it — including what the server renders — comes
 * back in the chosen language.
 */
export function LanguageToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const lang = useLanguage();

  const choose = (next: Lang) => {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.reload();
  };

  return (
    <div
      role="group"
      aria-label="Language / ভাষা"
      className={cn('inline-flex items-center rounded-full border border-line bg-surface p-0.5', className)}
    >
      {!compact && <Languages className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />}
      <button
        type="button"
        onClick={() => choose('en')}
        aria-pressed={lang === 'en'}
        lang="en"
        className={cn(
          'rounded-full px-2.5 py-1 text-meta font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          lang === 'en' ? 'bg-brand text-brand-contrast' : 'text-ink-muted hover:text-ink'
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => choose('bn')}
        aria-pressed={lang === 'bn'}
        lang="bn"
        className={cn(
          'rounded-full px-2.5 py-1 font-bn text-meta font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          lang === 'bn' ? 'bg-brand text-brand-contrast' : 'text-ink-muted hover:text-ink'
        )}
      >
        বাংলা
      </button>
    </div>
  );
}
