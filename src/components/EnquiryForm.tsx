'use client';

import { useState } from 'react';
import { HoneyPot, useFormTimer } from './spam';

export default function EnquiryForm({
  propertyRef,
  agentSlug,
  source = 'property_enquiry',
  defaultMessage = '',
  allowViewing = false,
  askRole = false,
  submitLabel = 'Send enquiry',
}: {
  propertyRef?: string;
  agentSlug?: string;
  source?: string;
  defaultMessage?: string;
  allowViewing?: boolean;
  askRole?: boolean;
  submitLabel?: string;
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const elapsed = useFormTimer();
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get('name'),
      phone: form.get('phone'),
      email: form.get('email'),
      message: form.get('message'),
      role: form.get('role'),
      source: form.get('viewing') ? 'viewing_request' : source,
      propertyRef,
      agentSlug,
      hp: form.get('hp'),
      t: elapsed(),
    };
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? '');
    setState(res.ok ? 'sent' : 'error');
  }

  if (state === 'sent') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-brand-greenLight p-6 text-center" role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-greenDark">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <p className="text-lg font-semibold text-brand-greenDark">Thank you, your message has been sent.</p>
        <p className="text-sm text-brand-ink/80">A Barods agent will get back to you within 24 hours, usually much sooner. For anything urgent, call or WhatsApp us.</p>
        <button type="button" onClick={() => setState('idle')} className="text-sm font-semibold text-brand-greenDark underline">Send another message</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative flex flex-col gap-3">
      <HoneyPot />
      <label className="label"><span>Full name <span className="text-brand-orange" aria-hidden="true">*</span></span><input name="name" required aria-required="true" className="field" autoComplete="name" /></label>
      <label className="label"><span>Phone / WhatsApp <span className="text-brand-orange" aria-hidden="true">*</span></span><input name="phone" type="tel" required aria-required="true" className="field" autoComplete="tel" /></label>
      <label className="label">Email (optional)<input name="email" type="email" className="field" autoComplete="email" /></label>
      {askRole && (
        <label className="label">
          I’m a
          <select name="role" className="field" defaultValue="Buyer">
            {['Buyer', 'Tenant', 'Investor', 'Agent', 'Other'].map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
      )}
      <label className="label">
        Message (optional)
        <textarea name="message" rows={defaultMessage ? 9 : 4} defaultValue={defaultMessage} className="field" />
      </label>
      {allowViewing && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="viewing" value="1" className="h-4 w-4 accent-brand-green" /> I’d like to book a viewing
        </label>
      )}
      <p className="-mt-1 text-xs text-muted"><span className="text-brand-orange">*</span> Required</p>
      <button type="submit" className="btn-green" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : submitLabel}
      </button>
      {state === 'error' && <p className="text-sm text-red-700" role="alert">{error || 'Something went wrong. Please call us instead.'}</p>}
    </form>
  );
}
