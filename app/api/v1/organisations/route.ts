// GET /api/v1/organisations -> liste des entreprises clientes (ESPACE PRIVE)
import { exigerOwner, handler, ok } from '@/lib/api';
import { getGlobalStats, listOrganizations } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await exigerOwner();
  const orgs = await listOrganizations();
  const stats = await getGlobalStats();
  return ok({ total: orgs.length, organisations: orgs, stats });
});
