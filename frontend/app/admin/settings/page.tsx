'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiErrorMessage, cn, formatTime } from '@/lib/utils';
import { DAYS } from '@/lib/constants';

/**
 * Sectioned settings in the GitHub/Vercel shape: what the setting is on the
 * left, the control on the right, one rule between sections. Each section saves
 * on its own so a change to the school's phone number does not resubmit the
 * grading scale.
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [identity, setIdentity] = useState({
    name: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    logoUrl: '',
  });
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const [savingWeek, setSavingWeek] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    adminAPI
      .getSettings()
      .then((r) => {
        const d = r.data.data ?? {};
        setSettings(d);
        setIdentity({
          name: d.name ?? '',
          address: d.address ?? '',
          contactPhone: d.contactPhone ?? '',
          contactEmail: d.contactEmail ?? '',
          logoUrl: d.logoUrl ?? '',
        });
        setActiveDays(d.activeDays ?? []);
      })
      .catch(() => {
        setFailed(true);
        toast.error('Could not load settings');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const saveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIdentity(true);
    try {
      await adminAPI.updateSettings(identity);
      toast.success('School details saved');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the school details'));
    } finally {
      setSavingIdentity(false);
    }
  };

  const saveWeek = async () => {
    setSavingWeek(true);
    try {
      await adminAPI.updateSettings({ activeDays: [...activeDays].sort((a, b) => a - b) });
      toast.success('School week saved');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the school week'));
    } finally {
      setSavingWeek(false);
    }
  };

  const toggleDay = (d: number) =>
    setActiveDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const weekChanged =
    JSON.stringify([...activeDays].sort()) !== JSON.stringify([...(settings?.activeDays ?? [])].sort());

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  }

  if (failed) return <ErrorState description="School settings did not load." onRetry={load} />;

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader title="Settings" description="How the school identifies itself across SchoolOS." />

      <form onSubmit={saveIdentity}>
        <SettingsSection
          title="School details"
          description="Used in the sidebar, the home page and on report cards."
        >
          <SettingRow label="School name" htmlFor="school-name">
            <Input
              id="school-name"
              value={identity.name}
              onChange={(e) => setIdentity((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </SettingRow>

          <SettingRow label="Address" htmlFor="school-address">
            <Input
              id="school-address"
              value={identity.address}
              onChange={(e) => setIdentity((s) => ({ ...s, address: e.target.value }))}
            />
          </SettingRow>

          <SettingRow label="Phone" htmlFor="school-phone">
            <Input
              id="school-phone"
              value={identity.contactPhone}
              onChange={(e) => setIdentity((s) => ({ ...s, contactPhone: e.target.value }))}
            />
          </SettingRow>

          <SettingRow label="Email" htmlFor="school-email">
            <Input
              id="school-email"
              type="email"
              value={identity.contactEmail}
              onChange={(e) => setIdentity((s) => ({ ...s, contactEmail: e.target.value }))}
            />
          </SettingRow>

          <SettingRow label="Logo URL" description="Optional." htmlFor="school-logo">
            <Input
              id="school-logo"
              value={identity.logoUrl}
              onChange={(e) => setIdentity((s) => ({ ...s, logoUrl: e.target.value }))}
            />
          </SettingRow>

          <div className="flex justify-end border-t border-line px-4 py-3">
            <Button type="submit" loading={savingIdentity}>
              Save details
            </Button>
          </div>
        </SettingsSection>
      </form>

      <SettingsSection
        title="School week"
        description="Which days the routine covers. Bangladeshi schools usually run Sunday to Thursday."
      >
        <div className="px-4 py-4">
          <fieldset>
            <legend className="sr-only">Teaching days</legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day, i) => {
                const on = activeDays.includes(i);
                return (
                  <button
                    key={day}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggleDay(i)}
                    className={cn(
                      'min-h-[2.25rem] rounded-btn border px-3 text-dense font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                      on
                        ? 'border-brand bg-brand-wash text-brand'
                        : 'border-line text-ink-muted hover:bg-surface-sunken'
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <p className="text-meta text-ink-subtle">
            {activeDays.length} teaching {activeDays.length === 1 ? 'day' : 'days'} a week
          </p>
          <Button onClick={saveWeek} loading={savingWeek} disabled={!weekChanged}>
            Save week
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Periods"
        description="The period times the routine is built on. Changing these is a database task for now."
      >
        <ul className="divide-y divide-line">
          {(settings?.periods ?? []).map((p: any) => (
            <li key={p._id ?? p.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-dense text-ink">{p.name}</span>
              <span className="text-dense text-ink-muted tabular">
                {formatTime(p.startTime)} – {formatTime(p.endTime)}
              </span>
            </li>
          ))}
          {!settings?.periods?.length && (
            <li className="px-4 py-4 text-dense text-ink-subtle">No periods configured.</li>
          )}
        </ul>
      </SettingsSection>

      <SettingsSection
        title="Grading scale"
        description="Used to turn a percentage into a grade and a grade point on every report card."
      >
        <ul className="divide-y divide-line">
          {(settings?.gradingScale ?? []).map((g: any) => (
            <li key={g._id ?? g.grade} className="flex items-center gap-4 px-4 py-2.5">
              <Badge tone="outline" className="w-12 justify-center font-semibold">
                {g.grade}
              </Badge>
              <span className="flex-1 text-dense text-ink-muted tabular">
                {g.minPercentage}% to {g.maxPercentage}%
              </span>
              <span className="text-dense text-ink tabular">{g.gradePoint?.toFixed(2)}</span>
            </li>
          ))}
          {!settings?.gradingScale?.length && (
            <li className="px-4 py-4 text-dense text-ink-subtle">No grading scale configured.</li>
          )}
        </ul>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-section text-ink">{title}</h2>
        {description && <p className="text-dense text-ink-muted">{description}</p>}
      </div>
      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">{children}</div>
    </section>
  );
}

/** Label and help on the left, control on the right — Vercel/GitHub shape. */
function SettingRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center sm:gap-4">
      <div>
        <Label htmlFor={htmlFor}>{label}</Label>
        {description && <p className="mt-0.5 text-meta text-ink-subtle">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
