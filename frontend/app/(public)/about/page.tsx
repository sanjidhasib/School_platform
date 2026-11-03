import Link from 'next/link';
import { GraduationCap, Users, BookOpen, Heart, Mail, ExternalLink } from 'lucide-react';
import { publicAPI } from '@/lib/api/public';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { SchoolBadge } from '@/components/layout/Logo';
import { LogIn } from 'lucide-react';
import { cookies } from 'next/headers';
import { t, setLanguage, getLanguage, LANG_COOKIE } from '@/lib/i18n';

export const revalidate = 3600;

async function getSchool() {
  try {
    const res = await publicAPI.getSchool();
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

const TEAM: {
  name: string;
  role: string;
  email: string;
  initials: string;
  color: string;
}[] = [
  {
    name: 'Sanjidul Hasan Hasib',
    role: 'Developer · Student, Khulna University',
    email: 'sanjidhasan220233@cseku.ac.bd',
    initials: 'SH',
    color: 'from-[#104028] to-[#1E7A48]',
  },
  {
    name: 'Audity Saha',
    role: 'Developer · Student, Khulna University',
    email: 'auditysaha220232@cseku.ac.bd',
    initials: 'AS',
    color: 'from-[#1B2240] to-[#2D3E80]',
  },
];

const SUPERVISOR = {
  name: 'Prof. Dr. Kazi Masudul Alam',
  role: 'Supervisor · Professor, Khulna University',
  initials: 'KA',
};

const VALUES = [
  {
    icon: BookOpen,
    title: 'Education First',
    desc: 'Every feature we build is driven by one question: does this help students learn better?',
  },
  {
    icon: Heart,
    title: 'Accessibility',
    desc: 'We believe every school — regardless of size or resources — deserves modern digital tools.',
  },
  {
    icon: Users,
    title: 'Community',
    desc: 'Schools thrive when students, teachers, guardians and staff are all connected.',
  },
];

export default async function AboutPage() {
  const school = await getSchool();
  setLanguage(cookies().get(LANG_COOKIE)?.value === 'bn' ? 'bn' : 'en');

  const schoolName = school?.name || school?.schoolName || 'Barishal Zilla School';
  const email = school?.contactEmail || school?.email;

  return (
    <div className="min-h-dvh bg-paper">
      <PublicNavbar schoolName={t(schoolName)} logoUrl={school?.logoUrl} />

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-[#104028] px-4 py-20 text-white dark:bg-[#12162B] sm:px-6 sm:py-28 lg:px-10">
          {/* subtle grid overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative mx-auto max-w-[1600px]">
            <p className="flex items-center gap-2 text-dense font-semibold uppercase tracking-[0.14em] text-white/60">
              <GraduationCap className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              About Us
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Built for schools,{' '}
              <span className="text-[#6CE08A]">by students who care.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/70 sm:text-xl">
              SchoolOS started as a university project with a clear mission: give every school a
              smart, connected platform without the complexity.
            </p>
          </div>
        </section>

        {/* ── Our Story ── */}
        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <SectionLabel icon={BookOpen} label="Our Story" />
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How SchoolOS came to be
          </h2>
          <div className="mt-6 grid gap-8 text-body text-ink-muted lg:grid-cols-2 lg:gap-16">
            <p>
              SchoolOS began with a simple observation: schools are rich with talented people but
              often held back by outdated, disconnected systems. Two Computer Science students at
              Khulna University — Sanjidul and Audity — set out to change that.
            </p>
            <p>
              What started as an academic project under the guidance of{' '}
              <strong className="font-semibold text-ink">Prof. Dr. Kazi Masudul Alam</strong> has
              grown into a full-featured school management platform — handling everything from
              timetables and homework to results, attendance and AI-powered learning tools.
            </p>
          </div>
        </section>

        {/* ── What we do ── */}
        <section className="bg-surface py-16 lg:py-24">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <SectionLabel icon={GraduationCap} label="What We Do" />
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              One platform for the whole school
            </h2>
            <p className="mt-5 max-w-3xl text-body text-ink-muted">
              SchoolOS brings together students, teachers, guardians and administrators under one
              roof. Whether it&apos;s checking results, browsing the digital library, tracking
              attendance or receiving notices — everything is a click away, on any device.
            </p>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { emoji: '📚', label: 'Digital Library & Textbooks' },
                { emoji: '📋', label: 'Attendance Tracking' },
                { emoji: '📝', label: 'Homework & Assignments' },
                { emoji: '📊', label: 'Results & Grade Reports' },
                { emoji: '🔔', label: 'Notices & Notifications' },
                { emoji: '🤖', label: 'AI-Powered Learning' },
              ].map(({ emoji, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-4 rounded-[20px] border border-line bg-paper px-5 py-4 shadow-card"
                >
                  <span className="text-2xl" aria-hidden="true">
                    {emoji}
                  </span>
                  <span className="text-base font-semibold text-ink">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── What we stand for ── */}
        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <SectionLabel icon={Heart} label="What We Stand For" />
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Values that guide every decision
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="rounded-[20px] border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-wash text-brand">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-body text-ink-muted">{desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Meet the team ── */}
        <section className="bg-surface py-16 lg:py-24">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <SectionLabel icon={Users} label="The Team" />
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Meet the people behind SchoolOS
            </h2>
            <p className="mt-4 max-w-2xl text-body text-ink-muted">
              SchoolOS is built and maintained by students of the{' '}
              <strong className="font-semibold text-ink">
                Computer Science &amp; Engineering Department, Khulna University
              </strong>
              , supervised by a faculty expert in the field.
            </p>

            {/* Developers */}
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {TEAM.map((member) => (
                <li
                  key={member.email}
                  className="overflow-hidden rounded-[20px] border border-line bg-paper shadow-card"
                >
                  <div className={`h-2 w-full bg-gradient-to-r ${member.color}`} />
                  <div className="flex items-start gap-5 p-6">
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white ${member.color}`}
                    >
                      {member.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-ink">{member.name}</p>
                      <p className="mt-0.5 text-dense text-ink-muted">{member.role}</p>
                      <a
                        href={`mailto:${member.email}`}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-meta text-ink-muted transition-colors hover:border-brand hover:text-brand"
                      >
                        <Mail className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                        {member.email}
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Supervisor */}
            <div className="mt-6 overflow-hidden rounded-[20px] border border-line bg-[#104028] text-white shadow-card dark:bg-[#12162B]">
              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-8">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold">
                  {SUPERVISOR.initials}
                </span>
                <div>
                  <p className="text-meta font-semibold uppercase tracking-[0.12em] text-white/50">
                    Project Supervisor
                  </p>
                  <p className="mt-1 text-xl font-bold">{SUPERVISOR.name}</p>
                  <p className="mt-1 text-body text-white/70">{SUPERVISOR.role}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Get in touch ── */}
        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <SectionLabel icon={Mail} label="Get In Touch" />
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            We&apos;d love to hear from you
          </h2>
          <p className="mt-5 max-w-2xl text-body text-ink-muted">
            Have a question about SchoolOS, want to report a bug, or just want to say hi? Reach
            out to the team directly — we&apos;re always happy to help.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-dense font-semibold text-brand-contrast transition-colors hover:bg-brand-hover"
              >
                <Mail className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Email the school
              </a>
            )}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-dense font-semibold text-ink transition-colors hover:border-line-strong hover:bg-wash"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Access SchoolOS
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t-4 border-t-brand bg-[#104028] text-white dark:border-t dark:border-t-white/10 dark:bg-[#12162B]">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
          <div>
            <div className="flex items-center gap-2.5">
              <SchoolBadge logoUrl={school?.logoUrl} className="h-9 w-9 bg-white/10 text-white ring-0" />
              <span className="text-lg font-bold">{t(schoolName)}</span>
            </div>
            <p className="mt-3 text-body text-white/70">Where legends are born.</p>
          </div>

          <div>
            <p className="text-meta font-semibold uppercase tracking-[0.14em] text-white/50">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/" className="text-dense text-white/80 transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-dense text-white/80 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-meta font-semibold uppercase tracking-[0.14em] text-white/50">
              SchoolOS
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-dense font-semibold text-[#104028] transition-colors hover:bg-white/90 dark:text-[#1B2240]"
                >
                  <LogIn className="h-4 w-4" strokeWidth={2} />
                  Login
                </Link>
              </li>
              <li className="text-meta text-white/60">
                For students, teachers, guardians and the office.
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-[1600px] px-4 py-6 text-meta text-white/50 sm:px-6 lg:px-10">
            © {new Date().getFullYear()} {t(schoolName)}. Powered by SchoolOS.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <p className="flex items-center gap-2 text-dense font-semibold uppercase tracking-[0.14em] text-brand">
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      {label}
    </p>
  );
}
