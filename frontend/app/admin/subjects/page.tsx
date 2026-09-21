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
import { Plus, BookOpen, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', type: 'THEORY' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);

  const load = () => { setLoading(true); adminAPI.getSubjects().then(r => setSubjects(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await adminAPI.createSubject(form); toast.success('Subject created'); setOpen(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Error saving'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Subjects" actions={<Button onClick={() => { setForm({ name: '', code: '', description: '', type: 'THEORY' }); setOpen(true); }}><Plus className="h-4 w-4" />Add Subject</Button>} />
      {loading ? <TableSkeleton /> : !subjects.length ? <EmptyState icon={BookOpen} title="No subjects" description="Create your first subject" /> : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Description</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y">{subjects.map((s: any) => (<tr key={s._id}><td className="px-4 py-3 font-mono">{s.code}</td><td className="px-4 py-3 font-medium">{s.name}</td><td className="px-4 py-3">{s.type}</td><td className="px-4 py-3 text-slate-500">{s.description}</td><td className="px-4 py-3"><div className="flex justify-end"><Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>))}</tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}><DialogBody className="space-y-3"><div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required className="mt-1" /></div><div><Label>Code</Label><Input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value}))} required className="mt-1" /></div><div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="mt-1" /></div></DialogBody><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>Save</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Subject</DialogTitle></DialogHeader>
          <DialogBody><p className="text-sm text-slate-600">Delete subject <strong>{deleting?.name}</strong> ({deleting?.code})? Linked assessments and assignments may be affected.</p></DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={async () => { try { await adminAPI.deleteSubject(deleting._id); toast.success('Subject deleted'); setDeleting(null); load(); } catch (err: any) { toast.error(err.response?.data?.error || 'Delete failed'); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
