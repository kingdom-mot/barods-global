'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { inviteAgentCard, inviteMember, removeMember, resendAccess, setRole, setSuspended, setVerified } from '@/app/portal/admin-actions';

type Msg = { ok: boolean; text: string } | null;

function Note({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return <p className={`mt-2 rounded-md px-3 py-2 text-xs ${msg.ok ? 'bg-brand-greenLight text-brand-greenDark' : 'bg-red-50 text-red-800'}`} role="status">{msg.text}</p>;
}

export function InviteForm() {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        start(async () => {
          const r = await inviteMember({
            fullName: String(f.get('fullName')),
            email: String(f.get('email')),
            role: f.get('role') === 'admin' ? 'admin' : 'agent',
            position: String(f.get('position') ?? ''),
          });
          setMsg(r.ok ? { ok: true, text: r.message ?? 'Invite sent.' } : { ok: false, text: r.error });
          if (r.ok) form.reset();
          router.refresh();
        });
      }}
    >
      <h2 className="font-semibold sm:col-span-2">Invite someone</h2>
      <label className="label">Full name<input name="fullName" className="field" required placeholder="e.g. Adaeze Okafor" /></label>
      <label className="label">Barods email<input name="email" type="email" className="field" required placeholder="name@barodsglobal.com" /></label>
      <label className="label">
        Role
        <select name="role" className="field" defaultValue="agent">
          <option value="agent">Agent: own listings and leads</option>
          <option value="admin">Admin: everything, including approvals</option>
        </select>
      </label>
      <label className="label">Position (optional)<input name="position" className="field" placeholder="Property Consultant" /></label>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-green px-6" disabled={pending}>{pending ? 'Sending invite…' : 'Send invite'}</button>
        <Note msg={msg} />
      </div>
    </form>
  );
}

export function MemberActions({
  profileId,
  agentId,
  role,
  suspended,
  signedIn,
  verified,
  isOwner,
  isMe,
}: {
  profileId: string;
  agentId: string | null;
  role: string;
  suspended: boolean;
  signedIn: boolean;
  verified: boolean;
  isOwner: boolean;
  isMe: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (r.message ? { ok: true, text: r.message } : null) : { ok: false, text: r.error ?? 'Something went wrong.' });
      router.refresh();
    });
  };
  const btn = 'rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand-green hover:text-brand-greenDark disabled:opacity-50';

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-2">
        {!signedIn && <button type="button" className={btn} disabled={pending} onClick={() => run(() => resendAccess(profileId, 'invite'))}>Resend invite</button>}
        {signedIn && <button type="button" className={btn} disabled={pending} onClick={() => run(() => resendAccess(profileId, 'recovery'))}>Send password reset</button>}
        {agentId && (
          <button type="button" className={btn} disabled={pending} onClick={() => run(() => setVerified(agentId, !verified))}>
            {verified ? 'Remove verified badge' : 'Mark verified'}
          </button>
        )}
        {!isOwner && !isMe && (
          <>
            <button type="button" className={btn} disabled={pending} onClick={() => run(() => setRole(profileId, role === 'admin' ? 'agent' : 'admin'))}>
              {role === 'admin' ? 'Make agent' : 'Make admin'}
            </button>
            <button
              type="button"
              className={btn}
              disabled={pending}
              onClick={() => run(() => setSuspended(profileId, !suspended), suspended ? undefined : 'Suspend this account? They won’t be able to sign in, and their card is hidden from the Agents page.')}
            >
              {suspended ? 'Reactivate' : 'Suspend'}
            </button>
            <button
              type="button"
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              disabled={pending}
              onClick={() => run(() => removeMember(profileId), 'Remove this person from the portal? This deletes their login. Their listings stay on the site for you to reassign.')}
            >
              Remove
            </button>
          </>
        )}
      </div>
      <Note msg={msg} />
    </div>
  );
}

export function InviteCardButton({ agentId, name }: { agentId: string; name: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        type="button"
        className="btn-green min-h-[36px] px-4 text-xs"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await inviteAgentCard(agentId);
            setMsg(r.ok ? { ok: true, text: r.message ?? `Invite sent to ${name}.` } : { ok: false, text: r.error });
            router.refresh();
          })
        }
      >
        {pending ? 'Sending…' : 'Send portal invite'}
      </button>
      <Note msg={msg} />
    </div>
  );
}
