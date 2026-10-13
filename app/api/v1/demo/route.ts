// =============================================================================
// POST /api/v1/demo  { action: "reset" }
// Remet les donnees de demonstration a zero (PRATIQUE POUR UNE DEMO CLIENT).
// Sans effet si la base PostgreSQL est branchee (protection volontaire).
// =============================================================================
import { erreur, handler, ok } from '@/lib/api';
import { baseConfiguree } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  if (corps.action !== 'reset') return erreur('Action inconnue. Utilisez { "action": "reset" }.');

  if (baseConfiguree()) {
    return erreur(
      'Base de données connectée : le reset de démonstration est désactivé pour protéger vos vraies données.',
      400,
    );
  }

  // On force la regeneration du jeu de donnees de demonstration
  const [store, demo] = await Promise.all([import('@/lib/store'), import('@/lib/demo-data')]);
  store.resetDemo();
  return ok({
    message: `Données de démonstration réinitialisées (${demo.DEMO_ORGS.length} entreprises, ${demo.DEMO_INVOICES.length} factures).`,
  });
});
