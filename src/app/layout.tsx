import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import { Suspense } from 'react';
import Header from '@/components/Header';
import ScrollToTop from '@/components/ScrollToTop';
import Footer from '@/components/Footer';
import { getVisitorCurrency } from '@/lib/visitor';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://barodsglobal.com'),
  title: { default: 'Barods Global Limited — Real Estate and Construction', template: '%s | Barods Global Limited' },
  description:
    'Buy, rent or shortlet property in Abeokuta, Lagos and across Nigeria with Barods Global Limited — your trusted partner in real estate and construction.',
  openGraph: { siteName: 'Barods Global Limited', type: 'website', locale: 'en_NG' },
  icons: { icon: '/brand/icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currency = getVisitorCurrency();
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <Header currency={currency} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
