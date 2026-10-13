// GET  /api/v1/clients          -> liste des clients
// POST /api/v1/clients          -> creation (utilisable par Make)
import { exigerSession, apiKeyValide, erreur, handler, ok, resoudreOrgId } from '@/lib/api';
import { createClient, listClients } from '@/lib/store';
import { envoyerAMake } from '@/lib/make';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, new URL(req.url).searchParams.get('orgId'));
  return ok({ orgId, clients: await listClients(orgId) });
});

export const POST = handler(async (req: Request) => {
  const corps = (await req.json().catch(() => ({}))) as Record<string, string>;
  let orgId: string;

  if (apiKeyValide(req) && corps.orgId && !req.headers.get('cookie')) {
    orgId = corps.orgId; // appel machine (Make) avec cle API
  } else {
    const session = await exigerSession();
    orgId = resoudreOrgId(session, corps.orgId);
  }

  if (!corps.name) return erreur('Le nom du client est obligatoire.');
  const client = await createClient(orgId, {
    name: corps.name,
    phone: corps.phone,
    email: corps.email,
    city: corps.city,
    type: (corps.type as never) || 'PARTICULIER',
  });

  // Evenement pour Make (utile pour synchroniser un CRM / Google Sheet)
  await envoyerAMake('message', 'client.cree', { client }, orgId);
  return ok({ client, message: `Client « ${client.name} » créé.` }, 201);
});
