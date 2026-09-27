'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { cn, gradeTone } from '@/lib/utils';

export interface SubjectGradeRow {
  id: string;
  subject: string;
  subjectBn?: string | null;
  percentage: number;
  grade: string;
}

/**
 * A single measure (percentage) per subject, so this stays one hue — the
 * skill's rule for magnitude is "sequential = one hue"; colouring each bar by
 * its own grade band would turn a magnitude chart into an ad-hoc categorical
 * one with no real identity to encode. The letter grade rides along as a
 * direct label instead, and repeats in the tooltip.
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as SubjectGradeRow;
  return (
    <div className="rounded-card border border-line bg-surface px-3 py-2 shadow-popover">
      <p className="text-dense font-medium text-ink">{row.subject}</p>
      {row.subjectBn && (
        <p lang="bn" className="font-bn text-meta text-ink-muted">
          {row.subjectBn}
        </p>
      )}
      <p className="mt-1 flex items-center gap-2 text-meta text-ink-muted tabular">
        {row.percentage.toFixed(1)}%
        <span className={cn('rounded-chip px-1.5 py-0.5 text-[11px] font-semibold', gradeTone(row.grade))}>
          {row.grade}
        </span>
      </p>
    </div>
  );
}

export function GradeChart({ data, className }: { data: SubjectGradeRow[]; className?: string }) {
  const axisColor = 'rgb(var(--ink-subtle))';

  return (
    <div className={cn('px-2 pb-2 pt-4', className)}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: -12 }} barCategoryGap={18}>
          <XAxis
            dataKey="subject"
            axisLine={false}
            tickLine={false}
            tick={{ fill: axisColor, fontSize: 12 }}
            interval={0}
            angle={data.length > 5 ? -20 : 0}
            textAnchor={data.length > 5 ? 'end' : 'middle'}
            height={data.length > 5 ? 40 : 24}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: axisColor, fontSize: 12 }}
            width={34}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip cursor={{ fill: 'rgb(var(--wash))' }} content={<CustomTooltip />} />
          <Bar dataKey="percentage" fill="rgb(var(--brand))" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
            <LabelList
              dataKey="grade"
              position="top"
              style={{ fill: 'rgb(var(--ink-muted))', fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
