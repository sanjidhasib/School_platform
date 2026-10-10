'use client';

import * as React from 'react';
import { ImagePlus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { mediaUrl } from '@/lib/api/client';
import { SLIDES } from '@/lib/design/carousel';
import { SchoolBadge } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_MB = 5;

/**
 * Settings → Website pictures: the school logo, and the picture behind each
 * homepage carousel slide. Each one can be replaced or put back to the
 * built-in picture.
 */
export function WebsitePictures({ settings, onChanged }: { settings: any; onChanged: () => void }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const images: string[] = settings?.carouselImages ?? [];

  const upload = async (target: string, file?: File | null) => {
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) {
      toast.error(t('Use a JPG, PNG or WebP image'));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(t('That picture is larger than {n} MB', { n: MAX_MB }));
      return;
    }
    setBusy(target);
    try {
      await adminAPI.uploadSchoolPicture(target, file);
      toast.success(t('Picture updated — it shows on the website now'));
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not upload the picture')));
    } finally {
      setBusy(null);
    }
  };

  const reset = async (target: string) => {
    setBusy(target);
    try {
      await adminAPI.resetSchoolPicture(target);
      toast.success(t('Back to the original picture'));
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not reset the picture')));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-section text-ink">{t('Website pictures')}</h2>
        <p className="text-dense text-ink-muted">
          {t('The school logo and the homepage carousel. JPG, PNG or WebP, up to {n} MB.', { n: MAX_MB })}
        </p>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {/* Logo */}
        <div className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-4">
          <SchoolBadge logoUrl={settings?.logoUrl} className="h-16 w-16 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-dense font-medium text-ink">{t('Logo')}</p>
            <p className="text-meta text-ink-subtle">
              {t('Shown in the sidebar, the website header and footer. A square picture works best.')}
            </p>
          </div>
          <PictureButtons
            target="logo"
            busy={busy}
            hasCustom={!!settings?.logoUrl}
            onPick={upload}
            onReset={reset}
          />
        </div>

        {/* Carousel slides */}
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {SLIDES.map((slide, i) => {
            const custom = images[i];
            const src = mediaUrl(custom) || slide.image;
            const target = `slide-${i}`;
            return (
              <div key={slide.id} className="overflow-hidden rounded-xl border border-line">
                <div className="relative aspect-[16/9] bg-surface-sunken">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={t(slide.alt)} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-meta font-semibold text-white">
                    {t('Slide {n}', { n: i + 1 })}
                  </span>
                  {custom && (
                    <span className="absolute right-2 top-2 rounded-full bg-brand px-2 py-0.5 text-meta font-semibold text-brand-contrast">
                      {t('Your picture')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <p className="min-w-0 flex-1 truncate text-dense font-medium text-ink">{t(slide.title)}</p>
                  <PictureButtons target={target} busy={busy} hasCustom={!!custom} onPick={upload} onReset={reset} compact />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PictureButtons({
  target,
  busy,
  hasCustom,
  onPick,
  onReset,
  compact,
}: {
  target: string;
  busy: string | null;
  hasCustom: boolean;
  onPick: (target: string, file?: File | null) => void;
  onReset: (target: string) => void;
  compact?: boolean;
}) {
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <div className={cn('flex shrink-0 items-center gap-1.5')}>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label={t('Choose a picture')}
        onChange={(e) => {
          onPick(target, e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <Button size="sm" variant="secondary" loading={busy === target} onClick={() => input.current?.click()}>
        <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
        {compact ? t('Replace') : t('Upload logo')}
      </Button>
      {hasCustom && (
        <Button size="sm" variant="ghost" disabled={busy === target} onClick={() => onReset(target)} aria-label={t('Reset to the original picture')}>
          <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
          {!compact && t('Reset')}
        </Button>
      )}
    </div>
  );
}
