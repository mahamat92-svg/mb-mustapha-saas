// =============================================================================
// MB Mustapha - Types partages entre l'interface privee, publique et l'API
// =============================================================================

export type Role = 'OWNER' | 'CLIENT_ADMIN' | 'CLIENT_USER';

export type Organization = {
  id: string;
  name: string;
  country: string; // TD, CM, BJ, TG...
  countryName: string;
  city: string;
  currency: 'XAF' | 'XOF';
  plan: string;
  planStatus: 'ACTIF' | 'ESSAI' | 'EN_RETARD' | 'SUSPENDU';
  phone: string;
  contactEmail: string;
  mrr: number; // revenu mensuel que CE client rapporte au SaaS (FCFA)
  createdAt: string;
};

export type UserRec = {
  id: string;
  orgId: string | null;
  name: string;
  email: string;
  password: string; // bcrypt ou clair (demo)
  phone: string;
  role: Role;
  createdAt: string;
};

export type ClientRec = {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  type: 'PARTICULIER' | 'ENTREPRISE' | 'ECOLE' | 'COOPERATIVE';
  createdAt: string;
};

export type InvoiceStatus = 'BROUILLON' | 'ENVOYEE' | 'PARTIELLE' | 'PAYEE' | 'IMPAYEE' | 'ANNULEE';

export type InvoiceRec = {
  id: string;
  orgId: string;
  number: string;
  clientId: string;
  clientName: string;
  label: string;
  amount: number;
  vatRate: number;
  total: number;
  paid: number;
  status: InvoiceStatus;
  channel: 'MANUEL' | 'WHATSAPP' | 'SMS' | 'EMAIL' | 'MAKE';
  issueDate: string;
  dueDate: string;
  reminders: number;
  lastRemind?: string | null;
};

export type PaymentRec = {
  id: string;
  orgId: string;
  invoiceId?: string | null;
  provider: string;
  amount: number;
  currency: string;
  phone: string;
  reference: string;
  status: 'EN_ATTENTE' | 'REUSSI' | 'ECHOUE' | 'REMBOURSE';
  createdAt: string;
};

export type StockRec = {
  id: string;
  orgId: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  threshold: number;
  supplier: string;
};

export type ContributionRec = {
  id: string;
  tontineId: string;
  member: string;
  amount: number;
  channel: string;
  status: 'RECU' | 'EN_ATTENTE' | 'RETARD';
  paidAt: string;
};

export type TontineRec = {
  id: string;
  orgId: string;
  name: string;
  cycle: 'HEBDOMADAIRE' | 'MENSUEL';
  contribution: number;
  membersCount: number;
  pot: number;
  beneficiary: string;
  nextDate: string;
  contributions: ContributionRec[];
};

export type SubscriptionRec = {
  id: string;
  orgId: string;
  orgName?: string;
  plan: string;
  amount: number;
  currency: string;
  provider: string;
  status: 'ESSAI' | 'ACTIF' | 'EN_RETARD' | 'ANNULE';
  startedAt: string;
  renewAt: string;
};

export type WebhookLogRec = {
  id: string;
  at: string;
  orgId?: string | null;
  direction: 'SORTANT' | 'ENTRANT';
  event: string;
  scenario: string;
  status: 'OK' | 'ERREUR';
  statusCode: number;
  payloadPreview: string;
  error?: string | null;
};

export type MessageRec = {
  id: string;
  orgId: string;
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL';
  to: string;
  body: string;
  status: 'EN_ATTENTE' | 'ENVOYE' | 'ECHOUE';
  at: string;
};

export type Stats = {
  chiffreAffaires: number;
  encaisse: number;
  impaye: number;
  tauxRecouvrement: number;
  nbFactures: number;
  nbClients: number;
  facturesEnRetard: number;
  alertesStock: number;
  mrr: number;
  panierMoyen: number;
};

export type ActionResult = { ok: boolean; message: string; data?: unknown };

// ---------------------------------------------------------------------------
// SCOLAPAY (module écoles)
// ---------------------------------------------------------------------------
export type StatutTranche = 'PAYEE' | 'PARTIELLE' | 'EN_RETARD' | 'A_VENIR';

export type EleveRec = {
  id: string;
  orgId: string;
  matricule: string;
  nom: string;
  sexe: 'M' | 'F';
  classe: string;
  parentNom: string;
  parentTelephone: string;
  fraisAnnuels: number; // scolarité annuelle (FCFA)
  fraisInscription: number; // inscription, payée une seule fois
  inscriptionPayee: boolean;
  statut: 'ACTIF' | 'PARTI';
  createdAt: string;
};

export type TrancheRec = {
  id: string;
  orgId: string;
  eleveId: string;
  numero: number;
  libelle: string;
  montant: number;
  echeance: string;
  montantPaye: number;
};

export type EncaissementRec = {
  id: string;
  orgId: string;
  eleveId: string;
  trancheId: string | null;
  montant: number;
  canal: 'ESPECES' | 'MOBILE_MONEY' | 'VIREMENT';
  recu: string; // REC-2026-0001
  note?: string;
  date: string;
};

// ---------------------------------------------------------------------------
// PAIE (module PaieLocal)
// ---------------------------------------------------------------------------
export type TypeEmploye = 'MENSUEL' | 'JOURNALIER';

export type EmployeRec = {
  id: string;
  orgId: string;
  nom: string;
  poste: string;
  type: TypeEmploye;
  salaireBrut: number; // mensuel (FCFA) — 0 si journalier
  tauxJour: number; // journalier (FCFA / jour) — 0 si mensuel
  transport: number; // indemnité mensuelle
  sursalaire: number; // primes imposables
  autresGains: number;
  avances: number;
  telephone: string;
  actif: boolean;
  dateEmbauche: string;
};

export type LigneBulletinRec = {
  code: string;
  libelle: string;
  base: number;
  taux: number;
  montant: number;
  nature: 'GAIN' | 'COTISATION_SALARIE' | 'IMPOT' | 'COTISATION_PATRONALE' | 'DEDUCTION';
};

export type BulletinRec = {
  id: string;
  orgId: string;
  employeId: string;
  employeNom: string;
  poste: string;
  periode: string; // "2026-02"
  joursTravailles: number | null;
  brutTotal: number;
  brutImposable: number;
  totalCotisationsSalarie: number;
  impotTotal: number;
  avances: number;
  netAPayer: number;
  partPatronale: number;
  coutEmployeur: number;
  lignes: LigneBulletinRec[];
  alertes: string[];
  organisme: string;
  pays: string;
  createdAt: string;
};
