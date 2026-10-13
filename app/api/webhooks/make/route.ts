// =============================================================================
// POST /api/webhooks/make       (MAKE -> AFRIFLOW)
// -----------------------------------------------------------------------------
// C'est ICI que Make.com vient deposer son travail :
//   - "facture.payee"        : un paiement Mobile Money a ete confirme
//   - "stock.commande"       : le fournisseur a repondu a l'alerte
//   - "message.recu"         : un client a ecrit sur WhatsApp (AfriBot)
//   - "client.cree"          : nouveau client depuis une capture Google Forms
//
// Securite : deux barrieres
//   1. Authorization: Bearer <AFRIFLOW_API_KEY>
//   2. Signature HMAC SHA-256 dans le header x-afriflow-signature
//
// Exemple de test (voir scripts/make-test.mjs) :
//   node scripts/make-test.mjs paiement.reussi
// =============================================================================
import { apiKeyValide, erreur, handler, ok } from '@/lib/api';
import { envoyerAMake, resumeEntrant, verifySignature } from '@/lib/make';
import {
  addContribution,
  createClient,
  createInvoice,
  createPayment,
  logMessage,
  logWebhook,
  registerPayment,
} from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = handler(async (req: Request) => {
  const corpsBrut = await req.text();
  const signature = req.headers.get('x-afriflow-signature');
  const evenement = req.headers.get('x-afriflow-event') || 'inconnu';

  // --- Barriere 1 : cle API -----------------------------------------------
  if (!apiKeyValide(req)) {
    await logWebhook({
      direction: 'ENTRANT',
      event: evenement,
      scenario: 'Appel Make entrant',
      status: 'ERREUR',
      statusCode: 401,
      payloadPreview: corpsBrut.slice(0, 200),
      error: 'Clé API absente ou incorrecte (Authorization: Bearer AFRIFLOW_API_KEY)',
    });
    return erreur('Clé API invalide.', 401);
  }

  // --- Barriere 2 : signature HMAC (recommandee en production) ------------
  const secretConfigure = Boolean(process.env.MAKE_WEBHOOK_SECRET);
  if (secretConfigure && signature && !verifySignature(corpsBrut, signature)) {
    await logWebhook({
      direction: 'ENTRANT',
      event: evenement,
      scenario: 'Appel Make entrant',
      status: 'ERREUR',
      statusCode: 401,
      payloadPreview: corpsBrut.slice(0, 200),
      error: 'Signature HMAC invalide',
    });
    return erreur('Signature HMAC invalide.', 401);
  }

  let corps: any = {};
  try {
    corps = JSON.parse(corpsBrut || '{}');
  } catch {
    return erreur('Corps JSON invalide.');
  }

  const event = corps.event || corps.evenement || evenement;
  const data = corps.data || corps;
  const orgId: string | undefined = corps.orgId || data.orgId;
  let resultat: Record<string, unknown> = {};

  // --- Traitement selon l'evenement ---------------------------------------
  switch (event) {
    case 'paiement.reussi':
    case 'paiement.confirme': {
      const montant = Math.round(Number(data.montant ?? data.amount ?? 0));
      if (orgId && montant > 0) {
        const paiement = await createPayment({
          orgId,
          invoiceId: data.factureId || null,
          provider: data.provider || 'mobile_money',
          amount: montant,
          phone: data.telephone,
          reference: data.reference,
          status: 'REUSSI',
        });
        if (data.factureId) await registerPayment(data.factureId, montant, data.provider || 'mobile_money');
        resultat = {
          paiement,
          message: `Paiement de ${montant.toLocaleString('fr-FR')} FCFA encaissé et facture mise à jour.`,
        };
      } else {
        resultat = { message: 'Paiement ignoré : orgId ou montant manquant.' };
      }
      break;
    }

    case 'client.cree':
    case 'client.created': {
      if (orgId && (data.name || data.nom)) {
        const client = await createClient(orgId, {
          name: data.name || data.nom,
          phone: data.phone || data.telephone,
          email: data.email,
          city: data.city || data.ville,
          type: data.type || 'PARTICULIER',
        });
        resultat = { client, message: `Client « ${client.name} » créé depuis Make.` };
      } else {
        resultat = { message: 'Client ignoré : orgId ou nom manquant.' };
      }
      break;
    }

    case 'facture.creee':
    case 'commande.whatsapp': {
      if (orgId && Number(data.montant ?? data.amount) > 0) {
        const facture = await createInvoice(orgId, {
          clientId: data.clientId,
          clientName: data.clientName || data.client || 'Client WhatsApp',
          label: data.libelle || data.description || 'Commande reçue par WhatsApp',
          amount: Math.round(Number(data.montant ?? data.amount)),
          channel: 'MAKE',
        });
        resultat = { facture, message: `Facture ${facture.number} créée automatiquement.` };
      } else {
        resultat = { message: 'Facture ignorée : orgId ou montant manquant.' };
      }
      break;
    }

    case 'tontine.cotisation': {
      if (data.tontineId && Number(data.montant) > 0) {
        const res = await addContribution(data.tontineId, {
          member: data.membre || data.member || 'Membre',
          amount: Math.round(Number(data.montant)),
          channel: data.canal || 'MOBILE_MONEY',
        });
        resultat = { message: res.message };
      } else {
        resultat = { message: 'Cotisation ignorée : tontineId ou montant manquant.' };
      }
      break;
    }

    case 'message.envoye':
    case 'message.recu': {
      if (orgId) {
        const msg = await logMessage({
          orgId,
          channel: (data.canal || data.channel || 'WHATSAPP') as never,
          to: String(data.telephone || data.to || data.from || '—'),
          body: String(data.texte || data.body || data.message || '').slice(0, 500),
          status: event === 'message.recu' ? 'EN_ATTENTE' : 'ENVOYE',
        });
        resultat = { messageEnregistre: msg.id };
      }
      break;
    }

    case 'ping':
    case 'test': {
      resultat = { message: 'Ping reçu. La connexion Make.com ↔ MB Mustapha fonctionne ✅' };
      break;
    }

    default: {
      resultat = {
        message: `Événement « ${event} » reçu mais non traité. Événements valides : paiement.reussi, client.cree, facture.creee, commande.whatsapp, tontine.cotisation, message.envoye, message.recu, ping.`,
      };
    }
  }

  await logWebhook({
    orgId: orgId || null,
    direction: 'ENTRANT',
    event,
    scenario: 'Appel Make entrant',
    status: 'OK',
    statusCode: 200,
    payloadPreview: resumeEntrant(corps),
  });

  return ok({ evenement: event, resultat });
});

/** Make peut verifier que l'URL repond bien avec un simple GET. */
export async function GET() {
  return ok({
    message: 'Endpoint Make.com opérationnel. Envoyez un POST avec Authorization: Bearer <AFRIFLOW_API_KEY>.',
    evenements: [
      'paiement.reussi',
      'client.cree',
      'facture.creee',
      'commande.whatsapp',
      'tontine.cotisation',
      'message.envoye',
      'message.recu',
      'ping',
    ],
  });
}
