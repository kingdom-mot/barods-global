'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BARODS_DOMAIN, createClient } from '@/lib/supabase/browser';

export default function ForgotPasswordPage() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get('email')).trim().toLowerCase();
    if (!email.endsWith(BARODS_DOMAIN)) {
      setError(`Use your Barods email address (ending ${BARODS_DOMAIN}).`);
      return;
    }
    setState('sending');
    // Same message whether or not the account exists, so this page can't be used to find staff emails.
    await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/portal/set-password`,
    });
    setState('sent');
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper px-4 py-14">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center font-display text-3xl">Reset your password</h1>
        {state === 'sent' ? (
          <p className="mt-4 rounded-lg bg-brand-greenLight p-4 text-sm text-brand-greenDark" role="status">
            If that address has a Barods account, a reset link is on its way. Check your inbox (and spam) in the next few minutes.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <p className="text-center text-sm text-muted">Enter your Barods email and we’ll send you a link to choose a new password.</p>
            <label className="label">
              Barods email
              <input name="email" type="email" placeholder="name@barodsglobal.com" className="field" autoComplete="username" required />
            </label>
            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
            <button type="submit" className="btn-green" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send reset link'}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm"><Link href="/login" className="text-brand-greenDark hover:underline">← Back to sign in</Link></p>
      </div>
    </div>
  );
}
