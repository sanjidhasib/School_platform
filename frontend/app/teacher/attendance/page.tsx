'use client';
import { useEffect, useState } from 'react';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { DAYS } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function TeacherAttendancePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'select' | 'mark'>('select');

  useEffect(() => {
    teacherAPI.getTodaySchedule().then(r => setSchedule(r.data.data.schedule || [])).catch(() => toast.error('Failed to load schedule'));
  }, []);

  const openSession = async (slot: any) => {
    try {
      const sessionRes = await teacherAPI.createAttendanceSession({
        timetableId: slot._id, teacherAssignmentId: slot.teacherAssignmentId._id,
        classId: slot.classId._id, subjectId: slot.teacherAssignmentId.subjectId._id,
        sessionDate: new Date().toISOString(), startTime: slot.startTime, endTime: slot.endTime
      });
      const session = sessionRes.data.data;
      setSelectedSession(session);
      const data = await teacherAPI.getAttendanceSession(session._id);
      setSessionData(data.data.data);
      const initial: Record<string, string> = {};
      data.data.data.students.forEach((s: any) => { initial[s._id] = data.data.data.records[s._id]?.status || 'PRESENT'; });
      setAttendance(initial);
      setStep('mark');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to open session'); }
  };

  const toggleStatus = (studentId: string) => {
    setAttendance(prev => { const cycle = { PRESENT: 'ABSENT', ABSENT: 'LEAVE', LEAVE: 'PRESENT' } as any; return { ...prev, [studentId]: cycle[prev[studentId]] || 'PRESENT' }; });
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
      await teacherAPI.saveAttendance(selectedSession._id, { records });
      toast.success('Attendance saved successfully');
      setStep('select');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save'); } finally { setSaving(false); }
  };

  if (step === 'mark' && sessionData) {
    const counts = Object.values(attendance).reduce((acc: any, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    return (
      <div className="space-y-6">
        <PageHeader title="Take Attendance" description={`${sessionData.session?.classId?.name} · ${sessionData.session?.subjectId?.name}`}
          actions={<><Button variant="outline" onClick={() => setStep('select')}>Back</Button><Button onClick={saveAttendance} disabled={saving}>{saving ? 'Saving...' : 'Save Attendance'}</Button></>}
        />
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">Present: {counts['PRESENT'] || 0}</span>
          <span className="text-red-600 font-medium">Absent: {counts['ABSENT'] || 0}</span>
          <span className="text-yellow-600 font-medium">Leave: {counts['LEAVE'] || 0}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {sessionData.students.map((student: any, idx: number) => (
            <div key={student._id} className="flex items-center gap-4 p-4">
              <span className="text-slate-400 text-sm w-6">{idx + 1}</span>
              <Avatar className="h-9 w-9"><AvatarFallback>{getInitials(student.fullName)}</AvatarFallback></Avatar>
              <div className="flex-1"><p className="font-medium text-sm">{student.fullName}</p><p className="text-xs text-slate-500">{student.studentId}</p></div>
              <button onClick={() => toggleStatus(student._id)} className="focus:outline-none">
                <StatusBadge status={attendance[student._id] || 'PRESENT'} className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Select a session to take attendance" />
      {!schedule.length ? <div className="text-center py-16 text-slate-500">No classes scheduled for today ({DAYS[new Date().getDay()]})</div> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedule.map((slot: any) => (
            <div key={slot._id} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-300 cursor-pointer transition-colors" onClick={() => openSession(slot)}>
              <p className="text-sm text-slate-500 font-mono">{slot.startTime} – {slot.endTime}</p>
              <p className="font-semibold text-slate-900 mt-1">{slot.teacherAssignmentId?.subjectId?.name}</p>
              <p className="text-sm text-slate-600">{slot.classId?.name} {slot.classId?.section}</p>
              <Button size="sm" className="mt-3 w-full">Take Attendance</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
