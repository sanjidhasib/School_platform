'use client';
import { useEffect, useState } from 'react';
import { guardianAPI } from '@/lib/api/guardian';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatPercentage, gradeTone } from '@/lib/utils';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function GuardianDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(0);

  useEffect(() => { guardianAPI.getDashboard().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <CardSkeleton key={i} />)}</div>;
  if (!data?.children?.length) return <div className="text-center py-16 text-slate-500">No linked children found</div>;

  const child = data.children[selectedChild];

  return (
    <div className="space-y-6">
      <PageHeader title="Guardian Dashboard" actions={<Link href="/guardian/reports"><Button variant="secondary"><FileText className="h-4 w-4" />Download Report</Button></Link>} />
      {data.children.length > 1 && (
        <div className="flex gap-2">
          {data.children.map((c: any, i: number) => (
            <button key={c.student._id} onClick={() => setSelectedChild(i)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === selectedChild ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              {c.student.fullName.split(' ')[0]}
            </button>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">{child.student.fullName[0]}</div>
        <div><h2 className="text-xl font-bold text-slate-900">{child.student.fullName}</h2><p className="text-slate-500">{child.student.classId?.name} {child.student.classId?.section}</p><StatusBadge status={child.student.status} className="mt-1" /></div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-700 mb-3">Attendance</h3>
          <p className="text-3xl font-bold text-slate-900">{formatPercentage(child.attendancePercentage)}</p>
          <Progress value={child.attendancePercentage} className="mt-3" />
          <p className="text-xs text-slate-500 mt-2">{child.presentCount} / {child.totalSessions} sessions</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-700 mb-3">Pending Homework</h3>
          <p className="text-3xl font-bold text-slate-900">{child.pendingHomework}</p>
          <p className="text-sm text-slate-500 mt-2">due assignments</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-700 mb-3">Subject Grades</h3>
          {!child.grades?.length ? <p className="text-slate-400 text-sm">No grades yet</p> : (
            <div className="space-y-1">
              {child.grades.slice(0,4).map((g: any) => (
                <div key={g._id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{g.subjectId?.name}</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-xs ${gradeTone(g.grade)}`}>{g.grade}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
