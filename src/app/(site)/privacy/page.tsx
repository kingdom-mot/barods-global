import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { privacyPolicy } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Barods Global Limited collects, uses, protects and manages personal information, in line with the Nigeria Data Protection Act 2023.',
};

export default function PrivacyPage() {
  return <LegalPage doc={privacyPolicy} />;
}
