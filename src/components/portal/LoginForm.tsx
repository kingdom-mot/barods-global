'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BARODS_DOMAIN, createClient } from '@/lib/supabase/browser';

export default function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')).trim().toLowerCase();
    if (!email.endsWith(BARODS_DOMAIN)) {
      setError(`Use your Barods email address (ending ${BARODS_DOMAIN}).`);
      return;
    }
    setBusy(true);
    const { error: err } = await createClient().auth.signInWithPassword({ email, password: String(f.get('password')) });
    setBusy(false);
    if (err) {
      setError(
        err.message.toLowerCase().includes('invalid')
          ? 'That email and password don’t match. Check them, or reset your password below.'
          : 'We couldn’t sign you in right now. Please try again.',
      );
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {notice && <p className="rounded-lg bg-brand-greenLight p-3 text-sm text-brand-greenDark" role="status">{notice}</p>}
      <label className="label">
        Barods email
        <input name="email" type="email" placeholder="name@barodsglobal.com" className="field" autoComplete="username" required />
      </label>
      <label className="label">
        Password
        <span className="relative">
          <input name="password" type={show ? 'text' : 'password'} className="field pr-16" autoComplete="current-password" required />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold normal-case tracking-normal text-brand-greenDark">
            {show ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button type="submit" className="btn-green" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <Link href="/login/forgot" className="text-center text-sm text-brand-greenDark hover:underline">Forgot your password?</Link>
    </form>
  );
}
