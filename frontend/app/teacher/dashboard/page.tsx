'use client';
import { useEffect, useState } from 'react';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ClipboardCheck, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TeacherDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { teacherAPI.getTodaySchedule().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Teacher Dashboard" />
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="p-4 border-b flex items-center justify-between"><h2 className="font-semibold">Today's Schedule</h2>{data?.pendingGrading > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">{data.pendingGrading} submissions to grade</span>}</div>
        {!data?.schedule?.length ? <EmptyState icon={Calendar} title="No classes today" description="Enjoy your free day!" /> : (
          <div className="divide-y divide-slate-100">
            {data.schedule.map((slot: any) => (
              <div key={slot._id} className="flex items-center gap-4 p-4">
                <div className="flex items-center gap-1.5 text-slate-400 text-sm w-24"><Clock className="h-3.5 w-3.5" />{slot.startTime}</div>
                <div className="flex-1"><p className="font-semibold text-slate-900">{slot.teacherAssignmentId?.subjectId?.name}</p><p className="text-sm text-slate-500">{slot.classId?.name} {slot.classId?.section}{slot.classId?.room ? ` · Room ${slot.classId.room}` : ''}</p></div>
                <Button size="sm" onClick={() => router.push('/teacher/attendance')}>Take Attendance</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
