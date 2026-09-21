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
import { Plus, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', achievementDate: '' });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); adminAPI.getAchievements().then(r => setAchievements(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await adminAPI.createAchievement(form); toast.success('Achievement added'); setOpen(false); load(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Error saving'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Achievements" actions={<Button onClick={() => { setForm({ title: '', description: '', achievementDate: new Date().toISOString().split('T')[0] }); setOpen(true); }}><Plus className="h-4 w-4" />New Achievement</Button>} />
      {loading ? <TableSkeleton /> : !achievements.length ? <EmptyState icon={Trophy} title="No achievements" description="Record school milestones" /> : (
        <div className="grid md:grid-cols-3 gap-4">
          {achievements.map((a: any) => (
            <div key={a._id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="h-10 w-10 bg-yellow-100 flex items-center justify-center rounded-xl mb-3"><Trophy className="h-5 w-5 text-yellow-600" /></div><h3 className="font-bold">{a.title}</h3><p className="text-sm text-slate-500 mt-1">{a.description}</p><p className="text-xs text-slate-400 mt-4">{formatDate(a.achievementDate)}</p></div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Achievement</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}><DialogBody className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required className="mt-1" /></div>
            <div><Label>Date</Label><Input type="date" value={form.achievementDate} onChange={e => setForm(f => ({...f, achievementDate: e.target.value}))} required className="mt-1" /></div>
          </DialogBody><DialogFooter><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>Save</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
