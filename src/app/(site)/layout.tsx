import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { getVisitorCurrency } from '@/lib/visitor';

/** Public website: header and footer around every page. The agent portal has its own layout. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header currency={getVisitorCurrency()} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
