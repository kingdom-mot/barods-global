'use client';

import { useState, useTransition } from 'react';
import { updateLead } from '@/app/portal/actions';
import { LEAD_STATUS } from '@/lib/leads';


export default function LeadRow({ id, status, note }: { id: string; status: string; note: string | null }) {
  const [s, setS] = useState(status);
  const [n, setN] = useState(note ?? '');
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const save = (nextStatus = s) =>
    start(async () => {
      await updateLead(id, nextStatus, n);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });

  return (
    <div className="flex flex-col gap-2 sm:w-64">
      <label className="sr-only" htmlFor={`ls-${id}`}>Lead status</label>
      <select
        id={`ls-${id}`}
        className="field h-10 py-1 text-sm"
        value={s}
        disabled={pending}
        onChange={(e) => {
          setS(e.target.value);
          save(e.target.value);
        }}
      >
        {LEAD_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <label className="sr-only" htmlFor={`ln-${id}`}>Private note</label>
      <textarea id={`ln-${id}`} className="field text-sm" rows={2} placeholder="Private note (only Barods sees this)" value={n} onChange={(e) => setN(e.target.value)} onBlur={() => n !== (note ?? '') && save()} />
      <span className="h-4 text-xs text-brand-greenDark" aria-live="polite">{pending ? 'Saving…' : saved ? 'Saved' : ''}</span>
    </div>
  );
}
