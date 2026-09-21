'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselSlide {
  src: string;
  alt: string;
  caption?: string;
}

interface SchoolCarouselProps {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  intervalMs?: number;
}

export function SchoolCarousel({
  slides,
  autoPlay = true,
  intervalMs = 5000,
}: SchoolCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!autoPlay || paused) return;
    const t = setInterval(next, intervalMs);
    return () => clearInterval(t);
  }, [autoPlay, paused, next, intervalMs]);

  if (!slides || slides.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-slate-200 bg-slate-900 group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="w-full flex-shrink-0 relative"
            style={{ aspectRatio: '16 / 7' }}
            aria-hidden={i !== index}
          >
            {imgErrors[i] ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white p-6">
                <div className="text-5xl font-bold mb-2">Barishal Zilla School</div>
                <div className="text-sm opacity-80">{slide.caption || slide.alt}</div>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full h-full object-cover"
                onError={() => setImgErrors((e) => ({ ...e, [i]: true }))}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            )}
            {slide.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 text-white">
                <p className="text-lg font-semibold drop-shadow">{slide.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-slate-900 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
