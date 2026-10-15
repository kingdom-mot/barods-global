'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { reviewListing } from '@/app/portal/actions';

export default function ReviewButtons({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const act = (d: 'approve' | 'send_back') =>
    start(async () => {
      await reviewListing(id, d, note);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-2">
      {asking ? (
        <>
          <label className="label" htmlFor={`note-${id}`}>What needs fixing?</label>
          <textarea id={`note-${id}`} className="field text-sm" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please add photos of the kitchen and confirm the title document." />
          <div className="flex gap-2">
            <button type="button" className="btn border border-red-300 text-red-800 hover:bg-red-50" disabled={pending} onClick={() => act('send_back')}>Send back to agent</button>
            <button type="button" className="btn text-muted" onClick={() => setAsking(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <button type="button" className="btn-green px-6" disabled={pending} onClick={() => act('approve')}>{pending ? 'Saving…' : 'Approve and publish'}</button>
          <button type="button" className="btn border border-line bg-white hover:border-red-300 hover:text-red-800" onClick={() => setAsking(true)}>Send back…</button>
        </div>
      )}
    </div>
  );
}
