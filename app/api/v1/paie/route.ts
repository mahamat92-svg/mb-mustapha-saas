// =============================================================================
// GET  /api/v1/paie            -> employés, bulletins, pointages, synthèse CNPS
//      ?periode=2026-02        -> filtrer un mois précis
// POST /api/v1/paie            -> actions :
//      { action: "creer_employe", ... }
//      { action: "generer_bulletins", periode }
//      { action: "pointage", employeId, jours }
//      { action: "simuler", pays, salaireBrut }   (calcul brut → net, sans enregistrer)
// =============================================================================
import { erreur, exigerSession, handler, ok, resoudreOrgId } from '@/lib/api';
import {
  createEmploye,
  genererBulletins,
  getOrganization,
  listBulletins,
  listEmployes,
  pointerJournalier,
  synthesePaie,
} from '@/lib/store';
import { REGLES_PAIE, calculerBulletin } from '@/lib/paie';
import { PAIE_PARAMS_PAYS } from '@/lib/config';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const session = await exigerSession();
  const url = new URL(req.url);
  const orgId = resoudreOrgId(session, url.searchParams.get('orgId'));
  const periode = url.searchParams.get('periode') || undefined;

  const [org, employes, bulletins, synthese] = await Promise.all([
    getOrganization(orgId),
    listEmployes(orgId),
    listBulletins(orgId, periode),
    synthesePaie(orgId, periode || new Date().toISOString().slice(0, 7)),
  ]);

  return ok({
    orgId,
    pays: org?.country || 'CM',
    params: PAIE_PARAMS_PAYS(org?.country || 'CM'),
    regles: REGLES_PAIE,
    employes,
    bulletins,
    synthese,
  });
});

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, corps.orgId);
  const org = await getOrganization(orgId);
  const pays = corps.pays || org?.country || 'CM';

  switch (corps.action) {
    case 'creer_employe': {
      if (!corps.nom) return erreur('Le nom de l’employé est obligatoire.');
      if (!corps.salaireBrut && !corps.tauxJour) {
        return erreur('Indiquez un salaire mensuel brut ou un taux journalier.');
      }
      const employe = await createEmploye(orgId, {
        nom: corps.nom,
        poste: corps.poste,
        type: corps.type || 'MENSUEL',
        salaireBrut: Number(corps.salaireBrut) || 0,
        tauxJour: Number(corps.tauxJour) || 0,
        transport: Number(corps.transport) || 0,
        sursalaire: Number(corps.sursalaire) || 0,
        telephone: corps.telephone,
      });

      // Aperçu immédiat du bulletin : le patron voit le net et le coût réel
      const apercu = calculerBulletin({
        pays,
        type: employe.type,
        salaireBrut: employe.salaireBrut,
        tauxJour: employe.tauxJour,
        joursTravailles: employe.type === 'JOURNALIER' ? REGLES_PAIE.joursOuvresMois : 0,
        transport: employe.transport,
        sursalaire: employe.sursalaire,
      });

      return ok(
        {
          employe,
          apercu: { netAPayer: apercu.netAPayer, coutEmployeur: apercu.coutEmployeur, alertes: apercu.alertes },
          message: `${employe.nom} ajouté. Net à payer estimé : ${apercu.netAPayer.toLocaleString('fr-FR')} FCFA (coût réel employeur ${apercu.coutEmployeur.toLocaleString('fr-FR')} FCFA).`,
        },
        201,
      );
    }

    case 'generer_bulletins': {
      const periode = corps.periode || new Date().toISOString().slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(periode)) return erreur('Période invalide. Format attendu : 2026-02.');
      const res = await genererBulletins(orgId, periode);
      return ok({ ...res });
    }

    case 'pointage': {
      if (!corps.employeId) return erreur('employeId obligatoire.');
      const res = await pointerJournalier(orgId, corps.employeId, Math.round(Number(corps.jours)));
      if (!res.ok) return erreur(res.message, 400);
      return ok({ message: res.message });
    }

    case 'simuler': {
      // Simulateur brut → net : n'enregistre rien, sert à négocier un salaire
      const res = calculerBulletin({
        pays,
        type: corps.type || 'MENSUEL',
        salaireBrut: Number(corps.salaireBrut) || 0,
        tauxJour: Number(corps.tauxJour) || 0,
        joursTravailles: Number(corps.joursTravailles) || 0,
        transport: Number(corps.transport) || 0,
        sursalaire: Number(corps.sursalaire) || 0,
        avances: Number(corps.avances) || 0,
        params: corps.params,
      });
      return ok({
        simulation: res,
        message: `Pour ${res.brutTotal.toLocaleString('fr-FR')} FCFA de brut : net ${res.netAPayer.toLocaleString('fr-FR')} FCFA, retenues ${res.totalRetenues.toLocaleString('fr-FR')} FCFA, coût employeur ${res.coutEmployeur.toLocaleString('fr-FR')} FCFA.`,
      });
    }

    default:
      return erreur(
        'Action inconnue. Utilisez : creer_employe, generer_bulletins, pointage, simuler.',
      );
  }
});
