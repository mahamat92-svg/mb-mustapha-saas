// =============================================================================
// GET  /api/v1/abonnements -> abonnements du SaaS (revenus recurrents)
// POST /api/v1/abonnements -> souscrire / changer d'offre
//      { plan, provider?, orgId? }  (+ initiation du paiement Mobile Money)
// =============================================================================
import { exigerSession, erreur, handler, ok, resoudreOrgId } from '@/lib/api';
import { activerAbonnement, getOrganization, listSubscriptions } from '@/lib/store';
import { PLAN_BY_ID, PLANS } from '@/lib/config';
import { initierPaiement } from '@/lib/paiements';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const session = await exigerSession();
  if (session.role === 'OWNER') {
    const subs = await listSubscriptions();
    const mrr = subs.filter((s) => s.status === 'ACTIF').reduce((a, s) => a + s.amount, 0);
    return ok({ abonnements: subs, mrr, arr: mrr * 12, catalogue: PLANS });
  }
  const orgId = resoudreOrgId(session);
  const org = await getOrganization(orgId);
  return ok({ abonnement: (await listSubscriptions()).find((s) => s.orgId === orgId) || null, org, catalogue: PLANS });
});

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, corps.orgId);

  const plan = PLAN_BY_ID(corps.plan);
  if (!plan) return erreur('Offre inconnue. Offres disponibles : ' + PLANS.map((p) => p.id).join(', '));

  // Offre gratuite : activation immediate, pas de paiement
  if (plan.price === 0) {
    const res = await activerAbonnement(orgId, plan.id, 'gratuit');
    return ok({ message: res.message, plan });
  }

  const org = await getOrganization(orgId);
  const paiement = await initierPaiement({
    montant: plan.price,
    devise: org?.currency || 'XAF',
    description: `Abonnement MB Mustapha ${plan.name} — 1 mois`,
    pays: org?.country,
    orgId,
    telephone: corps.telephone,
    returnUrl: corps.returnUrl,
  });

  return ok({
    plan,
    paiement,
    message:
      paiement.mode === 'EN_LIGNE'
        ? 'Ouverture de la page de paiement Mobile Money…'
        : `Instructions de paiement Mobile Money affichées (référence ${paiement.reference}).`,
  }, 201);
});
