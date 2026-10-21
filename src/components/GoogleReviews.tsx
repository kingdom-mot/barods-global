'use client';

import { useRef } from 'react';
import type { Reviews } from '@/lib/reviews';

function Stars({ n, size = 'text-base' }: { n: number; size?: string }) {
  const full = Math.round(n);
  return (
    <span className={`${size} leading-none tracking-tight`} aria-label={`${n} out of 5 stars`}>
      <span className="text-[#FBBC04]">{'★'.repeat(full)}</span>
      <span className="text-line">{'★'.repeat(5 - full)}</span>
    </span>
  );
}

/** Google's "G", for the attribution Google asks for wherever its reviews are shown. */
const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export default function GoogleReviews({ data, writeUrl }: { data: Reviews; writeUrl: string }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };
  const many = data.reviews.length > 3;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="section-title">What Our Clients Say</h2>
          <p className="section-sub">From our Google reviews</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data.rating != null && (
            <a href={data.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5 hover:border-brand-green">
              <GoogleG />
              <span className="font-display text-3xl leading-none">{data.rating.toFixed(1)}</span>
              <span className="flex flex-col">
                <Stars n={data.rating} />
                <span className="mt-1 text-xs text-muted">{data.count} Google reviews</span>
              </span>
            </a>
          )}
          <a href={writeUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">Write a review</a>
        </div>
      </div>

      <div className="relative">
        <div ref={track} className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.reviews.map((r, i) => (
            <figure key={i} className="flex w-[85%] shrink-0 snap-start flex-col rounded-xl border border-line bg-white p-6 sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
              <div className="flex items-center gap-3">
                {r.photo ? (
                  <img src={r.photo} alt="" className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-greenLight font-semibold text-brand-greenDark">{r.author.charAt(0)}</span>
                )}
                <figcaption className="min-w-0 flex-1">
                  {r.authorUrl ? (
                    <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-semibold hover:text-brand-greenDark">{r.author}</a>
                  ) : (
                    <span className="block truncate text-sm font-semibold">{r.author}</span>
                  )}
                  {r.when && <span className="text-xs text-muted">{r.when}</span>}
                </figcaption>
                <GoogleG />
              </div>
              <Stars n={r.rating} size="mt-4 text-lg" />
              <blockquote className="mt-3 line-clamp-6 flex-1 text-[15px] leading-relaxed">“{r.text}”</blockquote>
              {r.link && (
                <a href={r.link} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-brand-greenDark hover:underline">
                  Read on Google →
                </a>
              )}
            </figure>
          ))}
        </div>
        {many && (
          <div className="mt-5 flex justify-center gap-2 lg:justify-end">
            <button type="button" onClick={() => scroll(-1)} aria-label="Previous reviews" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:border-brand-green hover:text-brand-green">←</button>
            <button type="button" onClick={() => scroll(1)} aria-label="More reviews" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:border-brand-green hover:text-brand-green">→</button>
          </div>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted lg:justify-start">
        Reviews from <a href={data.mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Google</a>
      </p>
    </div>
  );
}
