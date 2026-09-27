'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogoMark } from './Logo';
import { t } from '@/lib/i18n';
import { LanguageToggle } from '@/components/i18n/LanguageToggle';

/**
 * A calm split: the school on the left, the form on the right. The left panel
 * carries a real photograph of the campus rather than an abstract graphic, and
 * it steps out of the way entirely on phones.
 */
export function AuthSplit({
  schoolName,
  children,
}: {
  schoolName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <Image
          src="/school-images/slide-1.jpg"
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/20" />

        <div className="relative flex h-full flex-col justify-between p-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-btn text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-btn bg-paper/15">
              <LogoMark />
            </span>
            <span className="text-dense font-semibold">{t('SchoolOS')}</span>
          </Link>

          <div className="max-w-md">
            <p className="text-3xl font-semibold leading-tight text-paper">{schoolName}</p>
            <p className="mt-3 text-body text-paper/75">
              {t('Attendance, homework, results and the class routine, in one place for teachers, students, guardians and the office.')}
            </p>
          </div>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <LanguageToggle compact className="absolute right-4 top-4" />
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
