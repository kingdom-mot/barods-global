import CookieConsent from '@/components/CookieConsent';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import VisitorCapture from '@/components/VisitorCapture';
import { getContact } from '@/lib/settings';
import { getVisitorCurrency } from '@/lib/visitor';

/** Public website: header and footer around every page. The agent portal has its own layout. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const contact = await getContact();
  return (
    <>
      <Header currency={getVisitorCurrency()} phone={contact.phone} />
      <main>{children}</main>
      <Footer />
      <CookieConsent />
      <VisitorCapture />
    </>
  );
}
