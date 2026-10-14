import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getVisitorCurrency } from '@/lib/visitor';
import './globals.css';

const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' });

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
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <Header currency={currency} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
