'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { PanelLeftClose, PanelLeft, LogOut, User as UserIcon, Home } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useSchool } from '@/lib/school-context';
import { navForRole, type NavItem } from '@/lib/nav';
import { Logo } from './Logo';
import { Tooltip } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { t } from '@/lib/i18n';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const school = useSchool();
  const groups = navForRole(user?.role);

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r border-line bg-surface transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-1 border-b border-line',
          collapsed ? 'justify-center px-2' : 'px-3'
        )}
      >
        <Link href="/" className="min-w-0 flex-1 rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Logo schoolName={school.name} logoUrl={school.logoUrl} compact={collapsed} />
        </Link>
        {onToggleCollapse && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={t('Collapse sidebar')}
            className="hidden shrink-0 rounded-chip p-1.5 text-ink-subtle transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:block"
          >
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-2 py-3" aria-label={t('Main')}>
        {groups.map((group, gi) => (
          <div key={group.title ?? `group-${gi}`} className="space-y-0.5">
            {group.title && !collapsed && (
              <p className="px-2 pb-1 pt-1 text-meta font-medium text-ink-subtle">{t(group.title)}</p>
            )}
            {group.title && collapsed && gi > 0 && <div className="mx-2 my-2 h-px bg-line" />}
            {group.items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line p-2">
        {onToggleCollapse && collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={t('Expand sidebar')}
            className="mb-1 hidden w-full items-center justify-center rounded-btn p-2 text-ink-subtle transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:flex"
          >
            <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2.5 rounded-btn p-1.5 text-left transition-colors hover:bg-wash',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                collapsed && 'justify-center'
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wash text-meta font-semibold text-brand">
                {getInitials(user?.username)}
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-dense font-medium text-ink">
                    {user?.username}
                  </span>
                  <span className="block truncate text-meta capitalize text-ink-subtle">
                    {user?.role?.toLowerCase()}
                  </span>
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel>{user?.email || user?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserIcon className="h-4 w-4" strokeWidth={1.75} />
                {t('Profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/">
                <Home className="h-4 w-4" strokeWidth={1.75} />
                {t('School home page')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => logout()}>
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              {t('Sign out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/**
 * The active indicator is one shared element that slides between items via
 * `layoutId`, rather than each row animating its own background.
 */
function SidebarLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex h-8 items-center gap-2.5 rounded-btn px-2 text-dense font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        collapsed && 'justify-center px-0',
        active ? 'text-brand' : 'text-ink-muted hover:bg-wash/60 hover:text-ink'
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-btn bg-wash"
          transition={{ type: 'spring', stiffness: 520, damping: 42 }}
        />
      )}
      <item.icon className="relative h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {!collapsed && <span className="relative truncate">{t(item.label)}</span>}
    </Link>
  );

  return collapsed ? (
    <Tooltip content={item.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
