// =============================================================================
// MB Mustapha — MOTEUR DE PAIE (CNPS / CNSS / IRPP / ITS) — Cameroun, Tchad, Bénin, Togo
// -----------------------------------------------------------------------------
// Ce fichier contient le CŒUR de calcul : c'est du code pur (aucun accès base,
// aucune dépendance serveur), donc utilisable côté serveur ET dans le
// navigateur (simulateur de salaire brut → net).
//
// ⚠️ HONNÊTETÉ : la MÉTHODE de calcul est correcte (cotisations plafonnées,
// abattement pour frais professionnels, impôt progressif par tranches, taxe
// communale, part patronale). Les TAUX et BARÈMES sont des valeurs de travail
// à faire valider par votre comptable (ils changent chaque année en loi de
// finances). Modifiez-les dans lib/config.ts → PAIE_PARAMS.
// =============================================================================

import { PAIE_PARAMS_PAYS, type ParametresPaie, type TrancheImpot } from './config';
import type { BulletinRec, EmployeRec } from './types';

// ---------------------------------------------------------------------------
// Nouveaux paramètres complémentaires (transport exonéré, jours ouvrés)
// ---------------------------------------------------------------------------
const TRANSPORT_EXONERE_PLAFOND = 30_000; // FCFA/mois : indemnité de transport exonérée
const JOURS_OUVRES_MOIS = 26; // base usuelle pour convertir un salaire mensuel en taux journalier

export const REGLES_PAIE = {
  transportExonerePlafond: TRANSPORT_EXONERE_PLAFOND,
  joursOuvresMois: JOURS_OUVRES_MOIS,
};

// ---------------------------------------------------------------------------
// Entrées / sorties du moteur
// ---------------------------------------------------------------------------
export type LigneBulletin = {
  code: string;
  libelle: string;
  base: number; // base de calcul (FCFA)
  taux: number; // % (0 pour une ligne forfaitaire)
  montant: number; // FCFA
  nature: 'GAIN' | 'COTISATION_SALARIE' | 'IMPOT' | 'COTISATION_PATRONALE' | 'DEDUCTION';
};

export type ResultatPaie = {
  pays: string;
  organisme: string;
  brutBase: number;
  indemniteTransportImposable: number;
  brutTotal: number;
  brutImposable: number;
  lignes: LigneBulletin[];
  totalCotisationsSalarie: number;
  baseImpot: number;
  impotBrut: number;
  taxeCommunale: number;
  impotTotal: number;
  avances: number;
  totalRetenues: number;
  netAPayer: number;
  partPatronale: number;
  coutEmployeur: number;
  tauxEffectif: number; // % de retenues sur le brut total
  alertes: string[];
  parametres: ParametresPaie;
};

export type EntreePaie = {
  pays: string; // CM, TD, BJ, TG
  type?: 'MENSUEL' | 'JOURNALIER';
  salaireBrut?: number; // mensuel
  tauxJour?: number; // journalier (FCFA / jour)
  joursTravailles?: number; // journalier
  transport?: number; // indemnité de transport
  sursalaire?: number; // primes et sursalaires imposables
  autresGains?: number; // autres éléments imposables
  avances?: number; // avances déjà versées, déduites du net
  params?: Partial<ParametresPaie>; // pour tester un autre barème
};

// ---------------------------------------------------------------------------
// 1. Impôt progressif par tranches
// ---------------------------------------------------------------------------
export function calculImpotProgressif(base: number, tranches: TrancheImpot[]): number {
  let impot = 0;
  let plancher = 0;
  for (const t of tranches) {
    if (base <= plancher) break;
    const dansLaTranche = Math.min(base, t.jusqua) - plancher;
    if (dansLaTranche > 0) impot += (dansLaTranche * t.taux) / 100;
    plancher = t.jusqua;
  }
  return Math.round(impot);
}

/** Taux marginal atteint (utile pour expliquer au patron). */
export function tauxMarginal(base: number, tranches: TrancheImpot[]): number {
  let taux = tranches[0]?.taux ?? 0;
  for (const t of tranches) if (base > (t.jusqua === Infinity ? -1 : 0) && base > 0) taux = t.taux;
  return taux;
}

// ---------------------------------------------------------------------------
// 2. Calcul complet d'un bulletin
// ---------------------------------------------------------------------------
export function calculerBulletin(entree: EntreePaie): ResultatPaie {
  const params: ParametresPaie = { ...PAIE_PARAMS_PAYS(entree.pays), ...(entree.params || {}) };
  const alertes: string[] = [];
  const lignes: LigneBulletin[] = [];

  const type = entree.type || 'MENSUEL';

  // --- a) Brut de base -----------------------------------------------------
  let brutBase = 0;
  if (type === 'JOURNALIER') {
    const jours = Math.max(0, Math.round(entree.joursTravailles ?? 0));
    const taux = Math.max(0, Math.round(entree.tauxJour ?? 0));
    brutBase = jours * taux;
    if (jours > 26) alertes.push(`${jours} jours pointés : vérifiez le pointage (un mois compte en général 26 jours ouvrables).`);
    if (taux > 0 && taux < 1_000) alertes.push('Taux journalier faible : vérifiez qu’il respecte le SMIG de votre pays.');
  } else {
    brutBase = Math.max(0, Math.round(entree.salaireBrut ?? 0));
  }

  const transport = Math.max(0, Math.round(entree.transport ?? 0));
  const sursalaire = Math.max(0, Math.round(entree.sursalaire ?? 0));
  const autresGains = Math.max(0, Math.round(entree.autresGains ?? 0));

  // --- b) Transport : exonéré jusqu'à un plafond ---------------------------
  const transportExonere = Math.min(transport, TRANSPORT_EXONERE_PLAFOND);
  const transportImposable = Math.max(0, transport - transportExonere);
  if (transport > TRANSPORT_EXONERE_PLAFOND) {
    alertes.push(
      `Indemnité de transport de ${transport.toLocaleString('fr-FR')} FCFA : la fraction au-dessus de ${TRANSPORT_EXONERE_PLAFOND.toLocaleString('fr-FR')} FCFA est réintégrée dans l’imposable.`,
    );
  }

  const brutTotal = brutBase + transport + sursalaire + autresGains;
  const brutImposable = brutBase + transportImposable + sursalaire + autresGains;

  lignes.push({ code: 'BRUT', libelle: type === 'JOURNALIER' ? `Salaire journalier (${entree.joursTravailles ?? 0} j × ${(entree.tauxJour ?? 0).toLocaleString('fr-FR')} FCFA)` : 'Salaire de base', base: brutBase, taux: 0, montant: brutBase, nature: 'GAIN' });
  if (transport > 0) lignes.push({ code: 'TRANSPORT', libelle: `Indemnité de transport (exonérée : ${transportExonere.toLocaleString('fr-FR')} FCFA)`, base: transport, taux: 0, montant: transport, nature: 'GAIN' });
  if (sursalaire > 0) lignes.push({ code: 'PRIME', libelle: 'Primes et sursalaires', base: sursalaire, taux: 0, montant: sursalaire, nature: 'GAIN' });
  if (autresGains > 0) lignes.push({ code: 'AUTRES', libelle: 'Autres gains imposables', base: autresGains, taux: 0, montant: autresGains, nature: 'GAIN' });

  // --- c) Cotisations salariales (plafonnées) ------------------------------
  let totalCotisationsSalarie = 0;

  const baseRetraite = Math.min(brutImposable, params.plafondSalarie);
  const retraite = Math.round((baseRetraite * params.tauxSalarie) / 100);
  totalCotisationsSalarie += retraite;
  lignes.push({
    code: 'CNPS_SAL',
    libelle: `${params.organisme} — part salariale (plafond ${params.plafondSalarie.toLocaleString('fr-FR')} FCFA)`,
    base: baseRetraite,
    taux: params.tauxSalarie,
    montant: retraite,
    nature: 'COTISATION_SALARIE',
  });
  if (brutImposable > params.plafondSalarie) {
    alertes.push(
      `Le brut dépasse le plafond de cotisation (${params.plafondSalarie.toLocaleString('fr-FR')} FCFA) : au-delà, plus de cotisation retraite.`,
    );
  }

  for (const autre of params.autresSalarie || []) {
    const base = Math.min(brutImposable, autre.plafond ?? Infinity);
    const montant = Math.round((base * autre.taux) / 100);
    if (montant > 0) {
      totalCotisationsSalarie += montant;
      lignes.push({ code: `AUTRE_${autre.nom}`, libelle: autre.nom, base, taux: autre.taux, montant, nature: 'COTISATION_SALARIE' });
    }
  }

  // --- d) Impôt : cotisations déduites, puis abattement frais pro ----------
  const apresCotisations = brutImposable - totalCotisationsSalarie;
  const baseImpot = Math.max(0, Math.round(apresCotisations * (1 - params.abattementImpot / 100)));
  const impotBrut = calculImpotProgressif(baseImpot, params.tranches);
  const taxeCommunale = params.taxeCommunale ? Math.round((impotBrut * params.taxeCommunale) / 100) : 0;
  const impotTotal = impotBrut + taxeCommunale;

  lignes.push({ code: 'BASE_IMPOT', libelle: `Base imposable (abattement frais professionnels ${params.abattementImpot}%)`, base: baseImpot, taux: 0, montant: baseImpot, nature: 'IMPOT' });
  lignes.push({ code: 'IRPP', libelle: 'Impôt sur le salaire (barème progressif)', base: baseImpot, taux: 0, montant: impotBrut, nature: 'IMPOT' });
  if (taxeCommunale > 0) {
    lignes.push({ code: 'CAC', libelle: `Centimes additionnels communaux (${params.taxeCommunale}% de l’impôt)`, base: impotBrut, taux: params.taxeCommunale, montant: taxeCommunale, nature: 'IMPOT' });
  }

  // --- e) Net à payer ------------------------------------------------------
  const avances = Math.max(0, Math.round(entree.avances ?? 0));
  const totalRetenues = totalCotisationsSalarie + impotTotal;
  let netAPayer = brutTotal - totalRetenues - avances;
  if (netAPayer < 0) {
    alertes.push('Le net à payer est négatif : les avances dépassent le salaire. Reportez le solde sur le mois suivant.');
    netAPayer = 0;
  }
  if (avances > 0) lignes.push({ code: 'AVANCES', libelle: 'Avances déjà versées', base: avances, taux: 0, montant: avances, nature: 'DEDUCTION' });

  // --- f) Part patronale (coût réel pour l'employeur) ----------------------
  const basePatronale = Math.min(brutImposable, params.plafondPatronal ?? Infinity);
  const partPatronale = Math.round((basePatronale * params.tauxPatronal) / 100);
  const coutEmployeur = brutTotal + partPatronale;
  lignes.push({
    code: 'CNPS_PAT',
    libelle: `${params.organisme} — part patronale (${params.tauxPatronal}%)`,
    base: basePatronale,
    taux: params.tauxPatronal,
    montant: partPatronale,
    nature: 'COTISATION_PATRONALE',
  });

  // --- g) Contrôles métier -------------------------------------------------
  if (type === 'MENSUEL' && brutBase > 0 && brutBase < params.smig) {
    alertes.push(`Salaire de base inférieur au SMIG (${params.smig.toLocaleString('fr-FR')} FCFA) : risque de redressement auprès de l’inspection du travail.`);
  }

  return {
    pays: params.pays,
    organisme: params.organisme,
    brutBase,
    indemniteTransportImposable: transportImposable,
    brutTotal,
    brutImposable,
    lignes,
    totalCotisationsSalarie,
    baseImpot,
    impotBrut,
    taxeCommunale,
    impotTotal,
    avances,
    totalRetenues,
    netAPayer,
    partPatronale,
    coutEmployeur,
    tauxEffectif: brutTotal ? Math.round((totalRetenues / brutTotal) * 1000) / 10 : 0,
    alertes,
    parametres: params,
  };
}

/** Convertit un salaire mensuel en taux journalier (26 jours ouvrables). */
export function tauxJournalierDepuisMensuel(salaireMensuel: number): number {
  return Math.round(salaireMensuel / JOURS_OUVRES_MOIS);
}

// ---------------------------------------------------------------------------
// 3. Employés et bulletins de démonstration (mode sans base de données)
// ---------------------------------------------------------------------------
const MOIS_COURANT = new Date().toISOString().slice(0, 7);
const MOIS_PRECEDENT = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 7);

function employesDeDemo(): EmployeRec[] {
  return [
    // --- N'Djaména (Tchad) ---
    { id: 'emp_ndj_1', orgId: 'org_ndjamena', nom: 'Abakar Mahamat', poste: 'Chef magasinier', type: 'MENSUEL', salaireBrut: 180_000, tauxJour: 0, transport: 25_000, sursalaire: 20_000, autresGains: 0, avances: 0, telephone: '+235 66 12 34 56', actif: true, dateEmbauche: new Date(Date.now() - 1400 * 86_400_000).toISOString() },
    { id: 'emp_ndj_2', orgId: 'org_ndjamena', nom: 'Fatimé Hassan', poste: 'Caissière', type: 'MENSUEL', salaireBrut: 120_000, tauxJour: 0, transport: 15_000, sursalaire: 0, autresGains: 0, avances: 20_000, telephone: '+235 63 77 88 99', actif: true, dateEmbauche: new Date(Date.now() - 600 * 86_400_000).toISOString() },
    { id: 'emp_ndj_3', orgId: 'org_ndjamena', nom: 'Ali Brahim', poste: 'Manutentionnaire (journalier)', type: 'JOURNALIER', salaireBrut: 0, tauxJour: 3_000, transport: 0, sursalaire: 0, autresGains: 0, avances: 0, telephone: '+235 99 45 67 21', actif: true, dateEmbauche: new Date(Date.now() - 320 * 86_400_000).toISOString() },
    // --- Douala (Cameroun) ---
    { id: 'emp_dla_1', orgId: 'org_douala', nom: 'Ngo Bassa Marie', poste: 'Comptable', type: 'MENSUEL', salaireBrut: 350_000, tauxJour: 0, transport: 30_000, sursalaire: 0, autresGains: 0, avances: 0, telephone: '+237 6 99 11 22 33', actif: true, dateEmbauche: new Date(Date.now() - 900 * 86_400_000).toISOString() },
    { id: 'emp_dla_2', orgId: 'org_douala', nom: 'Tchoumi Paul', poste: 'Commercial', type: 'MENSUEL', salaireBrut: 180_000, tauxJour: 0, transport: 20_000, sursalaire: 60_000, autresGains: 0, avances: 0, telephone: '+237 6 77 44 55 66', actif: true, dateEmbauche: new Date(Date.now() - 480 * 86_400_000).toISOString() },
    { id: 'emp_dla_3', orgId: 'org_douala', nom: 'Ekotto Jean', poste: 'Chauffeur-livreur', type: 'MENSUEL', salaireBrut: 140_000, tauxJour: 0, transport: 35_000, sursalaire: 0, autresGains: 0, avances: 30_000, telephone: '+237 6 55 77 88 99', actif: true, dateEmbauche: new Date(Date.now() - 700 * 86_400_000).toISOString() },
    { id: 'emp_dla_4', orgId: 'org_douala', nom: 'Sandjo Alice', poste: 'Vendeuse (journalière)', type: 'JOURNALIER', salaireBrut: 0, tauxJour: 3_500, transport: 0, sursalaire: 0, autresGains: 0, avances: 0, telephone: '+237 6 90 12 34 56', actif: true, dateEmbauche: new Date(Date.now() - 210 * 86_400_000).toISOString() },
    // --- Cotonou (Bénin) ---
    { id: 'emp_ctn_1', orgId: 'org_cotonou', nom: 'Assogba Pierre', poste: 'Gérant', type: 'MENSUEL', salaireBrut: 220_000, tauxJour: 0, transport: 20_000, sursalaire: 25_000, autresGains: 0, avances: 0, telephone: '+229 97 11 22 33', actif: true, dateEmbauche: new Date(Date.now() - 1100 * 86_400_000).toISOString() },
    { id: 'emp_ctn_2', orgId: 'org_cotonou', nom: 'Adjoa Reine', poste: 'Agent de recouvrement', type: 'MENSUEL', salaireBrut: 110_000, tauxJour: 0, transport: 18_000, sursalaire: 0, autresGains: 0, avances: 0, telephone: '+229 96 44 55 66', actif: true, dateEmbauche: new Date(Date.now() - 380 * 86_400_000).toISOString() },
    { id: 'emp_ctn_3', orgId: 'org_cotonou', nom: 'Sanni Karim', poste: 'Coursier (journalier)', type: 'JOURNALIER', salaireBrut: 0, tauxJour: 2_800, transport: 0, sursalaire: 0, autresGains: 0, avances: 0, telephone: '+229 95 77 88 99', actif: true, dateEmbauche: new Date(Date.now() - 150 * 86_400_000).toISOString() },
    // --- Lomé (Togo) ---
    { id: 'emp_lom_1', orgId: 'org_lome', nom: 'Kodjo Ama', poste: 'Enseignante', type: 'MENSUEL', salaireBrut: 130_000, tauxJour: 0, transport: 15_000, sursalaire: 0, autresGains: 0, avances: 0, telephone: '+228 91 22 33 44', actif: true, dateEmbauche: new Date(Date.now() - 520 * 86_400_000).toISOString() },
    { id: 'emp_lom_2', orgId: 'org_lome', nom: 'Mensah Yao', poste: 'Gardien', type: 'MENSUEL', salaireBrut: 85_000, tauxJour: 0, transport: 10_000, sursalaire: 0, autresGains: 0, avances: 5_000, telephone: '+228 90 55 66 77', actif: true, dateEmbauche: new Date(Date.now() - 260 * 86_400_000).toISOString() },
  ];
}

/** Pointages du mois pour les journaliers (30 jours, absences incluses). */
const POINTAGES: Record<string, number> = {
  emp_ndj_3: 24,
  emp_dla_4: 26,
  emp_ctn_3: 22,
};

type EtatPaie = { employes: EmployeRec[]; bulletins: BulletinRec[]; pointages: Record<string, number> };

let etat: EtatPaie | null = null;

function e(): EtatPaie {
  if (!etat) {
    const employes = employesDeDemo();
    const bulletins: BulletinRec[] = [];
    // On génère un bulletin réel (calculé par le moteur) pour le mois précédent
    for (const emp of employes) {
      const res = calculerBulletin({
        pays: paysDeOrg(emp.orgId),
        type: emp.type,
        salaireBrut: emp.salaireBrut,
        tauxJour: emp.tauxJour,
        joursTravailles: POINTAGES[emp.id] ?? 0,
        transport: emp.transport,
        sursalaire: emp.sursalaire,
        autresGains: emp.autresGains,
        avances: emp.avances,
      });
      bulletins.push({
        id: `bul_${emp.id}_${MOIS_PRECEDENT}`,
        orgId: emp.orgId,
        employeId: emp.id,
        employeNom: emp.nom,
        poste: emp.poste,
        periode: MOIS_PRECEDENT,
        joursTravailles: emp.type === 'JOURNALIER' ? POINTAGES[emp.id] ?? 0 : null,
        brutTotal: res.brutTotal,
        brutImposable: res.brutImposable,
        totalCotisationsSalarie: res.totalCotisationsSalarie,
        impotTotal: res.impotTotal,
        avances: res.avances,
        netAPayer: res.netAPayer,
        partPatronale: res.partPatronale,
        coutEmployeur: res.coutEmployeur,
        lignes: res.lignes,
        alertes: res.alertes,
        organisme: res.organisme,
        pays: res.pays,
        createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
      });
    }
    etat = { employes, bulletins, pointages: { ...POINTAGES } };
  }
  return etat;
}

function paysDeOrg(orgId: string): string {
  if (orgId.includes('ndjamena')) return 'TD';
  if (orgId.includes('douala') || orgId.includes('garoua')) return 'CM';
  if (orgId.includes('cotonou')) return 'BJ';
  if (orgId.includes('lome')) return 'TG';
  return 'CM';
}

export function resetPaieDemo(): void {
  etat = null;
}

export function listEmployesDemo(orgId: string): EmployeRec[] {
  return e().employes.filter((x) => x.orgId === orgId);
}

export function createEmployeDemo(orgId: string, input: Partial<EmployeRec> & { nom: string }): EmployeRec {
  const rec: EmployeRec = {
    id: `emp_${Math.random().toString(36).slice(2, 9)}`,
    orgId,
    nom: input.nom,
    poste: input.poste || 'Employé',
    type: input.type || 'MENSUEL',
    salaireBrut: input.salaireBrut || 0,
    tauxJour: input.tauxJour || 0,
    transport: input.transport || 0,
    sursalaire: input.sursalaire || 0,
    autresGains: 0,
    avances: 0,
    telephone: input.telephone || '',
    actif: true,
    dateEmbauche: new Date().toISOString(),
  };
  e().employes.push(rec);
  return rec;
}

export function listBulletinsDemo(orgId: string, periode?: string): BulletinRec[] {
  return e()
    .bulletins.filter((b) => b.orgId === orgId && (!periode || b.periode === periode))
    .sort((a, b) => (a.periode < b.periode ? 1 : -1));
}

export function getBulletinDemo(id: string): BulletinRec | null {
  return e().bulletins.find((b) => b.id === id) || null;
}

export function listPointagesPrixUtilise(orgId: string) {
  return listEmployesDemo(orgId)
    .filter((x) => x.type === 'JOURNALIER')
    .map((x) => ({ employeId: x.id, nom: x.nom, jours: e().pointages[x.id] ?? 0, tauxJour: x.tauxJour }));
}

/** Génère les bulletins d'un mois pour tous les employés actifs (idempotent). */
export function genererBulletinsDemo(orgId: string, periode: string): BulletinRec[] {
  const employes = listEmployesDemo(orgId).filter((x) => x.actif);
  const crees: BulletinRec[] = [];
  for (const emp of employes) {
    const existant = e().bulletins.find((b) => b.employeId === emp.id && b.periode === periode);
    if (existant) continue;
    const res = calculerBulletin({
      pays: paysDeOrg(orgId),
      type: emp.type,
      salaireBrut: emp.salaireBrut,
      tauxJour: emp.tauxJour,
      joursTravailles: e().pointages[emp.id] ?? 0,
      transport: emp.transport,
      sursalaire: emp.sursalaire,
      autresGains: emp.autresGains,
      avances: emp.avances,
    });
    const bulletin: BulletinRec = {
      id: `bul_${emp.id}_${periode}`,
      orgId,
      employeId: emp.id,
      employeNom: emp.nom,
      poste: emp.poste,
      periode,
      joursTravailles: emp.type === 'JOURNALIER' ? e().pointages[emp.id] ?? 0 : null,
      brutTotal: res.brutTotal,
      brutImposable: res.brutImposable,
      totalCotisationsSalarie: res.totalCotisationsSalarie,
      impotTotal: res.impotTotal,
      avances: res.avances,
      netAPayer: res.netAPayer,
      partPatronale: res.partPatronale,
      coutEmployeur: res.coutEmployeur,
      lignes: res.lignes,
      alertes: res.alertes,
      organisme: res.organisme,
      pays: res.pays,
      createdAt: new Date().toISOString(),
    };
    e().bulletins.push(bulletin);
    crees.push(bulletin);
  }
  return crees;
}

export function majPointageDemo(employeId: string, jours: number): { ok: boolean; message: string } {
  const emp = e().employes.find((x) => x.id === employeId);
  if (!emp) return { ok: false, message: 'Employé introuvable.' };
  if (jours < 0 || jours > 31) return { ok: false, message: 'Nombre de jours invalide (0 à 31).' };
  e().pointages[employeId] = jours;
  return { ok: true, message: `Pointage de ${emp.nom} mis à jour : ${jours} jour(s).` };
}

export const PERIODE_COURANTE = MOIS_COURANT;
export const PERIODE_PRECEDENTE = MOIS_PRECEDENT;

/** Aide à la conversion pour les pays (utilisée par les tests et l'UI). */
export const PAYS_DE_ORG_DEMO = paysDeOrg;
