'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export const CONSENT_COOKIE = 'cookie_consent';
export type Consent = 'accepted' | 'declined';

export function readConsent(): Consent | null {
  const m = document.cookie.match(/(?:^|;\s*)cookie_consent=(accepted|declined)/);
  return (m?.[1] as Consent) ?? null;
}

/**
 * Cookie notice with Accept / Decline. The choice is remembered for a year.
 * Declining keeps only what the site needs to work (sign-in for staff, the chosen currency);
 * analytics and follow-up reminders are only used after "Accept".
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!readConsent()) setShow(true);
  }, []);

  function choose(choice: Consent) {
    document.cookie = `${CONSENT_COOKIE}=${choice}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setShow(false);
    window.dispatchEvent(new CustomEvent('barods:consent', { detail: choice }));
  }

  if (!show) return null;
  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie preferences" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-2xl sm:flex-row sm:items-center">
        <div className="flex-1 text-sm text-brand-ink">
          <p className="mb-1 font-semibold">We value your privacy</p>
          <p className="text-muted">
            We use cookies to remember your currency, keep the site working and understand how it’s used, so we can show you better
            properties. You can accept or decline non-essential cookies.{' '}
            <Link href="/privacy" className="font-semibold text-brand-greenDark underline">Privacy policy</Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose('declined')} className="btn border border-line bg-white px-5 hover:border-brand-ink">
            Decline
          </button>
          <button type="button" onClick={() => choose('accepted')} className="btn-green px-6">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
