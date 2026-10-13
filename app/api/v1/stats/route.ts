// GET /api/v1/stats -> indicateurs du tableau de bord
// Parametres : ?orgId=... (reserve au proprietaire)
import { exigerSession, handler, ok, resoudreOrgId } from '@/lib/api';
import { getStats } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const session = await exigerSession();
  const url = new URL(req.url);
  const orgId = resoudreOrgId(session, url.searchParams.get('orgId'));
  const stats = await getStats(orgId);
  return ok({ orgId, stats });
});
