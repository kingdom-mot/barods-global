'use client';

import { useEffect, useRef } from 'react';

/** Free Google reviews widget from Trustindex. Their script draws the reviews where this box sits. */
export default function TrustindexWidget({ id }: { id: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.innerHTML = '';
    const s = document.createElement('script');
    s.src = `https://cdn.trustindex.io/loader.js?${encodeURIComponent(id)}`;
    s.defer = true;
    s.async = true;
    el.appendChild(s);
    return () => {
      el.innerHTML = '';
    };
  }, [id]);
  return <div ref={box} className="min-h-[200px]" />;
}
