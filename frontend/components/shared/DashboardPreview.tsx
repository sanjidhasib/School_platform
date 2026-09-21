import { cn } from '@/lib/utils';

/**
 * A rendered preview of the real admin routine, shown in the landing hero the
 * way Stripe and Linear show their actual product. It is built from the same
 * tokens and the same subject tints as the live screen, so it cannot drift into
 * marketing fiction — and it is static markup, so the marketing page does not
 * need an authenticated API call.
 */

const ROWS = [
  {
    time: '9:00',
    period: 'Period 1',
    cells: [
      { subject: 'Bangla', bn: 'বাংলা', teacher: 'Md. Anisur Rahman', tint: 'bg-subject-ban' },
      { subject: 'Mathematics', bn: 'গণিত', teacher: 'Md. Abul Kalam', tint: 'bg-subject-mat' },
      { subject: 'Science', bn: 'বিজ্ঞান', teacher: 'Md. Habibur Rahman', tint: 'bg-subject-sci' },
      { subject: 'English', bn: 'ইংরেজি', teacher: 'Md. Rafiqul Islam', tint: 'bg-subject-eng' },
    ],
  },
  {
    time: '10:00',
    period: 'Period 2',
    now: true,
    cells: [
      { subject: 'Mathematics', bn: 'গণিত', teacher: 'Md. Abul Kalam', tint: 'bg-subject-mat' },
      { subject: 'ICT', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', teacher: 'Md. Jahangir Alam', tint: 'bg-subject-ict' },
      { subject: 'Bangla', bn: 'বাংলা', teacher: 'Md. Anisur Rahman', tint: 'bg-subject-ban' },
      { subject: 'BGS', bn: 'বাংলাদেশ ও গ্লোবাল স্টাডিজ', teacher: 'Shahida Akter', tint: 'bg-subject-bgs' },
    ],
  },
  {
    time: '11:00',
    period: 'Period 3',
    cells: [
      { subject: 'English', bn: 'ইংরেজি', teacher: 'Md. Rafiqul Islam', tint: 'bg-subject-eng' },
      { subject: 'Science', bn: 'বিজ্ঞান', teacher: 'Md. Habibur Rahman', tint: 'bg-subject-sci' },
      null,
      { subject: 'Mathematics', bn: 'গণিত', teacher: 'Md. Monirul Islam', tint: 'bg-subject-mat' },
    ],
  },
  {
    time: '12:00',
    period: 'Period 4',
    cells: [
      { subject: 'Religion', bn: 'ধর্ম ও নৈতিক শিক্ষা', teacher: 'Md. Zahurul Haque', tint: 'bg-subject-rel' },
      { subject: 'Bangla', bn: 'বাংলা', teacher: 'Md. Anisur Rahman', tint: 'bg-subject-ban' },
      { subject: 'History', bn: 'ইতিহাস', teacher: 'Md. Shahidul Islam', tint: 'bg-subject-hss' },
      { subject: 'Science', bn: 'বিজ্ঞান', teacher: 'Md. Habibur Rahman', tint: 'bg-subject-sci' },
    ],
  },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday'];

export function DashboardPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-card border border-line bg-surface shadow-dialog',
        className
      )}
      aria-label="A preview of the SchoolOS class routine"
      role="img"
    >
      {/* Window chrome, so it reads as a screen rather than a diagram. */}
      <div className="flex items-center gap-2 border-b border-line bg-surface-sunken px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="ml-1 text-meta text-ink-subtle">Routine · Class 7 A</span>
      </div>

      <div className="overflow-hidden p-3">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="w-14 px-2 py-1.5 text-left text-[11px] font-medium text-ink-subtle">
                Time
              </th>
              {DAYS.map((d, i) => (
                <th
                  key={d}
                  scope="col"
                  className={cn(
                    'px-2 py-1.5 text-left text-[11px] font-medium',
                    i === 1 ? 'text-ink' : 'text-ink-subtle'
                  )}
                >
                  {d}
                  {i === 1 && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-highlighter align-middle" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.time} className="border-b border-line last:border-b-0">
                <th
                  scope="row"
                  className={cn(
                    'relative border-r border-line px-2 py-1.5 text-left align-top',
                    row.now && 'bg-highlighter-wash'
                  )}
                >
                  <span className="block text-[11px] font-medium text-ink-muted tabular">
                    {row.time}
                  </span>
                  <span className="block text-[10px] text-ink-subtle">{row.period}</span>
                </th>
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={cn(
                      'border-r border-line p-1 align-top last:border-r-0',
                      row.now && i === 1 && 'bg-highlighter-wash'
                    )}
                  >
                    {cell ? (
                      <div
                        className={cn(
                          'rounded-chip p-1.5',
                          cell.tint,
                          row.now && i === 1 && 'ring-1 ring-highlighter'
                        )}
                      >
                        <span className="block truncate text-[11px] font-semibold leading-tight text-ink">
                          {cell.subject}
                        </span>
                        <span
                          lang="bn"
                          className="block truncate font-bn text-[10px] leading-tight text-ink/70"
                        >
                          {cell.bn}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] leading-tight text-ink/60">
                          {cell.teacher}
                        </span>
                      </div>
                    ) : (
                      <div className="h-[3.1rem] rounded-chip border border-dashed border-line" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
