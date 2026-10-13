'use server';

// =============================================================================
// MB Mustapha - ACTIONS SERVEUR DE L'ESPACE PRIVE (vous, le proprietaire)
// Chaque action verifie le role OWNER avant d'agir.
// =============================================================================

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import {
  activerAbonnement,
  changerStatutOrganisation,
  listPayments,
  resetDemo,
  tranchePaiement,
} from '@/lib/store';
import { envoyerAMake } from '@/lib/make';
import type { Organization } from '@/lib/types';

async function garde() {
  const s = await getSession();
  if (!s || s.role !== 'OWNER') throw new Error('Action réservée au propriétaire du SaaS.');
  return s;
}

/** Valider / rejeter un paiement Mobile Money declare par un client. */
export async function actionTrancherPaiement(formData: FormData) {
  await garde();
  const id = String(formData.get('paiementId') || '');
  const decision = String(formData.get('decision') || 'REUSSI') as 'REUSSI' | 'ECHOUE';
  const res = await tranchePaiement(id, decision);
  revalidatePath('/admin');
  revalidatePath('/admin/revenus');
  return res.message;
}

/**
 * Valider un paiement EN_ATTENTE a partir de son index d'affichage
 * (utilise par le formulaire de la page /admin quand les identifiants
 * ne sont pas connus du client).
 */
export async function actionValiderPaiementParReference(formData: FormData) {
  await garde();
  const reference = String(formData.get('reference') || '');
  const paiements = await listPayments(null);
  const p = paiements.find((x) => x.reference === reference);
  if (!p) return 'Paiement introuvable.';
  const res = await tranchePaiement(p.id, 'REUSSI');
  revalidatePath('/admin');
  return res.message;
}

/** Activer / changer l'offre d'un client (apres reception du paiement FCFA). */
export async function actionActiverAbonnement(formData: FormData) {
  await garde();
  const orgId = String(formData.get('orgId') || '');
  const plan = String(formData.get('plan') || 'STARTER');
  const provider = String(formData.get('provider') || 'manuel');
  const res = await activerAbonnement(orgId, plan, provider);
  revalidatePath('/admin');
  revalidatePath('/admin/clients');
  revalidatePath('/admin/revenus');
  return res.message;
}

/** Changer le statut d'un client : ACTIF, ESSAI, EN_RETARD, SUSPENDU. */
export async function actionChangerStatut(formData: FormData) {
  await garde();
  const orgId = String(formData.get('orgId') || '');
  const statut = String(formData.get('statut') || 'ACTIF') as Organization['planStatus'];
  const res = await changerStatutOrganisation(orgId, statut);
  revalidatePath('/admin/clients');
  return res.message;
}

/** Tester la connexion Make.com (envoie un evenement "ping"). */
export async function actionTesterMake(formData: FormData) {
  await garde();
  const scenario = String(formData.get('scenario') || 'relance') as
    | 'relance'
    | 'stock'
    | 'paiement'
    | 'message'
    | 'rapport';
  const res = await envoyerAMake(
    scenario,
    'ping',
    {
      test: true,
      message: 'Test manuel depuis l’espace privé MB Mustapha',
      heure: new Date().toISOString(),
    },
    null,
  );
  revalidatePath('/admin/make');
  return res.message;
}

/** Reinitialiser les donnees de demonstration. */
export async function actionResetDemo() {
  await garde();
  resetDemo();
  revalidatePath('/admin');
  return 'Données de démonstration réinitialisées.';
}
