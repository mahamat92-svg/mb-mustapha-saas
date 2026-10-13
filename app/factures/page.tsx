import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, listClients, listInvoices } from '@/lib/store';
import { BadgeStatut, Card, StatCard } from '@/components/ui';
import { NouvelleFactureForm, RelanceButton } from '@/components/forms-app';
import { COUNTRY_BY_CODE } from '@/lib/config';
import { fcfa, frDate } from '@/lib/utils';
import type { InvoiceRec } from '@/lib/types';

export const dynamic = 'force-dynamic';

const FILTRES: { id: string; label: string }[] = [
  { id: '', label: 'Toutes' },
  { id: 'IMPAYEE', label: 'En retard' },
  { id: 'PARTIELLE', label: 'Partielles' },
  { id: 'ENVOYEE', label: 'En attente' },
  { id: 'PAYEE', label: 'Payées' },
];

export default async function Factures({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const session = await requireSession();
  const orgId = session.orgId!;
  const sp = await searchParams;
  const filtre = (sp?.statut || '').toUpperCase();

  const [org, clients, toutes] = await Promise.all([getOrganization(orgId), listClients(orgId), listInvoices(orgId)]);
  const pays = COUNTRY_BY_CODE(org?.country || 'TD');
  const factures: InvoiceRec[] = filtre ? toutes.filter((f) => f.status === filtre) : toutes;

  const totalRetard = toutes
    .filter((f) => f.status === 'IMPAYEE')
    .reduce((s, f) => s + (f.total - f.paid), 0);

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={org?.name || 'Mon entreprise'}
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="titre-page">Factures & reçus</h1>
            <p className="sous-titre">
              TVA appliquée automatiquement : {pays.vat}% ({pays.fiscal}) — devise FCFA {pays.currency}
            </p>
          </div>
          <RelanceButton libelle="Relancer tous les impayés" variante="accent" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Factures" valeur={String(toutes.length)} icone="🧾" />
          <StatCard label="Total facturé" valeur={fcfa(toutes.reduce((s, f) => s + f.total, 0))} icone="💵" ton="vert" />
          <StatCard label="En retard" valeur={fcfa(totalRetard)} icone="⏰" ton="rouge" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Card
            titre={`${factures.length} facture(s)`}
            sousTitre="Cliquez sur une facture pour imprimer le reçu ou déclarer un paiement"
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {FILTRES.map((f) => {
                const actif = filtre === f.id;
                const compte = f.id ? toutes.filter((x) => x.status === f.id).length : toutes.length;
                return (
                  <Link
                    key={f.id || 'toutes'}
                    href={f.id ? `/factures?statut=${f.id}` : '/factures'}
                    className={actif ? 'btn-dark btn-sm' : 'btn-ghost btn-sm'}
                  >
                    {f.label} ({compte})
                  </Link>
                );
              })}
            </div>

            {factures.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-500">Aucune facture dans ce filtre.</p>
            ) : (
              <div className="scroll-x">
                <table className="table min-w-[720px]">
                  <thead>
                    <tr>
                      <th>N° / Date</th>
                      <th>Client</th>
                      <th>Désignation</th>
                      <th>Total TTC</th>
                      <th>Reste</th>
                      <th>Échéance</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factures.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <Link href={`/factures/${f.id}`} className="lien">
                            {f.number}
                          </Link>
                          <div className="text-xs text-ink-500">{frDate(f.issueDate)}</div>
                        </td>
                        <td className="text-sm">{f.clientName}</td>
                        <td className="max-w-[200px] truncate text-sm text-ink-600">{f.label}</td>
                        <td className="whitespace-nowrap font-semibold">{fcfa(f.total)}</td>
                        <td className="whitespace-nowrap text-sm">{fcfa(f.total - f.paid)}</td>
                        <td className="whitespace-nowrap text-xs text-ink-500">{frDate(f.dueDate)}</td>
                        <td>
                          <BadgeStatut statut={f.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid content-start gap-5">
            <Card titre="Créer une facture" sousTitre="Le numéro est généré sans trou (obligatoire en cas de contrôle)">
              <NouvelleFactureForm clients={clients} tvaDefaut={pays.vat} />
            </Card>

            <Card titre="Bon à savoir">
              <ul className="space-y-2 text-sm text-ink-600">
                <li>• Le reçu comporte un QR code de vérification (anti-falsification).</li>
                <li>• Un impayé est relancé au maximum 4 fois automatiquement (J+3, J+7, J+15, J+30).</li>
                <li>• Le client peut payer par Mobile Money et déclarer sa référence : vous validez en un clic.</li>
                <li>• L’export Excel est disponible depuis l’espace privé de votre entreprise (sur demande).</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
