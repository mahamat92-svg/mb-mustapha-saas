// =============================================================================
// GET  /api/v1/stock                 -> inventaire
// POST /api/v1/stock                 -> mouvement { stockId, delta }
//      Si le seuil est franchi, un evenement est envoye a Make (SMS au gerant
//      + message au fournisseur).
// =============================================================================
import { exigerSession, erreur, handler, ok, resoudreOrgId } from '@/lib/api';
import { adjustStock, alertesStock, getOrganization, listStock } from '@/lib/store';
import { envoyerAMake, payloadStock } from '@/lib/make';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, new URL(req.url).searchParams.get('orgId'));
  const articles = await listStock(orgId);
  return ok({
    orgId,
    articles,
    alertes: articles.filter((a) => a.qty <= a.threshold),
  });
});

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, corps.orgId);

  const delta = Number(corps.delta);
  if (!corps.stockId || Number.isNaN(delta)) {
    return erreur('Précisez stockId et delta (ex. -5 pour une sortie).');
  }

  const res = await adjustStock(corps.stockId, delta);
  if (!res.ok) return erreur(res.message, 404);

  let evenementMake = null;
  if (res.alerte) {
    const org = await getOrganization(orgId);
    const item = (await listStock(orgId)).find((s) => s.sku === res.alerte!.sku);
    if (org && item) {
      evenementMake = await envoyerAMake('stock', 'stock.seuil_atteint', payloadStock(item, org), orgId);
    }
  }

  return ok({
    message: res.message,
    alerte: res.alerte || null,
    make: evenementMake,
  });
});
