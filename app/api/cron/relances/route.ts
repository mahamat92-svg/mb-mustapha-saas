// =============================================================================
// GET /api/cron/relances
// -----------------------------------------------------------------------------
// Tache planifiee (cron Vercel, tous les jours a 7h — voir vercel.json).
// Elle fait 3 choses :
//   1. Recupere toutes les factures en retard de toutes les entreprises clientes
//   2. Envoie chaque relance a Make.com (WhatsApp + SMS)
//   3. Envoie le rapport quotidien du patron a Make.com
// Protection : header Authorization: Bearer CRON_SECRET
// =============================================================================
import { cronAutorise, erreur, handler, ok } from '@/lib/api';
import { facturesEnRetard, getOrganization, getStats, marquerRelance, alertesStock } from '@/lib/store';
import { envoyerAMake, payloadRapport, payloadRelance, payloadStock } from '@/lib/make';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const GET = handler(async (req: Request) => {
  if (!cronAutorise(req)) return erreur('Cron non autorisé (CRON_SECRET absent ou invalide).', 401);

  const factures = await facturesEnRetard(null);
  const resultats = [];

  for (const f of factures) {
    const org = await getOrganization(f.orgId);
    if (!org) continue;
    const data = payloadRelance(f, org);
    // On ne relance pas plus de 4 fois la meme facture en automatique
    if (f.reminders >= 4) {
      resultats.push({ facture: f.number, action: 'ignorée (déjà 4 relances)', envoye: false });
      continue;
    }
    const envoi = await envoyerAMake('relance', 'facture.en_retard', data, f.orgId);
    await marquerRelance(f.id);
    resultats.push({ facture: f.number, client: f.clientName, reste: data.resteAPayer, envoye: envoi.ok, simule: Boolean(envoi.simulated) });
  }

  // Alertes de stock du jour
  const stocks = await alertesStock(null);
  const stockResultats = [];
  for (const s of stocks) {
    const org = await getOrganization(s.orgId);
    if (!org) continue;
    const envoi = await envoyerAMake('stock', 'stock.seuil_atteint', payloadStock(s, org), s.orgId);
    stockResultats.push({ article: s.name, qte: s.qty, envoye: envoi.ok, simule: Boolean(envoi.simulated) });
  }

  // Rapports quotidiens (patrons + vous-meme)
  const orgs = Array.from(new Set(factures.map((f) => f.orgId)));
  const rapports = [];
  for (const orgId of orgs) {
    const org = await getOrganization(orgId);
    if (!org) continue;
    const stats = await getStats(orgId);
    const envoi = await envoyerAMake('rapport', 'rapport.quotidien', payloadRapport(stats, org), orgId);
    rapports.push({ entreprise: org.name, ca: stats.chiffreAffaires, impaye: stats.impaye, envoye: envoi.ok });
  }

  return ok({
    executeA: new Date().toISOString(),
    relances: resultats.length,
    relancesDetail: resultats,
    alertesStock: stockResultats,
    rapports,
    message: `Cron exécuté : ${resultats.length} relance(s), ${stockResultats.length} alerte(s) stock, ${rapports.length} rapport(s).`,
  });
});
