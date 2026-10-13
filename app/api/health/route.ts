// GET /api/health -> etat du service (utile pour Vercel et pour verifier Make)
import { ok } from '@/lib/api';
import { integrationStatus, MODULES, PLANS } from '@/lib/config';
import { modeDemo } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({
    service: 'MB Mustapha',
    version: '1.0.0',
    heure: new Date().toISOString(),
    modeDemo: modeDemo(),
    modules: MODULES.length,
    offres: PLANS.map((p) => ({ id: p.id, prix: p.price })),
    integrations: integrationStatus(),
  });
}
