'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, ClipboardList, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ teacherId: '', classId: '', subjectId: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);

  const load = () => { setLoading(true); adminAPI.getAssignments().then(r => setAssignments(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { load(); adminAPI.getTeachers().then(r => setTeachers(r.data.data)); adminAPI.getClasses().then(r => setClasses(r.data.data)); adminAPI.getSubjects().then(r => setSubjects(r.data.data)); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await adminAPI.createAssignment(form); toast.success('Assigned'); setOpen(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Error saving'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Teacher Assignments" actions={<Button onClick={() => { setForm({ teacherId: '', classId: '', subjectId: '' }); setOpen(true); }}><Plus className="h-4 w-4" />New Assignment</Button>} />
      {loading ? <TableSkeleton /> : !assignments.length ? <EmptyState icon={ClipboardList} title="No assignments" description="Assign teachers to classes and subjects" /> : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 text-left">Teacher</th><th className="px-4 py-3 text-left">Class</th><th className="px-4 py-3 text-left">Subject</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y">{assignments.map((a: any) => (<tr key={a._id}><td className="px-4 py-3 font-medium">{a.teacherId?.fullName}</td><td className="px-4 py-3">{a.classId?.name} {a.classId?.section}</td><td className="px-4 py-3">{a.subjectId?.name}</td><td className="px-4 py-3"><div className="flex justify-end"><Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleting(a)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>))}</tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Assign Teacher</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}><DialogBody className="space-y-3">
            <div><Label>Teacher</Label><Select value={form.teacherId} onValueChange={v => setForm(f => ({...f, teacherId: v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{teachers.map(t => <SelectItem key={t._id} value={t._id}>{t.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Class</Label><Select value={form.classId} onValueChange={v => setForm(f => ({...f, classId: v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name} {c.section}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Subject</Label><Select value={form.subjectId} onValueChange={v => setForm(f => ({...f, subjectId: v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          </DialogBody><DialogFooter><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>Save</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Assignment</DialogTitle></DialogHeader>
          <DialogBody><p className="text-sm text-slate-600">Remove <strong>{deleting?.teacherId?.fullName}</strong> from <strong>{deleting?.subjectId?.name}</strong> in <strong>{deleting?.classId?.name} {deleting?.classId?.section}</strong>?</p></DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={async () => { try { await adminAPI.deleteAssignment(deleting._id); toast.success('Assignment removed'); setDeleting(null); load(); } catch (err: any) { toast.error(err.response?.data?.error || 'Delete failed'); } }}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
