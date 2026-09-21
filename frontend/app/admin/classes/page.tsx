'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Users, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', section: '', room: '', capacity: 40 });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); adminAPI.getClasses().then(r => setClasses(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await adminAPI.createClass(form); toast.success('Class created'); setOpen(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Error saving'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Classes" actions={<Button onClick={() => { setForm({ name: '', section: '', room: '', capacity: 40 }); setOpen(true); }}><Plus className="h-4 w-4" />Add Class</Button>} />
      {loading ? <TableSkeleton /> : !classes.length ? <EmptyState icon={LayoutGrid} title="No classes" description="Create your first class" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map((c: any) => (
            <div key={c._id} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-4"><div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">{c.name.replace(/[^0-9]/g, '') || c.name[0]}</div></div>
              <h3 className="font-bold text-slate-900 text-lg">{c.name} {c.section}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-2"><Users className="h-4 w-4" /> Enrollment: {c.enrollmentCount ?? 0} / {c.capacity}</p>
              {c.room && <p className="text-xs text-slate-400 mt-1">Room: {c.room}</p>}
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-3">
              <div className="grid grid-cols-2 gap-3"><div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Class 10" required className="mt-1" /></div><div><Label>Section</Label><Input value={form.section} onChange={e => setForm(f => ({...f, section: e.target.value}))} placeholder="e.g. A" required className="mt-1" /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>Room</Label><Input value={form.room} onChange={e => setForm(f => ({...f, room: e.target.value}))} className="mt-1" /></div><div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: parseInt(e.target.value)}))} required className="mt-1" /></div></div>
            </DialogBody>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Class'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
