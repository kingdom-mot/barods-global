'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { readConsent } from './CookieConsent';

const KEY = 'barods_visitor_prompt';
const ASK_AGAIN_DAYS = 30;

/** Remembered in the browser only if cookies were accepted; otherwise just for this visit. */
function store(): Storage | null {
  try {
    return readConsent() === 'accepted' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function alreadyHandled() {
  try {
    const v = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);
    if (!v) return false;
    const [state, at] = v.split(':');
    if (state === 'joined') return true;
    return Date.now() - Number(at) < ASK_AGAIN_DAYS * 864e5;
  } catch {
    return true; // storage blocked: don't nag
  }
}

/**
 * A small "Stay updated" card: name and email so Barods can follow up with new listings.
 * Appears once per visitor, after they've browsed for a while (25s or half-way down a page),
 * never before the cookie choice and never on the sign-in or portal pages.
 */
export default function VisitorCapture() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const armed = useRef(false);

  useEffect(() => {
    if (pathname.startsWith('/login') || pathname.startsWith('/portal')) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const arm = () => {
      if (armed.current || !readConsent() || alreadyHandled()) return;
      armed.current = true;
      const show = () => {
        if (!alreadyHandled()) setOpen(true);
        window.removeEventListener('scroll', onScroll);
        clearTimeout(timer);
      };
      const onScroll = () => {
        const h = document.documentElement;
        if (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) > 0.5) show();
      };
      timer = setTimeout(show, 25_000);
      window.addEventListener('scroll', onScroll, { passive: true });
    };

    arm();
    window.addEventListener('barods:consent', arm);
    return () => {
      window.removeEventListener('barods:consent', arm);
      clearTimeout(timer);
    };
  }, [pathname]);

  function close(joined = false) {
    store()?.setItem(KEY, `${joined ? 'joined' : 'dismissed'}:${Date.now()}`);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    setState('sending');
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'visitor_signup', name: f.get('name'), email: f.get('email'), consent: f.get('consent') === 'on', page: pathname }),
    });
    if (res.ok) {
      setState('done');
      store()?.setItem(KEY, `joined:${Date.now()}`);
      setTimeout(() => setOpen(false), 2500);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Something went wrong. Please try again.');
      setState('error');
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-ink/50 p-3 sm:items-center" onClick={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-labelledby="vc-title" className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button type="button" onClick={() => close()} aria-label="Close" className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-2xl text-muted hover:bg-paper hover:text-brand-ink">
          ×
        </button>
        <div className="bg-brand-greenLight px-6 pb-4 pt-6">
          <img src="/brand/icon.png" alt="" className="mb-3 h-10 w-10" />
          <h2 id="vc-title" className="font-display text-3xl leading-tight">Stay ahead of the market</h2>
          <p className="mt-1 text-sm text-muted">Get new listings and investment tips from Barods Global before anyone else.</p>
        </div>
        {state === 'done' ? (
          <p className="p-6 text-sm font-semibold text-brand-greenDark" role="status">Thank you! We’ll be in touch with properties that match what you’re looking for.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3 p-6">
            <label className="label">Your name<input name="name" className="field" autoComplete="name" required maxLength={120} /></label>
            <label className="label">Email address<input name="email" type="email" className="field" autoComplete="email" required maxLength={160} /></label>
            <label className="flex items-start gap-2 text-xs text-muted">
              <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand-green" />
              <span>
                I agree that Barods Global may contact me by email about properties and services. I can unsubscribe at any time. See our{' '}
                <Link href="/privacy" className="underline">privacy policy</Link>.
              </span>
            </label>
            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
            <button type="submit" className="btn-green w-full" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Keep me updated'}</button>
            <button type="button" onClick={() => close()} className="w-full text-center text-sm text-muted hover:text-brand-ink">No thanks</button>
          </form>
        )}
      </div>
    </div>
  );
}
