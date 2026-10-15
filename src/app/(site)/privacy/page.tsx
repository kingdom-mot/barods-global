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
    </div>
  );
}
