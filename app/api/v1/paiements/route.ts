// =============================================================================
// GET  /api/v1/paiements  -> dernieres transactions
// POST /api/v1/paiements  -> enregistre un paiement (appele par Make apres un
//                            encaissement Mobile Money) et met la facture a jour
// Corps : { orgId?, factureId?, montant, provider, telephone?, reference? }
// =============================================================================
import { apiKeyValide, exigerSession, erreur, handler, ok, resoudreOrgId } from '@/lib/api';
import { createPayment, getInvoice, listPayments, registerPayment } from '@/lib/store';
import { envoyerAMake, payloadPaiement } from '@/lib/make';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req: Request) => {
  const session = await exigerSession();
  const orgId = resoudreOrgId(session, new URL(req.url).searchParams.get('orgId'));
  return ok({ orgId, paiements: await listPayments(orgId) });
});

export const POST = handler(async (req: Request) => {
  const corps: any = await req.json().catch(() => ({}));
  let orgId: string;

  if (apiKeyValide(req) && corps.orgId && !req.headers.get('cookie')) {
    orgId = corps.orgId;
  } else {
    const session = await exigerSession();
    orgId = resoudreOrgId(session, corps.orgId);
  }

  const montant = Number(corps.montant ?? corps.amount ?? 0);
  if (!montant || montant <= 0) return erreur('Montant invalide.');

  const provider = corps.provider || corps.operateur || 'manuel';
  let facture = null;
  if (corps.factureId) facture = await getInvoice(corps.factureId);

  // 1. Journaliser la transaction
  const paiement = await createPayment({
    orgId,
    invoiceId: corps.factureId || null,
    provider,
    amount: Math.round(montant),
    currency: corps.devise || 'XAF',
    phone: corps.telephone || corps.phone,
    reference: corps.reference,
    status: (corps.statut as never) || 'REUSSI',
  });

  // 2. Mettre a jour la facture
  if (corps.factureId && (corps.statut || 'REUSSI') === 'REUSSI') {
    await registerPayment(corps.factureId, Math.round(montant), provider);
  }

  // 3. Reçu automatique via Make (WhatsApp + SMS au client)
  const data = payloadPaiement({
    reference: paiement.reference,
    montant: paiement.amount,
    provider,
    telephone: paiement.phone,
    facture: facture?.number,
    statut: 'Reçu ✔',
  });
  await envoyerAMake('paiement', 'paiement.reussi', data, orgId);

  return ok({
    paiement,
    facture,
    message: `Paiement de ${montant.toLocaleString('fr-FR')} FCFA enregistré${facture ? ` sur ${facture.number}` : ''}. Reçu envoyé au client.`,
  }, 201);
});
