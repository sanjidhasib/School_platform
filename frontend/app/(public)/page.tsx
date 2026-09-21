import Link from 'next/link';
import {
  UserCheck,
  BookMarked,
  BarChart3,
  CalendarDays,
  Trophy,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { publicAPI } from '@/lib/api/public';
import { SchoolCarousel } from '@/components/shared/SchoolCarousel';
import { DashboardPreview } from '@/components/shared/DashboardPreview';
import { LogoMark } from '@/components/layout/Logo';
import { formatDate } from '@/lib/utils';

/** Re-fetch notices and achievements at most once a minute. */
export const revalidate = 60;

const SCHOOL_SLIDES = [
  { src: '/school-images/slide-1.jpg', alt: 'The main building of Barishal Zilla School' },
  { src: '/school-images/slide-3.jpg', alt: 'A classroom during a lesson' },
  { src: '/school-images/slide-4.jpg', alt: 'The school library' },
  { src: '/school-images/slide-5.jpg', alt: 'Students working in the science laboratory' },
  { src: '/school-images/slide-6.jpg', alt: 'The morning assembly' },
  { src: '/school-images/slide-7.jpg', alt: 'The sports field' },
  { src: '/school-images/slide-8.jpg', alt: 'The school campus' },
];

/** What each role actually gets — described in their own terms, not in slogans. */
const ROLES = [
  {
    icon: UserCheck,
    title: 'For teachers',
    body: 'Take attendance from the class on your routine, set homework, and enter marks for a whole class in one pass.',
  },
  {
    icon: BookMarked,
    title: 'For students',
    body: 'See what is due, hand your work in, check your attendance and grades, and ask questions about your textbook.',
  },
  {
    icon: BarChart3,
    title: 'For guardians',
    body: "Follow your child's attendance and results, and download their progress report whenever you need it.",
  },
  {
    icon: CalendarDays,
    title: 'For the office',
    body: 'Admit students against class capacity, assign teachers to subjects, and build the school routine without clashes.',
  },
];

async function getPublicData() {
  try {
    const [achievements, upcoming, school] = await Promise.all([
      publicAPI.getAchievements(),
      publicAPI.getUpcoming(),
      publicAPI.getSchool(),
    ]);
    return {
      achievements: achievements.data.data ?? [],
      upcoming: upcoming.data.data ?? [],
      school: school.data.data ?? null,
    };
  } catch {
    return { achievements: [], upcoming: [], school: null };
  }
}

export default async function HomePage() {
  const { achievements, upcoming, school } = await getPublicData();

  /*
    The public endpoint currently returns only {_id, logoUrl, address}: the
    backend selects `schoolName`/`phone`/`email` while the model stores
    `name`/`contactPhone`/`contactEmail`. That is a pre-existing backend bug
    documented in docs/UI_REDESIGN_PLAN.md. Reading both shapes means the real
    values flow through the moment it is fixed, with no change here.
  */
  const schoolName = school?.schoolName || school?.name || 'Barishal Zilla School';
  const address = school?.address;
  const phone = school?.contactPhone || school?.phone;
  const email = school?.contactEmail || school?.email;

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-btn bg-brand text-brand-contrast">
              <LogoMark />
            </span>
            <span className="text-dense font-semibold text-ink">SchoolOS</span>
          </Link>

          <nav className="ml-auto flex items-center gap-2">
            <Link
              href="/register"
              className="rounded-btn px-3 py-1.5 text-dense font-medium text-ink-muted transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="rounded-btn bg-brand px-3.5 py-1.5 text-dense font-medium text-brand-contrast transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero: a plain headline and the actual product beside it. */}
        <section className="mx-auto max-w-[1200px] px-4 pb-14 pt-12 sm:px-6 lg:pb-20 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                {schoolName} runs on SchoolOS
              </h1>
              <p className="mt-4 max-w-lg text-lg text-ink-muted">
                The routine, attendance, homework and results for Classes 3 to 10 — in one place
                for teachers, students, guardians and the office.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-btn bg-brand px-5 py-2.5 text-body font-medium text-brand-contrast transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-btn border border-line bg-surface px-5 py-2.5 text-body font-medium text-ink transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Create an account
                </Link>
              </div>

              {address && (
                <p className="mt-7 flex items-start gap-2 text-dense text-ink-subtle">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {address}
                </p>
              )}
            </div>

            <DashboardPreview />
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <SchoolCarousel slides={SCHOOL_SLIDES} autoPlay intervalMs={6000} />
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-ink">What it does</h2>
          <ul className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {ROLES.map((role) => (
              <li key={role.title} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-wash text-brand">
                  <role.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-dense font-semibold text-ink">{role.title}</h3>
                  <p className="mt-1 text-body text-ink-muted">{role.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {upcoming.length > 0 && (
          <section className="border-t border-line bg-surface">
            <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
              <h2 className="text-2xl font-semibold text-ink">Notice board</h2>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {upcoming.slice(0, 6).map((n: any) => (
                  <li key={n._id} className="flex gap-5 py-4">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-meta uppercase text-ink-subtle">
                        {formatDate(n.eventDate).split(' ')[1]}
                      </p>
                      <p className="text-xl font-semibold text-ink tabular">
                        {formatDate(n.eventDate).split(' ')[0]}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-dense font-semibold text-ink">{n.title}</h3>
                      {n.description && (
                        <p className="mt-1 line-clamp-2 text-dense text-ink-muted">
                          {n.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {achievements.length > 0 && (
          <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold text-ink">What the school has won</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a: any) => (
                <li
                  key={a._id}
                  className="flex flex-col rounded-card border border-line bg-surface p-4"
                >
                  <Trophy
                    className="h-4 w-4 text-highlighter"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <h3 className="mt-2 text-dense font-semibold text-ink">{a.title}</h3>
                  {a.description && (
                    <p className="mt-1 flex-1 text-dense text-ink-muted">{a.description}</p>
                  )}
                  <p className="mt-3 text-meta text-ink-subtle tabular">
                    {formatDate(a.achievementDate)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="text-dense font-semibold text-ink">{schoolName}</p>
              {address && <p className="mt-1 max-w-xs text-dense text-ink-muted">{address}</p>}
            </div>

            {(phone || email) && (
              <div className="space-y-1.5">
                {phone && (
                  <p className="flex items-center gap-2 text-dense text-ink-muted">
                    <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="tabular">{phone}</span>
                  </p>
                )}
                {email && (
                  <p className="flex items-center gap-2 text-dense text-ink-muted">
                    <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    {email}
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="mt-8 border-t border-line pt-6 text-meta text-ink-subtle">
            © {new Date().getFullYear()} {schoolName}. Powered by SchoolOS.
          </p>
        </div>
      </footer>
    </div>
  );
}
