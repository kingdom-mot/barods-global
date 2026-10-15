import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="container-site max-w-3xl py-14">
      <h1 className="section-title">Privacy Policy</h1>
      <p className="mt-4 text-muted">
        [Barods Global to supply the privacy policy — it should cover enquiry form data (name, phone, email) under the
        Nigeria Data Protection Act 2023. Editable from the admin portal.]
      </p>
      <h2 className="mt-10 text-xl font-semibold">Cookies on this website</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
        <li><strong className="text-brand-ink">cookie_consent</strong> remembers whether you accepted or declined cookies (1 year).</li>
        <li><strong className="text-brand-ink">currency</strong> remembers the currency prices are shown in (6 months).</li>
        <li>Sign-in cookies are used only by Barods agents and staff on the agent portal.</li>
        <li>If you accept cookies, we also remember whether you’ve already seen our “Stay updated” form, so we don’t ask again.</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Details you give us</h2>
      <p className="mt-3 text-muted">
        When you send an enquiry, book a tour or ask to be kept updated, we store the details you give us (such as your name, phone
        number and email) so the right Barods agent can respond. You can ask us to update or delete them at any time by emailing{' '}
        <a href="mailto:support@barodsglobal.com" className="text-brand-greenDark underline">support@barodsglobal.com</a>.
      </p>
    </div>
  );
}
