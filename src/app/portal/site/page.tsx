import { KeyValueForm, LeadRecipientsForm, RatesPanel, SiteTabs } from '@/components/portal/SiteForms';
import { DEFAULTS } from '@/lib/settings';
import { createClient, requirePerm } from '@/lib/supabase/server';

export const metadata = { title: 'Website settings' };

export default async function SiteSettingsPage() {
  const me = await requirePerm('website');
  const supabase = createClient();
  const [{ data: rows }, { data: rates }] = await Promise.all([
    supabase.from('site_settings').select('key, value'),
    supabase.from('currency_rates').select('currency, per_ngn, updated_at').order('currency'),
  ]);
  const s = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value])) as Record<string, Record<string, unknown>>;
  const contact = { ...DEFAULTS.contact, ...(s.contact ?? {}) };
  const hero = { ...DEFAULTS.hero, ...(s.hero ?? {}) };
  const mortgage = { ...DEFAULTS.mortgage, ...(s.mortgage ?? {}) };
  const recipients = Array.isArray(s.lead_recipients) ? (s.lead_recipients as unknown as string[]) : [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 font-display text-4xl">Website</h1>
      <p className="mb-6 text-sm text-muted">Change what visitors see. Saved changes appear on the site straight away.</p>
      <SiteTabs />
      <div className="space-y-6">
        <KeyValueForm
          settingKey="hero"
          title="Homepage banner"
          hint="The big picture and welcome text at the top of the homepage."
          userId={me.id}
          initial={hero}
          fields={[
            { key: 'image', label: 'Background photo', type: 'image' },
            { key: 'eyebrow', label: 'Small line above the headline' },
            { key: 'title', label: 'Headline' },
            { key: 'subtitle', label: 'Welcome text', type: 'textarea' },
          ]}
        />
        <KeyValueForm
          settingKey="contact"
          title="Contact details"
          hint="Shown in the footer, on Contact Us, and used when a listing has no agent."
          initial={contact}
          fields={[
            { key: 'address', label: 'Office address', type: 'textarea' },
            { key: 'phone', label: 'Phone' },
            { key: 'whatsapp', label: 'WhatsApp number', hint: 'Include the country code, e.g. +234…' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'tagline', label: 'Footer tagline', type: 'textarea' },
          ]}
        />
        <KeyValueForm
          settingKey="socials"
          title="Social media links"
          hint="Leave blank to hide. Shown in the footer."
          initial={{ ...DEFAULTS.socials, ...(s.socials ?? {}) }}
          fields={['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok'].map((k) => ({ key: k, label: k === 'x' ? 'X (Twitter)' : k[0].toUpperCase() + k.slice(1), type: 'url' as const }))}
        />
        <LeadRecipientsForm initial={recipients} />
        <KeyValueForm
          settingKey="mortgage"
          title="Mortgage calculator rates"
          hint={`Starting figures in the calculator on every listing for sale. Last reviewed ${mortgage.reviewed}.`}
          initial={mortgage}
          fields={[
            { key: 'ng_commercial_rate', label: 'Nigeria: commercial rate (%)', type: 'number', step: '0.25' },
            { key: 'ng_commercial_min_deposit', label: 'Nigeria: minimum deposit (%)', type: 'number' },
            { key: 'ng_commercial_max_term', label: 'Nigeria: longest term (years)', type: 'number' },
            { key: 'nhf_rate', label: 'NHF rate (%)', type: 'number', step: '0.25' },
            { key: 'nhf_max_loan', label: 'NHF maximum loan (₦)', type: 'number' },
            { key: 'nhf_max_term', label: 'NHF longest term (years)', type: 'number' },
            { key: 'za_prime_rate', label: 'South Africa: prime rate (%)', type: 'number', step: '0.25' },
          ]}
        />
        <RatesPanel rows={(rates ?? []).map((r) => ({ ...r, per_ngn: Number(r.per_ngn) }))} />
      </div>
    </div>
  );
}
