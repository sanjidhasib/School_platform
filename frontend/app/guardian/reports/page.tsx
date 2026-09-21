'use client';
import { useEffect, useState } from 'react';
import { guardianAPI } from '@/lib/api/guardian';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function GuardianReportsPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { guardianAPI.getChildren().then(r => { setChildren(r.data.data); if (r.data.data.length > 0) setSelectedChild(r.data.data[0].student._id); }); }, []);

  const downloadReport = async () => {
    if (!selectedChild) return;
    setDownloading(true);
    try {
      const res = await guardianAPI.downloadChildReport(selectedChild);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', 'ReportCard.pdf'); document.body.appendChild(link); link.click(); link.parentNode?.removeChild(link);
    } catch { toast.error('Failed to download'); } finally { setDownloading(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" />
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div><label className="text-sm font-medium mb-1 block">Select Child</label><Select value={selectedChild} onValueChange={setSelectedChild}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{children.map((c: any) => <SelectItem key={c.student._id} value={c.student._id}>{c.student.fullName}</SelectItem>)}</SelectContent></Select></div>
        <div><label className="text-sm font-medium mb-1 block">Term</label><Select defaultValue="TERM_1"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="TERM_1">Term 1</SelectItem><SelectItem value="TERM_2">Term 2</SelectItem><SelectItem value="FINAL">Final</SelectItem></SelectContent></Select></div>
        <Button className="w-full" onClick={downloadReport} disabled={downloading}><FileText className="h-4 w-4 mr-2" />{downloading ? 'Generating...' : 'Download Report PDF'}</Button>
      </div>
    </div>
  );
}
