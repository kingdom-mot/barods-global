import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <div className="container-site max-w-3xl py-14">
      <h1 className="section-title">Terms of Use</h1>
      <p className="mt-4 text-muted">[Barods Global to supply the terms of use text — editable from the admin portal.]</p>
    </div>
  );
}
