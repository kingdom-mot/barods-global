'use client';

import { useCallback, useEffect, useState } from 'react';

function NoPhoto({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 bg-paper text-muted ${className}`}>
      <img src="/brand/icon.png" alt="" className="h-14 w-14 opacity-30" />
      <span className="text-sm font-semibold uppercase tracking-wide">Photos coming soon</span>
    </div>
  );
}

/** Houzez-style gallery: large photo + thumbnails, a Map tab, and a full-screen viewer. */
export default function PropertyGallery({ photos, title, mapQuery }: { photos: string[]; title: string; mapQuery: string }) {
  const [tab, setTab] = useState<'gallery' | 'map'>('gallery');
  const [open, setOpen] = useState<number | null>(null);
  const count = photos.length;

  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + count) % count)), [count]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, step]);

  const tabBtn = (t: 'gallery' | 'map', label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => setTab(t)}
      className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${tab === t ? 'bg-brand-green text-white' : 'bg-white text-brand-ink hover:text-brand-green'}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-3 flex gap-2" role="tablist" aria-label="Media">
        {tabBtn('gallery', count ? `Gallery (${count})` : 'Gallery')}
        {tabBtn('map', 'Map')}
      </div>

      {tab === 'gallery' ? (
        count > 1 ? (
          <div className="grid gap-2 sm:h-[480px] sm:grid-cols-4 sm:grid-rows-2">
            <button type="button" onClick={() => setOpen(0)} className="relative sm:col-span-3 sm:row-span-2">
              <img src={photos[0]} alt={title} className="aspect-[4/3] h-full w-full rounded-xl object-cover sm:aspect-auto" />
            </button>
            {photos.slice(1, 3).map((src, i) => (
              <button key={src} type="button" onClick={() => setOpen(i + 1)} className="relative hidden sm:block">
                <img src={src} alt="" className="h-full w-full rounded-xl object-cover" />
                {i === 1 && count > 3 && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-brand-ink/60 text-lg font-semibold text-white">
                    +{count - 3} photos
                  </span>
                )}
              </button>
            ))}
            <button type="button" onClick={() => setOpen(0)} className="btn-outline bg-white sm:hidden">View all {count} photos</button>
          </div>
        ) : (
          count === 1 ? (
            <button type="button" onClick={() => setOpen(0)} className="block w-full">
              <img src={photos[0]} alt={title} className="aspect-[4/3] w-full rounded-xl object-cover sm:aspect-auto sm:h-[480px]" />
            </button>
          ) : (
            <NoPhoto className="aspect-[4/3] w-full rounded-xl sm:aspect-auto sm:h-[480px]" />
          )
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <iframe
            title={`Map of ${mapQuery}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
            className="h-[360px] w-full sm:h-[480px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {open !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label={`${title} photos`}>
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm">{open + 1} / {count}</span>
            <button type="button" onClick={() => setOpen(null)} className="h-11 w-11 rounded-full text-2xl hover:bg-white/10" aria-label="Close">×</button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            <img src={photos[open]} alt={`${title}, photo ${open + 1}`} className="max-h-full max-w-full object-contain" />
            {count > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} className="absolute left-3 h-12 w-12 rounded-full bg-white/10 text-2xl text-white hover:bg-brand-green" aria-label="Previous photo">‹</button>
                <button type="button" onClick={() => step(1)} className="absolute right-3 h-12 w-12 rounded-full bg-white/10 text-2xl text-white hover:bg-brand-green" aria-label="Next photo">›</button>
              </>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto p-4">
            {photos.map((src, i) => (
              <button key={src} type="button" onClick={() => setOpen(i)} className={`shrink-0 overflow-hidden rounded-md border-2 ${i === open ? 'border-brand-green' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={src} alt="" className="h-16 w-24 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
