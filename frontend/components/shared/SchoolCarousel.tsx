'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t as tr } from '@/lib/i18n';

export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  href: string;
  cta?: string;
}

const TRANSITION_MS = 600;

/**
 * The "stacked deck" hero carousel. Slides are kept in a rotating order:
 *
 *   position 0      full-size, behind (the slide just left)
 *   position 1      full-size, the active slide — its text is shown
 *   positions 2–4   preview cards queued on the right
 *   position 5+     parked off to the right, invisible
 *
 * Next/Previous rotate the order; every slide then transitions from where it
 * was to its new position, so the next card grows into the background and
 * the old background shrinks into the back of the queue. The geometry lives
 * in CSS custom properties per breakpoint (see the container's classes), so
 * the same logic serves a phone, where the cards are hidden, and a desktop.
 */
export function SchoolCarousel({
  slides,
  autoPlay = true,
  intervalMs = 6000,
  className,
}: {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  intervalMs?: number;
  className?: string;
}) {
  const n = slides.length;
  // Start with slide 0 active: it sits at position 1, the last slide behind it.
  const [order, setOrder] = React.useState(() =>
    n > 1 ? [n - 1, ...Array.from({ length: n - 1 }, (_, i) => i)] : [0]
  );
  const [paused, setPaused] = React.useState(false);
  const busy = React.useRef(false);
  const touchX = React.useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const activeIndex = n > 1 ? order[1] : 0;
  const active = slides[activeIndex];

  // Ignore clicks while a move is still animating — rapid clicks otherwise
  // start new transitions from mid-flight positions and the deck tears.
  const move = React.useCallback((fn: (o: number[]) => number[]) => {
    if (busy.current) return;
    busy.current = true;
    setOrder(fn);
    window.setTimeout(() => {
      busy.current = false;
    }, TRANSITION_MS);
  }, []);

  const next = React.useCallback(() => move((o) => [...o.slice(1), o[0]]), [move]);
  const prev = React.useCallback(() => move((o) => [o[o.length - 1], ...o.slice(0, -1)]), [move]);
  const goTo = React.useCallback(
    (slideIndex: number) =>
      move((o) => {
        const at = o.indexOf(slideIndex);
        const shift = (at - 1 + o.length) % o.length;
        return [...o.slice(shift), ...o.slice(0, shift)];
      }),
    [move]
  );

  // Autoplay: restarts its timer after every move, so a manual click never
  // gets followed by an automatic one a moment later.
  React.useEffect(() => {
    if (!autoPlay || paused || reduceMotion || n < 2) return;
    const t = window.setTimeout(() => {
      if (!document.hidden) next();
    }, intervalMs);
    return () => window.clearTimeout(t);
  }, [autoPlay, paused, reduceMotion, n, intervalMs, next, order]);

  if (!n) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={tr('About SchoolOS')}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx < -50) next();
        if (dx > 50) prev();
      }}
      className={cn(
        'relative isolate overflow-hidden rounded-[20px] bg-[#12162B] shadow-dialog sm:rounded-[28px]',
        'h-[clamp(460px,72vh,780px)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
        // Card geometry per breakpoint: width, height, gap, and where the
        // first card starts. Phones get no cards; the frame is all photo.
        '[--cw:120px] [--ch:170px] [--cg:12px] [--cs:100%]',
        'md:[--cw:150px] md:[--ch:220px] md:[--cg:14px] md:[--cs:60%]',
        'lg:[--cw:190px] lg:[--ch:280px] lg:[--cg:18px] lg:[--cs:58%]',
        'xl:[--cw:210px] xl:[--ch:310px] xl:[--cg:20px] xl:[--cs:56%]',
        className
      )}
    >
      {order.map((slideIndex, position) => {
        const slide = slides[slideIndex];
        const isFull = position <= 1;
        const card = Math.min(position - 2, 3);
        return (
          <div
            key={slide.id}
            aria-hidden={slideIndex !== activeIndex}
            className={cn(
              'absolute overflow-hidden bg-[#12162B]',
              'transition-[left,top,width,height,border-radius,transform,opacity,box-shadow] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
              isFull ? 'z-0' : 'z-10 shadow-[0_20px_40px_-12px_rgb(0_0_0/0.55)]',
              position === 1 && 'z-[1]',
              // Cards past the third are parked out of sight; on phones none show.
              !isFull && (position > 4 ? 'pointer-events-none opacity-0' : 'max-md:pointer-events-none max-md:opacity-0')
            )}
            style={{
              transitionDuration: `${TRANSITION_MS}ms`,
              ...(isFull
                ? { left: 0, top: 0, width: '100%', height: '100%', borderRadius: 0, transform: 'translateY(0)' }
                : {
                    left: `calc(var(--cs) + ${card} * (var(--cw) + var(--cg)))`,
                    top: '50%',
                    width: 'var(--cw)',
                    height: 'var(--ch)',
                    borderRadius: 16,
                    transform: 'translateY(-50%)',
                  }),
            }}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1600px) 100vw, 1600px"
              priority={position <= 2}
              className="object-cover"
            />
            {!isFull && position <= 4 && (
              <button
                type="button"
                onClick={() => goTo(slideIndex)}
                tabIndex={-1}
                aria-label={tr('Show slide: {title}', { title: slide.title })}
                className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/10 to-transparent p-3 text-left"
              >
                <span className="line-clamp-2 text-dense font-semibold leading-snug text-white">
                  {slide.title}
                </span>
              </button>
            )}
          </div>
        );
      })}

      {/* Keeps white text readable over any photo: darker on the text side
          (left on desktop, bottom on phones), clear over the cards. */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/85 via-black/35 to-black/10 md:bg-gradient-to-r md:from-black/80 md:via-black/35 md:to-transparent"
        aria-hidden="true"
      />

      <div
        className="absolute inset-x-0 bottom-24 z-20 px-5 sm:bottom-28 sm:px-10 md:bottom-auto md:left-0 md:right-auto md:top-1/2 md:w-[54%] md:-translate-y-1/2 md:px-12 lg:w-[52%] lg:px-16"
        aria-live={paused ? 'polite' : 'off'}
      >
        <SlideContent key={active.id} slide={active} index={activeIndex} total={n} />
      </div>

      {n > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-3 sm:bottom-8 md:left-12 md:right-auto md:justify-start lg:left-16">
          <NavButton label={tr('Previous slide')} onClick={prev}>
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </NavButton>
          <NavButton label={tr('Next slide')} onClick={next}>
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </NavButton>
          <div className="ml-2 flex items-center gap-1.5" aria-hidden="true">
            {slides.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  'h-1 rounded-full transition-all duration-500',
                  i === activeIndex ? 'w-7 bg-white' : 'w-2.5 bg-white/40'
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const rise = {
  hidden: { opacity: 0, y: 40, filter: 'blur(16px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

function SlideContent({ slide, index, total }: { slide: CarouselSlide; index: number; total: number }) {
  const step = (delay: number) => ({
    variants: rise,
    initial: 'hidden' as const,
    animate: 'shown' as const,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });
  return (
    <div className="max-w-xl text-white">
      <motion.p {...step(0.05)} className="text-meta font-semibold uppercase tracking-[0.18em] text-white/70 tabular">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </motion.p>
      <motion.h2
        {...step(0.15)}
        className="mt-3 text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
      >
        {slide.title}
      </motion.h2>
      <motion.p {...step(0.3)} className="mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
        {slide.description}
      </motion.p>
      <motion.div {...step(0.45)} className="mt-7">
        <Link
          href={slide.href}
          className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-dense font-semibold text-[#1B2240] transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {slide.cta ?? tr('Explore SchoolOS')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      </motion.div>
    </div>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[#1B2240] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {children}
    </button>
  );
}
