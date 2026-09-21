'use client';
import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { BookMarked } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentHomeworkPage() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [answer, setAnswer] = useState('');

  const load = () => { studentAPI.getHomework().then(r => setHomeworks(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openSubmit = (hw: any) => { setSelected(hw); setAnswer(''); setSubmitOpen(true); };
  const handleSubmit = async () => {
    setSubmitting(true);
    try { await studentAPI.submitHomework(selected._id, { answerText: answer }); toast.success('Submitted!'); setSubmitOpen(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Submission failed'); } finally { setSubmitting(false); }
  };

  const pending = homeworks.filter(h => ['NOT_SUBMITTED', 'LATE'].includes(h.submission?.status || 'NOT_SUBMITTED'));
  const submitted = homeworks.filter(h => !['NOT_SUBMITTED'].includes(h.submission?.status || 'NOT_SUBMITTED'));

  if (loading) return <TableSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Homework" />
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-700">Pending ({pending.length})</h2>
        {!pending.length ? <EmptyState icon={BookMarked} title="No pending homework" description="You're all caught up!" /> : pending.map((hw: any) => {
          const isOverdue = new Date() > new Date(hw.dueAt);
          return (
            <div key={hw._id} className={`rounded-xl border bg-white p-5 flex items-start gap-4 ${isOverdue ? 'border-red-200' : 'border-slate-200'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{hw.subjectId?.name}</span><StatusBadge status={hw.submission?.status || 'NOT_SUBMITTED'} /></div>
                <h3 className="font-semibold text-slate-900">{hw.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{hw.description?.slice(0, 100)}</p>
                <p className={`text-xs mt-2 ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>Due: {formatDate(hw.dueAt)}{isOverdue ? ' (Overdue)' : ''} · {hw.maxMarks} marks</p>
              </div>
              <Button size="sm" onClick={() => openSubmit(hw)} variant={isOverdue ? 'destructive' : 'default'}>Submit</Button>
            </div>
          );
        })}
      </div>
      {submitted.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-700">Submitted ({submitted.length})</h2>
          {submitted.map((hw: any) => (
            <div key={hw._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div><span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{hw.subjectId?.name}</span><h3 className="font-medium mt-1">{hw.title}</h3></div>
                <StatusBadge status={hw.submission?.status} />
              </div>
              {hw.submission?.marks !== undefined && <p className="text-sm text-green-600 font-medium mt-2">Marks: {hw.submission.marks}/{hw.maxMarks}</p>}
              {hw.submission?.feedback && <p className="text-sm text-slate-500 mt-1">Feedback: {hw.submission.feedback}</p>}
            </div>
          ))}
        </div>
      )}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent><DialogHeader><DialogTitle>Submit Homework</DialogTitle></DialogHeader>
          <DialogBody className="space-y-3">
            <p className="font-medium">{selected?.title}</p>
            <p className="text-sm text-slate-500">{selected?.description}</p>
            <Textarea placeholder="Write your answer here..." value={answer} onChange={e => setAnswer(e.target.value)} rows={5} />
          </DialogBody>
          <DialogFooter><Button variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
