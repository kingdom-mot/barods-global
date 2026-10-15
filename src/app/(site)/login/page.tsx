import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from '@/components/portal/LoginForm';

export const metadata: Metadata = { title: 'Agent and Staff Sign In', robots: { index: false } };

const NOTICES: Record<string, string> = {
  'link-expired': 'That link has expired or was already used. Ask for a new one below.',
  'no-profile': 'Your account isn’t set up yet. Ask a Barods admin to invite you.',
};

export default function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string; 'signed-out'?: string } }) {
  const next = searchParams.next?.startsWith('/portal') ? searchParams.next : '/portal';
  const notice = searchParams.error ? NOTICES[searchParams.error] : searchParams['signed-out'] ? 'You’ve signed out.' : undefined;
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper px-4 py-14">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
        <img src="/brand/logo.png" alt="Barods Global Limited" className="mx-auto mb-6 h-16 w-auto" />
        <h1 className="mb-1 text-center font-display text-3xl">Agent sign in</h1>
        <p className="mb-6 text-center text-sm text-muted">For Barods agents and staff · @barodsglobal.com accounts only</p>
        <LoginForm next={next} notice={notice} />
        <p className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
          Accounts are by invitation. Want to join the Barods team? <Link href="/contact-us" className="text-brand-greenDark hover:underline">Contact us</Link>.
        </p>
      </div>
    </div>
  );
}
