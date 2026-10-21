'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/** Shown instead of a blank "Application error" page if something fails while a page loads. */
export default function ErrorScreen({ error, reset, home }: { error: Error & { digest?: string }; reset: () => void; home: { href: string; label: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-3xl">Something went wrong loading this page</h1>
      <p className="mt-3 text-muted">Please try again. If it keeps happening, let us know{error.digest ? ` and mention code ${error.digest}` : ''}.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-green">Try again</button>
        <Link href={home.href} className="btn-outline">{home.label}</Link>
      </div>
    </div>
  );
}
