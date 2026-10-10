'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { SchoolProvider } from '@/lib/school-context';
import { titleForPath } from '@/lib/nav';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { useCommandPalette } from './useCommandPalette';

// The search palette (cmdk) loads the first time it is opened, not with every page.
const CommandPalette = dynamic(() => import('./CommandPalette').then((m) => m.CommandPalette), { ssr: false });
import { t } from '@/lib/i18n';

const COLLAPSE_KEY = 'schoolos.sidebar.collapsed';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const [paletteUsed, setPaletteUsed] = React.useState(false);
  React.useEffect(() => {
    if (paletteOpen) setPaletteUsed(true);
  }, [paletteOpen]);

  // Remember the collapsed state, but read it after mount so the server and
  // client render the same markup.
  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* private mode, blocked storage - the default is fine */
    }
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const title = titleForPath(user?.role, pathname);

  return (
    <SchoolProvider>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-dvh overflow-hidden bg-paper">
          {/* Tablet collapses to icons; desktop shows the full rail. */}
          <div className="hidden shrink-0 md:block">
            <AppSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
          </div>

          <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-fade-in md:hidden" />
              <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-60 data-[state=open]:animate-fade-in md:hidden">
                <DialogPrimitive.Title className="sr-only">{t('Navigation')}</DialogPrimitive.Title>
                <AppSidebar onNavigate={() => setMobileOpen(false)} />
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              title={title}
              onMenuClick={() => setMobileOpen(true)}
              onSearchClick={() => setPaletteOpen(true)}
            />
            <main className="scrollbar-thin flex-1 overflow-y-auto">
              {/*
                A short fade-in on route change. Deliberately no exit
                animation: with the App Router, AnimatePresence's exiting
                element renders the *new* page, and in production the swap
                could stall until the next state change — which remounted
                the page and silently threw away the user's first click
                (e.g. "Add question" in the test builder did nothing).
              */}
              <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 lg:pb-8"
              >
                {children}
              </motion.div>
            </main>
          </div>

          <MobileNav />
          {paletteUsed && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}
        </div>
      </TooltipProvider>
    </SchoolProvider>
  );
}
