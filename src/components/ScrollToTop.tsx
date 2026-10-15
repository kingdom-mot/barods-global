'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Every page opens at the top: on first load, on refresh, and on Back / Forward.
 * The browser's own "remember where I was" is switched off. Links to a #section still jump there.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    // Run once more after paint, in case the router restores a position afterwards.
    const id = requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior }));
    return () => cancelAnimationFrame(id);
  }, [pathname, searchParams]);

  return null;
}
