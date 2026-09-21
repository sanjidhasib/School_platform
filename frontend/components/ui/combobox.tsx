'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from './popover';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Shown under the label — e.g. a Bangla name, or a class room. */
  hint?: string;
  disabled?: boolean;
  /** Explains why the option is disabled, e.g. a class that is full. */
  disabledReason?: string;
}

/**
 * A searchable picker. The admin assignment and timetable flows choose from 15
 * teachers, 8 classes and 8 subjects — long enough that typing beats scrolling.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches',
  id,
  className,
  disabled,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-chip border border-line bg-surface px-3',
            'text-left text-dense transition-colors',
            'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'aria-[invalid=true]:border-danger',
            selected ? 'text-ink' : 'text-ink-subtle',
            className
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command
          loop
          filter={(val, search) => {
            const opt = options.find((o) => o.value === val);
            const haystack = `${opt?.label ?? ''} ${opt?.hint ?? ''}`.toLowerCase();
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} />
            <Command.Input
              placeholder={searchPlaceholder}
              className="h-9 w-full bg-transparent text-dense text-ink placeholder:text-ink-subtle focus:outline-none"
            />
          </div>
          <Command.List className="scrollbar-thin max-h-64 overflow-y-auto p-1">
            <Command.Empty className="px-2 py-6 text-center text-dense text-ink-subtle">
              {emptyText}
            </Command.Empty>
            {options.map((opt) => (
              <Command.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                onSelect={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setOpen(false);
                }}
                title={opt.disabled ? opt.disabledReason : undefined}
                className={cn(
                  'flex cursor-pointer select-none items-center justify-between gap-2 rounded-chip px-2 py-1.5',
                  'text-dense text-ink outline-none data-[selected=true]:bg-wash',
                  'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-55'
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate">{opt.label}</span>
                  {(opt.disabled && opt.disabledReason ? opt.disabledReason : opt.hint) && (
                    <span
                      className={cn(
                        'block truncate text-meta',
                        opt.disabled && opt.disabledReason ? 'text-danger' : 'text-ink-subtle'
                      )}
                    >
                      {opt.disabled && opt.disabledReason ? opt.disabledReason : opt.hint}
                    </span>
                  )}
                </span>
                {opt.value === value && (
                  <Check className="h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
                )}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
