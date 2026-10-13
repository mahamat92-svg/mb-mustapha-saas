// =============================================================================
// MB Mustapha - CONFIGURATION CENTRALE DU SAAS
// Un seul fichier a modifier pour changer de marque, d'offre, de prix ou de pays.
// =============================================================================

// =============================================================================
// MARQUE (MARQUE BLANCHE) — tout est piloté par variables d'environnement.
// Pour rebaptiser le produit : `node scripts/rebrand.mjs --nom "Votre Nom"`.
// =============================================================================
export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'MB Mustapha',
  sigle: process.env.NEXT_PUBLIC_BRAND_SIGLE || 'MB',
  baseline:
    process.env.NEXT_PUBLIC_BRAND_BASELINE || 'La gestion qui fait rentrer l’argent',
  description:
    'Facturation, recouvrement, tontines, stock, paie (CNPS/CNSS/IRPP), Mobile Money et automatisation Make.com — en français, en FCFA, même avec une connexion faible.',
  couleur: process.env.NEXT_PUBLIC_BRAND_COLOR || '#1d4ed8',
  accent: process.env.NEXT_PUBLIC_BRAND_ACCENT || '#f59e0b',
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '',
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'contact@mbmustapha.com',
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+237 6 00 00 00 00',
  fondateur: process.env.NEXT_PUBLIC_FOUNDER_NAME || 'Mahamat Bouba Mustapha',
  country: 'Cameroun — Tchad — Bénin — Togo',
  domain: process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'mbmustapha.com',
  // Argumentaire du nom (utilisé à l'oral et sur la page d'accueil).
  signification:
    '« MB Mustapha » : le nom du fondateur comme signature. Dans le commerce sahélien, on ne signe pas avec une marque anonyme — on signe avec un nom, celui qu’on peut appeler quand il y a un problème.',
} as const;

export const CURRENCIES = {
  XAF: { code: 'XAF', label: 'FCFA (CEMAC)', symbol: 'FCFA' },
  XOF: { code: 'XOF', label: 'FCFA (UEMOA)', symbol: 'FCFA' },
} as const;

// ---------------------------------------------------------------------------
// OFFRES D'ABONNEMENT EN FCFA (revenu recurrent mensuel = MRR)
// ---------------------------------------------------------------------------
export type Plan = {
  id: string;
  name: string;
  price: number; // FCFA / mois
  annual: number; // FCFA / an (10 mois payes, 2 offerts)
  tagline: string;
  target: string;
  popular?: boolean;
  maxModules: number | 'illimite';
  limits: { users: number | 'illimite'; invoices: number | 'illimite'; messages: number; makeScenarios: number | 'illimite' };
  features: string[];
  cta: string;
};

export const PLANS: Plan[] = [
  {
    id: 'DECOUVERTE',
    name: 'Découverte',
    price: 0,
    annual: 0,
    tagline: 'Pour tester sans risque',
    target: 'Commerçant qui démarre',
    maxModules: 1,
    limits: { users: 1, invoices: 25, messages: 50, makeScenarios: 0 },
    features: [
      '1 module au choix',
      '25 factures par mois',
      'Reçus PDF avec logo',
      '50 SMS/WhatsApp par mois',
      'Support par WhatsApp',
    ],
    cta: 'Commencer gratuitement',
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 9900,
    annual: 99000,
    tagline: 'La boutique qui veut arrêter les cahiers',
    target: 'Boutique, atelier, taxi, salon',
    maxModules: 3,
    limits: { users: 3, invoices: 300, messages: 250, makeScenarios: 2 },
    features: [
      '3 modules au choix',
      '300 factures / mois',
      '250 SMS + WhatsApp',
      'Relances automatiques J+3 / J+7 / J+15',
      '2 scénarios Make.com',
      'Export Excel (expert-comptable)',
    ],
    cta: 'Choisir Starter',
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 24900,
    annual: 249000,
    tagline: 'Le pack des PME qui facturent tous les jours',
    target: 'PME, distributeur, école, clinique',
    maxModules: 6,
    popular: true,
    limits: { users: 10, invoices: 2000, messages: 1500, makeScenarios: 10 },
    features: [
      '6 modules au choix',
      '2 000 factures / mois',
      'Encaissement Mobile Money intégré',
      'Relances + reçus automatiques',
      '10 scénarios Make.com',
      'Tableau de bord multi-sites',
      'Support prioritaire 6j/7',
    ],
    cta: 'Choisir Pro',
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    price: 59900,
    annual: 599000,
    tagline: 'Toute l’entreprise, tous les modules, plusieurs agences',
    target: 'Groupe, coopérative, ONG',
    maxModules: 'illimite',
    limits: { users: 'illimite', invoices: 'illimite', messages: 6000, makeScenarios: 'illimite' },
    features: [
      'Les 10 modules',
      'Factures & utilisateurs illimités',
      '6 000 messages / mois',
      'Marque blanche (votre logo, vos couleurs)',
      'Scénarios Make.com illimités + API complète',
      'Multi-agences & consolidation des caisses',
      'Formation en ligne de vos équipes',
    ],
    cta: 'Choisir Business',
  },
  {
    id: 'COOPERATIVE',
    name: 'Coopérative & Institution',
    price: 149000,
    annual: 1490000,
    tagline: 'Tontines, coopératives d’épargne, écoles, ONG, administrations',
    target: 'Structure à plusieurs centaines de membres',
    maxModules: 'illimite',
    limits: { users: 'illimite', invoices: 'illimite', messages: 20000, makeScenarios: 'illimite' },
    features: [
      'Tout le pack Business',
      'Gestion de tontines / njangi / coopératives',
      'Paiement des membres par Mobile Money',
      'Rapprochement comptable SYSCOHADA',
      'Hébergement des données à votre nom',
      'Formation sur site (N’Djaména, Douala, Cotonou, Lomé)',
      'Accompagnement dédié',
    ],
    cta: 'Demander un devis',
  },
];

export const PLAN_BY_ID = (id: string): Plan | undefined => PLANS.find((p) => p.id === id) || PLANS[0];
export const PLAN_PRICE = (id: string): number => PLAN_BY_ID(id).price;

// Commission versee aux agents / revendeurs locaux (important en Afrique)
export const REVENDEUR_COMMISSION = 0.3; // 30% la premiere annee, 15% ensuite

// ---------------------------------------------------------------------------
// LES 10 MODULES QUI RESOLVENT DES PROBLEMES AFRICAINS CONCRETS
// ---------------------------------------------------------------------------
export type AppModule = {
  id: string;
  code: string;
  name: string;
  icon: string;
  tagline: string;
  probleme: string;
  solution: string;
  impact: string;
  features: string[];
  pays: string[];
  planMin: string;
};

export const MODULES: AppModule[] = [
  {
    id: 'facturation',
    code: 'FACT',
    name: 'FactuGo',
    icon: '🧾',
    tagline: 'Factures, devis et reçus conformes',
    probleme:
      "Carnets de reçus manuscrits, calculs de TVA approximatifs, clients qui contestent le montant, aucun historique.",
    solution:
      'Factures et devis numérotés sans trou, TVA automatique selon le pays (19,25% Cameroun, 18% Tchad/Bénin/Togo), reçus PDF avec QR code de vérification, envoyés par WhatsApp.',
    impact: '60% de temps administratif en moins, zéro contestation de reçu, image professionnelle.',
    features: [
      'Devis → facture en 1 clic',
      'TVA & AIR (Cameroun) automatiques',
      'Reçu PDF + QR code anti-fraude',
      'Envoi WhatsApp / SMS / Email',
      'Export SYSCOHADA pour l’expert-comptable',
    ],
    pays: ['Tchad', 'Cameroun', 'Bénin', 'Togo'],
    planMin: 'STARTER',
  },
  {
    id: 'recouvrement',
    code: 'RECOU',
    name: 'RecouveMax',
    icon: '⏰',
    tagline: 'Les impayés se recouvrent tout seuls',
    probleme:
      "« Je passe chez lui la semaine prochaine » : les créances dorment, la trésorerie meurt, la relance est gênante.",
    solution:
      'Relances automatiques programmées (J+3, J+7, J+15, J+30) par WhatsApp et SMS, lien de paiement Mobile Money, relevé de créances par client, stop automatique dès que le paiement arrive.',
    impact: 'En moyenne 3x plus rapide d’encaissement, 20 à 40% du chiffre d’affaires impayé récupéré.',
    features: [
      'Séquences de relance paramétrables',
      'Lien de paiement MTN MoMo / Orange / Moov / Airtel',
      'Relevé imprimable par client',
      'Alertes au patron si J+30 dépassé',
      'Scénario Make.com prêt à l’emploi',
    ],
    pays: ['Tchad', 'Cameroun', 'Bénin', 'Togo'],
    planMin: 'STARTER',
  },
  {
    id: 'tontine',
    code: 'TON',
    name: 'NjangiPro',
    icon: '🤝',
    tagline: 'Tontines, njangi et coopératives d’épargne',
    probleme:
      "Cahier de tontine perdu, membre qui jure avoir cotisé, tours retardés, disputes devant le chef de quartier.",
    solution:
      'Chaque membre reçoit un SMS de confirmation à chaque cotisation, la caisse du tour est publique, les tours sont planifiés, les PV de séance sont générés automatiquement.',
    impact: 'Plus une seule contestation, cotisations collectées 2x plus vite, confiance retrouvée.',
    features: [
      'Groupes tontine/njangi illimités',
      'Reçu SMS individuel à chaque cotisation',
      'Ordre de passage & tours automatiques',
      'Pénalités de retard paramétrables',
      'PV de séance imprimable',
    ],
    pays: ['Cameroun', 'Tchad', 'Bénin', 'Togo'],
    planMin: 'PRO',
  },
  {
    id: 'stock',
    code: 'STK',
    name: 'BoutiqueStock',
    icon: '📦',
    tagline: 'Stocks & inventaire même hors connexion',
    probleme:
      "Rupture sur le produit qui rapporte, marchandise volée, inventaire fait « au feeling » avec un cahier.",
    solution:
      'Stock mis à jour au comptoir (téléphone ou PC), alertes SMS de rupture et de surstock, inventaire en 10 minutes, historique des mouvements par vendeur.',
    impact: 'Ruptions divisées par 3, pertes et coulage détectés immédiatement.',
    features: [
      'Mode hors-ligne (PWA) : ça marche sans réseau',
      'Alertes SMS automatiques au seuil',
      'Codes-barres & scan caméra',
      'Transferts entre boutiques',
      'Valorisation du stock en FCFA',
    ],
    pays: ['Tchad', 'Cameroun', 'Bénin', 'Togo'],
    planMin: 'STARTER',
  },
  {
    id: 'paie',
    code: 'PAI',
    name: 'PaieLocal',
    icon: '👷',
    tagline: 'Paie, présences et journaliers — CNPS/CNSS et IRPP calculés',
    probleme:
      "Bulletins faits à la main, heures des journaliers disputées, cotisations CNPS/CNSS mal calculées, IRPP/ITS approximatif, payes en retard.",
    solution:
      'Pointage simple (téléphone à touches pour les journaliers), calcul automatique du bulletin : brut → cotisations salariales (CNPS Cameroun 4,2 % plafonnée, CNSS Tchad/Bénin/Togo) → abattement → IRPP/ITS par tranches → net à payer, plus le coût employeur. Bulletins imprimables, paiement Mobile Money groupé le jour de paie.',
    impact: 'Paie d’une équipe traitée en 2 heures au lieu de 2 jours, zéro litige sur les heures, zéro erreur de cotisation.',
    features: [
      'Barèmes CNPS/CNSS + IRPP/ITS par pays, paramétrables',
      'Bulletins de paie imprimables (détail ligne par ligne)',
      'Pointage des journaliers (jours travaillés × taux du jour)',
      'Coût employeur calculé (part patronale)',
      'Paiement Mobile Money groupé + reçu SMS à chaque employé',
      'Historique des avances sur salaire',
      'Simulateur brut → net pour négocier un salaire',
    ],
    pays: ['Tchad', 'Cameroun', 'Bénin', 'Togo'],
    planMin: 'PRO',
  },
  {
    id: 'livraison',
    code: 'MOTO',
    name: 'MotoTrack',
    icon: '🏍️',
    tagline: 'Livreurs, moto-taxis et caisses du jour',
    probleme:
      "Chauffeurs qui « oublient » de remettre la recette, courses non facturées, aucune trace des livraisons.",
    solution:
      'Chaque course est enregistrée par le chauffeur, la commission est calculée automatiquement, la caisse du jour doit être équilibrée sur l’écran du gérant, les clients reçoivent un SMS de confirmation.',
    impact: '100% des courses tracées, recettes du jour contrôlées en 1 minute.',
    features: [
      'Application chauffeur légère',
      'Calcul automatique de la commission',
      'Clôture de caisse par jour et par chauffeur',
      'SMS de confirmation au client',
      'Suivi entretien / carburant des motos',
    ],
    pays: ['Tchad', 'Cameroun', 'Bénin', 'Togo'],
    planMin: 'PRO',
  },
  {
    id: 'scolaire',
    code: 'SCOL',
    name: 'ScolaPay',
    icon: '🎓',
    tagline: 'Frais scolaires encaissés à temps, parents prévenus automatiquement',
    probleme:
      "Parents qui paient en 3 fois et qu'on relance à la main, cahier de caisse introuvable, reçus contestés, jours perdus à recopier les listes d'impayés, et une année qui finit avec un trou dans la trésorerie.",
    solution:
      "À l'inscription, l'échéancier du parent se crée tout seul (2, 3 ou 4 tranches, arrondies à 500 FCFA). Chaque paiement sort un reçu numéroté et envoie le message de confirmation au parent. Chaque semaine, l'école voit qui doit combien, et envoie d'un clic le rappel avant l'échéance ou la relance du retard — par WhatsApp ou SMS, avec le numéro Mobile Money de l'école.",
    impact:
      "Taux de recouvrement au-delà de 90 % dès le premier trimestre, deux jours par mois récupérés au bureau, et plus aucune contestation de reçu.",
    features: [
      'Inscription d’élève + échéancier automatique (2 à 4 tranches)',
      'Reçu numéroté à chaque paiement (espèces, Mobile Money, virement)',
      'Message de remerciement/confirmation envoyé au parent',
      'Liste des retards triée du plus gros au plus petit',
      'Rappel automatique 7 jours avant chaque échéance',
      'Tableau de bord par classe et par élève (taux de recouvrement)',
      'Situation imprimable à remettre au parent',
      'Frais d’inscription suivis séparément',
    ],
    pays: ['Togo', 'Bénin', 'Cameroun', 'Tchad'],
    planMin: 'PRO',
  },
  {
    id: 'agri',
    code: 'AGRI',
    name: 'AgriMarché',
    icon: '🌾',
    tagline: 'Collecte agricole et paiement des producteurs',
    probleme:
      "Pesées notées sur papier, producteurs payés des semaines plus tard, sacs perdus entre le village et le magasin.",
    solution:
      'Bon de pesée numérique, prix du jour par culture (coton, arachide, sésame, niébé, maïs), paiement Mobile Money des producteurs, traçabilité par sac et par village.',
    impact: 'Producteurs payés en 24h, fin des contestations de pesée, traçabilité export.',
    features: [
      'Bons de pesée signés par SMS',
      'Prix du marché paramétrable par zone',
      'Paiement Mobile Money groupé des producteurs',
      'Stock par culture et par magasin',
      'Rapports pour bailleurs / ONG',
    ],
    pays: ['Tchad', 'Cameroun', 'Bénin', 'Togo'],
    planMin: 'BUSINESS',
  },
  {
    id: 'ia',
    code: 'IA',
    name: 'AfriBot',
    icon: '🤖',
    tagline: 'Assistant IA WhatsApp multilingue 24h/24',
    probleme:
      "Impossible de répondre à tous les clients, les messages arrivent en français, en anglais, en arabe ou en pidgin, les commandes se perdent.",
    solution:
      'Assistant connecté à WhatsApp Business via Make.com : il répond aux questions, donne les prix, prend les commandes, relance les devis — en français, anglais, arabe tchadien et pidgin — puis transfère à un humain si besoin.',
    impact: 'Commandes prises même la nuit, 70% des questions répétitives traitées sans personnel.',
    features: [
      'Réponses multilingues (FR, EN, AR, pidgin)',
      'Prise de commande et devis automatique',
      'Transfert vers agent humain',
      'Résumé quotidien au patron par WhatsApp',
      'Connaît vos produits et vos prix',
    ],
    pays: ['Tchad', 'Cameroun', 'Bénin', 'Togo'],
    planMin: 'PRO',
  },
  {
    id: 'fiscal',
    code: 'FISC',
    name: 'Conformité+',
    icon: '📊',
    tagline: 'Impôts, CNPS et calendrier fiscal sans stress',
    probleme:
      "Dates de déclaration oubliées, pénalités DGI/OTR, expert-comptable qui réclame des documents dispersés.",
    solution:
      'Calendrier fiscal du pays configuré (DGI Tchad, DGI Cameroun, DGI Bénin, OTR Togo), rappels 7 jours avant, export des écritures au format attendu par votre comptable, coffre-fort de documents.',
    impact: 'Zéro pénalité de retard, comptable satisfait, contrôles fiscaux préparés.',
    features: [
      'Calendrier fiscal par pays',
      'Rappels SMS/WhatsApp avant échéance',
      'Export comptable SYSCOHADA (.xlsx / .csv)',
      'Coffre-fort de documents (bail, patente, CNPS)',
      'Tableau de bord TVA collectée / déductible',
    ],
    pays: ['Tchad', 'Cameroun', 'Bénin', 'Togo'],
    planMin: 'PRO',
  },
];

export const MODULE_BY_ID = (id: string) => MODULES.find((m) => m.id === id);

// ---------------------------------------------------------------------------
// PAYS COUVERTS, FISCALITE ET MOBILE MONEY
// ---------------------------------------------------------------------------
export type CountryInfo = {
  code: string;
  name: string;
  flag: string;
  currency: 'XAF' | 'XOF';
  vat: number;
  fiscal: string;
  social: string;
  mobileMoney: string[];
  villes: string[];
  priorite: 1 | 2 | 3;
  note: string;
};

export const COUNTRIES: CountryInfo[] = [
  {
    code: 'TD',
    name: 'Tchad',
    flag: '🇹🇩',
    currency: 'XAF',
    vat: 18,
    fiscal: 'DGI Tchad',
    social: 'CNPS Tchad',
    mobileMoney: ['Airtel Money', 'Moov Africa (Tigo Cash)'],
    villes: ['N’Djaména', 'Moundou', 'Sarh', 'Abéché', 'Garoua (zone frontalière)'],
    priorite: 1,
    note: "Marché très peu digitalisé : peu de concurrence locale, forte demande. Paiement : Airtel Money et Moov Africa ; prévoir une validation manuelle des paiements (virement/espèces) en secours.",
  },
  {
    code: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    currency: 'XAF',
    vat: 19.25,
    fiscal: 'DGI Cameroun',
    social: 'CNPS Cameroun',
    mobileMoney: ['MTN MoMo', 'Orange Money'],
    villes: ['Douala', 'Yaoundé', 'Garoua', 'Bafoussam', 'Maroua', 'Ngaoundéré'],
    priorite: 1,
    note: 'Marché le plus mature de la zone CEMAC, paiement mobile très répandu. Attention : TVA 19,25% avec AIR (acompte sur impôt sur le revenu) pour les non-immatriculés.',
  },
  {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    currency: 'XOF',
    vat: 18,
    fiscal: 'DGI Bénin',
    social: 'CNSS Bénin',
    mobileMoney: ['MTN MoMo', 'Moov Money', 'Celtiis Cash'],
    villes: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi'],
    priorite: 1,
    note: "Agrégateurs très matures : Kkiapay, CinetPay. Facture normalisée électronique (e-MECeF) en déploiement : prévoir le module d'export.",
  },
  {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    currency: 'XOF',
    vat: 18,
    fiscal: 'OTR',
    social: 'CNSS Togo',
    mobileMoney: ['T-Money (Togocom)', 'Moov Money'],
    villes: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé'],
    priorite: 1,
    note: 'OTR très actif sur la facture électronique. T-Money est dominant, prévoir la collecte par USSD.',
  },
  {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    currency: 'XOF',
    vat: 18,
    fiscal: 'DGID',
    social: 'CSS / IPRES',
    mobileMoney: ['Wave', 'Orange Money', 'Free Money'],
    villes: ['Dakar', 'Thiès', 'Saint-Louis', 'Touba'],
    priorite: 2,
    note: 'Wave domine avec des frais très bas : excellent terrain pour le recouvrement automatique.',
  },
  {
    code: 'CI',
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    currency: 'XOF',
    vat: 18,
    fiscal: 'DGI CI',
    social: 'CNPS CI',
    mobileMoney: ['Orange Money', 'MTN MoMo', 'Moov Money', 'Wave'],
    villes: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro'],
    priorite: 2,
    note: 'Plus gros marché francophone : idéal pour la licence revendeur.',
  },
  {
    code: 'NE',
    name: 'Niger',
    flag: '🇳🇪',
    currency: 'XOF',
    vat: 19,
    fiscal: 'DGI Niger',
    social: 'CNSS Niger',
    mobileMoney: ['Orange Money', 'Airtel Money', 'Zamani Cash'],
    villes: ['Niamey', 'Zinder', 'Maradi', 'Agadez'],
    priorite: 3,
    note: 'Zones à faible couverture réseau : le mode hors-ligne et le SMS sont indispensables.',
  },
  {
    code: 'GA',
    name: 'Gabon',
    flag: '🇬🇦',
    currency: 'XAF',
    vat: 18,
    fiscal: 'DGI Gabon',
    social: 'CNSS Gabon',
    mobileMoney: ['Airtel Money', 'Moov Money'],
    villes: ['Libreville', 'Port-Gentil', 'Franceville'],
    priorite: 3,
    note: 'Pouvoir d’achat plus élevé : possibilité de vendre le pack Business.',
  },
];

export const COUNTRY_BY_CODE = (code: string) =>
  COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

// ---------------------------------------------------------------------------
// OPERATEURS DE PAIEMENT (encaissement des abonnements et des factures clients)
// ---------------------------------------------------------------------------
export type Provider = {
  id: string;
  name: string;
  type: 'agregateur' | 'manuel';
  pays: string[];
  devises: string[];
  frais: string;
  docs: string;
  note: string;
};

export const PROVIDERS: Provider[] = [
  {
    id: 'kkiapay',
    name: 'Kkiapay',
    type: 'agregateur',
    pays: ['Bénin', 'Togo', "Côte d'Ivoire", 'Sénégal', 'Niger', 'Mali', 'Burkina Faso'],
    devises: ['XOF', 'XAF'],
    frais: '≈ 1,8 % par transaction',
    docs: 'https://docs.kkiapay.me',
    note: 'Le plus simple pour démarrer au Bénin et au Togo. Carte + Mobile Money + retrait marchand.',
  },
  {
    id: 'cinetpay',
    name: 'CinetPay',
    type: 'agregateur',
    pays: ['Cameroun', 'Côte d’Ivoire', 'Sénégal', 'Mali', 'Burkina', 'Bénin', 'Togo', 'Guinée'],
    devises: ['XAF', 'XOF'],
    frais: '≈ 2 à 3,5 %',
    docs: 'https://docs.cinetpay.com',
    note: 'Couverture CEMAC + UEMOA : indispensable pour le Cameroun. Paiements MTN MoMo / Orange Money.',
  },
  {
    id: 'paydunya',
    name: 'PayDunya',
    type: 'agregateur',
    pays: ['Sénégal', 'Côte d’Ivoire', 'Bénin', 'Togo', 'Burkina', 'Mali'],
    devises: ['XOF', 'XAF'],
    frais: '≈ 2 %',
    docs: 'https://paydunya.com/developers',
    note: 'Bon pour l’UEMOA, API très claire, support francophone.',
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    type: 'agregateur',
    pays: ['Cameroun', 'Ghana', 'Nigeria', 'Kenya', '+ 30 pays'],
    devises: ['XAF', 'XOF', 'USD', 'NGN'],
    frais: '≈ 1,4 % (local) / 3,8 % (international)',
    docs: 'https://developer.flutterwave.com',
    note: 'Panafricain, utile si vous facturez la diaspora ou des clients hors zone FCFA.',
  },
  {
    id: 'manuel',
    name: 'Encaissement manuel (Airtel / Moov / virement)',
    type: 'manuel',
    pays: ['Tchad', 'Tous'],
    devises: ['XAF', 'XOF'],
    frais: '0 %',
    docs: '',
    note: "Indispensable au Tchad et dans les zones sans agrégateur : le client envoie sur le numéro marchand, saisit la référence dans l'app, le propriétaire valide depuis /admin (validation en 1 clic).",
  },
];

// ---------------------------------------------------------------------------
// SCENARIOS MAKE.COM LIVRES AVEC LE SAAS
// ---------------------------------------------------------------------------
export type MakeScenario = {
  id: string;
  name: string;
  sens: 'APP → MAKE' | 'MAKE → APP' | 'BIDIRECTIONNEL';
  declencheur: string;
  actions: string;
  envKey: string;
  blueprint: string;
};

export const MAKE_SCENARIOS: MakeScenario[] = [
  {
    id: 'relance',
    name: '1. Relance des factures impayées',
    sens: 'APP → MAKE',
    declencheur: 'Webhook MB Mustapha « facture.en_retard » (cron Vercel 7h ou bouton « Relancer »)',
    actions: 'WhatsApp Cloud API → SMS Africa’s Talking → Google Sheet des relances → Email au patron',
    envKey: 'MAKE_WEBHOOK_RELANCE',
    blueprint: 'make-blueprints/01-relance-factures.json',
  },
  {
    id: 'stock',
    name: '2. Alerte de rupture de stock',
    sens: 'APP → MAKE',
    declencheur: 'Webhook « stock.seuil_atteint » (chaque mouvement de stock)',
    actions: 'SMS au gérant → message WhatsApp au fournisseur → ligne dans Google Sheets',
    envKey: 'MAKE_WEBHOOK_STOCK',
    blueprint: 'make-blueprints/02-alerte-stock.json',
  },
  {
    id: 'paiement',
    name: '3. Paiement Mobile Money reçu → reçu client',
    sens: 'BIDIRECTIONNEL',
    declencheur: 'Webhook de l’agrégateur (Kkiapay/CinetPay) reçu par Make, puis appel de l’API MB Mustapha',
    actions: 'Vérifier la transaction → POST /api/v1/paiements → reçu PDF → WhatsApp + SMS au client',
    envKey: 'MAKE_WEBHOOK_PAIEMENT',
    blueprint: 'make-blueprints/03-paiement-mobile-money.json',
  },
  {
    id: 'message',
    name: '4. Envoi de SMS / WhatsApp en masse',
    sens: 'APP → MAKE',
    declencheur: 'Webhook « message.envoyer » (campagne de la page Clients ou du module tontine)',
    actions: 'Boucle sur les destinataires → SMS ou WhatsApp → journal dans Google Sheets',
    envKey: 'MAKE_WEBHOOK_MESSAGE',
    blueprint: '',
  },
  {
    id: 'rapport',
    name: '5. Rapport quotidien du patron (7h00)',
    sens: 'APP → MAKE',
    declencheur: 'Cron Vercel /api/cron/relances (inclus dans le même déclenchement)',
    actions: 'Récupérer /api/v1/stats → mettre en forme → WhatsApp au patron + Google Sheet',
    envKey: 'MAKE_WEBHOOK_RAPPORT',
    blueprint: '',
  },
  {
    id: 'whatsapp-entrant',
    name: '6. WhatsApp entrant → facture / commande',
    sens: 'MAKE → APP',
    declencheur: 'WhatsApp Business « Watch messages » (module Make natif)',
    actions: 'AfriBot analyse le message → POST /api/v1/clients + /api/v1/factures → confirmation client',
    envKey: 'MAKE_WEBHOOK_GENERIC',
    blueprint: 'make-blueprints/04-whatsapp-vers-facture.json',
  },
];

// ---------------------------------------------------------------------------
// PARAMETRES DE PAIE (CNPS / CNSS / IRPP / ITS) — MODIFIABLES PAR PAYS
// -----------------------------------------------------------------------------
// ⚠️ IMPORTANT ET HONNÊTE : ces taux sont des valeurs de travail, arrondies aux
// usages les plus cités. Les taux sociaux et les barèmes d'impôt changent
// (lois de finances annuelles) : FAITES-LES CONFIRMER par votre comptable ou
// l'organisme avant de payer vos premiers salaires, puis ajustez ce tableau
// (ou la page /admin/parametres). Le moteur de calcul, lui, est correct :
// seule la donnée d'entrée est à valider.
// ---------------------------------------------------------------------------

export type TrancheImpot = { jusqua: number; taux: number }; // jusqua en FCFA mensuels (Infinity = dernière tranche)

export type ParametresPaie = {
  pays: string;
  organisme: string;
  tauxSalarie: number; // part salariale principale (%)
  plafondSalarie: number; // base maximale soumise à cette cotisation (FCFA/mois)
  autresSalarie: { nom: string; taux: number; plafond?: number }[];
  tauxPatronal: number; // part employeur (%)
  plafondPatronal?: number;
  abattementImpot: number; // abattement pour frais professionnels (%)
  tranches: TrancheImpot[]; // barème progressif mensuel
  taxeCommunale: number; // centimes additionnels / taxe locale (% de l'impôt)
  smig: number; // salaire minimum interprofessionnel garanti (FCFA/mois)
  aVerifier: string;
};

export const PAIE_PARAMS: Record<string, ParametresPaie> = {
  CM: {
    pays: 'Cameroun',
    organisme: 'CNPS Cameroun',
    tauxSalarie: 4.2,
    plafondSalarie: 750_000,
    autresSalarie: [{ nom: 'Crédit foncier', taux: 1, plafond: 750_000 }],
    tauxPatronal: 16.2,
    plafondPatronal: 750_000,
    abattementImpot: 30,
    tranches: [
      { jusqua: 166_667, taux: 11 },
      { jusqua: 250_000, taux: 15 },
      { jusqua: 416_667, taux: 25 },
      { jusqua: Infinity, taux: 35 },
    ],
    taxeCommunale: 10, // CAC sur le montant de l'impôt
    smig: 41_875,
    aVerifier: 'CNPS Cameroun (cnps.cm) et DGI Cameroun (impots.cm) — barème IRPP + CAC + AIR',
  },
  TD: {
    pays: 'Tchad',
    organisme: 'CNPS Tchad',
    tauxSalarie: 3.5,
    plafondSalarie: 500_000,
    autresSalarie: [],
    tauxPatronal: 16.5,
    plafondPatronal: 500_000,
    abattementImpot: 20,
    tranches: [
      { jusqua: 100_000, taux: 0 },
      { jusqua: 200_000, taux: 10 },
      { jusqua: 350_000, taux: 15 },
      { jusqua: 600_000, taux: 20 },
      { jusqua: Infinity, taux: 25 },
    ],
    taxeCommunale: 0,
    smig: 60_000,
    aVerifier: 'CNPS Tchad et DGI Tchad — barème IRPP de la loi de finances en vigueur',
  },
  BJ: {
    pays: 'Bénin',
    organisme: 'CNSS Bénin',
    tauxSalarie: 3.6,
    plafondSalarie: 208_333,
    autresSalarie: [],
    tauxPatronal: 15.4,
    plafondPatronal: 208_333,
    abattementImpot: 20,
    tranches: [
      { jusqua: 60_000, taux: 0 },
      { jusqua: 200_000, taux: 10 },
      { jusqua: 300_000, taux: 15 },
      { jusqua: 500_000, taux: 19 },
      { jusqua: Infinity, taux: 30 },
    ],
    taxeCommunale: 0,
    smig: 52_000,
    aVerifier: 'CNSS Bénin et DGI Bénin — barème ITS et réduction pour charges de famille',
  },
  TG: {
    pays: 'Togo',
    organisme: 'CNSS Togo',
    tauxSalarie: 4,
    plafondSalarie: 400_000,
    autresSalarie: [],
    tauxPatronal: 17.5,
    plafondPatronal: 400_000,
    abattementImpot: 20,
    tranches: [
      { jusqua: 60_000, taux: 0 },
      { jusqua: 150_000, taux: 10 },
      { jusqua: 300_000, taux: 15 },
      { jusqua: 500_000, taux: 20 },
      { jusqua: Infinity, taux: 25 },
    ],
    taxeCommunale: 0,
    smig: 52_500,
    aVerifier: 'CNSS Togo et OTR — barème IRPP/IGIS de la loi de finances en vigueur',
  },
};

export const PAIE_PARAMS_PAYS = (code: string) => PAIE_PARAMS[code] || PAIE_PARAMS.CM;

// ---------------------------------------------------------------------------
// ETAT DES INTEGRATIONS (utilise par /admin/parametres et /api/health)
// ---------------------------------------------------------------------------
export function integrationStatus() {
  const set = (v?: string) => Boolean(v && String(v).trim().length > 0);
  return {
    database: { ok: set(process.env.DATABASE_URL), label: 'Base de données Postgres' },
    make: {
      ok: set(process.env.MAKE_API_TOKEN) || set(process.env.MAKE_WEBHOOK_RELANCE),
      label: 'Make.com (webhooks)',
    },
    paiement: {
      ok:
        set(process.env.KIIAPAY_PRIVATE_KEY) ||
        set(process.env.CINETPAY_API_KEY) ||
        set(process.env.PAYDUNYA_MASTER_KEY) ||
        set(process.env.FLUTTERWAVE_SECRET_KEY),
      label: 'Mobile Money (agrégateur)',
    },
    whatsapp: { ok: set(process.env.WHATSAPP_TOKEN), label: 'WhatsApp Cloud API' },
    sms: { ok: set(process.env.AFRICASTALKING_API_KEY), label: 'SMS (Africa’s Talking)' },
    auth: { ok: set(process.env.AUTH_SECRET), label: 'Clé de session AUTH_SECRET' },
  };
}
