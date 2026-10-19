/**
 * Lead emails, sent with Resend (resend.com). Needs RESEND_API_KEY in Vercel, and barodsglobal.com
 * verified in Resend so mail can come from leads@barodsglobal.com. Without a key nothing is sent,
 * but every lead is still saved and visible in the portal.
 */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const FALLBACK_LEAD_EMAIL = process.env.LEAD_FALLBACK_EMAIL ?? 'support@barodsglobal.com';
const FROM = process.env.LEAD_FROM_EMAIL ?? 'Barods Global Website <leads@barodsglobal.com>';
// Links in emails point at wherever the site is live: the Vercel address now, barodsglobal.com after the move.
export const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://barodsglobal.com')
).replace(/\/$/, '');

/** Copies, without repeating the main recipient or each other. */
function ccList(to: string, cc: string[] = []) {
  return [...new Set(cc.map((e) => e.trim().toLowerCase()).filter((e) => e && e !== to.toLowerCase()))];
}

/** Simple branded notice (listing submitted, approved, sent back…). */
export async function sendNotice(n: { to: string[]; subject: string; heading: string; lines: string[]; button?: { label: string; href: string } }): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  const to = [...new Set(n.to.filter(Boolean).map((e) => e.toLowerCase()))];
  if (!key || !to.length) return { sent: false, reason: key ? 'no recipients' : 'RESEND_API_KEY not set' };
  const html = `<!doctype html><html><body style="margin:0;background:#F6F7F5;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#231F20;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;font-weight:bold">Barods Global · ${esc(n.heading)}</div>
    <div style="background:#fff;padding:22px;border-radius:0 0 10px 10px;border:1px solid #E3E6EA;border-top:0;color:#231F20;font-size:15px;line-height:1.55">
      ${n.lines.map((l) => `<p style="margin:0 0 12px">${esc(l)}</p>`).join('')}
      ${n.button ? `<p style="margin:18px 0 0"><a href="${esc(n.button.href)}" style="display:inline-block;background:#56B91E;color:#fff;padding:11px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${esc(n.button.label)}</a></p>` : ''}
    </div>
  </div></body></html>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM.replace('Website', 'Portal'), to, subject: n.subject, html, text: [...n.lines, n.button ? `${n.button.label}: ${n.button.href}` : ''].join('\n\n') }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? { sent: true } : { sent: false, reason: `Resend ${res.status}` };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export type LeadEmail = {
  to: string;
  cc?: string[];
  agentName?: string;
  visitor: { name: string; phone?: string | null; email?: string | null; message?: string | null };
  kind: string; // "Property enquiry", "Tour request", …
  property?: { title: string; ref: string; slug: string } | null;
  viewingAt?: string | null;
};

export async function sendLeadEmail(l: LeadEmail): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: 'RESEND_API_KEY not set' };

  const when = l.viewingAt
    ? new Date(l.viewingAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
    : null;
  const subject = `${l.kind}: ${l.property ? `${l.property.title} (${l.property.ref})` : l.visitor.name}`;
  const wa = l.visitor.phone ? l.visitor.phone.replace(/[^0-9]/g, '').replace(/^0/, '234') : '';
  const row = (k: string, v?: string | null) =>
    v ? `<tr><td style="padding:6px 12px 6px 0;color:#5B6168;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#231F20">${v}</td></tr>` : '';

  const html = `<!doctype html><html><body style="margin:0;background:#F6F7F5;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#231F20;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;font-weight:bold">Barods Global · New ${esc(l.kind.toLowerCase())}</div>
    <div style="background:#fff;padding:20px;border-radius:0 0 10px 10px;border:1px solid #E3E6EA;border-top:0">
      <p style="margin:0 0 14px;color:#231F20">Hello ${esc(l.agentName?.split(' ')[0] ?? 'team')}, someone has just contacted you from the website.</p>
      ${when ? `<p style="margin:0 0 14px;padding:10px 12px;background:#EEF8E7;color:#3D7F16;border-radius:8px;font-weight:bold">Tour requested for ${esc(when)}</p>` : ''}
      <table style="border-collapse:collapse;font-size:14px;width:100%">
        ${row('Name', esc(l.visitor.name))}
        ${row('Phone', l.visitor.phone ? `<a href="tel:${esc(l.visitor.phone)}" style="color:#3D7F16">${esc(l.visitor.phone)}</a>` : null)}
        ${row('Email', l.visitor.email ? `<a href="mailto:${esc(l.visitor.email)}" style="color:#3D7F16">${esc(l.visitor.email)}</a>` : null)}
        ${row('Listing', l.property ? `<a href="${SITE}/property/${esc(l.property.slug)}" style="color:#3D7F16">${esc(l.property.title)}</a> (${esc(l.property.ref)})` : null)}
        ${row('Message', l.visitor.message ? esc(l.visitor.message).replace(/\n/g, '<br>') : null)}
      </table>
      <p style="margin:18px 0 0">
        ${wa ? `<a href="https://wa.me/${wa}" style="display:inline-block;background:#1E7A4F;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:8px">WhatsApp ${esc(l.visitor.name.split(' ')[0])}</a>` : ''}
        <a href="${SITE}/portal/leads" style="display:inline-block;background:#56B91E;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Open in the portal</a>
      </p>
      <p style="margin:18px 0 0;font-size:12px;color:#5B6168">Reply to this email to answer ${esc(l.visitor.name.split(' ')[0])} directly.</p>
    </div>
  </div></body></html>`;

  const text = [
    `New ${l.kind.toLowerCase()} from barodsglobal.com`,
    when ? `Tour requested for ${when}` : '',
    `Name: ${l.visitor.name}`,
    l.visitor.phone ? `Phone: ${l.visitor.phone}` : '',
    l.visitor.email ? `Email: ${l.visitor.email}` : '',
    l.property ? `Listing: ${l.property.title} (${l.property.ref}) ${SITE}/property/${l.property.slug}` : '',
    l.visitor.message ? `Message: ${l.visitor.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [l.to],
        ...(ccList(l.to, l.cc).length ? { cc: ccList(l.to, l.cc) } : {}),
        subject,
        html,
        text,
        ...(l.visitor.email ? { reply_to: l.visitor.email } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { sent: false, reason: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/** Branded invite / password-reset email with a one-time sign-in link. */
export async function sendInviteEmail(i: { to: string; name: string; link: string; kind: 'invite' | 'recovery'; invitedBy: string }): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: 'RESEND_API_KEY not set' };
  const first = esc(i.name.split(' ')[0] ?? i.name);
  const invite = i.kind === 'invite';
  const subject = invite ? 'You’re invited to the Barods Global agent portal' : 'Set a new password for the Barods Global portal';
  const html = `<!doctype html><html><body style="margin:0;background:#F6F7F5;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#231F20;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;font-weight:bold">Barods Global · Agent portal</div>
    <div style="background:#fff;padding:24px;border-radius:0 0 10px 10px;border:1px solid #E3E6EA;border-top:0;color:#231F20;font-size:15px;line-height:1.5">
      <p style="margin:0 0 12px">Hello ${first},</p>
      ${
        invite
          ? `<p style="margin:0 0 12px">${esc(i.invitedBy)} has invited you to the Barods Global agent portal, where you can add listings, see your enquiries and update your profile.</p>`
          : `<p style="margin:0 0 12px">Use the button below to choose a new password for your Barods Global portal account.</p>`
      }
      <p style="margin:20px 0"><a href="${esc(i.link)}" style="display:inline-block;background:#56B91E;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold">${invite ? 'Accept invite and set password' : 'Set a new password'}</a></p>
      <p style="margin:0 0 12px;color:#5B6168;font-size:13px">The link works once and expires after an hour. If it has expired, ask an admin to send a new one.</p>
      <p style="margin:0;color:#5B6168;font-size:13px">Didn’t expect this email? You can ignore it.</p>
    </div>
  </div></body></html>`;
  const text = `${invite ? `${i.invitedBy} has invited you to the Barods Global agent portal.` : 'Set a new password for your Barods Global portal account.'}\n\n${i.link}\n\nThe link works once and expires after an hour.`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM.replace('Website', 'Portal'), to: [i.to], subject, html, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { sent: false, reason: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
