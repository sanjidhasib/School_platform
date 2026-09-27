/**
 * Bangla / English for the interface.
 *
 * Text is written in English in the code and wrapped in `t()`; the Bangla
 * dictionary is keyed by that same English text. Anything not in the
 * dictionary simply stays English, so a missing translation never breaks a
 * page. Placeholders like `{n}` are filled from `vars`, and numbers become
 * Bangla digits when the language is Bangla.
 *
 * What people type — names, notices, homework — is never translated.
 *
 * The language lives in a `lang` cookie, so the server renders the chosen
 * language directly. Switching reloads the page (see LanguageToggle), which
 * keeps every screen, including server-rendered ones, in one language.
 */
import { bn } from './bn';

export type Lang = 'en' | 'bn';
export const LANG_COOKIE = 'lang';

let current: Lang =
  typeof document !== 'undefined' && document.documentElement.lang === 'bn' ? 'bn' : 'en';

/** Called by LanguageProvider (and server pages) before rendering. */
export function setLanguage(lang: Lang) {
  current = lang;
}

export function getLanguage(): Lang {
  return current;
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBnDigits = (value: string | number) => String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

/** A number in the current language's digits. */
export function num(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return current === 'bn' ? toBnDigits(value) : String(value);
}

export function translate(lang: Lang, text: string | null | undefined, vars?: Record<string, unknown>): string {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') return String(text);
  let out = text;
  if (lang === 'bn') {
    if (bn[text] !== undefined) out = bn[text];
    else {
      // Keys are stored trimmed; keep the spaces around a fragment.
      const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
      if (bn[m[2]] !== undefined) out = m[1] + bn[m[2]] + m[3];
    }
  }
  if (vars) {
    out = out.replace(/\{(\w+)\}/g, (whole, key) => {
      const v = vars[key];
      if (v === undefined || v === null) return '';
      if (lang === 'bn' && typeof v === 'number') return toBnDigits(v);
      return String(v);
    });
  }
  return out;
}

/** Translate interface text into the current language. */
export function t(text: string | null | undefined, vars?: Record<string, unknown>): string {
  return translate(current, text, vars);
}
