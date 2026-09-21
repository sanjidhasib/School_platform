import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
interface StatCardProps { label: string; value: string | number; icon: LucideIcon; iconColor?: string; iconBg?: string; trend?: string; trendUp?: boolean; }
export function StatCard({ label, value, icon: Icon, iconColor = 'text-blue-600', iconBg = 'bg-blue-50', trend, trendUp }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div><p className="text-sm text-slate-500 font-medium">{label}</p><p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>{trend && <p className={cn('text-xs mt-1', trendUp ? 'text-green-600' : 'text-red-500')}>{trend}</p>}</div>
        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', iconBg)}><Icon className={cn('h-6 w-6', iconColor)} /></div>
      </div>
    </div>
  );
}
