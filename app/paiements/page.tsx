import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, listInvoices, listPayments } from '@/lib/store';
import { BadgeStatut, Card, Cellule, StatCard } from '@/components/ui';
import { DeclarationPaiementLibre } from '@/components/paiement-libre';
import { USSD_CODES } from '@/lib/paiements';
import { fcfa, frDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Paiements() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, paiements, factures] = await Promise.all([
    getOrganization(orgId),
    listPayments(orgId),
    listInvoices(orgId),
  ]);

  const impayees = factures
    .filter((f) => f.status !== 'PAYEE' && f.status !== 'ANNULEE')
    .map((f) => ({ id: f.id, number: f.number, clientName: f.clientName, reste: f.total - f.paid }));

  const encaisse = paiements.filter((p) => p.status === 'REUSSI').reduce((s, p) => s + p.amount, 0);
  const enAttente = paiements.filter((p) => p.status === 'EN_ATTENTE');
  const ussd = USSD_CODES.filter((u) => u.pays === (org?.country || 'TD'));

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={org?.name || 'Mon entreprise'}
    >
      <div className="grid gap-5">
        <div>
          <h1 className="titre-page">Mobile Money & encaissements</h1>
          <p className="sous-titre">
            Un seul écran pour voir tout l’argent qui entre : Mobile Money, espèces en boutique, virement,
            agrégateurs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Encaissé (60 derniers)" valeur={fcfa(encaisse)} icone="💰" ton="vert" />
          <StatCard label="En attente de validation" valeur={String(enAttente.length)} aide={fcfa(enAttente.reduce((s, p) => s + p.amount, 0))} icone="⏳" ton="ambre" />
          <StatCard label="Factures ouvertes" valeur={String(impayees.length)} icone="🧾" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <Card titre="Historique des transactions" sousTitre="Chaque encaissement génère un reçu automatique au client">
            {paiements.length === 0 ? (
              <p className="text-sm text-ink-500">Aucune transaction enregistrée.</p>
            ) : (
              <div className="scroll-x">
                <table className="table min-w-[560px]">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Opérateur</th>
                      <th>Référence</th>
                      <th>État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiements.map((p) => (
                      <tr key={p.id}>
                        <td className="whitespace-nowrap text-xs text-ink-500">{frDateTime(p.createdAt)}</td>
                        <td className="whitespace-nowrap font-semibold">{fcfa(p.amount)}</td>
                        <td className="text-sm">{p.provider.replace('_', ' ')}</td>
                        <td className="font-mono text-xs">{p.reference}</td>
                        <td>
                          <BadgeStatut statut={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid content-start gap-5">
            <Card titre="Enregistrer un encaissement" sousTitre="Saisie manuelle (comptoir, reçu papier, virement)">
              <DeclarationPaiementLibre factures={impayees} />
            </Card>

            <Card titre={`Codes USSD — ${org?.countryName || 'Tchad'}`}>
              <ul className="space-y-2 text-sm">
                {ussd.map((u) => (
                  <li key={u.operateur} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2">
                    <span>{u.operateur}</span>
                    <span className="font-mono font-bold text-brand-700">{u.code}</span>
                  </li>
                ))}
                {ussd.length === 0 && <li className="text-sm text-ink-500">Aucun code enregistré pour ce pays.</li>}
              </ul>
              <p className="mt-3 text-xs text-ink-500">
                Codes indicatifs, à confirmer auprès de l’opérateur — ils changent parfois sans préavis.
              </p>
            </Card>
          </div>
        </div>

        <Card titre="Comment l’encaissement automatique fonctionne" sousTitre="Le chemin complet d’un paiement">
          <ol className="grid gap-3 text-sm text-ink-600 sm:grid-cols-2 lg:grid-cols-4">
            <li className="rounded-xl bg-ink-50 p-3">
              <strong className="text-ink-900">1. Le client paie</strong>
              <p className="mt-1">Airtel Money, MTN MoMo, Orange Money, Moov, T-Money, Wave… avec la référence de sa facture.</p>
            </li>
            <li className="rounded-xl bg-ink-50 p-3">
              <strong className="text-ink-900">2. L’agrégateur confirme</strong>
              <p className="mt-1">Kkiapay / CinetPay envoie un callback à MB Mustapha (ou à Make, qui vérifie).</p>
            </li>
            <li className="rounded-xl bg-ink-50 p-3">
              <strong className="text-ink-900">3. La facture passe à « Payée »</strong>
              <p className="mt-1">Le solde est recalculé, les relances s’arrêtent automatiquement.</p>
            </li>
            <li className="rounded-xl bg-ink-50 p-3">
              <strong className="text-ink-900">4. Le reçu part</strong>
              <p className="mt-1">WhatsApp + SMS au client, et le patron reçoit le résumé du jour à 7h.</p>
            </li>
          </ol>
        </Card>
      </div>
    </DashboardShell>
  );
}
