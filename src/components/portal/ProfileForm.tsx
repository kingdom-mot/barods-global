'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateProfile } from '@/app/portal/actions';
import { createClient } from '@/lib/supabase/browser';

type Initial = { fullName: string; position: string; phone: string; whatsapp: string; bio: string; photoUrl: string | null };

export default function ProfileForm({ userId, initial }: { userId: string; initial: Initial }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const set = (k: keyof Initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  async function onPhoto(file?: File) {
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `${userId}/profile-${Date.now()}.${file.type === 'image/png' ? 'png' : 'jpg'}`;
    const { error } = await supabase.storage.from('listing-photos').upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return setMsg({ ok: false, text: 'Couldn’t upload that photo. Use a JPG or PNG under 10MB.' });
    setV({ ...v, photoUrl: supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl });
  }

  return (
    <form
      className="space-y-5 rounded-xl bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfile(v);
          setMsg(r.ok ? { ok: true, text: r.activated ? 'Saved. Your card is now live on the Agents page.' : 'Saved.' } : { ok: false, text: r.error });
          router.refresh();
        });
      }}
    >
      <div className="flex items-center gap-5">
        {v.photoUrl ? (
          <img src={v.photoUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-paper text-xs text-muted">No photo</div>
        )}
        <label className="btn-outline cursor-pointer">
          {uploading ? 'Uploading…' : v.photoUrl ? 'Change photo' : 'Add photo'}
          <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="label">Full name<input className="field" value={v.fullName} onChange={set('fullName')} required /></label>
        <label className="label">Position<input className="field" value={v.position} onChange={set('position')} placeholder="Property Consultant" /></label>
        <label className="label">Phone<input className="field" type="tel" value={v.phone} onChange={set('phone')} placeholder="0803 000 0000" required /></label>
        <label className="label">WhatsApp number<input className="field" type="tel" value={v.whatsapp} onChange={set('whatsapp')} placeholder="Same as phone if blank" /></label>
      </div>
      <label className="label">Short bio<textarea className="field" rows={4} value={v.bio} onChange={set('bio')} placeholder="The areas you cover and how you help buyers and tenants." maxLength={1200} /></label>
      {msg && <p className={`rounded-lg p-3 text-sm ${msg.ok ? 'bg-brand-greenLight text-brand-greenDark' : 'bg-red-50 text-red-800'}`} role="status">{msg.text}</p>}
      <button type="submit" className="btn-green px-8" disabled={pending || uploading}>{pending ? 'Saving…' : 'Save profile'}</button>
    </form>
  );
}
