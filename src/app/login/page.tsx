import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Agent and Staff Sign In', robots: { index: false } };

// Sign-in UI. Supabase Auth is wired in with the agent and admin portals (next phase).
export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper px-4 py-14">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
        <img src="/brand/logo.png" alt="Barods Global Limited" className="mx-auto mb-6 h-16 w-auto" />
        <h1 className="mb-1 text-center font-display text-3xl">Sign in</h1>
        <p className="mb-6 text-center text-sm text-muted">For Barods agents and staff · @barodsglobal.com accounts only</p>
        <form className="flex flex-col gap-4">
          <label className="label">Barods email<input type="email" placeholder="name@barodsglobal.com" className="field" required /></label>
          <label className="label">Password<input type="password" className="field" required /></label>
          <button type="submit" className="btn-green" disabled>Sign in (coming next)</button>
        </form>
        <p className="mt-6 text-center text-sm"><Link href="/" className="text-brand-greenDark hover:underline">← Back to barodsglobal.com</Link></p>
      </div>
    </div>
  );
}
