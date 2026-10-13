// =============================================================================
// GET  /api/v1/tontines   -> groupes + cotisations
// POST /api/v1/tontines   -> enregistre une cotisation
//      { tontineId, membre, montant, canal? }  et previent le membre par SMS.
// =============================================================================
import { exigerSession, erreur, handler, ok, resoudreOrgId } from '@/lib/api';
import { addContribution, listTontines, logMessage } from '@/lib/store';
import { envoyerAMake } from '@/lib/make';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, new URL(req.url).searchParams.get('orgId'));
  return ok({ orgId, tontines: await listTontines(orgId) });
});

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, corps.orgId);

  if (!corps.tontineId || !corps.membre || !Number(corps.montant)) {
    return erreur('Précisez tontineId, membre et montant.');
  }

  const res = await addContribution(corps.tontineId, {
    member: corps.membre,
    amount: Math.round(Number(corps.montant)),
    channel: corps.canal || 'ESPECES',
  });
  if (!res.ok) return erreur(res.message, 404);

  const messageSMS = `Cotisation reçue : ${Number(corps.montant).toLocaleString('fr-FR')} FCFA au nom de ${corps.membre}. Merci ! Vous recevrez votre reçu par WhatsApp.`;
  await logMessage({
    orgId,
    channel: corps.canal?.includes('MOMO') || corps.canal?.includes('MOOV') || corps.canal?.includes('AIRTEL') ? 'SMS' : 'SMS',
    to: corps.membre,
    body: messageSMS,
  });
  await envoyerAMake('message', 'tontine.cotisation', {
    tontineId: corps.tontineId,
    membre: corps.membre,
    montant: Number(corps.montant),
    canal: corps.canal || 'ESPECES',
    message: messageSMS,
  }, orgId);

  return ok({ message: res.message }, 201);
});
