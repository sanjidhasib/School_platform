import type { Metadata, Viewport } from 'next';
import { Onest, Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Providers } from '@/components/providers';
import { cookies } from 'next/headers';
import { LanguageProvider } from '@/components/i18n/LanguageProvider';
import { LANG_COOKIE, type Lang } from '@/lib/i18n';

/*
  Onest carries the UI. It was chosen over Inter deliberately: its narrower,
  more humanist letterforms hold up at the 13-14px used in the admin tables,
  and it ships real `tnum` tabular figures, which marks, student IDs and
  capacity counts need in order to line up in columns.
*/
const onest = Onest({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

/*
  Bangla is first-class here, not a fallback glyph. Hind Siliguri gets its own
  variable and its own line-height (set in globals.css) because the matra
  headline and deeper descenders need more room than Latin text.
*/
const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  variable: '--font-bn',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'SchoolOS',
  description: 'Digital School Management System',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F7FA' },
    { media: '(prefers-color-scheme: dark)', color: '#12162B' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The interface language the visitor chose (English unless they picked Bangla).
  const lang: Lang = cookies().get(LANG_COOKIE)?.value === 'bn' ? 'bn' : 'en';
  return (
    <html lang={lang} className={`${onest.variable} ${hindSiliguri.variable}`} suppressHydrationWarning>
      <body>
        <LanguageProvider lang={lang}>
          <Providers>
            <AuthProvider>{children}</AuthProvider>
          </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
