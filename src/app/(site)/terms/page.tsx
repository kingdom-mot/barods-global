import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { termsOfUse } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The rules for using the Barods Global Limited website, property listings, enquiry forms and agent portal.',
};

export default function TermsPage() {
  return <LegalPage doc={termsOfUse} />;
}
