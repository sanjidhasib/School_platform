'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { DAYS, SHORT_DAYS, PERIODS } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function TimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ dayOfWeek: 0, startTime: '', endTime: '', teacherAssignmentId: '', room: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI.getClasses().then(r => { setClasses(r.data.data); if (r.data.data.length > 0) setSelectedClass(r.data.data[0]._id); });
    adminAPI.getAssignments().then(r => setAssignments(r.data.data));
  }, []);

  const loadTimetable = () => { if (!selectedClass) return; setLoading(true); adminAPI.getTimetable({ classId: selectedClass }).then(r => setTimetable(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { loadTimetable(); }, [selectedClass]);

  const handleCellClick = (day: number, period: any) => { setForm({ dayOfWeek: day, startTime: period.start, endTime: period.end, teacherAssignmentId: '', room: '' }); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await adminAPI.createTimetableEntry({ ...form, classId: selectedClass }); toast.success('Entry added'); setOpen(false); loadTimetable(); }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save (check conflicts)'); } finally { setSaving(false); }
  };

  const getEntry = (day: number, start: string) => timetable.find(t => t.dayOfWeek === day && t.startTime === start);

  return (
    <div className="space-y-6">
      <PageHeader title="Timetable" description="Manage school schedules" actions={<Button onClick={() => { setForm({ dayOfWeek: 0, startTime: '', endTime: '', teacherAssignmentId: '', room: '' }); setOpen(true); }}><Plus className="h-4 w-4" />Add Entry</Button>} />
      <div className="flex gap-3"><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c._id} value={c._id}>{c.name} {c.section}</SelectItem>)}</SelectContent></Select></div>
      {!selectedClass ? <EmptyState icon={CalendarIcon} title="Select a class" description="Choose a class to view its timetable" /> : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 text-left w-32 border-r">Time \ Day</th>{[0,1,2,3,4].map(d => <th key={d} className="px-4 py-3 text-center">{DAYS[d]}</th>)}</tr></thead>
            <tbody className="divide-y">
              {PERIODS.map(p => (
                <tr key={p.start}><td className="px-4 py-3 border-r font-mono text-slate-500 text-xs bg-slate-50">{p.start} - {p.end}</td>
                  {[0,1,2,3,4].map(d => {
                    const entry = getEntry(d, p.start);
                    return <td key={d} className="p-2 border-r hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handleCellClick(d, p)}>
                      {entry ? <div className="bg-blue-50 text-blue-700 p-2 rounded text-xs text-center font-medium">{entry.teacherAssignmentId?.subjectId?.name}<br/><span className="text-blue-500 font-normal">{entry.teacherAssignmentId?.teacherId?.fullName}</span></div> : <div className="h-10 border-2 border-dashed border-slate-200 rounded flex items-center justify-center text-slate-300 hover:border-slate-300"><Plus className="h-4 w-4" /></div>}
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Timetable Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Day</Label><Select value={form.dayOfWeek.toString()} onValueChange={v => setForm(f => ({...f, dayOfWeek: parseInt(v)}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[0,1,2,3,4].map(d => <SelectItem key={d} value={d.toString()}>{DAYS[d]}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Room</Label><Input value={form.room} onChange={e => setForm(f => ({...f, room: e.target.value}))} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={e => setForm(f => ({...f, startTime: e.target.value}))} required className="mt-1" /></div>
                <div><Label>End Time</Label><Input type="time" value={form.endTime} onChange={e => setForm(f => ({...f, endTime: e.target.value}))} required className="mt-1" /></div>
              </div>
              <div><Label>Teacher & Subject</Label><Select value={form.teacherAssignmentId} onValueChange={v => setForm(f => ({...f, teacherAssignmentId: v}))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select assignment" /></SelectTrigger><SelectContent>{assignments.filter(a => a.classId?._id === selectedClass).map(a => <SelectItem key={a._id} value={a._id}>{a.subjectId?.name} ({a.teacherId?.fullName})</SelectItem>)}</SelectContent></Select></div>
            </DialogBody>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
