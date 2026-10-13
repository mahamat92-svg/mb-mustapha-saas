import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getInvoice, getOrganization, listClients } from '@/lib/store';
import { BadgeStatut, Card } from '@/components/ui';
import { DeclarerPaiementForm, RelanceButton } from '@/components/forms-app';
import { BoutonImprimer } from '@/components/print-button';
import { fcfa, frDate } from '@/lib/utils';
import { baseConfiguree } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function FactureDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const facture = await getInvoice(id);
  if (!facture) notFound();
  if (session.role !== 'OWNER' && facture.orgId !== session.orgId) notFound();

  const [org, clients] = await Promise.all([getOrganization(facture.orgId), listClients(facture.orgId)]);
  const client = clients.find((c) => c.id === facture.clientId);
  const reste = facture.total - facture.paid;
  const tva = facture.total - facture.amount;
  const lienVerification = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mbmustapha.com'}/verifier/${facture.number}`;

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={org?.name || 'Mon entreprise'}
    >
      <div className="grid gap-5">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/factures" className="text-sm text-ink-500 hover:text-ink-800">
              ← Retour aux factures
            </Link>
            <h1 className="titre-page mt-1">Facture {facture.number}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatut statut={facture.status} />
            <BoutonImprimer />
            <RelanceButton factureIds={[facture.id]} libelle="Relancer ce client" />
          </div>
        </div>

        {/* ------------- RECU IMPRIMABLE ------------- */}
        <div className="card mx-auto w-full max-w-3xl">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-200 pb-4">
            <div>
              <p className="text-lg font-extrabold text-ink-900">{org?.name}</p>
              <p className="text-xs text-ink-500">
                {org?.city} · {org?.countryName} · {org?.phone}
              </p>
              <p className="text-xs text-ink-500">{org?.contactEmail}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Facture</p>
              <p className="text-xl font-extrabold text-brand-700">{facture.number}</p>
              <p className="text-xs text-ink-500">Émise le {frDate(facture.issueDate)}</p>
              <p className="text-xs text-ink-500">Échéance : {frDate(facture.dueDate)}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Client</p>
              <p className="mt-1 font-bold text-ink-900">{facture.clientName}</p>
              {client && (
                <p className="text-xs text-ink-500">
                  {client.phone} {client.city ? `· ${client.city}` : ''}
                </p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Règlement</p>
              <p className="mt-1 text-sm text-ink-700">
                Mobile Money (Airtel, Moov, MTN, Orange, T-Money) · espèces · virement
              </p>
            </div>
          </div>

          <table className="table mt-5">
            <thead>
              <tr className="bg-ink-50">
                <th>Désignation</th>
                <th className="text-right">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-sm text-ink-700">{facture.label}</td>
                <td className="text-right font-semibold">{fcfa(facture.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-3 ml-auto w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Total HT</span>
              <span className="font-semibold">{fcfa(facture.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">TVA {facture.vatRate}%</span>
              <span className="font-semibold">{fcfa(tva)}</span>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-1.5 text-base">
              <span className="font-bold">Total TTC</span>
              <span className="font-extrabold text-brand-700">{fcfa(facture.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Déjà payé</span>
              <span className="font-semibold text-brand-700">{fcfa(facture.paid)}</span>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-1.5">
              <span className="font-bold">Reste à payer</span>
              <span className="font-extrabold text-rose-600">{fcfa(reste)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink-200 pt-4">
            <div className="text-xs text-ink-500">
              <p className="font-semibold text-ink-700">Vérification d’authenticité</p>
              <p className="break-all font-mono">{lienVerification}</p>
              <p className="mt-1">
                Relances envoyées : {facture.reminders} — dernière le {frDate(facture.lastRemind || facture.issueDate)}
              </p>
            </div>
            {/* QR code genere par un service public (facultatif : à retirer en mode hors-ligne) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(lienVerification)}`}
              alt={`QR de vérification de la facture ${facture.number}`}
              width={110}
              height={110}
              className="rounded-lg border border-ink-200 bg-white p-1"
            />
          </div>
        </div>

        {/* ------------- ACTIONS ------------- */}
        {reste > 0 && (
          <Card
            className="no-print mx-auto w-full max-w-3xl"
            titre="Encaisser cette facture"
            sousTitre="Deux méthodes : le client paie par Mobile Money puis déclare sa référence, ou vous enregistrez l’encaissement depuis l’espace privé."
          >
            <DeclarerPaiementForm factureId={facture.id} reste={reste} telephone={client?.phone} />
            <p className="mt-3 text-xs text-ink-500">
              Mode démonstration {baseConfiguree() ? 'désactivé (base connectée)' : 'actif (base non branchée)'} —
              configurez votre agrégateur (Kkiapay, CinetPay…) pour un encaissement 100% automatique.
            </p>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
