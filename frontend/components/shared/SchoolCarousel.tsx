'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CarouselSlide {
  src: string;
  alt: string;
}

/**
 * Real photographs of the real campus. The caption overlay is gone — the
 * pictures speak for themselves, and the old gradient scrim over every frame
 * was the single heaviest piece of decoration on the page.
 */
export function SchoolCarousel({
  slides,
  autoPlay = true,
  intervalMs = 6000,
}: {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (!autoPlay || paused || slides.length < 2) return;
    const t = setInterval(next, intervalMs);
    return () => clearInterval(t);
  }, [autoPlay, paused, next, intervalMs, slides.length]);

  if (!slides.length) return null;

  return (
    <div
      className="group relative overflow-hidden rounded-card border border-line bg-surface-sunken"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Photographs of the school"
    >
      <div className="relative" style={{ aspectRatio: '16 / 7' }}>
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className={cn(
              'absolute inset-0 transition-opacity duration-500',
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            aria-hidden={i !== index}
          >
            {failed[i] ? (
              <div className="flex h-full items-center justify-center bg-surface-sunken">
                <p className="text-dense text-ink-subtle">{slide.alt}</p>
              </div>
            ) : (
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority={i === 0}
                className="object-cover"
                onError={() => setFailed((e) => ({ ...e, [i]: true }))}
              />
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <CarouselButton side="left" onClick={prev} label="Previous photograph">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </CarouselButton>
          <CarouselButton side="right" onClick={next} label="Next photograph">
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </CarouselButton>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Photograph ${i + 1} of ${slides.length}`}
                aria-current={i === index}
                className={cn(
                  'h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CarouselButton({
  side,
  onClick,
  label,
  children,
}: {
  side: 'left' | 'right';
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full',
        'bg-white/85 text-ink opacity-0 transition-opacity',
        'group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
        side === 'left' ? 'left-3' : 'right-3'
      )}
    >
      {children}
    </button>
  );
}
