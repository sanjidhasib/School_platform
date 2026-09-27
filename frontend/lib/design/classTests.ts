/**
 * Where a class test is in its life, worked out from its status and times —
 * one definition shared by the teacher and student pages.
 */
export type TestPhase = 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'RESULTS';

export function testPhase(t: { status?: string; opensAt: string; closesAt: string; resultsPublished?: boolean }, now = Date.now()): TestPhase {
  if (t.status === 'DRAFT') return 'DRAFT';
  if (t.resultsPublished) return 'RESULTS';
  if (now < new Date(t.opensAt).getTime()) return 'SCHEDULED';
  if (now < new Date(t.closesAt).getTime()) return 'OPEN';
  return 'CLOSED';
}

export const PHASE_META: Record<TestPhase, { label: string; tone: string }> = {
  DRAFT: { label: 'Draft', tone: 'bg-surface-sunken text-ink-muted' },
  SCHEDULED: { label: 'Scheduled', tone: 'bg-info-bg text-info' },
  OPEN: { label: 'Open now', tone: 'bg-success-bg text-success' },
  CLOSED: { label: 'Closed', tone: 'bg-warning-bg text-warning' },
  RESULTS: { label: 'Results out', tone: 'bg-brand-wash text-brand' },
};

export const fmtWhen = (d: string | Date) =>
  new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

/** For <input type="datetime-local">: local time, no seconds. */
export const toLocalInput = (d: string | Date) => {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
