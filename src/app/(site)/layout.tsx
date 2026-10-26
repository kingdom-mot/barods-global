import CookieConsent from '@/components/CookieConsent';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import VisitorCapture from '@/components/VisitorCapture';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { waNumber } from '@/lib/phone';
import JsonLd from '@/components/JsonLd';
import { getContact, getSocials } from '@/lib/settings';
import { getVisitorCurrency } from '@/lib/visitor';

/** Public website: header and footer around every page. The agent portal has its own layout. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [contact, socials] = await Promise.all([getContact(), getSocials()]);
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          '@id': 'https://barodsglobal.com/#organization',
          name: 'Barods Global Limited',
          slogan: 'You Dream, We Build.',
          url: 'https://barodsglobal.com',
          logo: 'https://barodsglobal.com/brand/logo.png',
          image: 'https://barodsglobal.com/brand/logo.png',
          telephone: contact.phone,
          email: contact.email,
          address: { '@type': 'PostalAddress', streetAddress: 'Suite B104, Providence Mall, M.K.O. Abiola Way', addressLocality: 'Abeokuta', postalCode: '110118', addressRegion: 'Ogun State', addressCountry: 'NG' },
          hasMap: 'https://maps.google.com/?cid=3979199159802875239',
          areaServed: ['Abeokuta', 'Lagos', 'Ibadan', 'Nigeria', 'Johannesburg'],
          sameAs: Object.values(socials).filter(Boolean),
        }}
      />
      <Header currency={getVisitorCurrency()} phone={contact.phone} />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat number={waNumber(contact.whatsapp || contact.phone)} />
      <CookieConsent />
      <VisitorCapture />
    </>
  );
}
