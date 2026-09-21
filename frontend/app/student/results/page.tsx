'use client';
import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { gradeTone } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentResultsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { studentAPI.getResults().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);
  if (loading) return <TableSkeleton rows={6} />;
  return (
    <div className="space-y-6">
      <PageHeader title="Results" />
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="p-4 border-b"><h2 className="font-semibold">Subject Grades</h2></div>
        {!data?.grades?.length ? <EmptyState icon={BarChart3} title="No grades yet" description="Grades will appear once teachers publish results" /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Subject</th><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Term</th><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">%</th><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Grade</th><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">GPA</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.grades.map((g: any) => (<tr key={g._id}><td className="px-4 py-3 font-medium">{g.subjectId?.name}</td><td className="px-4 py-3 text-slate-500">{g.term}</td><td className="px-4 py-3">{g.percentage?.toFixed(1)}%</td><td className="px-4 py-3"><span className={`font-bold px-2 py-0.5 rounded text-xs ${gradeTone(g.grade)}`}>{g.grade}</span></td><td className="px-4 py-3 text-slate-600">{g.gradePoint}</td></tr>))}
            </tbody>
          </table>
        )}
      </div>
      {data?.marks?.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="p-4 border-b"><h2 className="font-semibold">Assessment Marks</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Assessment</th><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Subject</th><th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Marks</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{data.marks.map((m: any) => (<tr key={m._id}><td className="px-4 py-3 font-medium">{m.assessmentId?.title}</td><td className="px-4 py-3 text-slate-500">{m.assessmentId?.subjectId?.name}</td><td className="px-4 py-3">{m.absent ? 'Absent' : `${m.obtainedMarks} / ${m.assessmentId?.maxMarks}`}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
