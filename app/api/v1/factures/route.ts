// =============================================================================
// GET  /api/v1/factures   -> liste (filtre ?statut=IMPAYEE)
// POST /api/v1/factures   -> creation d'une facture (calcul TVA automatique)
//      corps : { clientId | clientName, montant, libelle?, tva?, delai?, canal? }
// =============================================================================
import { apiKeyValide, exigerSession, erreur, handler, ok, resoudreOrgId } from '@/lib/api';
import { createInvoice, listInvoices, getOrganization } from '@/lib/store';
import { envoyerAMake } from '@/lib/make';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, url.searchParams.get('orgId'));
  let factures = await listInvoices(orgId);
  const statut = url.searchParams.get('statut');
  if (statut) factures = factures.filter((f) => f.status === statut);
  return ok({ orgId, total: factures.length, factures });
});

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  let orgId: string;

  if (apiKeyValide(req) && corps.orgId && !req.headers.get('cookie')) {
    orgId = corps.orgId;
  } else {
    const session = await exigerSession();
    orgId = resoudreOrgId(session, corps.orgId);
  }

  const montant = Number(corps.montant ?? corps.amount ?? 0);
  if (!montant || montant <= 0) return erreur('Le montant HT (en FCFA) est obligatoire.');
  if (!corps.clientName && !corps.clientId) return erreur('Précisez le client (clientId ou clientName).');

  const org = await getOrganization(orgId);
  const facture = await createInvoice(orgId, {
    clientId: corps.clientId,
    clientName: corps.clientName || 'Client',
    label: corps.libelle || corps.label,
    amount: Math.round(montant),
    vatRate: corps.tva !== undefined ? Number(corps.tva) : org?.country === 'CM' ? 19.25 : org?.country === 'NE' ? 19 : 18,
    dueInDays: corps.delai ? Number(corps.delai) : 15,
    channel: corps.canal || corps.channel || 'MANUEL',
  });

  return ok({ facture, message: `Facture ${facture.number} créée (${facture.total.toLocaleString('fr-FR')} FCFA TTC).` }, 201);
});
