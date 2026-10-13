// =============================================================================
// MB Mustapha - DONNEES DE DEMONSTRATION
// Utilisees quand DATABASE_URL est vide (ou pour un demo devant un client).
// Remplacez-les par vos vraies donnees en branchant Postgres + `npm run db:seed`.
// =============================================================================

import type {
  ClientRec,
  InvoiceRec,
  MessageRec,
  Organization,
  PaymentRec,
  StockRec,
  SubscriptionRec,
  TontineRec,
  UserRec,
  WebhookLogRec,
} from './types';

const J = (jours: number) => new Date(Date.now() + jours * 86_400_000).toISOString();
const H = (heures: number) => new Date(Date.now() + heures * 3_600_000).toISOString();

export const DEMO_ORGS: Organization[] = [
  {
    id: 'org_ndjamena',
    name: 'N’Djaména Distribution SARL',
    country: 'TD',
    countryName: 'Tchad',
    city: 'N’Djaména',
    currency: 'XAF',
    plan: 'PRO',
    planStatus: 'ACTIF',
    phone: '+235 66 12 34 56',
    contactEmail: 'patron@ndjamena-distrib.td',
    mrr: 24900,
    createdAt: J(-420),
  },
  {
    id: 'org_douala',
    name: 'Douala Boutique Électronique',
    country: 'CM',
    countryName: 'Cameroun',
    city: 'Douala',
    currency: 'XAF',
    plan: 'BUSINESS',
    planStatus: 'ACTIF',
    phone: '+237 6 99 88 77 66',
    contactEmail: 'gestion@douala-elec.cm',
    mrr: 59900,
    createdAt: J(-310),
  },
  {
    id: 'org_cotonou',
    name: 'Cotonou Njangi & Tontines',
    country: 'BJ',
    countryName: 'Bénin',
    city: 'Cotonou',
    currency: 'XOF',
    plan: 'COOPERATIVE',
    planStatus: 'ACTIF',
    phone: '+229 97 45 12 30',
    contactEmail: 'president@njangi-cotonou.bj',
    mrr: 149000,
    createdAt: J(-540),
  },
  {
    id: 'org_lome',
    name: 'Lomé École Les Palmiers',
    country: 'TG',
    countryName: 'Togo',
    city: 'Lomé',
    currency: 'XOF',
    plan: 'STARTER',
    planStatus: 'ESSAI',
    phone: '+228 90 11 22 33',
    contactEmail: 'direction@palmeraies.tg',
    mrr: 9900,
    createdAt: J(-12),
  },
  {
    id: 'org_garoua',
    name: 'Garoua Transport Express',
    country: 'CM',
    countryName: 'Cameroun',
    city: 'Garoua',
    currency: 'XAF',
    plan: 'PRO',
    planStatus: 'EN_RETARD',
    phone: '+237 6 55 44 33 22',
    contactEmail: 'gerant@garoua-transport.cm',
    mrr: 24900,
    createdAt: J(-200),
  },
];

// Comptes de demonstration. En production, les mots de passe sont haches (bcrypt).
export const DEMO_USERS: UserRec[] = [
  {
    id: 'usr_owner',
    orgId: null,
    name: 'Le Patron (vous)',
    email: 'patron@mbmustapha.com',
    password: 'patron2026',
    phone: '+235 66 00 00 00',
    role: 'OWNER',
    createdAt: J(-600),
  },
  {
    id: 'usr_ndj',
    orgId: 'org_ndjamena',
    name: 'Abakar Mahamat',
    email: 'demo@mbmustapha.com',
    password: 'demo2026',
    phone: '+235 66 12 34 56',
    role: 'CLIENT_ADMIN',
    createdAt: J(-420),
  },
  {
    id: 'usr_dla',
    orgId: 'org_douala',
    name: 'Mme Ngo Bassa',
    email: 'douala@mbmustapha.com',
    password: 'demo2026',
    phone: '+237 6 99 88 77 66',
    role: 'CLIENT_ADMIN',
    createdAt: J(-310),
  },
  {
    id: 'usr_lome',
    orgId: 'org_lome',
    name: 'Directeur — École Les Palmiers',
    email: 'ecole@mbmustapha.com',
    password: 'demo2026',
    phone: '+228 90 11 22 33',
    role: 'CLIENT_ADMIN',
    createdAt: J(-12),
  },
  {
    id: 'usr_ctn',
    orgId: 'org_cotonou',
    name: 'Président Assogba',
    email: 'cotonou@mbmustapha.com',
    password: 'demo2026',
    phone: '+229 97 45 12 30',
    role: 'CLIENT_ADMIN',
    createdAt: J(-540),
  },
];

export const DEMO_CLIENTS: ClientRec[] = [
  { id: 'cl_1', orgId: 'org_ndjamena', name: 'Boutique Al-Nour', phone: '+235 63 44 12 00', email: 'alnour@mail.td', city: 'N’Djaména', type: 'ENTREPRISE', createdAt: J(-300) },
  { id: 'cl_2', orgId: 'org_ndjamena', name: 'Restaurant Le Tchadien', phone: '+235 99 21 55 40', email: '', city: 'N’Djaména', type: 'ENTREPRISE', createdAt: J(-260) },
  { id: 'cl_3', orgId: 'org_ndjamena', name: 'Hôtel Sahel', phone: '+235 66 78 90 12', email: 'reservation@sahel.td', city: 'Moundou', type: 'ENTREPRISE', createdAt: J(-190) },
  { id: 'cl_4', orgId: 'org_ndjamena', name: 'Mariam Djibrine', phone: '+235 62 11 88 99', email: '', city: 'N’Djaména', type: 'PARTICULIER', createdAt: J(-90) },
  { id: 'cl_5', orgId: 'org_douala', name: 'Supermarché Bonamoussadi', phone: '+237 6 77 12 34 56', email: 'achat@bona.cm', city: 'Douala', type: 'ENTREPRISE', createdAt: J(-280) },
  { id: 'cl_6', orgId: 'org_douala', name: 'Clinique La Grâce', phone: '+237 6 91 55 44 33', email: '', city: 'Douala', type: 'ENTREPRISE', createdAt: J(-150) },
  { id: 'cl_7', orgId: 'org_cotonou', name: 'Coopérative Dantokpa', phone: '+229 96 33 22 11', email: 'coord@dantokpa.bj', city: 'Cotonou', type: 'COOPERATIVE', createdAt: J(-520) },
  { id: 'cl_8', orgId: 'org_cotonou', name: 'Mme Adjoa Kossi', phone: '+229 95 77 66 55', email: '', city: 'Porto-Novo', type: 'PARTICULIER', createdAt: J(-120) },
  { id: 'cl_9', orgId: 'org_lome', name: 'Parent d’élève — Kodjo', phone: '+228 91 22 33 44', email: '', city: 'Lomé', type: 'PARTICULIER', createdAt: J(-10) },
  { id: 'cl_10', orgId: 'org_garoua', name: 'Transporteur Sahel Cargo', phone: '+237 6 55 11 22 33', email: '', city: 'Garoua', type: 'ENTREPRISE', createdAt: J(-180) },
];

type Seed = Partial<InvoiceRec> & { orgId: string; number: string; clientId: string; clientName: string; total: number };

const inv = (s: Seed): InvoiceRec => {
  const amount = s.amount ?? Math.round((s.total || 0) / 1.18);
  const vatRate = s.vatRate ?? 18;
  const total = s.total;
  const paid = s.paid ?? 0;
  return {
    id: `inv_${s.number.replace(/[^0-9]/g, '')}_${s.orgId.slice(-3)}`,
    orgId: s.orgId,
    number: s.number,
    clientId: s.clientId,
    clientName: s.clientName,
    label: s.label || 'Vente de marchandises',
    amount,
    vatRate,
    total,
    paid,
    status: s.status || (paid >= total ? 'PAYEE' : paid > 0 ? 'PARTIELLE' : 'ENVOYEE'),
    channel: s.channel || 'MANUEL',
    issueDate: s.issueDate || J(-30),
    dueDate: s.dueDate || J(-3),
    reminders: s.reminders ?? 0,
    lastRemind: s.lastRemind ?? null,
  };
};

export const DEMO_INVOICES: InvoiceRec[] = [
  inv({ orgId: 'org_ndjamena', number: 'FAC-2026-0001', clientId: 'cl_1', clientName: 'Boutique Al-Nour', label: 'Riz 50 sacs + huile 20 cartons', total: 2_950_000, paid: 2_950_000, status: 'PAYEE', issueDate: J(-120), dueDate: J(-90) }),
  inv({ orgId: 'org_ndjamena', number: 'FAC-2026-0002', clientId: 'cl_2', clientName: 'Restaurant Le Tchadien', label: 'Livraison sucre & lait', total: 780_000, paid: 200_000, status: 'PARTIELLE', issueDate: J(-45), dueDate: J(-15), reminders: 2, lastRemind: H(-20) }),
  inv({ orgId: 'org_ndjamena', number: 'FAC-2026-0003', clientId: 'cl_3', clientName: 'Hôtel Sahel', label: 'Équipement climatisation', total: 4_120_000, paid: 0, status: 'IMPAYEE', issueDate: J(-38), dueDate: J(-8), reminders: 3, lastRemind: H(-30) }),
  inv({ orgId: 'org_ndjamena', number: 'FAC-2026-0004', clientId: 'cl_4', clientName: 'Mariam Djibrine', label: 'Commande boutique détail', total: 145_000, paid: 0, status: 'IMPAYEE', issueDate: J(-22), dueDate: J(-2), reminders: 1, lastRemind: H(-48) }),
  inv({ orgId: 'org_ndjamena', number: 'FAC-2026-0005', clientId: 'cl_1', clientName: 'Boutique Al-Nour', label: 'Réassort boissons', total: 1_180_000, paid: 0, status: 'ENVOYEE', issueDate: J(-6), dueDate: J(9) }),
  inv({ orgId: 'org_ndjamena', number: 'FAC-2026-0006', clientId: 'cl_2', clientName: 'Restaurant Le Tchadien', label: 'Farine & condiments', total: 320_000, paid: 320_000, status: 'PAYEE', issueDate: J(-10), dueDate: J(-1) }),

  inv({ orgId: 'org_douala', number: 'FAC-2026-0101', clientId: 'cl_5', clientName: 'Supermarché Bonamoussadi', label: 'Téléviseurs 12 unités', total: 6_450_000, paid: 6_450_000, status: 'PAYEE', issueDate: J(-60), dueDate: J(-30) }),
  inv({ orgId: 'org_douala', number: 'FAC-2026-0102', clientId: 'cl_6', clientName: 'Clinique La Grâce', label: 'Tensiomètres & glucomètres', total: 1_890_000, paid: 900_000, status: 'PARTIELLE', issueDate: J(-40), dueDate: J(-10), reminders: 2 }),
  inv({ orgId: 'org_douala', number: 'FAC-2026-0103', clientId: 'cl_5', clientName: 'Supermarché Bonamoussadi', label: 'Ventilateurs & batteries', total: 3_120_000, paid: 0, status: 'IMPAYEE', issueDate: J(-35), dueDate: J(-5), reminders: 3 }),
  inv({ orgId: 'org_douala', number: 'FAC-2026-0104', clientId: 'cl_6', clientName: 'Clinique La Grâce', label: 'Ordinateurs portables 4', total: 2_240_000, paid: 0, status: 'ENVOYEE', issueDate: J(-4), dueDate: J(11) }),

  inv({ orgId: 'org_cotonou', number: 'FAC-2026-0201', clientId: 'cl_7', clientName: 'Coopérative Dantokpa', label: 'Cotisations membres — lot 3', total: 4_800_000, paid: 4_800_000, status: 'PAYEE', issueDate: J(-70), dueDate: J(-40) }),
  inv({ orgId: 'org_cotonou', number: 'FAC-2026-0202', clientId: 'cl_8', clientName: 'Mme Adjoa Kossi', label: 'Frais de gestion épargne', total: 250_000, paid: 100_000, status: 'PARTIELLE', issueDate: J(-28), dueDate: J(-7), reminders: 1 }),
  inv({ orgId: 'org_cotonou', number: 'FAC-2026-0203', clientId: 'cl_7', clientName: 'Coopérative Dantokpa', label: 'Cotisations membres — lot 4', total: 5_200_000, paid: 0, status: 'IMPAYEE', issueDate: J(-20), dueDate: J(-1), reminders: 2 }),

  inv({ orgId: 'org_lome', number: 'FAC-2026-0301', clientId: 'cl_9', clientName: 'Parent d’élève — Kodjo', label: 'Frais de scolarité 1er trimestre', total: 185_000, paid: 185_000, status: 'PAYEE', issueDate: J(-9), dueDate: J(-2) }),
  inv({ orgId: 'org_lome', number: 'FAC-2026-0302', clientId: 'cl_9', clientName: 'Parent d’élève — Kodjo', label: 'Frais de scolarité 2e trimestre', total: 185_000, paid: 0, status: 'ENVOYEE', issueDate: J(-3), dueDate: J(12) }),

  inv({ orgId: 'org_garoua', number: 'FAC-2026-0401', clientId: 'cl_10', clientName: 'Transporteur Sahel Cargo', label: '10 voyages Garoua–Ngaoundéré', total: 3_750_000, paid: 1_500_000, status: 'PARTIELLE', issueDate: J(-50), dueDate: J(-20), reminders: 4 }),
  inv({ orgId: 'org_garoua', number: 'FAC-2026-0402', clientId: 'cl_10', clientName: 'Transporteur Sahel Cargo', label: 'Carburant avancé', total: 980_000, paid: 0, status: 'IMPAYEE', issueDate: J(-25), dueDate: J(-5), reminders: 2 }),
];

export const DEMO_STOCK: StockRec[] = [
  { id: 'stk_1', orgId: 'org_ndjamena', sku: 'RIZ-50K', name: 'Riz parfumé 50 kg', qty: 42, unit: 'sac', price: 27_500, threshold: 15, supplier: 'Import Chinois N’Djaména' },
  { id: 'stk_2', orgId: 'org_ndjamena', sku: 'HUI-20L', name: 'Huile végétale 20 L', qty: 8, unit: 'bidon', price: 19_000, threshold: 12, supplier: 'SODECOTON' },
  { id: 'stk_3', orgId: 'org_ndjamena', sku: 'SUC-25K', name: 'Sucre en poudre 25 kg', qty: 3, unit: 'sac', price: 16_500, threshold: 10, supplier: 'CST Industries' },
  { id: 'stk_4', orgId: 'org_ndjamena', sku: 'THE-500', name: 'Thé vert 500 g (carton 20)', qty: 120, unit: 'carton', price: 8_400, threshold: 30, supplier: 'Grossiste Marché Central' },
  { id: 'stk_5', orgId: 'org_ndjamena', sku: 'LAI-24', name: 'Lait en poudre (carton 24)', qty: 5, unit: 'carton', price: 22_000, threshold: 8, supplier: 'Nestlé Cameroun' },

  { id: 'stk_6', orgId: 'org_douala', sku: 'TV-43', name: 'Téléviseur LED 43"', qty: 11, unit: 'pièce', price: 145_000, threshold: 4, supplier: 'Import Douala Port' },
  { id: 'stk_7', orgId: 'org_douala', sku: 'BAT-12V', name: 'Batterie solaire 12V 200Ah', qty: 2, unit: 'pièce', price: 380_000, threshold: 5, supplier: 'Solar Cameroon' },
  { id: 'stk_8', orgId: 'org_douala', sku: 'VENT-18', name: 'Ventilateur 18 pouces', qty: 34, unit: 'pièce', price: 27_500, threshold: 10, supplier: 'Bonaberi Import' },
  { id: 'stk_9', orgId: 'org_douala', sku: 'PC-HP15', name: 'PC portable HP 15', qty: 6, unit: 'pièce', price: 395_000, threshold: 3, supplier: 'Infotech Douala' },

  { id: 'stk_10', orgId: 'org_cotonou', sku: 'PAGNE-06', name: 'Pagne wax (lot 6)', qty: 210, unit: 'lot', price: 12_000, threshold: 50, supplier: 'Dantokpa textile' },
  { id: 'stk_11', orgId: 'org_cotonou', sku: 'NIM-25', name: 'Nimboire 25 kg', qty: 4, unit: 'sac', price: 21_000, threshold: 12, supplier: 'Marché Dantokpa' },

  { id: 'stk_12', orgId: 'org_lome', sku: 'CAH-96', name: 'Cahiers 96 pages (carton)', qty: 18, unit: 'carton', price: 6_500, threshold: 6, supplier: 'Papeterie Lomé' },
  { id: 'stk_13', orgId: 'org_garoua', sku: 'PNEU-315', name: 'Pneu camion 315/80', qty: 1, unit: 'pièce', price: 425_000, threshold: 4, supplier: 'Pneus Nord Cameroun' },
];

export const DEMO_TONTINES: TontineRec[] = [
  {
    id: 'ton_1',
    orgId: 'org_cotonou',
    name: 'Njangi Femmes Dantokpa',
    cycle: 'MENSUEL',
    contribution: 25_000,
    membersCount: 24,
    pot: 600_000,
    beneficiary: 'Mme Adjoa Kossi',
    nextDate: J(6),
    contributions: [
      { id: 'con_1', tontineId: 'ton_1', member: 'Mme Adjoa Kossi', amount: 25_000, channel: 'MTN_MOMO', status: 'RECU', paidAt: J(-24) },
      { id: 'con_2', tontineId: 'ton_1', member: 'Mme Bintou Soglo', amount: 25_000, channel: 'ESPECES', status: 'RECU', paidAt: J(-23) },
      { id: 'con_3', tontineId: 'ton_1', member: 'M. Dossou Pierre', amount: 25_000, channel: 'MOOV', status: 'RETARD', paidAt: J(-30) },
      { id: 'con_4', tontineId: 'ton_1', member: 'Mme Chabi Reine', amount: 25_000, channel: 'CELTIIS', status: 'RECU', paidAt: J(-22) },
    ],
  },
  {
    id: 'ton_2',
    orgId: 'org_cotonou',
    name: 'Njangi Chauffeurs Porto-Novo',
    cycle: 'HEBDOMADAIRE',
    contribution: 10_000,
    membersCount: 18,
    pot: 180_000,
    beneficiary: 'M. Sanni Karim',
    nextDate: J(2),
    contributions: [
      { id: 'con_5', tontineId: 'ton_2', member: 'M. Sanni Karim', amount: 10_000, channel: 'MTN_MOMO', status: 'RECU', paidAt: J(-6) },
      { id: 'con_6', tontineId: 'ton_2', member: 'M. Houngbo Sylvestre', amount: 10_000, channel: 'ESPECES', status: 'RECU', paidAt: J(-6) },
      { id: 'con_7', tontineId: 'ton_2', member: 'M. Aïdjo Rachidou', amount: 10_000, channel: 'MOOV', status: 'EN_ATTENTE', paidAt: H(-30) },
    ],
  },
  {
    id: 'ton_3',
    orgId: 'org_ndjamena',
    name: 'Tontine Commerçantes Marché Central',
    cycle: 'MENSUEL',
    contribution: 50_000,
    membersCount: 12,
    pot: 600_000,
    beneficiary: 'Hadja Fatimé',
    nextDate: J(11),
    contributions: [
      { id: 'con_8', tontineId: 'ton_3', member: 'Hadja Fatimé', amount: 50_000, channel: 'AIRTEL', status: 'RECU', paidAt: J(-19) },
      { id: 'con_9', tontineId: 'ton_3', member: 'Mariam Djibrine', amount: 50_000, channel: 'ESPECES', status: 'RECU', paidAt: J(-18) },
      { id: 'con_10', tontineId: 'ton_3', member: 'Achta Oumar', amount: 50_000, channel: 'ESPECES', status: 'RETARD', paidAt: J(-25) },
    ],
  },
];

export const DEMO_PAYMENTS: PaymentRec[] = [
  { id: 'pay_1', orgId: 'org_ndjamena', invoiceId: 'inv_20260002_ena', provider: 'airtel', amount: 200_000, currency: 'XAF', phone: '+235 63 44 12 00', reference: 'AM-8845120', status: 'REUSSI', createdAt: H(-20) },
  { id: 'pay_2', orgId: 'org_douala', invoiceId: 'inv_20260102_ala', provider: 'cinetpay', amount: 900_000, currency: 'XAF', phone: '+237 6 91 55 44 33', reference: 'CTPY-9912043', status: 'REUSSI', createdAt: H(-52) },
  { id: 'pay_3', orgId: 'org_cotonou', invoiceId: 'inv_20260202_nou', provider: 'kkiapay', amount: 100_000, currency: 'XOF', phone: '+229 95 77 66 55', reference: 'KKP-773421', status: 'REUSSI', createdAt: H(-70) },
  { id: 'pay_4', orgId: 'org_lome', invoiceId: 'inv_20260301_ome', provider: 't_money', amount: 185_000, currency: 'XOF', phone: '+228 91 22 33 44', reference: 'TM-5512098', status: 'REUSSI', createdAt: J(-9) },
  { id: 'pay_5', orgId: 'org_garoua', invoiceId: 'inv_20260401_rou', provider: 'manuel', amount: 1_500_000, currency: 'XAF', phone: '+237 6 55 11 22 33', reference: 'RECU-MANUEL-014', status: 'EN_ATTENTE', createdAt: H(-8) },
  { id: 'pay_6', orgId: 'org_ndjamena', invoiceId: 'inv_20260002_ena', provider: 'moov', amount: 200_000, currency: 'XAF', phone: '+235 99 21 55 40', reference: 'MV-2201987', status: 'ECHOUE', createdAt: H(-44) },
];

export const DEMO_SUBSCRIPTIONS: SubscriptionRec[] = [
  { id: 'sub_1', orgId: 'org_ndjamena', orgName: 'N’Djaména Distribution SARL', plan: 'PRO', amount: 24_900, currency: 'XAF', provider: 'manuel', status: 'ACTIF', startedAt: J(-420), renewAt: J(11) },
  { id: 'sub_2', orgId: 'org_douala', orgName: 'Douala Boutique Électronique', plan: 'BUSINESS', amount: 59_900, currency: 'XAF', provider: 'cinetpay', status: 'ACTIF', startedAt: J(-310), renewAt: J(4) },
  { id: 'sub_3', orgId: 'org_cotonou', orgName: 'Cotonou Njangi & Tontines', plan: 'COOPERATIVE', amount: 149_000, currency: 'XOF', provider: 'kkiapay', status: 'ACTIF', startedAt: J(-540), renewAt: J(19) },
  { id: 'sub_4', orgId: 'org_lome', orgName: 'Lomé École Les Palmiers', plan: 'STARTER', amount: 9_900, currency: 'XOF', provider: 'paydunya', status: 'ESSAI', startedAt: J(-12), renewAt: J(2) },
  { id: 'sub_5', orgId: 'org_garoua', orgName: 'Garoua Transport Express', plan: 'PRO', amount: 24_900, currency: 'XAF', provider: 'manuel', status: 'EN_RETARD', startedAt: J(-200), renewAt: J(-6) },
];

export const DEMO_WEBHOOK_LOGS: WebhookLogRec[] = [
  { id: 'wh_1', at: H(-1), orgId: 'org_ndjamena', direction: 'SORTANT', event: 'facture.en_retard', scenario: 'Relance des factures impayées', status: 'OK', statusCode: 200, payloadPreview: '{"invoice":"FAC-2026-0003","montant":4120000,"client":"Hôtel Sahel"}' },
  { id: 'wh_2', at: H(-1.2), orgId: 'org_douala', direction: 'ENTRANT', event: 'paiement.reussi', scenario: 'Paiement Mobile Money reçu → reçu client', status: 'OK', statusCode: 200, payloadPreview: '{"reference":"CTPY-9912043","montant":900000,"provider":"cinetpay"}' },
  { id: 'wh_3', at: H(-3), orgId: 'org_ndjamena', direction: 'SORTANT', event: 'stock.seuil_atteint', scenario: 'Alerte de rupture de stock', status: 'OK', statusCode: 200, payloadPreview: '{"sku":"SUC-25K","qte":3,"seuil":10}' },
  { id: 'wh_4', at: H(-5), orgId: 'org_cotonou', direction: 'SORTANT', event: 'message.envoyer', scenario: 'Envoi SMS de masse', status: 'ERREUR', statusCode: 401, payloadPreview: '{"canal":"SMS","destinataires":18}', error: 'WhatsApp Cloud API : jeton expiré (401)' },
  { id: 'wh_5', at: H(-7), orgId: 'org_garoua', direction: 'SORTANT', event: 'rapport.quotidien', scenario: 'Rapport quotidien du patron', status: 'OK', statusCode: 200, payloadPreview: '{"ca":7500000,"impaye":3230000,"taux":60}' },
  { id: 'wh_6', at: H(-26), orgId: 'org_lome', direction: 'ENTRANT', event: 'whatsapp.message', scenario: 'WhatsApp entrant → facture', status: 'OK', statusCode: 200, payloadPreview: '{"from":"+22891223344","texte":"Je veux payer la scolarité"}' },
];

export const DEMO_MESSAGES: MessageRec[] = [
  { id: 'msg_1', orgId: 'org_ndjamena', channel: 'WHATSAPP', to: '+235 66 78 90 12', body: 'Bonjour Hôtel Sahel, la facture FAC-2026-0003 de 4 120 000 FCFA reste impayée (échéance J-8). Payez ici : mbmustapha.com/p/…', status: 'ENVOYE', at: H(-30) },
  { id: 'msg_2', orgId: 'org_ndjamena', channel: 'SMS', to: '+235 62 11 88 99', body: 'Mariam, votre facture FAC-2026-0004 (145 000 FCFA) est en retard. Merci de régler.', status: 'ENVOYE', at: H(-48) },
  { id: 'msg_3', orgId: 'org_douala', channel: 'WHATSAPP', to: '+237 6 91 55 44 33', body: 'Clinique La Grâce : reçu de paiement 900 000 FCFA enregistré. Merci !', status: 'ENVOYE', at: H(-52) },
  { id: 'msg_4', orgId: 'org_cotonou', channel: 'SMS', to: '+229 97 45 12 30', body: 'Cotisation Njangi reçue : 25 000 FCFA. Cagnotte du tour : 600 000 FCFA.', status: 'ENVOYE', at: J(-22) },
];

/** Cree une copie mutable du jeu de donnees (le mode demo peut ainsi ecrire). */
export function seedDemo() {
  const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  return {
    orgs: clone(DEMO_ORGS),
    users: clone(DEMO_USERS),
    clients: clone(DEMO_CLIENTS),
    invoices: clone(DEMO_INVOICES),
    stock: clone(DEMO_STOCK),
    tontines: clone(DEMO_TONTINES),
    payments: clone(DEMO_PAYMENTS),
    subscriptions: clone(DEMO_SUBSCRIPTIONS),
    webhookLogs: clone(DEMO_WEBHOOK_LOGS),
    messages: clone(DEMO_MESSAGES),
  };
}

export type DemoDb = ReturnType<typeof seedDemo>;
