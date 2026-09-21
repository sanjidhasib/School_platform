'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', publishDate: '' });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); adminAPI.getNotices().then(r => setNotices(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await adminAPI.createNotice({ ...form, status: 'PUBLISHED' }); toast.success('Notice published'); setOpen(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Error saving'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notices" actions={<Button onClick={() => { setForm({ title: '', description: '', publishDate: new Date().toISOString().split('T')[0] }); setOpen(true); }}><Plus className="h-4 w-4" />New Notice</Button>} />
      {loading ? <TableSkeleton /> : !notices.length ? <EmptyState icon={Bell} title="No notices" description="Create announcements for the school" /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {notices.map((n: any) => (
            <div key={n._id} className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-bold">{n.title}</h3><p className="text-sm text-slate-500 mt-2">{n.description}</p><p className="text-xs text-blue-600 mt-4">{formatDate(n.publishDate)}</p></div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Publish Notice</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}><DialogBody className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required className="mt-1" /></div>
            <div><Label>Content</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required className="mt-1" /></div>
            <div><Label>Publish Date</Label><Input type="date" value={form.publishDate} onChange={e => setForm(f => ({...f, publishDate: e.target.value}))} required className="mt-1" /></div>
          </DialogBody><DialogFooter><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>Publish</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
