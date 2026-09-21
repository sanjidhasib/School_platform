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
import { getInitials, formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { username: '', email: '', password: '', fullName: '', teacherId: '', degree: '', specialization: '', phone: '', joiningDate: '', status: 'ACTIVE' };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);

  const load = () => { setLoading(true); adminAPI.getTeachers({ search }).then(r => setTeachers(r.data.data)).catch(() => toast.error('Failed to load teachers')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (t: any) => { setEditing(t); setForm({ username: t.userId?.username || '', email: t.email || '', password: '', fullName: t.fullName, teacherId: t.teacherId, degree: t.degree, specialization: t.specialization || '', phone: t.phone, joiningDate: t.joiningDate?.slice(0, 10) || '', status: t.status }); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await adminAPI.updateTeacher(editing._id, form); toast.success('Teacher updated'); }
      else { await adminAPI.createTeacher(form); toast.success('Teacher created'); }
      setOpen(false); load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error saving'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Teachers" description="Manage school teaching staff" actions={
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Teacher</Button>
      } />
      <div className="flex gap-3"><div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div></div>
      {loading ? <TableSkeleton /> : !teachers.length ? <EmptyState icon={Users} title="No teachers found" description="Add your first teacher to get started" action={<Button onClick={openAdd}><Plus className="h-4 w-4" />Add Teacher</Button>} /> : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">Teacher</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">ID</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase hidden md:table-cell">Degree</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase hidden lg:table-cell">Phone</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">Status</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((t: any) => (
                <tr key={t._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={t.photoUrl} /><AvatarFallback>{getInitials(t.fullName)}</AvatarFallback></Avatar><div><p className="font-medium text-slate-900">{t.fullName}</p><p className="text-xs text-slate-500">{t.specialization}</p></div></div></td>
                  <td className="px-4 py-3 font-mono text-slate-600">{t.teacherId}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{t.degree}</td>
                  <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{t.phone}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2 justify-end"><Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleting(t)}><Trash2 className="h-4 w-4" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-3">
              {!editing && <><div className="grid grid-cols-2 gap-3"><div><Label>Username</Label><Input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} required className="mt-1" /></div><div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required className="mt-1" /></div></div><div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1" /></div></>}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Full Name</Label><Input value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))} required className="mt-1" /></div>
                <div><Label>Teacher ID</Label><Input value={form.teacherId} onChange={e => setForm(f => ({...f, teacherId: e.target.value}))} required className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Degree</Label><Input value={form.degree} onChange={e => setForm(f => ({...f, degree: e.target.value}))} className="mt-1" /></div>
                <div><Label>Specialization</Label><Input value={form.specialization} onChange={e => setForm(f => ({...f, specialization: e.target.value}))} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="mt-1" /></div>
                <div><Label>Joining Date</Label><Input type="date" value={form.joiningDate} onChange={e => setForm(f => ({...f, joiningDate: e.target.value}))} className="mt-1" /></div>
              </div>
            </DialogBody>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Teacher'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Teacher</DialogTitle></DialogHeader>
          <DialogBody><p className="text-sm text-slate-600">Are you sure you want to delete <strong>{deleting?.fullName}</strong>? This will remove their user account and assignments. This cannot be undone.</p></DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={async () => { try { await adminAPI.deleteTeacher(deleting._id); toast.success('Teacher deleted'); setDeleting(null); load(); } catch (err: any) { toast.error(err.response?.data?.error || 'Delete failed'); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
