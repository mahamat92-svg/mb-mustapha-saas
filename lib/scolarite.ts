// =============================================================================
// MB Mustapha — MODULE SCOLAPAY (écoles privées, collèges, centres de formation)
// -----------------------------------------------------------------------------
// Cœur métier : échéancier en tranches, suivi des encaissements, situation par
// élève et par classe, relances automatiques aux parents.
//
// Code pur (aucune dépendance serveur) : utilisable côté serveur ET navigateur.
// Tout est en FCFA entiers, comme le reste de l'application.
// =============================================================================

import { BRAND } from './config';
import type { EleveRec, EncaissementRec, TrancheRec, StatutTranche } from './types';

// ---------------------------------------------------------------------------
// 1. Paramètres de l'école (modifiables)
// ---------------------------------------------------------------------------
export const REGLES_SCOLAIRE = {
  nbTranchesParDefaut: 3,
  arrondiTranche: 500, // les tranches tombent sur des montants ronds (500 FCFA)
  joursAvantRappel: 7, // on prévient le parent 7 jours avant l'échéance
  joursGraceApresEcheance: 0, // dès le lendemain de l'échéance, l'élève est en retard
  canaux: ['ESPECES', 'MOBILE_MONEY', 'VIREMENT'] as const,
};

export const LIBELLE_TRANCHE = ['1re tranche', '2e tranche', '3e tranche', '4e tranche'];

// ---------------------------------------------------------------------------
// 2. Échéancier : découpage des frais annuels en tranches égales
// ---------------------------------------------------------------------------
export type TrancheCalculee = { numero: number; libelle: string; montant: number; echeance: string };

/**
 * Découpe des frais annuels en tranches égales, arrondies à 500 FCFA.
 * Le reliquat d'arrondi est ajouté à la DERNIÈRE tranche (jamais de centimes).
 *
 * Exemple : 120 000 FCFA en 3 tranches → 40 000 + 40 000 + 40 000
 * Exemple : 90 000 FCFA en 3 tranches  → 30 000 + 30 000 + 30 000
 * Exemple : 100 000 FCFA en 3 tranches → 33 000 + 33 000 + 34 000
 */
export function calculerEcheancier(
  fraisAnnuels: number,
  nbTranches = REGLES_SCOLAIRE.nbTranchesParDefaut,
  debut: Date = new Date(),
): TrancheCalculee[] {
  const n = Math.max(1, Math.min(4, Math.round(nbTranches)));
  const total = Math.max(0, Math.round(fraisAnnuels));
  const arrondi = REGLES_SCOLAIRE.arrondiTranche;
  const base = Math.floor(total / n / arrondi) * arrondi;

  const tranches: TrancheCalculee[] = [];
  let cumul = 0;

  for (let i = 0; i < n; i++) {
    const montant = i === n - 1 ? total - cumul : base;
    cumul += montant;
    // Échéances : tous les 3 mois à partir de la date de début
    const echeance = new Date(debut.getTime() + i * 91 * 86_400_000);
    tranches.push({
      numero: i + 1,
      libelle: LIBELLE_TRANCHE[i] || `Tranche ${i + 1}`,
      montant,
      echeance: echeance.toISOString(),
    });
  }
  return tranches;
}

/** Contrôle : la somme des tranches doit toujours égaler les frais annuels. */
export function verifierEcheancier(fraisAnnuels: number, nbTranches: number): { ok: boolean; total: number; ecart: number } {
  const t = calculerEcheancier(fraisAnnuels, nbTranches);
  const total = t.reduce((s, x) => s + x.montant, 0);
  return { ok: total === Math.round(fraisAnnuels), total, ecart: total - Math.round(fraisAnnuels) };
}

// ---------------------------------------------------------------------------
// 3. Statut d'une tranche
// ---------------------------------------------------------------------------
export function statutTranche(
  t: Pick<TrancheRec, 'montant' | 'montantPaye' | 'echeance'>,
  aujourdhui: Date = new Date(),
): StatutTranche {
  if (t.montantPaye >= t.montant) return 'PAYEE';
  const echeance = new Date(t.echeance);
  if (echeance.getTime() < aujourdhui.getTime()) return t.montantPaye > 0 ? 'PARTIELLE' : 'EN_RETARD';
  return t.montantPaye > 0 ? 'PARTIELLE' : 'A_VENIR';
}

export function joursDeRetard(echeance: string, aujourdhui: Date = new Date()): number {
  const j = Math.floor((aujourdhui.getTime() - new Date(echeance).getTime()) / 86_400_000);
  return j > 0 ? j : 0;
}

// ---------------------------------------------------------------------------
// 4. Situation d'un élève
// ---------------------------------------------------------------------------
export type SituationEleve = {
  eleveId: string;
  nom: string;
  classe: string;
  parentNom: string;
  parentTelephone: string;
  totalDu: number; // frais annuels + inscription non payée
  totalPaye: number;
  reste: number;
  montantEnRetard: number; // tranches échues non soldées
  joursRetardMax: number;
  prochaineEcheance: string | null;
  prochainMontant: number;
  statut: 'A_JOUR' | 'EN_RETARD' | 'PARTIEL' | 'SOLDÉ';
  tranches: { numero: number; montant: number; montantPaye: number; echeance: string; statut: StatutTranche }[];
};

export function situationEleve(
  eleve: EleveRec,
  tranches: TrancheRec[],
  aujourdhui: Date = new Date(),
): SituationEleve {
  const mesTranches = tranches
    .filter((t) => t.eleveId === eleve.id)
    .sort((a, b) => a.numero - b.numero);

  const inscriptionDue = eleve.inscriptionPayee ? 0 : eleve.fraisInscription;
  const totalDu = eleve.fraisAnnuels + inscriptionDue;
  const totalPaye = mesTranches.reduce((s, t) => s + t.montantPaye, 0) + (eleve.inscriptionPayee ? eleve.fraisInscription : 0);
  const reste = Math.max(0, totalDu - totalPaye);

  let montantEnRetard = 0;
  let joursRetardMax = 0;
  for (const t of mesTranches) {
    const st = statutTranche(t, aujourdhui);
    if ((st === 'EN_RETARD' || st === 'PARTIELLE') && new Date(t.echeance) < aujourdhui) {
      montantEnRetard += Math.max(0, t.montant - t.montantPaye);
      joursRetardMax = Math.max(joursRetardMax, joursDeRetard(t.echeance, aujourdhui));
    }
  }

  const nonPayees = mesTranches.filter((t) => t.montantPaye < t.montant);
  const prochaine = nonPayees.find((t) => new Date(t.echeance) >= aujourdhui) || nonPayees[0] || null;

  const statut: SituationEleve['statut'] =
    reste === 0 ? 'SOLDÉ' : montantEnRetard > 0 ? 'EN_RETARD' : totalPaye > 0 ? 'PARTIEL' : 'A_JOUR';

  return {
    eleveId: eleve.id,
    nom: eleve.nom,
    classe: eleve.classe,
    parentNom: eleve.parentNom,
    parentTelephone: eleve.parentTelephone,
    totalDu,
    totalPaye,
    reste,
    montantEnRetard,
    joursRetardMax,
    prochaineEcheance: prochaine ? prochaine.echeance : null,
    prochainMontant: prochaine ? prochaine.montant - prochaine.montantPaye : 0,
    statut,
    tranches: mesTranches.map((t) => ({
      numero: t.numero,
      montant: t.montant,
      montantPaye: t.montantPaye,
      echeance: t.echeance,
      statut: statutTranche(t, aujourdhui),
    })),
  };
}

// ---------------------------------------------------------------------------
// 5. Synthèse de l'école (le tableau de bord du directeur)
// ---------------------------------------------------------------------------
export type SyntheseEcole = {
  nbEleves: number;
  totalDu: number;
  totalEncaisse: number;
  resteARecouvrer: number;
  montantEnRetard: number;
  nbElevesEnRetard: number;
  tauxRecouvrement: number; // %
  encaisseMoisCourant: number;
  parClasse: { classe: string; nbEleves: number; du: number; encaisse: number; reste: number; retard: number }[];
  aRelancer: SituationEleve[]; // triés du plus grossiste retard au plus petit
  echeancesProches: SituationEleve[]; // échéance dans les 7 jours
};

export function syntheseEcole(
  eleves: EleveRec[],
  tranches: TrancheRec[],
  encaissements: EncaissementRec[],
  aujourdhui: Date = new Date(),
): SyntheseEcole {
  const actifs = eleves.filter((e) => e.statut === 'ACTIF');
  const situations = actifs.map((e) => situationEleve(e, tranches, aujourdhui));

  const totalDu = situations.reduce((s, x) => s + x.totalDu, 0);
  const totalEncaisse = situations.reduce((s, x) => s + x.totalPaye, 0);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1).getTime();
  const encaisseMoisCourant = encaissements
    .filter((e) => new Date(e.date).getTime() >= debutMois)
    .reduce((s, e) => s + e.montant, 0);

  const classes = Array.from(new Set(actifs.map((e) => e.classe))).sort();
  const parClasse = classes.map((classe) => {
    const dedans = situations.filter((s) => s.classe === classe);
    return {
      classe,
      nbEleves: dedans.length,
      du: dedans.reduce((s, x) => s + x.totalDu, 0),
      encaisse: dedans.reduce((s, x) => s + x.totalPaye, 0),
      reste: dedans.reduce((s, x) => s + x.reste, 0),
      retard: dedans.reduce((s, x) => s + x.montantEnRetard, 0),
    };
  });

  const aRelancer = situations
    .filter((s) => s.montantEnRetard > 0)
    .sort((a, b) => b.montantEnRetard - a.montantEnRetard);

  const echeancesProches = situations
    .filter((s) => {
      if (!s.prochaineEcheance || s.reste === 0) return false;
      const jours = (new Date(s.prochaineEcheance).getTime() - aujourdhui.getTime()) / 86_400_000;
      return jours >= 0 && jours <= REGLES_SCOLAIRE.joursAvantRappel;
    })
    .sort((a, b) => new Date(a.prochaineEcheance!).getTime() - new Date(b.prochaineEcheance!).getTime());

  return {
    nbEleves: actifs.length,
    totalDu,
    totalEncaisse,
    resteARecouvrer: Math.max(0, totalDu - totalEncaisse),
    montantEnRetard: situations.reduce((s, x) => s + x.montantEnRetard, 0),
    nbElevesEnRetard: aRelancer.length,
    tauxRecouvrement: totalDu ? Math.round((totalEncaisse / totalDu) * 1000) / 10 : 0,
    encaisseMoisCourant,
    parClasse,
    aRelancer,
    echeancesProches,
  };
}

// ---------------------------------------------------------------------------
// 6. Messages aux parents (WhatsApp / SMS) — prêts à envoyer
// ---------------------------------------------------------------------------
export function messageRappelEcheance(
  s: SituationEleve,
  numeroPaiement: string = BRAND.whatsapp,
  nomEcole = 'notre établissement',
): string {
  const date = s.prochaineEcheance ? new Date(s.prochaineEcheance).toLocaleDateString('fr-FR') : '';
  return (
    `Bonjour ${s.parentNom}, ${nomEcole} vous rappelle que la scolarité de ${s.nom} (${s.classe}) arrive à échéance le ${date}. ` +
    `Montant : ${s.prochainMontant.toLocaleString('fr-FR')} FCFA. ` +
    `Paiement par Mobile Money au ${numeroPaiement} ou à la caisse. ` +
    `Merci — et n'hésitez pas à appeler si vous souhaitez un échelonnement.`
  );
}

export function messageRelanceRetard(
  s: SituationEleve,
  numeroPaiement: string = BRAND.whatsapp,
  nomEcole = 'notre établissement',
): string {
  return (
    `Bonjour ${s.parentNom}, ${nomEcole} concernant ${s.nom} (${s.classe}) : il reste ` +
    `${s.montantEnRetard.toLocaleString('fr-FR')} FCFA en retard (${s.joursRetardMax} jour(s) de retard). ` +
    `Vous pouvez payer dès maintenant par Mobile Money au ${numeroPaiement}. ` +
    `Si vous rencontrez une difficulté, appelez-nous : nous pouvons étaler le paiement. Merci de votre confiance.`
  );
}

export function messageRecu(eleveNom: string, montant: number, reste: number, recu: string): string {
  return (
    `Reçu ${recu} — Nous avons bien reçu ${montant.toLocaleString('fr-FR')} FCFA pour la scolarité de ${eleveNom}. ` +
    `Reste à payer : ${reste.toLocaleString('fr-FR')} FCFA. Merci, et bonne journée.`
  );
}

/** Lien WhatsApp prêt à cliquer (le parent reçoit le message depuis votre numéro). */
export function lienWhatsApp(telephone: string, message: string): string {
  const num = telephone.replace(/[^0-9]/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

/** Lien SMS (utilisé par Make.com pour les parents sans smartphone). */
export function lienSms(telephone: string, message: string): string {
  return `sms:${telephone.replace(/\s/g, '')}?body=${encodeURIComponent(message)}`;
}

/** Numéro de reçu : REC-2026-0042 */
export function numeroRecu(seq: number, annee = new Date().getFullYear()): string {
  return `REC-${annee}-${String(seq).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// 7. Jeu de données de démonstration — Lomé École Les Palmiers (org_lome)
// ---------------------------------------------------------------------------
const ORG_ECOLE = 'org_lome';

const CLASSES_DEMO = [
  { classe: 'CM2 A', frais: 120_000, inscription: 15_000 },
  { classe: '6e B', frais: 150_000, inscription: 20_000 },
  { classe: '3e A', frais: 180_000, inscription: 25_000 },
];

const NOMS = [
  ['Kodjo Ama', 'F', 'M. Kodjo Yao', '+228 91 22 33 44'],
  ['Mensah Kwame', 'M', 'Mme Mensah Abla', '+228 90 55 66 77'],
  ['Adjovi Sena', 'F', 'M. Adjovi Kossi', '+228 91 77 88 99'],
  ['Tchalla Yao', 'M', 'Mme Tchalla Ama', '+228 92 11 22 33'],
  ['Bakari Fatou', 'F', 'M. Bakari Ibrahim', '+228 93 44 55 66'],
  ['Dossou Koffi', 'M', 'Mme Dossou Afi', '+228 90 88 77 66'],
  ['N’Guessan Aya', 'F', 'M. N’Guessan Paul', '+228 91 33 44 55'],
  ['Kponvi Selom', 'M', 'Mme Kponvi Akou', '+228 92 55 66 77'],
  ['Lawson Emefa', 'F', 'M. Lawson Dodji', '+228 93 12 34 56'],
  ['Amegan Kofi', 'M', 'Mme Amegan Yawa', '+228 90 22 33 44'],
  ['Sossou Abra', 'F', 'M. Sossou Komla', '+228 91 66 77 88'],
  ['Zoumarou Idriss', 'M', 'M. Zoumarou Ali', '+228 92 88 99 00'],
];

type EtatScolarite = {
  eleves: EleveRec[];
  tranches: TrancheRec[];
  encaissements: EncaissementRec[];
  compteurRecu: number;
};

let etat: EtatScolarite | null = null;

/** Construit l'école de démonstration : 12 élèves, 3 classes, 3 tranches, paiements variés. */
function construireDemo(): EtatScolarite {
  const eleves: EleveRec[] = [];
  const tranches: TrancheRec[] = [];
  const encaissements: EncaissementRec[] = [];
  let compteur = 1;

  const debut = new Date(Date.now() - 95 * 86_400_000); // l'année scolaire a commencé il y a ~3 mois

  NOMS.forEach((ligne, i) => {
    const [nom, sexe, parentNom, parentTelephone] = ligne;
    const config = CLASSES_DEMO[i % CLASSES_DEMO.length];
    const eleve: EleveRec = {
      id: `elv_${i + 1}`,
      orgId: ORG_ECOLE,
      matricule: `2026-${String(101 + i)}`,
      nom,
      sexe: sexe as 'M' | 'F',
      classe: config.classe,
      parentNom,
      parentTelephone,
      fraisAnnuels: config.frais,
      fraisInscription: config.inscription,
      inscriptionPayee: i % 5 !== 4, // 1 élève sur 5 n'a pas payé l'inscription
      statut: 'ACTIF',
      createdAt: new Date(debut.getTime() - 120 * 86_400_000).toISOString(),
    };
    eleves.push(eleve);

    // Échéancier : 3 tranches, la 1re est déjà échue (il y a ~2 mois), la 2e arrive, la 3e est future
    const t = calculerEcheancier(config.frais, 3, new Date(Date.now() - 62 * 86_400_000));
    t.forEach((x) => {
      const tranche: TrancheRec = {
        id: `trc_${i + 1}_${x.numero}`,
        orgId: ORG_ECOLE,
        eleveId: eleve.id,
        numero: x.numero,
        libelle: x.libelle,
        montant: x.montant,
        echeance: x.echeance,
        montantPaye: 0,
      };
      tranches.push(tranche);
    });

    // Profil de paiement : 0 = tout payé, 1 = payé en partie, 2 = rien payé, 3 = retard ancien
    const profil = i % 4;
    const mesTranches = tranches.filter((x) => x.eleveId === eleve.id);

    if (profil === 0) {
      // Bon payeur : 1re tranche soldée + 2e soldée d'avance
      mesTranches[0].montantPaye = mesTranches[0].montant;
      mesTranches[1].montantPaye = mesTranches[1].montant;
      encaissements.push(recu(eleve, mesTranches[0], mesTranches[0].montant, 'ESPECES', -60, compteur++, 'Payé à la caisse'));
      encaissements.push(recu(eleve, mesTranches[1], mesTranches[1].montant, 'MOBILE_MONEY', -20, compteur++, 'Flooz / T-Money'));
    } else if (profil === 1) {
      // Paiement partiel sur la 1re tranche
      const part = Math.round(mesTranches[0].montant * 0.6);
      mesTranches[0].montantPaye = part;
      encaissements.push(recu(eleve, mesTranches[0], part, 'MOBILE_MONEY', -55, compteur++, '1re partie'));
    } else if (profil === 2) {
      // Rien payé : tranche 1 échue non soldée
    } else {
      // Retard ancien : la 1re tranche n'a jamais été réglée, la 2e approche
    }

    // L'inscription, si payée, est encaissée comme un reçu séparé
    if (eleve.inscriptionPayee) {
      encaissements.push({
        id: `enc_ins_${i + 1}`,
        orgId: ORG_ECOLE,
        eleveId: eleve.id,
        trancheId: null,
        montant: config.inscription,
        canal: 'ESPECES',
        recu: numeroRecu(compteur++),
        note: 'Frais d’inscription',
        date: new Date(debut.getTime() - 130 * 86_400_000).toISOString(),
      });
    }
  });

  return { eleves, tranches, encaissements, compteurRecu: compteur };
}

function recu(
  eleve: EleveRec,
  tranche: TrancheRec,
  montant: number,
  canal: EncaissementRec['canal'],
  jours: number,
  seq: number,
  note: string,
): EncaissementRec {
  return {
    id: `enc_${eleve.id}_${tranche.numero}_${seq}`,
    orgId: ORG_ECOLE,
    eleveId: eleve.id,
    trancheId: tranche.id,
    montant,
    canal,
    recu: numeroRecu(seq),
    note,
    date: new Date(Date.now() + jours * 86_400_000).toISOString(),
  };
}

function e(): EtatScolarite {
  if (!etat) etat = construireDemo();
  return etat;
}

export function resetScolariteDemo(): void {
  etat = null;
}

export function listElevesDemo(orgId: string): EleveRec[] {
  if (orgId !== ORG_ECOLE) return [];
  return [...e().eleves].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

export function listTranchesDemo(orgId: string, eleveId?: string): TrancheRec[] {
  if (orgId !== ORG_ECOLE) return [];
  return e().tranches.filter((t) => t.orgId === orgId && (!eleveId || t.eleveId === eleveId));
}

export function listEncaissementsDemo(orgId: string, eleveId?: string): EncaissementRec[] {
  if (orgId !== ORG_ECOLE) return [];
  return e()
    .encaissements.filter((x) => x.orgId === orgId && (!eleveId || x.eleveId === eleveId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function createEleveDemo(
  orgId: string,
  input: Partial<EleveRec> & { nom: string },
  nbTranches = REGLES_SCOLAIRE.nbTranchesParDefaut,
): EleveRec {
  const eleve: EleveRec = {
    id: `elv_${Math.random().toString(36).slice(2, 9)}`,
    orgId,
    matricule: input.matricule || `${new Date().getFullYear()}-${String(200 + e().eleves.length).padStart(3, '0')}`,
    nom: input.nom,
    sexe: input.sexe || 'M',
    classe: input.classe || 'Non affecté',
    parentNom: input.parentNom || 'Parent',
    parentTelephone: input.parentTelephone || '',
    fraisAnnuels: Math.round(input.fraisAnnuels || 0),
    fraisInscription: Math.round(input.fraisInscription || 0),
    inscriptionPayee: false,
    statut: 'ACTIF',
    createdAt: new Date().toISOString(),
  };
  e().eleves.push(eleve);

  // L'échéancier est créé immédiatement : l'école n'a rien à saisir de plus
  const t = calculerEcheancier(eleve.fraisAnnuels, nbTranches, new Date(Date.now() + 30 * 86_400_000));
  t.forEach((x) => {
    e().tranches.push({
      id: `trc_${Math.random().toString(36).slice(2, 9)}`,
      orgId,
      eleveId: eleve.id,
      numero: x.numero,
      libelle: x.libelle,
      montant: x.montant,
      echeance: x.echeance,
      montantPaye: 0,
    });
  });
  return eleve;
}

/** Encaisse un paiement : remplit la première tranche non soldée, puis les suivantes. */
export function encaisserDemo(
  orgId: string,
  eleveId: string,
  montant: number,
  canal: EncaissementRec['canal'] = 'ESPECES',
  note = '',
): { ok: boolean; message: string; encaissement?: EncaissementRec; reste: number } {
  const eleve = e().eleves.find((x) => x.id === eleveId && x.orgId === orgId);
  if (!eleve) return { ok: false, message: 'Élève introuvable.', reste: 0 };
  const montantNet = Math.round(montant);
  if (montantNet <= 0) return { ok: false, message: 'Le montant doit être supérieur à zéro.', reste: 0 };

  // GARDE-FOU : jamais un centime de plus que ce qui est dû.
  //  - compte soldé  -> aucun encaissement possible (sinon on émet un reçu pour rien)
  //  - excédent      -> refusé, avec le montant exact à encaisser
  const situation = situationEleve(eleve, e().tranches);
  if (situation.reste <= 0) {
    return {
      ok: false,
      message: `${eleve.nom} n'a plus rien à payer : le compte est soldé.`,
      reste: 0,
    };
  }
  if (montantNet > situation.reste) {
    return {
      ok: false,
      message: `Le montant dépasse ce qui reste à payer (${situation.reste.toLocaleString('fr-FR')} FCFA). Corrigez le montant.`,
      reste: situation.reste,
    };
  }

  let restant = montantNet;

  // 1) On solde d'abord les tranches échues (les plus anciennes)
  const mesTranches = e()
    .tranches.filter((t) => t.eleveId === eleveId)
    .sort((a, b) => new Date(a.echeance).getTime() - new Date(b.echeance).getTime());

  let trancheTouchee: TrancheRec | null = null;
  for (const t of mesTranches) {
    if (restant <= 0) break;
    const du = t.montant - t.montantPaye;
    if (du <= 0) continue;
    const verse = Math.min(du, restant);
    t.montantPaye += verse;
    restant -= verse;
    trancheTouchee = t;
  }

  // 2) S'il reste de l'argent (avance), on le garde sur la dernière tranche
  if (restant > 0 && mesTranches.length) {
    const derniere = mesTranches[mesTranches.length - 1];
    derniere.montantPaye += restant;
    trancheTouchee = derniere;
    restant = 0;
  }

  const encaissement: EncaissementRec = {
    id: `enc_${Math.random().toString(36).slice(2, 9)}`,
    orgId,
    eleveId,
    trancheId: trancheTouchee ? trancheTouchee.id : null,
    montant: montantNet,
    canal,
    recu: numeroRecu(e().compteurRecu++),
    note,
    date: new Date().toISOString(),
  };
  e().encaissements.push(encaissement);

  const apres = situationEleve(eleve, e().tranches);
  return {
    ok: true,
    message: `Reçu ${encaissement.recu} : ${montantNet.toLocaleString('fr-FR')} FCFA encaissés pour ${eleve.nom}. Reste à payer : ${apres.reste.toLocaleString('fr-FR')} FCFA.`,
    encaissement,
    reste: apres.reste,
  };
}

/** Encaissement de l'inscription (une seule fois). */
export function encaisserInscriptionDemo(orgId: string, eleveId: string, canal: EncaissementRec['canal'] = 'ESPECES') {
  const eleve = e().eleves.find((x) => x.id === eleveId && x.orgId === orgId);
  if (!eleve) return { ok: false, message: 'Élève introuvable.' };
  if (eleve.inscriptionPayee) return { ok: false, message: 'L’inscription de cet élève est déjà payée.' };
  eleve.inscriptionPayee = true;
  e().encaissements.push({
    id: `enc_ins_${Math.random().toString(36).slice(2, 9)}`,
    orgId,
    eleveId,
    trancheId: null,
    montant: eleve.fraisInscription,
    canal,
    recu: numeroRecu(e().compteurRecu++),
    note: 'Frais d’inscription',
    date: new Date().toISOString(),
  });
  return { ok: true, message: `Inscription de ${eleve.nom} encaissée (${eleve.fraisInscription.toLocaleString('fr-FR')} FCFA).` };
}

export const ORG_ECOLE_DEMO = ORG_ECOLE;
export const CLASSES_DEMO_PUBLIC = CLASSES_DEMO;
