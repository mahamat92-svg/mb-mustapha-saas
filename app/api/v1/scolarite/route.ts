// =============================================================================
// GET  /api/v1/scolarite          -> élèves, échéanciers, encaissements, synthèse
// POST /api/v1/scolarite          -> actions du module ScolaPay :
//      { action: "inscrire_eleve", nom, classe, fraisAnnuels, ... }
//      { action: "encaisser", eleveId, montant, canal, note }
//      { action: "encaisser_inscription", eleveId, canal }
//      { action: "relancer", eleveId, type: "rappel" | "retard", canal: "WHATSAPP" | "SMS" }
// =============================================================================
import { erreur, exigerSession, handler, ok, resoudreOrgId } from '@/lib/api';
import {
  encaisserEcolage,
  encaisserInscription,
  getEleve,
  getOrganization,
  inscrireEleve,
  listEleves,
  listEncaissements,
  listTranches,
  logMessage,
} from '@/lib/store';
import {
  lienSms,
  lienWhatsApp,
  messageRappelEcheance,
  messageRelanceRetard,
  REGLES_SCOLAIRE,
  situationEleve,
  syntheseEcole,
} from '@/lib/scolarite';
import { BRAND } from '@/lib/config';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, new URL(req.url).searchParams.get('orgId'));

  const [org, eleves, tranches, encaissements] = await Promise.all([
    getOrganization(orgId),
    listEleves(orgId),
    listTranches(orgId),
    listEncaissements(orgId),
  ]);

  const synthese = syntheseEcole(eleves, tranches, encaissements);
  const situations = eleves.map((e) => situationEleve(e, tranches));
  const numeroPaiement = org?.phone || BRAND.whatsapp;

  return ok({
    orgId,
    etablissement: org?.name || 'École',
    ville: org?.city || '',
    numeroPaiement,
    regles: REGLES_SCOLAIRE,
    eleves,
    tranches,
    encaissements: encaissements.slice(0, 50),
    synthese,
    situations,
    messagesPrets: synthese.aRelancer.slice(0, 10).map((s) => ({
      eleveId: s.eleveId,
      nom: s.nom,
      montantEnRetard: s.montantEnRetard,
      whatsapp: messageRelanceRetard(s, numeroPaiement, org?.name || 'notre établissement'),
      lienWhatsApp: lienWhatsApp(s.parentTelephone, messageRelanceRetard(s, numeroPaiement, org?.name || 'notre établissement')),
      lienSms: lienSms(s.parentTelephone, messageRelanceRetard(s, numeroPaiement, org?.name || 'notre établissement')),
    })),
  });
});

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, corps.orgId);
  const org = await getOrganization(orgId);
  const numeroPaiement = org?.phone || BRAND.whatsapp;

  switch (corps.action) {
    case 'inscrire_eleve': {
      if (!corps.nom) return erreur('Le nom de l’élève est obligatoire.');
      if (!Number(corps.fraisAnnuels)) return erreur('Indiquez les frais de scolarité annuels (FCFA).');
      const res = await inscrireEleve(
        orgId,
        {
          nom: corps.nom,
          sexe: corps.sexe,
          classe: corps.classe,
          parentNom: corps.parentNom,
          parentTelephone: corps.parentTelephone,
          fraisAnnuels: Number(corps.fraisAnnuels),
          fraisInscription: Number(corps.fraisInscription) || 0,
        },
        Number(corps.nbTranches) || REGLES_SCOLAIRE.nbTranchesParDefaut,
      );
      return ok({ ...res, message: `${res.message} Un message d’accueil a été préparé pour le parent.` }, 201);
    }

    case 'encaisser': {
      if (!corps.eleveId) return erreur('eleveId obligatoire.');
      const montant = Number(corps.montant);
      if (!montant) return erreur('Indiquez le montant encaissé en FCFA.');
      const res = await encaisserEcolage(orgId, corps.eleveId, montant, corps.canal || 'ESPECES', corps.note || '');
      if (!res.ok) return erreur(res.message, 400);

      // Reçu au parent : message prêt à envoyer (WhatsApp ou SMS)
      const eleve = await getEleve(corps.eleveId);
      let messageParent = '';
      if (eleve) {
        messageParent =
          `Reçu ${res.recu} — ${BN(org?.name)} a bien reçu ${montant.toLocaleString('fr-FR')} FCFA pour la scolarité de ` +
          `${eleve.nom}. Reste à payer : ${(res.reste || 0).toLocaleString('fr-FR')} FCFA. Merci.`;
        await logMessage({
          orgId,
          channel: corps.canal === 'MOBILE_MONEY' ? 'WHATSAPP' : 'SMS',
          to: eleve.parentTelephone || '',
          body: messageParent,
          status: 'ENVOYE',
        });
      }
      return ok({ ...res, messageParent, lienWhatsApp: eleve ? lienWhatsApp(eleve.parentTelephone, messageParent) : '' });
    }

    case 'encaisser_inscription': {
      if (!corps.eleveId) return erreur('eleveId obligatoire.');
      const res = await encaisserInscription(orgId, corps.eleveId, corps.canal || 'ESPECES');
      if (!res.ok) return erreur(res.message, 400);
      return ok(res);
    }

    case 'relancer': {
      if (!corps.eleveId) return erreur('eleveId obligatoire.');
      const eleve = await getEleve(corps.eleveId);
      if (!eleve) return erreur('Élève introuvable.', 404);
      if (!eleve.parentTelephone) return erreur('Aucun téléphone de parent enregistré pour cet élève.', 400);

      const [tranches, encaissements] = await Promise.all([
        listTranches(orgId, eleve.id),
        listEncaissements(orgId, eleve.id),
      ]);
      const situation = situationEleve(eleve, tranches);
      const texte =
        corps.type === 'rappel'
          ? messageRappelEcheance(situation, numeroPaiement, org?.name || 'notre établissement')
          : messageRelanceRetard(situation, numeroPaiement, org?.name || 'notre établissement');

      await logMessage({
        orgId,
        channel: corps.canal === 'SMS' ? 'SMS' : 'WHATSAPP',
        to: eleve.parentTelephone,
        body: texte,
        status: 'ENVOYE',
      });

      void encaissements;
      return ok({
        message: `Message ${corps.canal === 'SMS' ? 'SMS' : 'WhatsApp'} préparé et journalisé pour ${eleve.parentNom} (${eleve.nom}).`,
        texte,
        lienWhatsApp: lienWhatsApp(eleve.parentTelephone, texte),
        lienSms: lienSms(eleve.parentTelephone, texte),
        montant: corps.type === 'rappel' ? situation.prochainMontant : situation.montantEnRetard,
      });
    }

    default:
      return erreur('Action inconnue. Utilisez : inscrire_eleve, encaisser, encaisser_inscription, relancer.');
  }
});

/** Petit utilitaire local : nom de l'établissement ou nom de la marque. */
function BN(nom?: string | null): string {
  return nom || BRAND.name;
}
