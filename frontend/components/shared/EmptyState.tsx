import { type LucideIcon, FolderOpen } from 'lucide-react';
interface EmptyStateProps { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode; }
export function EmptyState({ icon: Icon = FolderOpen, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
