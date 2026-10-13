import type { NavItem } from '@/components/dashboard-shell';

/** Navigation de l'ESPACE PUBLIC (vos clients) */
export const NAV_CLIENT: NavItem[] = [
  { href: '/tableau-de-bord', label: 'Tableau de bord', icone: '📊' },
  { href: '/factures', label: 'Factures & reçus', icone: '🧾' },
  { href: '/clients', label: 'Clients', icone: '👥' },
  { href: '/stock', label: 'Stock & alertes', icone: '📦' },
  { href: '/tontines', label: 'Tontines & coopératives', icone: '🤝' },
  { href: '/scolarite', label: 'École (ScolaPay)', icone: '🎓' },
  { href: '/employes', label: 'Employés & pointage', icone: '🧑‍🏭' },
  { href: '/paie', label: 'Paie (CNPS/IRPP)', icone: '👷' },
  { href: '/messages', label: 'SMS & WhatsApp', icone: '💬' },
  { href: '/paiements', label: 'Mobile Money', icone: '📱' },
  { href: '/abonnement', label: 'Mon abonnement', icone: '💳' },
];

/** Navigation de l'ESPACE PRIVÉ (vous, l'éditeur) */
export const NAV_ADMIN: NavItem[] = [
  { href: '/admin', label: 'Pilotage', icone: '🎛️' },
  { href: '/admin/clients', label: 'Entreprises clientes', icone: '🏢' },
  { href: '/admin/revenus', label: 'Revenus (MRR / ARR)', icone: '📈' },
  { href: '/admin/make', label: 'Make.com & journal', icone: '⚙️' },
  { href: '/admin/parametres', label: 'Paramètres & clés', icone: '🔑' },
];
