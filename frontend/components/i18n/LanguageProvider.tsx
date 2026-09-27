'use client';

import * as React from 'react';
import { setLanguage, type Lang } from '@/lib/i18n';

const LanguageContext = React.createContext<Lang>('en');

/**
 * Sets the interface language before anything below renders, on the server
 * and in the browser alike, so `t()` and the date formatters agree with the
 * <html lang> the server sent.
 */
export function LanguageProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  setLanguage(lang);
  return <LanguageContext.Provider value={lang}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => React.useContext(LanguageContext);
