import Link from 'next/link';
import { Trophy, Phone, Mail, MapPin, CalendarDays, Newspaper, GraduationCap, LogIn } from 'lucide-react';
import { publicAPI } from '@/lib/api/public';
import { SchoolCarousel } from '@/components/shared/SchoolCarousel';
import { SLIDES } from '@/lib/design/carousel';
import { mediaUrl } from '@/lib/api/client';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { SchoolBadge } from '@/components/layout/Logo';
import { cn, formatDate } from '@/lib/utils';
import { cookies } from 'next/headers';
import { t, setLanguage, getLanguage, LANG_COOKIE } from '@/lib/i18n';

/** Re-fetch notices, achievements and seats at most once a minute. */
export const revalidate = 60;

const CATEGORY_TONE: Record<string, string> = {
  EXAM: 'bg-warning-bg text-warning',
  HOLIDAY: 'bg-success-bg text-success',
  EVENT: 'bg-info-bg text-info',
  ACADEMIC: 'bg-brand-wash text-brand',
  URGENT: 'bg-danger-bg text-danger',
  GENERAL: 'bg-surface-sunken text-ink-muted',
};

const categoryLabel = (c?: string) => t(c ? c.charAt(0) + c.slice(1).toLowerCase() : 'Notice');

async function getPublicData() {
  // Each list fails on its own: one slow endpoint shouldn't blank the page.
  const settle = async (p: Promise<any>) => {
    try {
      return (await p).data.data ?? null;
    } catch {
      return null;
    }
  };
  const [achievements, upcoming, news, admission, school] = await Promise.all([
    settle(publicAPI.getAchievements()),
    settle(publicAPI.getUpcoming()),
    settle(publicAPI.getNews()),
    settle(publicAPI.getAdmission()),
    settle(publicAPI.getSchool()),
  ]);
  return {
    achievements: achievements ?? [],
    upcoming: upcoming ?? [],
    news: news ?? [],
    admission: admission ?? [],
    school,
  };
}

export default async function HomePage() {
  const { achievements, upcoming, news, admission, school } = await getPublicData();
  // A server page: take the visitor's language from the cookie before any text renders.
  setLanguage(cookies().get(LANG_COOKIE)?.value === 'bn' ? 'bn' : 'en');
  const bangla = getLanguage() === 'bn';
  const uploaded: string[] = school?.carouselImages ?? [];
  const slides = SLIDES.map((s, i) => ({ ...s, image: mediaUrl(uploaded[i]) || s.image, title: t(s.title), description: t(s.description), alt: t(s.alt), cta: t('Explore SchoolOS') }));

  const schoolName = school?.name || school?.schoolName || 'Barishal Zilla School';
  const address = school?.address;
  const phone = school?.contactPhone || school?.phone;
  const email = school?.contactEmail || school?.email;

  return (
    <div className="min-h-dvh bg-paper">
      <PublicNavbar schoolName={t(schoolName)} logoUrl={school?.logoUrl} />

      <main>
        {/* ── Hero ── */}
        <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:px-10 lg:pb-10 lg:pt-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              {/* The other language's name sits small above the big one. */}
              <p
                lang={bangla ? undefined : 'bn'}
                className={cn('text-base font-medium text-brand sm:text-lg', !bangla && 'font-bn')}
              >
                {bangla ? schoolName : 'বরিশাল জিলা স্কুল'}
              </p>
              <h1
                lang={bangla ? 'bn' : undefined}
                className="mt-2 bg-gradient-to-r from-[#0F3D26] via-[#1E7A48] to-[#2E9A5C] bg-clip-text pb-1 text-[2.6rem] font-extrabold leading-[1.1] tracking-tight text-transparent dark:from-[#E8EAF2] dark:via-[#B9C6F5] dark:to-[#7D97EE] sm:text-6xl lg:text-7xl xl:text-8xl"
              >
                {t(schoolName)}
              </h1>
              <p className="mt-4 text-xl font-medium text-ink-muted sm:text-2xl lg:text-3xl">
                {t('Where legends are born.')}
              </p>
            </div>
            {address && (
              <p className="flex max-w-sm items-start gap-2.5 rounded-card border border-line bg-surface px-4 py-3 text-dense text-ink-muted shadow-card lg:mb-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
                <span>
                  <span className="sr-only">{t('Location:')}{' '}</span>
                  {address}
                </span>
              </p>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10 lg:pb-24">
          <SchoolCarousel slides={slides} autoPlay intervalMs={6000} />
        </section>

        {/* ── Achievements ── */}
        <Section
          id="achievements"
          icon={Trophy}
          eyebrow={t('Achievements')}
          title={t('What our students have won')}
        >
          {!achievements.length ? (
            <Quiet>{t('Achievements will appear here once the school publishes them.')}</Quiet>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a: any, i: number) => (
                <li
                  key={a._id}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover',
                    i === 0 && 'lg:border-transparent lg:bg-[#104028] dark:lg:bg-[#1F2A5A] lg:text-white'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        i === 0 ? 'bg-highlighter-wash text-warning dark:text-highlighter lg:bg-white/15 lg:text-white' : 'bg-highlighter-wash text-warning dark:text-highlighter'
                      )}
                    >
                      <Trophy className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    {a.category && (
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-meta font-medium',
                          i === 0 ? 'bg-surface-sunken text-ink-muted lg:bg-white/15 lg:text-white' : 'bg-surface-sunken text-ink-muted'
                        )}
                      >
                        {a.category}
                      </span>
                    )}
                  </div>
                  <h3
                    className={cn(
                      'mt-5 font-semibold leading-snug text-ink',
                      i === 0 ? 'text-lg lg:text-white' : 'text-lg'
                    )}
                  >
                    {a.title}
                  </h3>
                  {a.description && (
                    <p className={cn('mt-2 flex-1 text-body text-ink-muted', i === 0 && 'lg:text-white/80')}>
                      {a.description}
                    </p>
                  )}
                  <p className={cn('mt-5 text-meta font-medium text-ink-subtle tabular', i === 0 && 'lg:text-white/70')}>
                    {formatDate(a.achievementDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── Notices: what's coming up ── */}
        <Section
          id="upcoming"
          icon={CalendarDays}
          eyebrow={t('Notice board')}
          title={t('Upcoming at school')}
          className="bg-surface"
        >
          {!upcoming.length ? (
            <Quiet>{t('No upcoming events or notices right now.')}</Quiet>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {upcoming.slice(0, 6).map((n: any) => {
                const date = new Date(n.eventDate);
                return (
                  <li
                    key={n._id}
                    className="flex gap-5 rounded-[20px] border border-line bg-paper p-5 transition-colors hover:border-line-strong"
                  >
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand text-brand-contrast">
                      <span className="text-meta font-semibold uppercase tracking-wide opacity-80">
                        {date.toLocaleDateString('en-GB', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold leading-none tabular">{date.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-meta font-medium',
                          CATEGORY_TONE[n.category] ?? CATEGORY_TONE.GENERAL
                        )}
                      >
                        {categoryLabel(n.category)}
                      </span>
                      <h3 className="mt-2 text-base font-semibold text-ink">{n.title}</h3>
                      {n.description && (
                        <p className="mt-1 line-clamp-2 text-dense text-ink-muted">{n.description}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* ── News: a strip that scrolls by itself ── */}
        <section id="news" className="scroll-mt-20 py-16 lg:py-24">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <SectionHeading icon={Newspaper} eyebrow={t('News')} title={t('Latest from the school')} />
          </div>
          {!news.length ? (
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
              <Quiet>{t('News will appear here as the school publishes it.')}</Quiet>
            </div>
          ) : (
            <NewsStrip items={news} />
          )}
        </section>

        {/* ── Admission ── */}
        <Section
          id="admission"
          icon={GraduationCap}
          eyebrow={t('Admission')}
          title={t('Admission information')}
          className="bg-surface"
        >
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            <div>
              <p className="max-w-2xl text-body text-ink-muted">
                {t('{schoolName} teaches Classes 3 to 10, with at most 40 students in each class. Seats open for admission right now:', { schoolName: t(schoolName) })}
              </p>
              {admission.length ? (
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {admission.map((c: any) => {
                    const full = c.seatsLeft <= 0;
                    return (
                      <li key={c._id} className="rounded-2xl border border-line bg-paper p-4">
                        <p className="text-dense font-semibold text-ink">
                          {c.name}
                          {c.section ? <span className="font-normal text-ink-subtle"> · {c.section}</span> : null}
                        </p>
                        <p className={cn('mt-2 text-2xl font-bold tabular', full ? 'text-danger' : 'text-ink')}>
                          {full ? t('Full') : c.seatsLeft}
                        </p>
                        <p className="text-meta text-ink-subtle">
                          {full ? t('no seats left') : t('of {capacity} seats left', { capacity: c.capacity })}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Quiet>{t('Seat availability will appear here.')}</Quiet>
              )}
            </div>

            <div className="rounded-[20px] bg-[#104028] p-6 dark:bg-[#12162B] text-white ring-1 ring-white/5 sm:p-8">
              <h3 className="text-xl font-semibold">{t('How to apply')}</h3>
              <p className="mt-2 text-body text-white/75">
                {t('Admission is handled by the school office. Contact the office for forms, dates and the documents you need.')}
              </p>
              <ul className="mt-6 space-y-4 text-dense">
                {address && (
                  <ContactLine icon={MapPin} label={t('Visit')}>
                    {address}
                  </ContactLine>
                )}
                {phone && (
                  <ContactLine icon={Phone} label={t('Call')}>
                    <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="tabular hover:underline">
                      {phone}
                    </a>
                  </ContactLine>
                )}
                {email && (
                  <ContactLine icon={Mail} label={t('Email')}>
                    <a href={`mailto:${email}`} className="break-all hover:underline">
                      {email}
                    </a>
                  </ContactLine>
                )}
              </ul>
            </div>
          </div>
        </Section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t-4 border-t-brand bg-[#104028] text-white dark:border-t dark:border-t-white/10 dark:bg-[#12162B]">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-10">
          <div>
            <div className="flex items-center gap-2.5">
              <SchoolBadge logoUrl={school?.logoUrl} className="h-9 w-9 bg-white/10 text-white ring-0" />
              <span className="text-lg font-bold">{t(schoolName)}</span>
            </div>
            <p className="mt-3 text-body text-white/70">{t('Where legends are born.')}</p>
            {address && <p className="mt-4 max-w-xs text-dense text-white/60">{address}</p>}
          </div>

          <FooterColumn title={t('Explore')}>
            <FooterLink href="#achievements">{t('Achievements')}</FooterLink>
            <FooterLink href="#news">{t('News')}</FooterLink>
            <FooterLink href="#upcoming">{t('Upcoming')}</FooterLink>
            <FooterLink href="#admission">{t('Admission')}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t('Contact')}>
            {phone && (
              <FooterLink href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                <span className="tabular">{phone}</span>
              </FooterLink>
            )}
            {email && <FooterLink href={`mailto:${email}`}>{email}</FooterLink>}
            {!phone && !email && <li className="text-dense text-white/60">{t('Contact the school office.')}</li>}
          </FooterColumn>

          <FooterColumn title={t('SchoolOS')}>
            <li>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-dense font-semibold text-[#104028] transition-colors hover:bg-white/90 dark:text-[#1B2240]"
              >
                <LogIn className="h-4 w-4" strokeWidth={2} />
                {t('Login')}
              </Link>
            </li>
            <li className="text-meta text-white/60">{t('For students, teachers, guardians and the office.')}</li>
          </FooterColumn>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-[1600px] px-4 py-6 text-meta text-white/50 sm:px-6 lg:px-10">
            {t('© {getFullYear} {schoolName}. Powered by SchoolOS.', { getFullYear: new Date().getFullYear(), schoolName: t(schoolName) })}
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────────

function Section({
  id,
  icon,
  eyebrow,
  title,
  className,
  children,
}: {
  id: string;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('scroll-mt-16 py-16 lg:py-24', className)}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <SectionHeading icon={icon} eyebrow={eyebrow} title={title} />
        {children}
      </div>
    </section>
  );
}

function SectionHeading({ icon: Icon, eyebrow, title }: { icon: React.ElementType; eyebrow: string; title: string }) {
  return (
    <div className="mb-8 lg:mb-10">
      <p className="flex items-center gap-2 text-dense font-semibold uppercase tracking-[0.14em] text-brand">
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">{title}</h2>
    </div>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[20px] border border-dashed border-line-strong px-6 py-10 text-center text-body text-ink-subtle">
      {children}
    </p>
  );
}

/**
 * The news list runs past on its own, twice over so the loop is seamless.
 * Hovering (or focusing a card) holds it still; with reduced motion it's a
 * plain strip the reader scrolls themselves.
 */
function NewsStrip({ items }: { items: any[] }) {
  // Short lists are repeated so the strip is always wider than the screen.
  const base = items.length >= 6 ? items : [...items, ...items, ...items].slice(0, Math.max(6, items.length));
  const seconds = Math.max(30, base.length * 7);
  const card = (n: any, i: number, hidden: boolean) => (
    <li
      key={`${n._id}-${i}-${hidden ? 'b' : 'a'}`}
      aria-hidden={hidden || undefined}
      className="w-[300px] shrink-0 rounded-[20px] border border-line bg-surface p-5 shadow-card sm:w-[340px]"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-meta font-medium',
            CATEGORY_TONE[n.category] ?? CATEGORY_TONE.GENERAL
          )}
        >
          {categoryLabel(n.category)}
        </span>
        <span className="text-meta text-ink-subtle tabular">{formatDate(n.publishAt)}</span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-semibold text-ink">{n.title}</h3>
      {n.description && <p className="mt-1.5 line-clamp-3 text-dense text-ink-muted">{n.description}</p>}
    </li>
  );

  return (
    <div
      className="group relative overflow-hidden motion-reduce:overflow-x-auto"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
      }}
    >
      <ul
        className="flex w-max gap-4 px-4 py-2 animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ ['--marquee-duration' as string]: `${seconds}s` }}
        aria-label={t('Latest news')}
      >
        {base.map((n, i) => card(n, i, false))}
        {base.map((n, i) => card(n, i, true))}
      </ul>
    </div>
  );
}

function ContactLine({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-meta uppercase tracking-wide text-white/50">{label}</p>
        <div className="text-white">{children}</div>
      </div>
    </li>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-meta font-semibold uppercase tracking-[0.14em] text-white/50">{title}</p>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} className="break-all text-dense text-white/80 transition-colors hover:text-white">
        {children}
      </a>
    </li>
  );
}
