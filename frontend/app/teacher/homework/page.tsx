'use client';
import { useEffect, useState } from 'react';
import { teacherAPI } from '@/lib/api/teacher';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, ClipboardCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function HomeworkPage() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedHw, setSelectedHw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ classId: '', subjectId: '', title: '', description: '', dueAt: '', maxMarks: 10 });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); teacherAPI.getHomework().then(r => setHomeworks(r.data.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); adminAPI.getAssignments().then(r => setAssignments(r.data.data)); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await teacherAPI.createHomework(form); toast.success('Created'); setOpen(false); load(); }
    catch (err: any) { toast.error('Failed to create'); } finally { setSaving(false); }
  };

  const loadSubmissions = async (hw: any) => {
    setSelectedHw(hw);
    try { const res = await teacherAPI.getHomeworkSubmissions(hw._id); setSubmissions(res.data.data); } catch { toast.error('Failed to load submissions'); }
  };

  const handleGrade = async (subId: string, marks: number, feedback: string) => {
    try { await teacherAPI.gradeSubmission(subId, { marks, feedback, status: 'GRADED' }); toast.success('Graded'); loadSubmissions(selectedHw); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Homework" actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New Homework</Button>} />
      {!selectedHw ? (
        !homeworks.length ? <EmptyState icon={ClipboardCheck} title="No homework created" description="Create an assignment for your students" /> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeworks.map((h: any) => (
              <div key={h._id} className="rounded-xl border border-slate-200 bg-white p-5 cursor-pointer hover:border-blue-300 transition-colors" onClick={() => loadSubmissions(h)}>
                <div className="flex justify-between items-start mb-2"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{h.classId?.name}</span></div>
                <h3 className="font-bold">{h.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{h.subjectId?.name}</p>
                <p className="text-xs text-slate-400 mt-4">Due: {formatDate(h.dueAt)}</p>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedHw(null)}>Back</Button>
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="p-4 border-b bg-slate-50"><h2 className="font-bold">{selectedHw.title}</h2><p className="text-sm text-slate-500">{selectedHw.classId?.name} · {selectedHw.subjectId?.name}</p></div>
            <table className="w-full text-sm">
              <thead className="border-b"><tr><th className="px-4 py-3 text-left">Student</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Answer</th><th className="px-4 py-3 text-left">Grade</th></tr></thead>
              <tbody className="divide-y">{submissions.map((s: any) => (
                <tr key={s._id}><td className="px-4 py-3">{s.studentId?.fullName}</td><td className="px-4 py-3"><StatusBadge status={s.status} /></td><td className="px-4 py-3 text-slate-500 max-w-xs truncate">{s.answerText}</td>
                <td className="px-4 py-3">
                  {s.status === 'SUBMITTED' || s.status === 'LATE' ? (
                    <Button size="sm" onClick={() => { const m = prompt('Marks (out of '+selectedHw.maxMarks+'):'); if(m) handleGrade(s._id, parseInt(m), ''); }}>Grade</Button>
                  ) : s.marks !== undefined ? <span className="font-bold text-green-600">{s.marks}/{selectedHw.maxMarks}</span> : '—'}
                </td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Homework</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate}><DialogBody className="space-y-3">
            <div><Label>Assignment Context</Label><Select value={`${form.classId}|${form.subjectId}`} onValueChange={v => { const [c,s]=v.split('|'); setForm(f=>({...f,classId:c,subjectId:s})); }}><SelectTrigger><SelectValue placeholder="Select class & subject"/></SelectTrigger><SelectContent>{assignments.map(a => <SelectItem key={a._id} value={`${a.classId?._id}|${a.subjectId?._id}`}>{a.classId?.name} - {a.subjectId?.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Due Date</Label><Input type="date" value={form.dueAt} onChange={e => setForm(f => ({...f, dueAt: e.target.value}))} required /></div><div><Label>Max Marks</Label><Input type="number" value={form.maxMarks} onChange={e => setForm(f => ({...f, maxMarks: parseInt(e.target.value)}))} required /></div></div>
          </DialogBody><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>Create</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
