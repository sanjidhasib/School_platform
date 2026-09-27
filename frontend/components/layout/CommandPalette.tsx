'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, User as UserIcon, Home } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAuth } from '@/hooks/useAuth';
import { navForRole } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

/**
 * Navigation only, and only to pages the signed-in role is allowed to open —
 * the palette reads the same nav definition as the sidebar, so it can never
 * offer a destination the role does not have.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const groups = navForRole(user?.role);

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          aria-label={t('Command palette')}
          className={cn(
            'fixed left-1/2 top-[18%] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2',
            'overflow-hidden rounded-dialog border border-line bg-surface shadow-dialog',
            'data-[state=open]:animate-fade-in'
          )}
        >
          <DialogPrimitive.Title className="sr-only">{t('Go to page')}</DialogPrimitive.Title>
          <Command loop>
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              <Search className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
              <Command.Input
                autoFocus
                placeholder={t('Go to…')}
                className="h-12 w-full bg-transparent text-body text-ink placeholder:text-ink-subtle focus:outline-none"
              />
            </div>
            <Command.List className="scrollbar-thin max-h-80 overflow-y-auto p-2">
              <Command.Empty className="px-2 py-8 text-center text-dense text-ink-subtle">
                {t('Nothing matches that')}
              </Command.Empty>

              {groups.map((group, gi) => (
                <Command.Group
                  key={group.title ?? `g-${gi}`}
                  heading={group.title ? t(group.title) : undefined}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-meta [&_[cmdk-group-heading]]:text-ink-subtle"
                >
                  {group.items.map((item) => (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${group.title ?? ''}`}
                      onSelect={() => go(item.href)}
                      className="flex cursor-pointer select-none items-center gap-2.5 rounded-chip px-2 py-2 text-dense text-ink outline-none data-[selected=true]:bg-wash"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
                      {t(item.label)}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}

              <Command.Group
                heading="Account"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-meta [&_[cmdk-group-heading]]:text-ink-subtle"
              >
                <Command.Item
                  value="Profile account settings"
                  onSelect={() => go('/profile')}
                  className="flex cursor-pointer select-none items-center gap-2.5 rounded-chip px-2 py-2 text-dense text-ink outline-none data-[selected=true]:bg-wash"
                >
                  <UserIcon className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
                  {t('Profile')}
                </Command.Item>
                <Command.Item
                  value="School home page public site"
                  onSelect={() => go('/')}
                  className="flex cursor-pointer select-none items-center gap-2.5 rounded-chip px-2 py-2 text-dense text-ink outline-none data-[selected=true]:bg-wash"
                >
                  <Home className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
                  {t('School home page')}
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Ctrl/Cmd+K from anywhere inside the shell. */
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return { open, setOpen };
}
