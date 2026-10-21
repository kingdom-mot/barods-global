import { redirect } from 'next/navigation';
import ProfileForm from '@/components/portal/ProfileForm';
import { requireUser } from '@/lib/supabase/server';

export const metadata = { title: 'My profile' };

export default async function ProfilePage() {
  const me = await requireUser();
  if (!me.agent) redirect('/portal');
  const a = me.agent;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 font-display text-4xl">My profile</h1>
      <p className="mb-6 text-sm text-muted">
        This is your public card on the Agents page and on every listing you add. Signed in as {me.email}.
        {a.status === 'active' && <> <a href={`/agent/${a.slug}`} target="_blank" className="font-semibold text-brand-greenDark hover:underline">View my public page →</a></>}
      </p>
      <ProfileForm
        userId={me.id}
        initial={{ fullName: a.fullName, position: a.position ?? '', phone: a.phone ?? '', whatsapp: a.whatsapp ?? '', bio: a.bio ?? '', serviceAreas: a.serviceAreas ?? '', photoUrl: a.photoUrl }}
      />
    </div>
  );
}
