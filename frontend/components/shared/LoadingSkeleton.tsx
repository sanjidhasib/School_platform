import { Skeleton } from '@/components/ui/skeleton';
export function CardSkeleton() {
  return <div className="rounded-xl border border-slate-200 bg-white p-6"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></div>;
}
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-4 border-b bg-slate-50"><Skeleton className="h-4 w-48" /></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-slate-100 flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
