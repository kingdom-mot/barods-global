'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { reviewListing } from '@/app/portal/actions';

export default function ReviewButtons({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const act = (d: 'approve' | 'send_back') =>
    start(async () => {
      setMsg(null);
      try {
        const r = await reviewListing(id, d, note);
        if (!r.ok) return setMsg({ ok: false, text: r.error });
        setMsg({ ok: true, text: r.message ?? 'Saved.' });
        // Leave the confirmation up for a moment before the listing drops off this page.
        setTimeout(() => router.refresh(), r.message && r.message.includes('Note:') ? 6000 : 1200);
      } catch {
        // Usually the portal was updated while this page was open: a refresh loads the new version.
        setMsg({ ok: false, text: 'Couldn’t reach the server. Refresh the page (the portal may have just been updated) and try again.' });
      }
    });

  return (
    <div className="flex flex-col gap-2 md:w-64">
      {asking ? (
        <>
          <label className="label" htmlFor={`note-${id}`}>What needs fixing?</label>
          <textarea id={`note-${id}`} className="field text-sm" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please add photos of the kitchen and confirm the title document." />
          <div className="flex gap-2">
            <button type="button" className="btn border border-red-300 text-red-800 hover:bg-red-50" disabled={pending} onClick={() => act('send_back')}>{pending ? 'Sending…' : 'Send back to agent'}</button>
            <button type="button" className="btn text-muted" onClick={() => setAsking(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-green px-6" disabled={pending || msg?.ok} onClick={() => act('approve')}>{pending ? 'Saving…' : 'Approve and publish'}</button>
          <button type="button" className="btn border border-line bg-white hover:border-red-300 hover:text-red-800" disabled={pending || msg?.ok} onClick={() => setAsking(true)}>Send back…</button>
        </div>
      )}
      {msg && (
        <p className={`rounded-md px-3 py-2 text-sm ${msg.ok ? 'bg-brand-greenLight text-brand-greenDark' : 'bg-red-50 text-red-800'}`} role="status">
          {msg.text}
        </p>
      )}
    </div>
  );
}
