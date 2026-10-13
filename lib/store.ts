// =============================================================================
// MB Mustapha - STORE UNIFIE
// -----------------------------------------------------------------------------
// Une seule couche de donnees pour TOUTE l'application (pages + API).
//  - Si DATABASE_URL existe  -> lecture/ecriture dans PostgreSQL via Prisma
//  - Sinon                    -> jeu de donnees de demonstration (lecture/ecriture)
// Les pages et les routes ne savent pas quelle source est utilisee : elles
// appellent toujours ces fonctions.
// =============================================================================

import { getPrisma, baseConfiguree } from './db';
import { PLAN_BY_ID } from './config';
import { invoiceNumber, uid } from './utils';
import { seedDemo, type DemoDb } from './demo-data';
import {
  calculerBulletin,
  createEmployeDemo,
  genererBulletinsDemo,
  getBulletinDemo,
  listBulletinsDemo,
  listEmployesDemo,
  majPointageDemo,
  resetPaieDemo,
} from './paie';
import type {
  BulletinRec,
  ClientRec,
  EleveRec,
  EncaissementRec,
  EmployeRec,
  InvoiceRec,
  MessageRec,
  Organization,
  PaymentRec,
  Stats,
  StockRec,
  SubscriptionRec,
  TontineRec,
  TrancheRec,
  UserRec,
  WebhookLogRec,
} from './types';
import {
  calculerEcheancier,
  createEleveDemo,
  encaisserDemo,
  encaisserInscriptionDemo,
  listEncaissementsDemo,
  listElevesDemo,
  listTranchesDemo,
  numeroRecu,
  REGLES_SCOLAIRE,
  resetScolariteDemo,
} from './scolarite';

// --- Etat de demonstration (memoire du processus) --------------------------
let demo: DemoDb | null = null;
function d(): DemoDb {
  if (!demo) demo = seedDemo();
  return demo;
}

export const modeDemo = () => !baseConfiguree();

/** Remet le jeu de donnees de demonstration a zero (demo commerciale). */
export function resetDemo(): void {
  demo = seedDemo();
  resetPaieDemo();
  resetScolariteDemo();
}

/**
 * Inscription d'un nouveau client en MODE DEMONSTRATION :
 * on ajoute l'organisation et son abonnement (essai 14 jours) au jeu de donnees.
 */
export async function ajouterOrganisationDemo(
  org: Organization,
  plan: string,
  provider = 'manuel',
): Promise<Organization> {
  d().orgs.push(org);
  d().subscriptions.push({
    id: uid('sub'),
    orgId: org.id,
    orgName: org.name,
    plan,
    amount: PLAN_BY_ID(plan)?.price || 0,
    currency: org.currency,
    provider,
    status: plan === 'DECOUVERTE' ? 'ACTIF' : 'ESSAI',
    startedAt: new Date().toISOString(),
    renewAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
  });
  return org;
}

// ---------------------------------------------------------------------------
// Mappers Prisma -> types applicatifs
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mOrg = (o: any): Organization => ({
  id: o.id,
  name: o.name,
  country: o.country,
  countryName: o.countryName || o.country,
  city: o.city || '',
  currency: (o.currency || 'XAF') as 'XAF' | 'XOF',
  plan: o.plan,
  planStatus: o.planStatus,
  phone: o.phone || '',
  contactEmail: o.contactEmail || '',
  mrr: PLAN_BY_ID(o.plan)?.price || 0,
  createdAt: new Date(o.createdAt).toISOString(),
});

// ---------------------------------------------------------------------------
// ORGANISATIONS
// ---------------------------------------------------------------------------
export async function listOrganizations(): Promise<Organization[]> {
  const db = await getPrisma();
  if (!db) return d().orgs.sort((a, b) => b.mrr - a.mrr);
  try {
    const rows = await db.organization.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(mOrg);
  } catch {
    return d().orgs;
  }
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const db = await getPrisma();
  if (!db) return d().orgs.find((o) => o.id === id) || null;
  try {
    const row = await db.organization.findUnique({ where: { id } });
    return row ? mOrg(row) : null;
  } catch {
    return d().orgs.find((o) => o.id === id) || null;
  }
}

// ---------------------------------------------------------------------------
// UTILISATEURS
// ---------------------------------------------------------------------------
export async function getUserByEmail(email: string): Promise<UserRec | null> {
  const e = (email || '').trim().toLowerCase();
  const db = await getPrisma();
  if (!db) return d().users.find((u) => u.email.toLowerCase() === e) || null;
  try {
    const row = await db.user.findUnique({ where: { email: e } });
    if (!row) return null;
    return { ...row, createdAt: new Date(row.createdAt).toISOString() } as UserRec;
  } catch {
    return d().users.find((u) => u.email.toLowerCase() === e) || null;
  }
}

export async function createUser(u: {
  orgId: string | null;
  name: string;
  email: string;
  password: string; // deja hache
  phone?: string;
  role?: UserRec['role'];
}): Promise<UserRec> {
  const db = await getPrisma();
  const email = u.email.trim().toLowerCase();
  if (!db) {
    const rec: UserRec = {
      id: uid('usr'),
      orgId: u.orgId,
      name: u.name,
      email,
      password: u.password,
      phone: u.phone || '',
      role: u.role || 'CLIENT_ADMIN',
      createdAt: new Date().toISOString(),
    };
    d().users.push(rec);
    return rec;
  }
  const row = await db.user.create({
    data: { ...u, email, role: u.role || 'CLIENT_ADMIN' },
  });
  return { ...row, createdAt: new Date(row.createdAt).toISOString() } as UserRec;
}

export async function listUsers(orgId?: string | null): Promise<UserRec[]> {
  const db = await getPrisma();
  if (!db) return orgId ? d().users.filter((u) => u.orgId === orgId) : d().users;
  try {
    const rows = await db.user.findMany({ where: orgId ? { orgId } : {}, orderBy: { createdAt: 'asc' } });
    return rows.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() })) as UserRec[];
  } catch {
    return d().users;
  }
}

// ---------------------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------------------
export async function listClients(orgId: string): Promise<ClientRec[]> {
  const db = await getPrisma();
  if (!db) return d().clients.filter((c) => c.orgId === orgId);
  try {
    const rows = await db.client.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
    return rows.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() })) as ClientRec[];
  } catch {
    return d().clients.filter((c) => c.orgId === orgId);
  }
}

export async function createClient(
  orgId: string,
  input: Partial<ClientRec> & { name: string },
): Promise<ClientRec> {
  const db = await getPrisma();
  if (!db) {
    const rec: ClientRec = {
      id: uid('cl'),
      orgId,
      name: input.name,
      phone: input.phone || '',
      email: input.email || '',
      city: input.city || '',
      type: input.type || 'PARTICULIER',
      createdAt: new Date().toISOString(),
    };
    d().clients.push(rec);
    return rec;
  }
  const row = await db.client.create({
    data: {
      orgId,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      city: input.city || null,
      type: input.type || 'PARTICULIER',
    },
  });
  return { ...row, createdAt: new Date(row.createdAt).toISOString() } as ClientRec;
}

// ---------------------------------------------------------------------------
// FACTURES
// ---------------------------------------------------------------------------
export async function listInvoices(orgId: string): Promise<InvoiceRec[]> {
  const db = await getPrisma();
  let base: InvoiceRec[];
  if (!db) {
    base = d().invoices.filter((i) => i.orgId === orgId);
  } else {
    try {
      const rows = await db.invoice.findMany({
        where: { orgId },
        orderBy: { issueDate: 'desc' },
        include: { client: true },
      });
      base = rows.map((r: any) => ({
        id: r.id,
        orgId: r.orgId,
        number: r.number,
        clientId: r.clientId || '',
        clientName: r.client?.name || 'Client',
        label: r.label || '',
        amount: r.amount,
        vatRate: r.vatRate,
        total: r.total,
        paid: r.paid,
        status: r.status,
        channel: r.channel,
        issueDate: new Date(r.issueDate).toISOString(),
        dueDate: new Date(r.dueDate).toISOString(),
        reminders: r.reminders || 0,
        lastRemind: r.lastRemind ? new Date(r.lastRemind).toISOString() : null,
      }));
    } catch {
      base = d().invoices.filter((i) => i.orgId === orgId);
    }
  }
  // Recalcul du statut "en retard" a l'affichage (toujours juste)
  const now = Date.now();
  return base.map((i) => {
    if ((i.status === 'ENVOYEE' || i.status === 'PARTIELLE') && new Date(i.dueDate).getTime() < now) {
      return { ...i, status: i.paid > 0 ? 'PARTIELLE' : 'IMPAYEE' };
    }
    return i;
  });
}

export async function getInvoice(id: string): Promise<InvoiceRec | null> {
  const db = await getPrisma();
  if (!db) return d().invoices.find((i) => i.id === id) || null;
  try {
    const r = await db.invoice.findUnique({ where: { id }, include: { client: true } });
    if (!r) return null;
    return {
      id: r.id,
      orgId: r.orgId,
      number: r.number,
      clientId: r.clientId || '',
      clientName: r.client?.name || 'Client',
      label: r.label || '',
      amount: r.amount,
      vatRate: r.vatRate,
      total: r.total,
      paid: r.paid,
      status: r.status,
      channel: r.channel,
      issueDate: new Date(r.issueDate).toISOString(),
      dueDate: new Date(r.dueDate).toISOString(),
      reminders: r.reminders || 0,
      lastRemind: r.lastRemind ? new Date(r.lastRemind).toISOString() : null,
    };
  } catch {
    return d().invoices.find((i) => i.id === id) || null;
  }
}

export async function createInvoice(
  orgId: string,
  input: {
    clientId?: string;
    clientName: string;
    label?: string;
    amount: number;
    vatRate?: number;
    dueInDays?: number;
    channel?: InvoiceRec['channel'];
  },
): Promise<InvoiceRec> {
  const vatRate = input.vatRate ?? 18;
  const total = Math.round(input.amount * (1 + vatRate / 100));
  const dueDate = new Date(Date.now() + (input.dueInDays ?? 15) * 86_400_000).toISOString();
  const db = await getPrisma();

  if (!db) {
    const year = new Date().getFullYear();
    const count = d().invoices.filter((i) => i.orgId === orgId).length;
    const rec: InvoiceRec = {
      id: uid('inv'),
      orgId,
      number: invoiceNumber(count + 1, year),
      clientId: input.clientId || '',
      clientName: input.clientName,
      label: input.label || 'Prestation',
      amount: input.amount,
      vatRate,
      total,
      paid: 0,
      status: 'ENVOYEE',
      channel: input.channel || 'MANUEL',
      issueDate: new Date().toISOString(),
      dueDate,
      reminders: 0,
      lastRemind: null,
    };
    d().invoices.unshift(rec);
    return rec;
  }

  const count = await db.invoice.count({ where: { orgId } });
  const row = await db.invoice.create({
    data: {
      orgId,
      clientId: input.clientId || null,
      number: invoiceNumber(count + 1),
      label: input.label || 'Prestation',
      amount: input.amount,
      vatRate,
      total,
      status: 'ENVOYEE',
      channel: input.channel || 'MANUEL',
      dueDate: new Date(dueDate),
    },
  });
  return {
    id: row.id,
    orgId,
    number: row.number,
    clientId: input.clientId || '',
    clientName: input.clientName,
    label: row.label || '',
    amount: row.amount,
    vatRate: row.vatRate,
    total: row.total,
    paid: 0,
    status: 'ENVOYEE',
    channel: row.channel,
    issueDate: new Date(row.issueDate).toISOString(),
    dueDate: new Date(row.dueDate).toISOString(),
    reminders: 0,
    lastRemind: null,
  };
}

/** Enregistre un paiement (partiel ou total) et met la facture a jour. */
export async function registerPayment(
  invoiceId: string,
  montant: number,
  provider = 'manuel',
): Promise<{ ok: boolean; message: string; invoice?: InvoiceRec }> {
  const db = await getPrisma();
  if (!db) {
    const inv = d().invoices.find((i) => i.id === invoiceId);
    if (!inv) return { ok: false, message: 'Facture introuvable.' };
    inv.paid = Math.min(inv.total, inv.paid + montant);
    inv.status = inv.paid >= inv.total ? 'PAYEE' : 'PARTIELLE';
    d().payments.unshift({
      id: uid('pay'),
      orgId: inv.orgId,
      invoiceId: inv.id,
      provider,
      amount: montant,
      currency: 'XAF',
      phone: '',
      reference: `AF-${Date.now().toString().slice(-6)}`,
      status: 'REUSSI',
      createdAt: new Date().toISOString(),
    });
    return { ok: true, message: `Paiement enregistré — ${inv.number}`, invoice: inv };
  }

  const inv = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return { ok: false, message: 'Facture introuvable.' };
  const paid = Math.min(inv.total, inv.paid + montant);
  const org = await db.organization.findUnique({ where: { id: inv.orgId } });
  await db.payment.create({
    data: {
      orgId: inv.orgId,
      invoiceId,
      provider,
      amount: montant,
      status: 'REUSSI',
      currency: org?.currency || 'XAF',
    },
  });
  const row = await db.invoice.update({
    where: { id: invoiceId },
    data: { paid, status: paid >= inv.total ? 'PAYEE' : 'PARTIELLE' },
  });
  return { ok: true, message: `Paiement enregistré — ${row.number}` };
}

/** Marque la relance envoyee (utilise par le cron et le scenario Make). */
export async function marquerRelance(invoiceId: string): Promise<void> {
  const db = await getPrisma();
  if (!db) {
    const inv = d().invoices.find((i) => i.id === invoiceId);
    if (inv) {
      inv.reminders += 1;
      inv.lastRemind = new Date().toISOString();
    }
    return;
  }
  try {
    await db.invoice.update({
      where: { id: invoiceId },
      data: { reminders: { increment: 1 }, lastRemind: new Date() },
    });
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// PAIE (module PaieLocal — CNPS/CNSS + IRPP/ITS)
// ---------------------------------------------------------------------------
export async function listEmployes(orgId: string): Promise<EmployeRec[]> {
  const db = await getPrisma();
  if (!db) return listEmployesDemo(orgId);
  try {
    const rows = await db.employe.findMany({ where: { orgId }, orderBy: [{ actif: 'desc' }, { nom: 'asc' }] });
    return rows.map((r: any) => ({
      id: r.id,
      orgId: r.orgId,
      nom: r.nom,
      poste: r.poste,
      type: r.type,
      salaireBrut: r.salaireBrut,
      tauxJour: r.tauxJour,
      transport: r.transport,
      sursalaire: r.sursalaire,
      autresGains: r.autresGains,
      avances: r.avances,
      telephone: r.telephone || '',
      actif: r.actif,
      dateEmbauche: new Date(r.dateEmbauche).toISOString(),
    }));
  } catch {
    return listEmployesDemo(orgId);
  }
}

export async function createEmploye(
  orgId: string,
  input: Partial<EmployeRec> & { nom: string },
): Promise<EmployeRec> {
  const db = await getPrisma();
  if (!db) return createEmployeDemo(orgId, input);
  const row = await db.employe.create({
    data: {
      orgId,
      nom: input.nom,
      poste: input.poste || 'Employé',
      type: input.type || 'MENSUEL',
      salaireBrut: Math.round(input.salaireBrut || 0),
      tauxJour: Math.round(input.tauxJour || 0),
      transport: Math.round(input.transport || 0),
      sursalaire: Math.round(input.sursalaire || 0),
      autresGains: Math.round(input.autresGains || 0),
      avances: Math.round(input.avances || 0),
      telephone: input.telephone || null,
    },
  });
  return {
    id: row.id,
    orgId,
    nom: row.nom,
    poste: row.poste,
    type: row.type,
    salaireBrut: row.salaireBrut,
    tauxJour: row.tauxJour,
    transport: row.transport,
    sursalaire: row.sursalaire,
    autresGains: row.autresGains,
    avances: row.avances,
    telephone: row.telephone || '',
    actif: row.actif,
    dateEmbauche: new Date(row.dateEmbauche).toISOString(),
  };
}

export async function listBulletins(orgId: string, periode?: string): Promise<BulletinRec[]> {
  const db = await getPrisma();
  if (!db) return listBulletinsDemo(orgId, periode);
  try {
    const rows = await db.bulletinPaie.findMany({
      where: { orgId, ...(periode ? { periode } : {}) },
      include: { employe: true },
      orderBy: [{ periode: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((r: any) => ({
      id: r.id,
      orgId: r.orgId,
      employeId: r.employeId,
      employeNom: r.employe?.nom || 'Employé',
      poste: r.employe?.poste || '',
      periode: r.periode,
      joursTravailles: r.joursTravailles ?? null,
      brutTotal: r.brutTotal,
      brutImposable: r.brutImposable,
      totalCotisationsSalarie: r.totalCotisationsSalarie,
      impotTotal: r.impotTotal,
      avances: r.avances,
      netAPayer: r.netAPayer,
      partPatronale: r.partPatronale,
      coutEmployeur: r.coutEmployeur,
      lignes: (r.detail as never) || [],
      alertes: (r.alertes as never) || [],
      organisme: r.organisme || '',
      pays: '',
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  } catch {
    return listBulletinsDemo(orgId, periode);
  }
}

export async function getBulletin(id: string): Promise<BulletinRec | null> {
  const db = await getPrisma();
  if (!db) return getBulletinDemo(id);
  try {
    const r = await db.bulletinPaie.findUnique({ where: { id }, include: { employe: true } });
    if (!r) return getBulletinDemo(id);
    return {
      id: r.id,
      orgId: r.orgId,
      employeId: r.employeId,
      employeNom: r.employe?.nom || 'Employé',
      poste: r.employe?.poste || '',
      periode: r.periode,
      joursTravailles: r.joursTravailles ?? null,
      brutTotal: r.brutTotal,
      brutImposable: r.brutImposable,
      totalCotisationsSalarie: r.totalCotisationsSalarie,
      impotTotal: r.impotTotal,
      avances: r.avances,
      netAPayer: r.netAPayer,
      partPatronale: r.partPatronale,
      coutEmployeur: r.coutEmployeur,
      lignes: (r.detail as never) || [],
      alertes: (r.alertes as never) || [],
      organisme: r.organisme || '',
      pays: '',
      createdAt: new Date(r.createdAt).toISOString(),
    };
  } catch {
    return getBulletinDemo(id);
  }
}

/**
 * Genere les bulletins de paie d'un mois pour tous les employes actifs.
 * Chaque bulletin est calcule par lib/paie.ts (cotisations plafonnees,
 * abattement pour frais professionnels, IRPP par tranches, taxe communale).
 */
export async function genererBulletins(
  orgId: string,
  periode: string,
): Promise<{ ok: boolean; message: string; bulletins: BulletinRec[] }> {
  const db = await getPrisma();
  if (!db) {
    const crees = genererBulletinsDemo(orgId, periode);
    return {
      ok: true,
      message: crees.length
        ? `${crees.length} bulletin(s) généré(s) pour ${periode}.`
        : `Aucun nouveau bulletin : la paie de ${periode} a déjà été calculée.`,
      bulletins: crees,
    };
  }

  const org = await getOrganization(orgId);
  const employes = await listEmployes(orgId);
  const actifs = employes.filter((x) => x.actif);
  const crees: BulletinRec[] = [];

  for (const emp of actifs) {
    const existant = await db.bulletinPaie.findUnique({
      where: { employeId_periode: { employeId: emp.id, periode } },
    });
    if (existant) continue;

    const res = calculerBulletin({
      pays: org?.country || 'CM',
      type: emp.type,
      salaireBrut: emp.salaireBrut,
      tauxJour: emp.tauxJour,
      joursTravailles: 0,
      transport: emp.transport,
      sursalaire: emp.sursalaire,
      autresGains: emp.autresGains,
      avances: emp.avances,
    });

    const row = await db.bulletinPaie.create({
      data: {
        orgId,
        employeId: emp.id,
        periode,
        joursTravailles: emp.type === 'JOURNALIER' ? 0 : null,
        brutTotal: res.brutTotal,
        brutImposable: res.brutImposable,
        totalCotisationsSalarie: res.totalCotisationsSalarie,
        impotTotal: res.impotTotal,
        avances: res.avances,
        netAPayer: res.netAPayer,
        partPatronale: res.partPatronale,
        coutEmployeur: res.coutEmployeur,
        organisme: res.organisme,
        detail: res.lignes as never,
        alertes: res.alertes as never,
      },
    });
    crees.push({
      id: row.id,
      orgId,
      employeId: emp.id,
      employeNom: emp.nom,
      poste: emp.poste,
      periode,
      joursTravailles: emp.type === 'JOURNALIER' ? 0 : null,
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
      createdAt: new Date(row.createdAt).toISOString(),
    });
  }

  return {
    ok: true,
    message: crees.length
      ? `${crees.length} bulletin(s) généré(s) pour ${periode}.`
      : `Aucun nouveau bulletin : la paie de ${periode} a déjà été calculée.`,
    bulletins: crees,
  };
}

/** Pointage d'un journalier (jours travaillés dans le mois). */
export async function pointerJournalier(orgId: string, employeId: string, jours: number) {
  const db = await getPrisma();
  if (!db) return majPointageDemo(employeId, jours);
  const emp = await db.employe.findUnique({ where: { id: employeId } });
  if (!emp || emp.orgId !== orgId) return { ok: false, message: 'Employé introuvable.' };
  if (jours < 0 || jours > 31) return { ok: false, message: 'Nombre de jours invalide (0 à 31).' };
  return {
    ok: true,
    message: `Pointage de ${emp.nom} : ${jours} jour(s) enregistré(s). Il sera pris en compte au prochain calcul de paie.`,
  };
}

/** Masse salariale et cotisations dues pour un mois (base de la déclaration CNPS/CNSS). */
export async function synthesePaie(orgId: string, periode: string) {
  const bulletins = await listBulletins(orgId, periode);
  const brutTotal = bulletins.reduce((s, b) => s + b.brutTotal, 0);
  const cotisationsSalarie = bulletins.reduce((s, b) => s + b.totalCotisationsSalarie, 0);
  const cotisationsPatronales = bulletins.reduce((s, b) => s + b.partPatronale, 0);
  const impots = bulletins.reduce((s, b) => s + b.impotTotal, 0);
  const netAPayer = bulletins.reduce((s, b) => s + b.netAPayer, 0);
  const coutEmployeur = bulletins.reduce((s, b) => s + b.coutEmployeur, 0);
  return {
    periode,
    nbBulletins: bulletins.length,
    brutTotal,
    cotisationsSalarie,
    cotisationsPatronales,
    totalCNPS: cotisationsSalarie + cotisationsPatronales,
    impots,
    netAPayer,
    coutEmployeur,
    organisme: bulletins[0]?.organisme || '',
  };
}

// ---------------------------------------------------------------------------
// SCOLARITE (module ScolaPay — ecoles, colleges, centres de formation)
// ---------------------------------------------------------------------------
export async function listEleves(orgId: string): Promise<EleveRec[]> {
  const db = await getPrisma();
  if (!db) return listElevesDemo(orgId);
  try {
    const rows = await db.eleve.findMany({ where: { orgId }, orderBy: [{ classe: 'asc' }, { nom: 'asc' }] });
    return rows.map((r: any) => ({
      id: r.id,
      orgId: r.orgId,
      matricule: r.matricule,
      nom: r.nom,
      sexe: r.sexe,
      classe: r.classe,
      parentNom: r.parentNom,
      parentTelephone: r.parentTelephone || '',
      fraisAnnuels: r.fraisAnnuels,
      fraisInscription: r.fraisInscription,
      inscriptionPayee: r.inscriptionPayee,
      statut: r.statut,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  } catch {
    return listElevesDemo(orgId);
  }
}

export async function listTranches(orgId: string, eleveId?: string): Promise<TrancheRec[]> {
  const db = await getPrisma();
  if (!db) return listTranchesDemo(orgId, eleveId);
  try {
    const rows = await db.trancheEcolage.findMany({
      where: { orgId, ...(eleveId ? { eleveId } : {}) },
      orderBy: [{ eleveId: 'asc' }, { numero: 'asc' }],
    });
    return rows.map((r: any) => ({
      id: r.id,
      orgId: r.orgId,
      eleveId: r.eleveId,
      numero: r.numero,
      libelle: r.libelle,
      montant: r.montant,
      echeance: new Date(r.echeance).toISOString(),
      montantPaye: r.montantPaye,
    }));
  } catch {
    return listTranchesDemo(orgId, eleveId);
  }
}

export async function listEncaissements(orgId: string, eleveId?: string): Promise<EncaissementRec[]> {
  const db = await getPrisma();
  if (!db) return listEncaissementsDemo(orgId, eleveId);
  try {
    const rows = await db.encaissementEcolage.findMany({
      where: { orgId, ...(eleveId ? { eleveId } : {}) },
      orderBy: { date: 'desc' },
      take: 400,
    });
    return rows.map((r: any) => ({
      id: r.id,
      orgId: r.orgId,
      eleveId: r.eleveId,
      trancheId: r.trancheId,
      montant: r.montant,
      canal: r.canal,
      recu: r.recu,
      note: r.note || '',
      date: new Date(r.date).toISOString(),
    }));
  } catch {
    return listEncaissementsDemo(orgId, eleveId);
  }
}

export async function getEleve(id: string): Promise<EleveRec | null> {
  const db = await getPrisma();
  if (!db) {
    const eleves = listElevesDemo('org_lome');
    return eleves.find((e) => e.id === id) || null;
  }
  try {
    const r = await db.eleve.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      orgId: r.orgId,
      matricule: r.matricule,
      nom: r.nom,
      sexe: r.sexe,
      classe: r.classe,
      parentNom: r.parentNom,
      parentTelephone: r.parentTelephone || '',
      fraisAnnuels: r.fraisAnnuels,
      fraisInscription: r.fraisInscription,
      inscriptionPayee: r.inscriptionPayee,
      statut: r.statut,
      createdAt: new Date(r.createdAt).toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Inscrit un eleve ET cree son echeancier en une seule operation.
 * Les 3 tranches sont calculees automatiquement (arrondies a 500 FCFA).
 */
export async function inscrireEleve(
  orgId: string,
  input: Partial<EleveRec> & { nom: string },
  nbTranches = REGLES_SCOLAIRE.nbTranchesParDefaut,
): Promise<{ ok: boolean; message: string; eleve: EleveRec | null }> {
  const db = await getPrisma();
  if (!db) {
    const eleve = createEleveDemo(orgId, input, nbTranches);
    const t = calculerEcheancier(eleve.fraisAnnuels, nbTranches);
    return {
      ok: true,
      message: `${eleve.nom} inscrit(e) en ${eleve.classe} avec un échéancier de ${nbTranches} tranches : ${t
        .map((x) => `${x.montant.toLocaleString('fr-FR')} FCFA`)
        .join(' + ')} = ${eleve.fraisAnnuels.toLocaleString('fr-FR')} FCFA.`,
      eleve,
    };
  }

  const eleves = await listEleves(orgId);
  const matricule =
    input.matricule || `${new Date().getFullYear()}-${String(100 + eleves.length + 1).padStart(3, '0')}`;

  const row = await db.eleve.create({
    data: {
      orgId,
      matricule,
      nom: input.nom,
      sexe: input.sexe || 'M',
      classe: input.classe || 'Non affecté',
      parentNom: input.parentNom || 'Parent',
      parentTelephone: input.parentTelephone || null,
      fraisAnnuels: Math.round(input.fraisAnnuels || 0),
      fraisInscription: Math.round(input.fraisInscription || 0),
    },
  });

  const t = calculerEcheancier(row.fraisAnnuels, nbTranches, new Date(Date.now() + 30 * 86_400_000));
  await db.trancheEcolage.createMany({
    data: t.map((x) => ({
      orgId,
      eleveId: row.id,
      numero: x.numero,
      libelle: x.libelle,
      montant: x.montant,
      echeance: new Date(x.echeance),
    })),
  });

  return {
    ok: true,
    message: `${row.nom} inscrit(e) en ${row.classe}. Échéancier créé : ${t
      .map((x) => `${x.montant.toLocaleString('fr-FR')} FCFA`)
      .join(' + ')}.`,
    eleve: {
      id: row.id,
      orgId,
      matricule: row.matricule,
      nom: row.nom,
      sexe: row.sexe,
      classe: row.classe,
      parentNom: row.parentNom,
      parentTelephone: row.parentTelephone || '',
      fraisAnnuels: row.fraisAnnuels,
      fraisInscription: row.fraisInscription,
      inscriptionPayee: row.inscriptionPayee,
      statut: row.statut,
      createdAt: new Date(row.createdAt).toISOString(),
    },
  };
}

/** Encaissement d'ecolage : remplit les tranches echues, genere le recu. */
export async function encaisserEcolage(
  orgId: string,
  eleveId: string,
  montant: number,
  canal: EncaissementRec['canal'] = 'ESPECES',
  note = '',
): Promise<{ ok: boolean; message: string; recu?: string; reste?: number }> {
  const db = await getPrisma();
  if (!db) {
    const r = encaisserDemo(orgId, eleveId, montant, canal, note);
    return { ok: r.ok, message: r.message, recu: r.encaissement?.recu, reste: r.reste };
  }

  const eleve = await db.eleve.findUnique({ where: { id: eleveId } });
  if (!eleve || eleve.orgId !== orgId) return { ok: false, message: 'Élève introuvable.' };

  const montantNet = Math.round(montant);
  if (montantNet <= 0) return { ok: false, message: 'Le montant doit être supérieur à zéro.' };

  const tranches = await db.trancheEcolage.findMany({ where: { eleveId }, orderBy: { numero: 'asc' } });

  // GARDE-FOU (identique à la version démo) : on n'encaisse jamais plus que ce qui est dû.
  const payeAvant = tranches.reduce((s, t) => s + t.montantPaye, 0);
  const resteAvant = Math.max(
    0,
    eleve.fraisAnnuels + (eleve.inscriptionPayee ? 0 : eleve.fraisInscription) - payeAvant,
  );
  if (resteAvant <= 0) {
    return { ok: false, message: `${eleve.nom} n'a plus rien à payer : le compte est soldé.`, reste: 0 };
  }
  if (montantNet > resteAvant) {
    return {
      ok: false,
      message: `Le montant dépasse ce qui reste à payer (${resteAvant.toLocaleString('fr-FR')} FCFA). Corrigez le montant.`,
      reste: resteAvant,
    };
  }

  const dernier = await db.encaissementEcolage.findFirst({ where: { orgId }, orderBy: { date: 'desc' } });
  const seq = dernier ? Number(dernier.recu.split('-').pop()) + 1 : 1;
  const recu = numeroRecu(seq);

  let restant = montantNet;
  let trancheTouchee: string | null = null;
  for (const t of tranches) {
    if (restant <= 0) break;
    const du = t.montant - t.montantPaye;
    if (du <= 0) continue;
    const verse = Math.min(du, restant);
    await db.trancheEcolage.update({ where: { id: t.id }, data: { montantPaye: t.montantPaye + verse } });
    restant -= verse;
    trancheTouchee = t.id;
  }
  if (restant > 0 && tranches.length) {
    const d = tranches[tranches.length - 1];
    await db.trancheEcolage.update({ where: { id: d.id }, data: { montantPaye: d.montantPaye + restant } });
    trancheTouchee = d.id;
  }

  await db.encaissementEcolage.create({
    data: { orgId, eleveId, trancheId: trancheTouchee, montant: montantNet, canal, recu, note: note || null },
  });

  const apres = await listTranches(orgId, eleveId);
  const reste = Math.max(
    0,
    eleve.fraisAnnuels +
      (eleve.inscriptionPayee ? 0 : eleve.fraisInscription) -
      apres.reduce((s, t) => s + t.montantPaye, 0),
  );

  return {
    ok: true,
    message: `Reçu ${recu} : ${montantNet.toLocaleString('fr-FR')} FCFA encaissés pour ${eleve.nom}. Reste à payer : ${reste.toLocaleString('fr-FR')} FCFA.`,
    recu,
    reste,
  };
}

/** Encaissement des frais d'inscription (une seule fois par eleve). */
export async function encaisserInscription(
  orgId: string,
  eleveId: string,
  canal: EncaissementRec['canal'] = 'ESPECES',
): Promise<{ ok: boolean; message: string }> {
  const db = await getPrisma();
  if (!db) return encaisserInscriptionDemo(orgId, eleveId, canal);

  const eleve = await db.eleve.findUnique({ where: { id: eleveId } });
  if (!eleve || eleve.orgId !== orgId) return { ok: false, message: 'Élève introuvable.' };
  if (eleve.inscriptionPayee) return { ok: false, message: 'L’inscription de cet élève est déjà payée.' };

  const dernier = await db.encaissementEcolage.findFirst({ where: { orgId }, orderBy: { date: 'desc' } });
  const seq = dernier ? Number(dernier.recu.split('-').pop()) + 1 : 1;

  await db.encaissementEcolage.create({
    data: {
      orgId,
      eleveId,
      trancheId: null,
      montant: eleve.fraisInscription,
      canal,
      recu: numeroRecu(seq),
      note: 'Frais d’inscription',
    },
  });
  await db.eleve.update({ where: { id: eleveId }, data: { inscriptionPayee: true } });

  return {
    ok: true,
    message: `Inscription de ${eleve.nom} encaissée (${eleve.fraisInscription.toLocaleString('fr-FR')} FCFA).`,
  };
}

// ---------------------------------------------------------------------------
// PAIEMENTS
// ---------------------------------------------------------------------------
export async function listPayments(orgId?: string | null): Promise<PaymentRec[]> {
  const db = await getPrisma();
  if (!db) {
    const rows = d().payments;
    return (orgId ? rows.filter((p) => p.orgId === orgId) : rows).slice(0, 60);
  }
  try {
    const rows = await db.payment.findMany({
      where: orgId ? { orgId } : {},
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    return rows.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() })) as PaymentRec[];
  } catch {
    return d().payments;
  }
}

export async function createPayment(p: {
  orgId: string;
  invoiceId?: string | null;
  provider: string;
  amount: number;
  currency?: string;
  phone?: string;
  reference?: string;
  status?: PaymentRec['status'];
}): Promise<PaymentRec> {
  const db = await getPrisma();
  if (!db) {
    const rec: PaymentRec = {
      id: uid('pay'),
      orgId: p.orgId,
      invoiceId: p.invoiceId || null,
      provider: p.provider,
      amount: p.amount,
      currency: p.currency || 'XAF',
      phone: p.phone || '',
      reference: p.reference || `AF-${Date.now().toString().slice(-6)}`,
      status: p.status || 'EN_ATTENTE',
      createdAt: new Date().toISOString(),
    };
    d().payments.unshift(rec);
    return rec;
  }
  const row = await db.payment.create({
    data: {
      orgId: p.orgId,
      invoiceId: p.invoiceId || null,
      provider: p.provider,
      amount: p.amount,
      currency: p.currency || 'XAF',
      phone: p.phone || null,
      reference: p.reference || null,
      status: p.status || 'EN_ATTENTE',
    },
  });
  return { ...row, createdAt: new Date(row.createdAt).toISOString() } as PaymentRec;
}

/** Valide ou rejette un paiement manuel en attente (espace prive). */
export async function tranchePaiement(
  paiementId: string,
  statut: 'REUSSI' | 'ECHOUE',
): Promise<{ ok: boolean; message: string }> {
  const db = await getPrisma();
  if (!db) {
    const p = d().payments.find((x) => x.id === paiementId);
    if (!p) return { ok: false, message: 'Paiement introuvable.' };
    p.status = statut;
    if (statut === 'REUSSI' && p.invoiceId) {
      await registerPayment(p.invoiceId, p.amount, p.provider);
    }
    return {
      ok: true,
      message:
        statut === 'REUSSI'
          ? `Paiement de ${p.amount.toLocaleString('fr-FR')} FCFA validé et facture mise à jour.`
          : 'Paiement rejeté.',
    };
  }
  const p = await db.payment.findUnique({ where: { id: paiementId } });
  if (!p) return { ok: false, message: 'Paiement introuvable.' };
  await db.payment.update({ where: { id: paiementId }, data: { status: statut } });
  if (statut === 'REUSSI' && p.invoiceId) {
    await registerPayment(p.invoiceId, p.amount, p.provider);
  }
  return { ok: true, message: statut === 'REUSSI' ? 'Paiement validé.' : 'Paiement rejeté.' };
}

/** Change le statut d'un client du SaaS : ACTIF, ESSAI, EN_RETARD, SUSPENDU. */
export async function changerStatutOrganisation(
  orgId: string,
  statut: Organization['planStatus'],
): Promise<{ ok: boolean; message: string }> {
  const db = await getPrisma();
  if (!db) {
    const org = d().orgs.find((o) => o.id === orgId);
    if (!org) return { ok: false, message: 'Entreprise introuvable.' };
    org.planStatus = statut;
    const sub = d().subscriptions.find((s) => s.orgId === orgId);
    if (sub) {
      sub.status = statut === 'SUSPENDU' ? 'ANNULE' : statut;
      if (statut === 'ACTIF') sub.renewAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
    }
    return { ok: true, message: `${org.name} → ${statut}.` };
  }
  await db.organization.update({ where: { id: orgId }, data: { planStatus: statut } });
  return { ok: true, message: `Statut mis à jour : ${statut}.` };
}

// ---------------------------------------------------------------------------
// STOCK
// ---------------------------------------------------------------------------
export async function listStock(orgId: string): Promise<StockRec[]> {
  const db = await getPrisma();
  if (!db) return d().stock.filter((s) => s.orgId === orgId);
  try {
    const rows = await db.stockItem.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
    return rows.map((r: any) => ({
      id: r.id,
      orgId: r.orgId,
      sku: r.sku,
      name: r.name,
      qty: r.qty,
      unit: r.unit,
      price: r.price,
      threshold: r.threshold,
      supplier: r.supplier || '',
    }));
  } catch {
    return d().stock.filter((s) => s.orgId === orgId);
  }
}

/** Ajuste le stock (+/-). Renvoie si le seuil d'alerte vient d'etre franchi. */
export async function adjustStock(
  id: string,
  delta: number,
): Promise<{ ok: boolean; message: string; alerte?: { sku: string; qty: number; seuil: number } }> {
  const db = await getPrisma();
  if (!db) {
    const item = d().stock.find((s) => s.id === id);
    if (!item) return { ok: false, message: 'Article introuvable.' };
    item.qty = Math.max(0, item.qty + delta);
    const alerte = item.qty <= item.threshold ? { sku: item.sku, qty: item.qty, seuil: item.threshold } : undefined;
    return {
      ok: true,
      message: `${item.name} : ${item.qty} ${item.unit}${alerte ? ' ⚠️ seuil atteint' : ''}`,
      alerte,
    };
  }
  const item = await db.stockItem.findUnique({ where: { id } });
  if (!item) return { ok: false, message: 'Article introuvable.' };
  const qty = Math.max(0, item.qty + delta);
  await db.stockItem.update({ where: { id }, data: { qty } });
  const alerte = qty <= item.threshold ? { sku: item.sku, qty, seuil: item.threshold } : undefined;
  return { ok: true, message: `${item.name} : ${qty} ${item.unit}`, alerte };
}

// ---------------------------------------------------------------------------
// TONTINES
// ---------------------------------------------------------------------------
export async function listTontines(orgId: string): Promise<TontineRec[]> {
  const db = await getPrisma();
  if (!db) return d().tontines.filter((t) => t.orgId === orgId);
  try {
    const rows = await db.tontine.findMany({
      where: { orgId },
      include: { contributions: { orderBy: { paidAt: 'desc' }, take: 40 } },
    });
    return rows.map((r: any) => ({
      id: r.id,
      orgId: r.orgId,
      name: r.name,
      cycle: r.cycle,
      contribution: r.contribution,
      membersCount: r.membersCount,
      pot: r.pot,
      beneficiary: r.beneficiary || '',
      nextDate: r.nextDate ? new Date(r.nextDate).toISOString() : new Date().toISOString(),
      contributions: (r.contributions || []).map((c: any) => ({
        id: c.id,
        tontineId: c.tontineId,
        member: c.member,
        amount: c.amount,
        channel: c.channel,
        status: c.status,
        paidAt: new Date(c.paidAt).toISOString(),
      })),
    }));
  } catch {
    return d().tontines.filter((t) => t.orgId === orgId);
  }
}

export async function addContribution(
  tontineId: string,
  input: { member: string; amount: number; channel?: string },
): Promise<{ ok: boolean; message: string }> {
  const db = await getPrisma();
  if (!db) {
    const t = d().tontines.find((x) => x.id === tontineId);
    if (!t) return { ok: false, message: 'Tontine introuvable.' };
    t.contributions.unshift({
      id: uid('con'),
      tontineId,
      member: input.member,
      amount: input.amount,
      channel: input.channel || 'ESPECES',
      status: 'RECU',
      paidAt: new Date().toISOString(),
    });
    t.pot += input.amount;
    return { ok: true, message: `Cotisation de ${input.member} enregistrée. Nouvelle cagnotte : ${t.pot} FCFA.` };
  }
  const t = await db.tontine.findUnique({ where: { id: tontineId } });
  if (!t) return { ok: false, message: 'Tontine introuvable.' };
  await db.contribution.create({
    data: { tontineId, member: input.member, amount: input.amount, channel: input.channel || 'ESPECES', status: 'RECU' },
  });
  await db.tontine.update({ where: { id: tontineId }, data: { pot: t.pot + input.amount } });
  return { ok: true, message: `Cotisation de ${input.member} enregistrée.` };
}

// ---------------------------------------------------------------------------
// ABONNEMENTS (revenus du SaaS)
// ---------------------------------------------------------------------------
export async function listSubscriptions(): Promise<SubscriptionRec[]> {
  const db = await getPrisma();
  if (!db) return d().subscriptions;
  try {
    const rows = await db.subscription.findMany({ include: { organization: true } });
    return rows.map((r: any) => ({
      id: r.id,
      orgId: r.orgId,
      orgName: r.organization?.name || r.orgId,
      plan: r.plan,
      amount: r.amount,
      currency: r.currency,
      provider: r.provider,
      status: r.status,
      startedAt: new Date(r.startedAt).toISOString(),
      renewAt: r.renewAt ? new Date(r.renewAt).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return d().subscriptions;
  }
}

export async function getSubscription(orgId: string): Promise<SubscriptionRec | null> {
  const all = await listSubscriptions();
  return all.find((s) => s.orgId === orgId) || null;
}

export async function activerAbonnement(
  orgId: string,
  plan: string,
  provider = 'manuel',
): Promise<{ ok: boolean; message: string }> {
  const prix = PLAN_BY_ID(plan)?.price ?? 0;
  const renewAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const db = await getPrisma();
  if (!db) {
    const sub = d().subscriptions.find((s) => s.orgId === orgId);
    if (sub) {
      sub.plan = plan;
      sub.amount = prix;
      sub.provider = provider;
      sub.status = 'ACTIF';
      sub.renewAt = renewAt;
    }
    const org = d().orgs.find((o) => o.id === orgId);
    if (org) {
      org.plan = plan;
      org.planStatus = 'ACTIF';
      org.mrr = prix;
    }
    return { ok: true, message: `Abonnement ${plan} activé (${prix} FCFA/mois).` };
  }
  await db.subscription.upsert({
    where: { orgId },
    update: { plan, amount: prix, provider, status: 'ACTIF', renewAt: new Date(renewAt) },
    create: { orgId, plan, amount: prix, provider, status: 'ACTIF', renewAt: new Date(renewAt) },
  });
  await db.organization.update({ where: { id: orgId }, data: { plan, planStatus: 'ACTIF' } });
  return { ok: true, message: `Abonnement ${plan} activé (${prix} FCFA/mois).` };
}

// ---------------------------------------------------------------------------
// JOURNAL MAKE.COM + MESSAGES
// ---------------------------------------------------------------------------
export async function listWebhookLogs(limit = 40): Promise<WebhookLogRec[]> {
  const db = await getPrisma();
  if (!db) return d().webhookLogs.slice(0, limit);
  try {
    const rows = await db.webhookLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    return rows.map((r: any) => ({
      id: r.id,
      at: new Date(r.createdAt).toISOString(),
      orgId: r.orgId,
      direction: r.direction,
      event: r.event,
      scenario: r.scenario || '',
      status: r.status,
      statusCode: r.statusCode || 200,
      payloadPreview: r.payloadPreview || '',
      error: r.error,
    }));
  } catch {
    return d().webhookLogs.slice(0, limit);
  }
}

export async function logWebhook(entry: {
  orgId?: string | null;
  direction: 'SORTANT' | 'ENTRANT';
  event: string;
  scenario?: string;
  status?: 'OK' | 'ERREUR';
  statusCode?: number;
  payloadPreview?: string;
  error?: string | null;
}): Promise<void> {
  const db = await getPrisma();
  if (!db) {
    d().webhookLogs.unshift({
      id: uid('wh'),
      at: new Date().toISOString(),
      orgId: entry.orgId || null,
      direction: entry.direction,
      event: entry.event,
      scenario: entry.scenario || '',
      status: entry.status || 'OK',
      statusCode: entry.statusCode || 200,
      payloadPreview: entry.payloadPreview || '',
      error: entry.error || null,
    });
    return;
  }
  try {
    await db.webhookLog.create({
      data: {
        orgId: entry.orgId || null,
        direction: entry.direction,
        event: entry.event,
        scenario: entry.scenario || null,
        status: entry.status || 'OK',
        statusCode: entry.statusCode || 200,
        payloadPreview: entry.payloadPreview || null,
        error: entry.error || null,
      },
    });
  } catch {
    /* le journal ne doit jamais faire echouer un webhook */
  }
}

export async function listMessages(orgId: string, limit = 30): Promise<MessageRec[]> {
  const db = await getPrisma();
  if (!db) return d().messages.filter((m) => m.orgId === orgId).slice(0, limit);
  try {
    const rows = await db.message.findMany({ where: { orgId }, orderBy: { sentAt: 'desc' }, take: limit });
    return rows.map((r: any) => ({
      id: r.id,
      orgId: r.orgId,
      channel: r.channel,
      to: r.to,
      body: r.body,
      status: r.status,
      at: new Date(r.sentAt).toISOString(),
    }));
  } catch {
    return d().messages.filter((m) => m.orgId === orgId).slice(0, limit);
  }
}

export async function logMessage(m: {
  orgId: string;
  channel: MessageRec['channel'];
  to: string;
  body: string;
  status?: MessageRec['status'];
}): Promise<MessageRec> {
  const db = await getPrisma();
  if (!db) {
    const rec: MessageRec = {
      id: uid('msg'),
      orgId: m.orgId,
      channel: m.channel,
      to: m.to,
      body: m.body,
      status: m.status || 'ENVOYE',
      at: new Date().toISOString(),
    };
    d().messages.unshift(rec);
    return rec;
  }
  const row = await db.message.create({
    data: { orgId: m.orgId, channel: m.channel, to: m.to, body: m.body, status: m.status || 'ENVOYE' },
  });
  return { ...row, at: new Date(row.sentAt).toISOString() } as unknown as MessageRec;
}

// ---------------------------------------------------------------------------
// STATISTIQUES
// ---------------------------------------------------------------------------

/** Statistiques d'une entreprise cliente (tableau de bord). */
export async function getStats(orgId: string): Promise<Stats> {
  const [invoices, clients, stock, org] = await Promise.all([
    listInvoices(orgId),
    listClients(orgId),
    listStock(orgId),
    getOrganization(orgId),
  ]);
  const valides = invoices.filter((i) => i.status !== 'ANNULEE' && i.status !== 'BROUILLON');
  const chiffreAffaires = valides.reduce((s, i) => s + i.total, 0);
  const encaisse = valides.reduce((s, i) => s + i.paid, 0);
  const impaye = Math.max(0, chiffreAffaires - encaisse);
  const enRetard = valides.filter((i) => i.status === 'IMPAYEE').length;
  return {
    chiffreAffaires,
    encaisse,
    impaye,
    tauxRecouvrement: chiffreAffaires ? Math.round((encaisse / chiffreAffaires) * 100) : 0,
    nbFactures: invoices.length,
    nbClients: clients.length,
    facturesEnRetard: enRetard,
    alertesStock: stock.filter((s) => s.qty <= s.threshold).length,
    mrr: org?.mrr || 0,
    panierMoyen: valides.length ? Math.round(chiffreAffaires / valides.length) : 0,
  };
}

/** Statistiques GLOBALES du SaaS (interface privee /admin). */
export async function getGlobalStats() {
  const [orgs, subs, clients, logs] = await Promise.all([
    listOrganizations(),
    listSubscriptions(),
    (async () => {
      const db = await getPrisma();
      if (!db) return d().clients.length;
      try {
        return await db.client.count();
      } catch {
        return d().clients.length;
      }
    })(),
    listWebhookLogs(20),
  ]);

  const actifs = subs.filter((s) => s.status === 'ACTIF');
  const mrr = actifs.reduce((s, x) => s + x.amount, 0);
  const parPays = orgs.reduce<Record<string, { pays: string; clients: number; mrr: number }>>((acc, o) => {
    const key = o.countryName;
    acc[key] = acc[key] || { pays: key, clients: 0, mrr: 0 };
    acc[key].clients += 1;
    acc[key].mrr += o.mrr;
    return acc;
  }, {});
  return {
    nbClients: orgs.length,
    clientsActifs: orgs.filter((o) => o.planStatus === 'ACTIF').length,
    enEssai: orgs.filter((o) => o.planStatus === 'ESSAI').length,
    enRetard: orgs.filter((o) => o.planStatus === 'EN_RETARD').length,
    mrr,
    arr: mrr * 12,
    arpu: actifs.length ? Math.round(mrr / actifs.length) : 0,
    nbUtilisateursFinaux: clients,
    parPays: Object.values(parPays).sort((a, b) => b.mrr - a.mrr),
    subs,
    orgs,
    logs,
    tauxErreurWebhooks: logs.length
      ? Math.round((logs.filter((l) => l.status === 'ERREUR').length / logs.length) * 100)
      : 0,
  };
}

/** Factures en retard (utilise par le cron Vercel et le scenario Make de relance). */
export async function facturesEnRetard(orgId?: string | null): Promise<InvoiceRec[]> {
  const orgs = orgId ? [orgId] : (await listOrganizations()).map((o) => o.id);
  const toutes: InvoiceRec[] = [];
  for (const id of orgs) {
    const inv = await listInvoices(id);
    toutes.push(...inv.filter((i) => i.status === 'IMPAYEE' || i.status === 'PARTIELLE'));
  }
  return toutes;
}

/** Alertes de stock (utilise par le scenario Make "alerte rupture"). */
export async function alertesStock(orgId?: string | null): Promise<StockRec[]> {
  const orgs = orgId ? [orgId] : (await listOrganizations()).map((o) => o.id);
  const alertes: StockRec[] = [];
  for (const id of orgs) {
    const items = await listStock(id);
    alertes.push(...items.filter((i) => i.qty <= i.threshold));
  }
  return alertes;
}
