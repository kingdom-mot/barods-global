'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PasswordInput from '@/components/PasswordInput';
import { BARODS_DOMAIN, createClient } from '@/lib/supabase/browser';

export default function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    // Every sign-in starts on the dashboard, never on whatever page was open last.
    router.replace('/portal');
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
        <PasswordInput name="password" autoComplete="current-password" required />
      </label>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button type="submit" className="btn-green" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <Link href="/login/forgot" className="text-center text-sm text-brand-greenDark hover:underline">Forgot your password?</Link>
    </form>
  );
}
