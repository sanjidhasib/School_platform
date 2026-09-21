'use client';

import { ThemeProvider } from 'next-themes';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Motion is wrapped in `reducedMotion="user"`, so every animation in the app
 * defers to the operating system setting without each component checking.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster
          position="bottom-right"
          gap={10}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                'flex w-full items-start gap-3 rounded-card border border-line bg-surface p-3.5 shadow-popover',
              title: 'text-dense font-medium text-ink',
              description: 'text-meta text-ink-muted mt-0.5',
              actionButton: 'rounded-chip bg-brand px-2 py-1 text-meta font-medium text-brand-contrast',
              cancelButton: 'rounded-chip px-2 py-1 text-meta text-ink-muted',
            },
          }}
          icons={{
            success: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={1.75} />,
            error: <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />,
            warning: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />,
            info: <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" strokeWidth={1.75} />,
          }}
        />
      </MotionConfig>
    </ThemeProvider>
  );
}
