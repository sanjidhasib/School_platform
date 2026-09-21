'use client';
import { useEffect, useState } from 'react';
import { teacherAPI } from '@/lib/api/teacher';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResultsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  useEffect(() => { teacherAPI.getAssessments().then(r => setAssessments(r.data.data)); adminAPI.getAssignments().then(r => setAssignments(r.data.data)); }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Results & Grading" />
      <Tabs defaultValue="assessments">
        <TabsList><TabsTrigger value="assessments">Assessments</TabsTrigger><TabsTrigger value="grades">Final Grades</TabsTrigger></TabsList>
        <TabsContent value="assessments" className="space-y-4 pt-4">
          {!assessments.length ? <EmptyState icon={BarChart3} title="No assessments" description="Create tests or exams to enter marks" /> : (
            <div className="grid md:grid-cols-3 gap-4">
              {assessments.map((a: any) => (
                <div key={a._id} className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="font-bold">{a.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{a.classId?.name} · {a.subjectId?.name}</p>
                  <Button size="sm" className="mt-4 w-full">Enter Marks</Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="grades" className="pt-4">
          <EmptyState icon={BarChart3} title="Grade Entry" description="Select a class and term to calculate and publish final grades." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
