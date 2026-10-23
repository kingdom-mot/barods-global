'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { sendInviteEmail, sendNotice, SITE } from '@/lib/email';
import { adminClient } from '@/lib/supabase/admin';
import { isPermKey, PERMISSIONS, type PermKey } from '@/lib/permissions';
import { createClient, requirePerm, requireStaff, requireUser } from '@/lib/supabase/server';

type Result = { ok: true; message?: string } | { ok: false; error: string };
const DOMAIN = '@barodsglobal.com';

function siteOrigin() {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barodsglobal.com');
}

async function log(action: string, entity: string, entityId: string) {
  const me = await requireUser();
  await createClient().from('activity_log').insert({ actor: me.id, action, entity, entity_id: entityId });
}

/** Emailed sign-in link: invite (new account) or recovery (set a new password). */
async function sendAccessLink(kind: 'invite' | 'recovery', email: string, fullName: string, invitedBy: string): Promise<Result> {
  const admin = adminClient();
  const redirectTo = `${siteOrigin()}/login`;

  // Without Resend, fall back to Supabase's own email (limited to a few an hour).
  if (!process.env.RESEND_API_KEY) {
    const { error } =
      kind === 'invite'
        ? await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName }, redirectTo })
        : await admin.auth.resetPasswordForEmail(email, { redirectTo });
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { data, error } = await admin.auth.admin.generateLink(
    kind === 'invite' ? { type: 'invite', email, options: { data: { full_name: fullName }, redirectTo } } : { type: 'recovery', email, options: { redirectTo } },
  );
  if (error || !data?.properties?.action_link) return { ok: false, error: error?.message ?? 'Couldn’t create the link.' };
  const sent = await sendInviteEmail({ to: email, name: fullName, link: data.properties.action_link, kind, invitedBy });
  return sent.sent ? { ok: true } : { ok: false, error: `Account ready, but the email didn’t send (${sent.reason}).` };
}

export async function inviteMember(input: { fullName: string; email: string; role: 'agent' | 'admin'; position: string }): Promise<Result> {
  const me = await requirePerm('team');
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  if (fullName.length < 3) return { ok: false, error: 'Enter their full name.' };
  if (!email.endsWith(DOMAIN) || !/^[^\s@]+@barodsglobal\.com$/.test(email)) return { ok: false, error: `Use their ${DOMAIN} email address.` };
  if (input.role === 'admin' && !me.isStaff) return { ok: false, error: 'Only admins can invite admins.' };

  const admin = adminClient();
  const { data: existing } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing) return { ok: false, error: 'This person already has an account. Use “Resend invite” or “Send password reset” on their row.' };

  const sent = await sendAccessLink('invite', email, fullName, me.agent?.fullName ?? me.fullName);
  if (!sent.ok && !sent.error.startsWith('Account ready')) return sent;

  // The sign-up trigger has created their profile and agent card; apply the role and position.
  const { data: profile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (profile) {
    if (input.role === 'admin') await admin.from('profiles').update({ role: 'admin' }).eq('id', profile.id);
    await admin.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
    if (input.position.trim()) await admin.from('agents').update({ position: input.position.trim().slice(0, 120) }).eq('profile_id', profile.id);
    await log(`invited ${input.role}`, 'profile', profile.id);
  }
  revalidatePath('/portal/team');
  return sent.ok ? { ok: true, message: `Invite sent to ${email}.` } : sent;
}

export async function resendAccess(profileId: string, kind: 'invite' | 'recovery'): Promise<Result> {
  const me = await requirePerm('team');
  const { data: p } = await adminClient().from('profiles').select('email, full_name, role').eq('id', profileId).maybeSingle();
  if (!p) return { ok: false, error: 'Account not found.' };
  if (p.role !== 'agent' && !me.isStaff) return { ok: false, error: 'Only admins can send links to admin accounts.' };
  const r = await sendAccessLink(kind, p.email, p.full_name, me.agent?.fullName ?? me.fullName);
  if (r.ok) await log(kind === 'invite' ? 'resent invite' : 'sent password reset', 'profile', profileId);
  return r.ok ? { ok: true, message: kind === 'invite' ? 'Invite sent again.' : 'Password reset link sent.' } : r;
}

/** Invite someone who already has a public agent card (e.g. imported from WordPress) but no login. */
export async function inviteAgentCard(agentId: string): Promise<Result> {
  const { data: a } = await adminClient().from('agents').select('full_name, email, position').eq('id', agentId).maybeSingle();
  if (!a) return { ok: false, error: 'Agent not found.' };
  return inviteMember({ fullName: a.full_name, email: a.email, role: 'agent', position: a.position ?? '' });
}

async function guardTarget(profileId: string, meId: string): Promise<{ email: string; is_owner: boolean } | string> {
  const { data: p } = await adminClient().from('profiles').select('email, is_owner').eq('id', profileId).maybeSingle();
  if (!p) return 'Account not found.';
  if (p.is_owner) return 'The owner account can’t be changed or removed.';
  if (profileId === meId) return 'You can’t do this to your own account.';
  return p;
}

export async function setRole(profileId: string, role: 'agent' | 'admin'): Promise<Result> {
  const me = await requireStaff();
  const t = await guardTarget(profileId, me.id);
  if (typeof t === 'string') return { ok: false, error: t };
  const { error } = await adminClient().from('profiles').update({ role }).eq('id', profileId);
  if (error) return { ok: false, error: error.message };
  await log(`role changed to ${role}`, 'profile', profileId);
  revalidatePath('/portal/team');
  return { ok: true, message: role === 'admin' ? 'Now an admin.' : 'Now an agent.' };
}

export async function setSuspended(profileId: string, suspend: boolean): Promise<Result> {
  const me = await requireStaff();
  const t = await guardTarget(profileId, me.id);
  if (typeof t === 'string') return { ok: false, error: t };
  const admin = adminClient();
  // Block sign-in and hide their public card; their listings stay, ready to reassign.
  const { error } = await admin.auth.admin.updateUserById(profileId, { ban_duration: suspend ? '876000h' : 'none' });
  if (error) return { ok: false, error: error.message };
  await admin.from('agents').update({ status: suspend ? 'suspended' : 'active' }).eq('profile_id', profileId);
  await log(suspend ? 'suspended' : 'reactivated', 'profile', profileId);
  revalidatePath('/portal/team');
  return { ok: true, message: suspend ? 'Suspended: they can no longer sign in.' : 'Reactivated.' };
}

export async function removeMember(profileId: string): Promise<Result> {
  const me = await requireStaff();
  const t = await guardTarget(profileId, me.id);
  if (typeof t === 'string') return { ok: false, error: t };
  const admin = adminClient();
  // Hide the public card first; listings keep the card so nothing breaks, and can be reassigned.
  await admin.from('agents').update({ status: 'suspended' }).eq('profile_id', profileId);
  const { error } = await admin.auth.admin.deleteUser(profileId);
  if (error) return { ok: false, error: error.message };
  await log(`removed ${t.email}`, 'profile', profileId);
  revalidatePath('/portal/team');
  return { ok: true, message: 'Removed. Their listings are still on the site; reassign them from All listings.' };
}

export async function setVerified(agentId: string, verified: boolean): Promise<Result> {
  await requirePerm('team');
  const { error } = await adminClient().from('agents').update({ verified }).eq('id', agentId);
  if (error) return { ok: false, error: error.message };
  await log(verified ? 'verified agent' : 'unverified agent', 'agent', agentId);
  revalidatePath('/portal/team');
  return { ok: true };
}

/** Admin-only listing controls: featured, label, archive / restore. */
export async function setListingFlags(id: string, flags: { featured?: boolean; label?: string | null; archived?: boolean }): Promise<Result> {
  await requirePerm('listings');
  const update: Record<string, unknown> = {};
  if (flags.featured !== undefined) update.featured = flags.featured;
  if (flags.label !== undefined) update.label = flags.label || null;
  if (flags.archived !== undefined) {
    if (flags.archived) update.status = 'archived';
    else {
      // Restoring puts a listing back where it was: live if it had been published before, otherwise a draft.
      const { data: cur } = await createClient().from('properties').select('published_at').eq('id', id).maybeSingle();
      update.status = cur?.published_at ? 'published' : 'draft';
    }
  }
  const { error } = await createClient().from('properties').update(update).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await log(`listing ${Object.keys(flags).join(', ')} changed`, 'property', id);
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Admins choose what an agent can do beyond their own listings, leads and profile. */
export async function setPermissions(profileId: string, permissions: PermKey[]): Promise<Result> {
  const me = await requireStaff();
  const t = await guardTarget(profileId, me.id);
  if (typeof t === 'string') return { ok: false, error: t };
  const admin = adminClient();
  const { data: target } = await admin.from('profiles').select('role, full_name').eq('id', profileId).maybeSingle();
  if (target?.role !== 'agent') return { ok: false, error: 'Admins already have every permission.' };
  const clean = [...new Set(permissions.filter(isPermKey))];
  const { error } = await admin.from('profiles').update({ permissions: clean }).eq('id', profileId);
  if (error) return { ok: false, error: error.message.includes('permissions') ? 'Run the 0009_permissions.sql update in Supabase first.' : error.message };
  const names = clean.map((k) => PERMISSIONS.find((x) => x.key === k)?.label).join(', ');
  await log(clean.length ? `permissions set: ${names}` : 'permissions cleared', 'profile', profileId);
  revalidatePath('/portal', 'layout');
  return { ok: true, message: clean.length ? `Saved. ${target.full_name.split(' ')[0]} can now also: ${names}.` : 'Saved. Own listings, leads and profile only.' };
}

/** New agents appear on the website only once an admin approves their completed profile. */
export async function approveAgent(agentId: string): Promise<Result> {
  await requirePerm('team');
  const admin = adminClient();
  const { data: a } = await admin.from('agents').select('full_name, email, phone, photo_url, status, slug').eq('id', agentId).maybeSingle();
  if (!a) return { ok: false, error: 'Agent not found.' };
  if (a.status === 'suspended') return { ok: false, error: 'This agent is suspended. Reactivate them first.' };
  const { error } = await admin.from('agents').update({ status: 'active' }).eq('id', agentId);
  if (error) return { ok: false, error: error.message };
  await log(`approved agent ${a.full_name}`, 'agent', agentId);
  const first = a.full_name.replace(/^ESV\s+/, '').split(' ')[0];
  await Promise.race([
    sendNotice({
      to: [a.email],
      subject: 'Your Barods Global profile is live',
      heading: 'You’re on the website',
      lines: [`Hi ${first},`, 'Your agent profile has been approved and now appears on the Barods Global website. Your approved listings show on it too.'],
      button: { label: 'View my profile', href: `${SITE}/agent/${a.slug}` },
    }).catch(() => undefined),
    new Promise((r) => setTimeout(r, 6000)),
  ]);
  revalidatePath('/', 'layout');
  return { ok: true, message: `${a.full_name} is approved and now on the website.` };
}
