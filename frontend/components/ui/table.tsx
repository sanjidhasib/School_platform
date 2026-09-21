import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Tables carry their own structure through rules and alignment. There is no
 * card wrapper and no shadow — the header is a hairline, not a grey block.
 * Wide tables scroll inside their own container so the page never overflows.
 */
const TableWrap = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'scrollbar-thin w-full overflow-x-auto rounded-card border border-line bg-surface',
      className
    )}
    {...props}
  />
);

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table ref={ref} className={cn('w-full border-collapse text-dense', className)} {...props} />
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('border-b border-line', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('divide-y divide-line', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('group transition-colors hover:bg-wash/60', className)} {...props} />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }
>(({ className, numeric, ...props }, ref) => (
  <th
    ref={ref}
    scope="col"
    className={cn(
      'h-9 px-4 text-left align-middle text-meta font-medium text-ink-subtle',
      numeric && 'text-right',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }
>(({ className, numeric, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('px-4 py-3 align-middle text-ink', numeric && 'text-right tabular', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export { TableWrap, Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
