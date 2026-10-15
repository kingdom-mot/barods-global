'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { setPassword } from '../actions';

/** Reached from the invite email (first password) or the reset email, or from the menu. */
export default function SetPasswordPage() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 font-display text-4xl">Set your password</h1>
      <p className="mb-6 text-sm text-muted">At least 8 characters. Use something you don’t use on other sites.</p>
      <form
        className="space-y-4 rounded-xl bg-white p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const p1 = String(f.get('p1'));
          if (p1 !== String(f.get('p2'))) return setMsg({ ok: false, text: 'The two passwords don’t match.' });
          start(async () => {
            const r = await setPassword(p1);
            setMsg(r.ok ? { ok: true, text: 'Password saved.' } : { ok: false, text: r.error });
          });
        }}
      >
        <label className="label">New password<input name="p1" type="password" minLength={8} className="field" autoComplete="new-password" required /></label>
        <label className="label">Type it again<input name="p2" type="password" minLength={8} className="field" autoComplete="new-password" required /></label>
        {msg && <p className={`rounded-lg p-3 text-sm ${msg.ok ? 'bg-brand-greenLight text-brand-greenDark' : 'bg-red-50 text-red-800'}`} role="status">{msg.text}</p>}
        <button type="submit" className="btn-green w-full" disabled={pending}>{pending ? 'Saving…' : 'Save password'}</button>
        {msg?.ok && <Link href="/portal" className="btn-outline w-full">Go to my dashboard</Link>}
      </form>
    </div>
  );
}
