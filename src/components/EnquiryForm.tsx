'use client';

import { useState } from 'react';

export default function EnquiryForm({
  propertyRef,
  agentSlug,
  source = 'property_enquiry',
  defaultMessage = '',
  allowViewing = false,
  askRole = false,
}: {
  propertyRef?: string;
  agentSlug?: string;
  source?: string;
  defaultMessage?: string;
  allowViewing?: boolean;
  askRole?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

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
    };
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setState(res.ok ? 'sent' : 'error');
  }

  if (state === 'sent') {
    return (
      <div className="rounded-lg bg-brand-greenLight p-4 text-sm text-brand-greenDark" role="status">
        Thank you — your message has been sent. We’ll get back to you shortly.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="label">Full name<input name="name" required className="field" autoComplete="name" /></label>
      <label className="label">Phone / WhatsApp<input name="phone" type="tel" required className="field" autoComplete="tel" /></label>
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
        Message
        <textarea name="message" rows={4} defaultValue={defaultMessage} className="field" />
      </label>
      {allowViewing && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="viewing" value="1" className="h-4 w-4 accent-brand-green" /> I’d like to book a viewing
        </label>
      )}
      <button type="submit" className="btn-green" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
      {state === 'error' && <p className="text-sm text-red-700" role="alert">Something went wrong. Please call us instead.</p>}
    </form>
  );
}
