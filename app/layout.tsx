import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.baseline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: [
    'logiciel de gestion PME Afrique',
    'facturation FCFA',
    'paie CNPS Cameroun',
    'paie CNSS Tchad Bénin Togo',
    'facture Mobile Money',
    'recouvrement impayés Afrique',
    'gestion tontine',
    'Airtel Money Tchad',
    'MTN MoMo Cameroun',
    'logiciel Tchad Cameroun Bénin Togo',
  ],
  authors: [{ name: BRAND.fondateur }],
  openGraph: {
    title: `${BRAND.name} — ${BRAND.baseline}`,
    description: BRAND.description,
    type: 'website',
    locale: 'fr_FR',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: BRAND.couleur,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
