// =============================================================================
// POST /api/v1/factures/relancer
// Declenche la relance des impayes : envoie les evenements a Make.com
// (WhatsApp + SMS), journalise les relances, et renvoie le recapitulatif.
// Corps : { orgId?, factureIds?: string[], seuilJours?: number }
// =============================================================================
import { exigerSession, erreur, handler, ok, resoudreOrgId } from '@/lib/api';
import { getOrganization, listInvoices, logMessage, marquerRelance } from '@/lib/store';
import { envoyerAMake, payloadRelance } from '@/lib/make';
import { fcfa } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, corps.orgId);
  const seuil = Number(corps.seuilJours ?? 0);

  const org = await getOrganization(orgId);
  if (!org) return erreur('Entreprise introuvable.', 404);

  let factures = await listInvoices(orgId);
  factures = factures.filter((f) => f.status === 'IMPAYEE' || f.status === 'PARTIELLE');
  if (Array.isArray(corps.factureIds) && corps.factureIds.length) {
    factures = factures.filter((f) => corps.factureIds.includes(f.id));
  }
  if (seuil > 0) {
    factures = factures.filter(
      (f) => (Date.now() - new Date(f.dueDate).getTime()) / 86_400_000 >= seuil,
    );
  }
  if (!factures.length) return ok({ relances: [], message: 'Aucune facture à relancer. Bravo ! 🎉' });

  const resultats = [];
  let montantTotal = 0;

  for (const f of factures) {
    const data = payloadRelance(f, org);
    montantTotal += data.resteAPayer;
    const envoi = await envoyerAMake('relance', 'facture.en_retard', data, orgId);
    await marquerRelance(f.id);
    await logMessage({
      orgId,
      channel: 'WHATSAPP',
      to: f.clientName,
      body: data.message,
      status: envoi.ok ? 'ENVOYE' : 'ECHOUE',
    });
    resultats.push({
      facture: f.number,
      client: f.clientName,
      reste: data.resteAPayer,
      joursDeRetard: data.joursDeRetard,
      canal: 'WhatsApp + SMS',
      envoye: envoi.ok,
      simule: Boolean(envoi.simulated),
      message: envoi.message,
    });
  }

  return ok({
    orgId,
    nbRelances: resultats.length,
    montantRelance: montantTotal,
    relances: resultats,
    message: `${resultats.length} relance(s) déclenchée(s) pour ${fcfa(montantTotal)} d'impayés.`,
  });
});
