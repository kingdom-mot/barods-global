'use client';

import { useEffect, useState } from 'react';
import { HoneyPot, useFormTimer } from './spam';

const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

function label12(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/** Pick a day, a time and in-person or video; saved as a viewing request lead for the agent. */
export default function ScheduleTour({ propertyRef, agentSlug, title }: { propertyRef: string; agentSlug?: string; title: string }) {
  // Dates are worked out in the visitor's browser (their time zone), after the page loads.
  const [days, setDays] = useState<Date[]>([]);
  useEffect(() => {
    const out: Date[] = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 1; out.length < 14; i++) {
      const x = new Date(d);
      x.setDate(d.getDate() + i);
      if (x.getDay() !== 0) out.push(x); // no Sunday viewings
    }
    setDays(out);
  }, []);
  const [day, setDay] = useState(0);
  const [type, setType] = useState<'In person' | 'Video chat'>('In person');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const elapsed = useFormTimer();
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const f = new FormData(e.currentTarget);
    const time = String(f.get('time'));
    const date = days[day] ?? new Date();
    const [h, m] = time.split(':').map(Number);
    const when = new Date(date);
    when.setHours(h, m);
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: f.get('name'),
        phone: f.get('phone'),
        email: f.get('email'),
        message: f.get('message'),
        source: 'viewing_request',
        tourType: type,
        viewingAt: when.toISOString(),
        propertyRef,
        agentSlug,
        hp: f.get('hp'),
        t: elapsed(),
      }),
    });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? '');
    setState(res.ok ? 'sent' : 'error');
  }

  if (state === 'sent') {
    return (
      <div className="rounded-lg bg-brand-greenLight p-4 text-sm text-brand-greenDark" role="status">
        Tour request sent for {days[day]?.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}. The agent will call to confirm.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
      <HoneyPot />
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Tour type</legend>
        <div className="flex gap-2">
          {(['In person', 'Video chat'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={`min-h-[44px] rounded-md border px-4 text-sm font-semibold ${type === t ? 'border-brand-green bg-brand-green text-white' : 'border-line hover:border-brand-green hover:text-brand-green'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Choose a day</legend>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d, i) => (
            <button
              key={d.toISOString()}
              type="button"
              aria-pressed={day === i}
              onClick={() => setDay(i)}
              className={`flex w-16 shrink-0 flex-col items-center rounded-lg border py-2 ${day === i ? 'border-brand-green bg-brand-green text-white' : 'border-line hover:border-brand-green'}`}
            >
              <span className="text-[11px] uppercase">{d.toLocaleDateString('en-NG', { weekday: 'short' })}</span>
              <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
              <span className="text-[11px] uppercase">{d.toLocaleDateString('en-NG', { month: 'short' })}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label">
          Time
          <select name="time" className="field" defaultValue="10:00">
            {TIMES.map((t) => <option key={t} value={t}>{label12(t)}</option>)}
          </select>
        </label>
        <label className="label"><span>Full name <span className="text-brand-orange" aria-hidden="true">*</span></span><input name="name" required aria-required="true" className="field" autoComplete="name" /></label>
        <label className="label"><span>Phone / WhatsApp <span className="text-brand-orange" aria-hidden="true">*</span></span><input name="phone" type="tel" required aria-required="true" className="field" autoComplete="tel" /></label>
        <label className="label">Email (optional)<input name="email" type="email" className="field" autoComplete="email" /></label>
      </div>
      <label className="label">
        Message (optional)
        <textarea name="message" rows={3} className="field" defaultValue={`I'd like to tour ${title} (${propertyRef}).`} />
      </label>
      <button type="submit" className="btn-green w-full sm:w-auto" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Submit a tour request'}
      </button>
      {state === 'error' && <p className="text-sm text-red-700" role="alert">{error || 'Something went wrong. Please call the agent instead.'}</p>}
    </form>
  );
}
