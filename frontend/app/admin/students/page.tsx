'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInitials, formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { username: '', email: '', password: '', fullName: '', studentId: '', classId: '', phone: '', status: 'ACTIVE' };

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);

  const load = () => { setLoading(true); adminAPI.getStudents({ search, classId: classFilter === 'all' ? undefined : classFilter }).then(r => setStudents(r.data.data)).catch(() => toast.error('Failed to load students')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [search, classFilter]);
  useEffect(() => { adminAPI.getClasses().then(r => setClasses(r.data.data)); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ username: s.userId?.username || '', email: s.email || '', password: '', fullName: s.fullName, studentId: s.studentId, classId: s.classId?._id || '', phone: s.phone || '', status: s.status }); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await adminAPI.updateStudent(editing._id, form); toast.success('Student updated'); }
      else { await adminAPI.createStudent(form); toast.success('Student created'); }
      setOpen(false); load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error saving'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Manage school students" actions={<Button onClick={openAdd}><Plus className="h-4 w-4" />Add Student</Button>} />
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={classFilter} onValueChange={setClassFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Classes" /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name} {c.section}</SelectItem>)}</SelectContent></Select>
      </div>
      {loading ? <TableSkeleton /> : !students.length ? <EmptyState icon={GraduationCap} title="No students found" description="Add your first student to get started" action={<Button onClick={openAdd}><Plus className="h-4 w-4" />Add Student</Button>} /> : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">Student</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">ID</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">Class</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">Status</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s: any) => (
                <tr key={s._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={s.photoUrl} /><AvatarFallback>{getInitials(s.fullName)}</AvatarFallback></Avatar><div><p className="font-medium text-slate-900">{s.fullName}</p></div></div></td>
                  <td className="px-4 py-3 font-mono text-slate-600">{s.studentId}</td>
                  <td className="px-4 py-3 text-slate-600">{s.classId?.name} {s.classId?.section}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2 justify-end"><Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-3">
              {!editing && <><div className="grid grid-cols-2 gap-3"><div><Label>Username</Label><Input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} required className="mt-1" /></div><div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required className="mt-1" /></div></div><div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1" /></div></>}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Full Name</Label><Input value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))} required className="mt-1" /></div>
                <div><Label>Student ID</Label><Input value={form.studentId} onChange={e => setForm(f => ({...f, studentId: e.target.value}))} required className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Class</Label><Select value={form.classId} onValueChange={v => setForm(f => ({...f, classId: v}))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name} {c.section}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="mt-1" /></div>
              </div>
            </DialogBody>
            <DialogFooter><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Student'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Student</DialogTitle></DialogHeader>
          <DialogBody><p className="text-sm text-slate-600">Are you sure you want to delete <strong>{deleting?.fullName}</strong>? Their user account and related records will be removed.</p></DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={async () => { try { await adminAPI.deleteStudent(deleting._id); toast.success('Student deleted'); setDeleting(null); load(); } catch (err: any) { toast.error(err.response?.data?.error || 'Delete failed'); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
