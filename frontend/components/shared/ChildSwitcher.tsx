'use client';

import { motion } from 'framer-motion';
import { PersonAvatar } from '@/components/ui/avatar';
import { cn, firstName } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface ChildOption {
  _id: string;
  fullName: string;
  photoUrl?: string | null;
  classId?: { name?: string; section?: string } | null;
}

/**
 * Avatar pills across the top, ClassDojo-style. Shown even with a single child,
 * because the page is scoped to whoever is selected and hiding the switcher
 * left that ambiguous.
 */
export function ChildSwitcher({
  options,
  selectedId,
  onSelect,
}: {
  options: ChildOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (!options.length) return null;

  return (
    <div
      role="tablist"
      aria-label={t('Choose a child')}
      className="scrollbar-thin flex gap-2 overflow-x-auto pb-1"
    >
      {options.map((child) => {
        const active = child._id === selectedId;
        return (
          <button
            key={child._id}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(child._id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              active ? 'border-brand' : 'border-line hover:border-line-strong'
            )}
          >
            {active && (
              <motion.span
                layoutId="child-switcher-active"
                className="absolute inset-0 rounded-full bg-wash"
                transition={{ type: 'spring', stiffness: 480, damping: 40 }}
              />
            )}
            <PersonAvatar
              name={child.fullName}
              src={child.photoUrl}
              className="relative h-8 w-8"
            />
            <span className="relative text-left leading-tight">
              <span
                className={cn(
                  'block text-dense font-medium',
                  active ? 'text-brand' : 'text-ink'
                )}
              >
                {firstName(child.fullName)}
              </span>
              {child.classId?.name && (
                <span className="block text-meta text-ink-subtle">
                  {child.classId.name} {child.classId.section}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
