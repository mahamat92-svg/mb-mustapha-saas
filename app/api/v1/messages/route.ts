// =============================================================================
// GET  /api/v1/messages -> historique des SMS / WhatsApp / e-mails
// POST /api/v1/messages -> envoi d'un message (ou d'une campagne)
//      { canal, destinataires: string[] | to: string, texte }
//      L'envoi reel est delegue a Make.com (WhatsApp Cloud API / Africa's Talking)
// =============================================================================
import { exigerSession, erreur, handler, ok, resoudreOrgId } from '@/lib/api';
import { listMessages, logMessage, listClients } from '@/lib/store';
import { envoyerAMake, payloadMessage } from '@/lib/make';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, new URL(req.url).searchParams.get('orgId'));
  return ok({ orgId, messages: await listMessages(orgId) });
});

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, corps.orgId);

  const texte = String(corps.texte || corps.message || '').trim();
  if (!texte) return erreur('Le texte du message est vide.');

  let destinataires: string[] = [];
  if (Array.isArray(corps.destinataires) && corps.destinataires.length) {
    destinataires = corps.destinataires;
  } else if (corps.to) {
    destinataires = [corps.to];
  } else if (corps.campagne === 'tous_les_clients') {
    const clients = await listClients(orgId);
    destinataires = clients.map((c) => c.phone).filter(Boolean);
  }
  if (!destinataires.length) return erreur('Aucun destinataire (utilisez « to » ou « campagne »).');

  const canal = (corps.canal || 'SMS').toUpperCase();
  const envoi = await envoyerAMake('message', 'message.envoyer', payloadMessage(canal, destinataires, texte), orgId);
  for (const d of destinataires) {
    await logMessage({ orgId, channel: canal as never, to: d, body: texte, status: envoi.ok ? 'ENVOYE' : 'ECHOUE' });
  }

  return ok({
    nbDestinataires: destinataires.length,
    canal,
    make: envoi,
    message: `${destinataires.length} message(s) ${canal} confié(s) à Make.com.`,
  }, 201);
});
