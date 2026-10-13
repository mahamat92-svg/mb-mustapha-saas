import type { MetadataRoute } from 'next';

// Manifest PWA généré dynamiquement : le nom de votre marque suit les variables
// d'environnement (NEXT_PUBLIC_BRAND_NAME, _BASELINE). Aucun fichier statique à éditer.
export default function manifest(): MetadataRoute.Manifest {
  const nom = process.env.NEXT_PUBLIC_BRAND_NAME || 'MB Mustapha';
  return {
    name: `${nom} — ${process.env.NEXT_PUBLIC_BRAND_BASELINE || 'Gestion, facturation et Mobile Money pour les PME d’Afrique'}`,
    short_name: nom,
    description:
      'Factures, recouvrement, tontines, stock, paie et automatisation Make.com. En FCFA, en français, même avec une connexion faible.',
    start_url: '/tableau-de-bord',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: process.env.NEXT_PUBLIC_BRAND_COLOR || '#1d4ed8',
    lang: 'fr',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
