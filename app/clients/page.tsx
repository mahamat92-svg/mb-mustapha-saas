import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, listClients, listInvoices } from '@/lib/store';
import { BadgeStatut, Card, Cellule, StatCard, Vide } from '@/components/ui';
import { MessageEnvoiForm, NouveauClientForm } from '@/components/forms-app';
import { fcfa } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Clients() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, clients, factures] = await Promise.all([getOrganization(orgId), listClients(orgId), listInvoices(orgId)]);

  const avecSolde = clients.map((c) => {
    const ses = factures.filter((f) => f.clientId === c.id);
    const du = ses.reduce((s, f) => s + (f.total - f.paid), 0);
    const total = ses.reduce((s, f) => s + f.total, 0);
    const enRetard = ses.filter((f) => f.status === 'IMPAYEE').length;
    return { ...c, du, total, nbFactures: ses.length, enRetard };
  });

  const totalDu = avecSolde.reduce((s, c) => s + c.du, 0);
  const mauvaisPayeurs = avecSolde.filter((c) => c.enRetard > 0).sort((a, b) => b.du - a.du);

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={org?.name || 'Mon entreprise'}
    >
      <div className="grid gap-5">
        <div>
          <h1 className="titre-page">Clients</h1>
          <p className="sous-titre">
            {clients.length} fiche(s) — chaque client a son historique, son encours et son carnet d’adresses
            WhatsApp.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Clients" valeur={String(clients.length)} icone="👥" />
          <StatCard label="Encours total (à recevoir)" valeur={fcfa(totalDu)} icone="🧮" ton="rouge" />
          <StatCard label="Clients en retard de paiement" valeur={String(mauvaisPayeurs.length)} icone="⚠️" ton="ambre" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Card titre="Fichier clients" sousTitre="Trié par encours — relancez d’un clic les plus gros débiteurs">
            {clients.length === 0 ? (
              <Vide message="Aucun client pour l’instant." icone="👥" />
            ) : (
              <div className="scroll-x">
                <table className="table min-w-[680px]">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Contact</th>
                      <th>Factures</th>
                      <th>Total acheté</th>
                      <th>Encours</th>
                      <th>État</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {avecSolde
                      .sort((a, b) => b.du - a.du)
                      .map((c) => (
                        <tr key={c.id}>
                          <td>
                            <Cellule principal={c.name} secondaire={`${c.type} · ${c.city}`} />
                          </td>
                          <td className="text-sm">
                            {c.phone || '—'}
                            <div className="text-xs text-ink-500">{c.email}</div>
                          </td>
                          <td className="text-sm">{c.nbFactures}</td>
                          <td className="whitespace-nowrap text-sm">{fcfa(c.total)}</td>
                          <td className="whitespace-nowrap font-bold">{fcfa(c.du)}</td>
                          <td>{c.enRetard > 0 ? <BadgeStatut statut="IMPAYEE" /> : c.du > 0 ? <BadgeStatut statut="PARTIELLE" /> : <BadgeStatut statut="PAYEE" />}</td>
                          <td>
                            <Link href="/factures" className="btn-ghost btn-sm">
                              Factures
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid content-start gap-5">
            <Card titre="Ajouter un client">
              <NouveauClientForm />
            </Card>

            <Card titre="Message groupé WhatsApp / SMS" sousTitre="Idéal pour annoncer un arrivage ou un rappel de paiement">
              <MessageEnvoiForm clients={clients} />
            </Card>
          </div>
        </div>

        <Card titre="Priorités de relance" sousTitre="Les clients à appeler aujourd’hui, dans l’ordre">
          {mauvaisPayeurs.length === 0 ? (
            <p className="text-sm text-ink-500">Aucun impayé : votre portefeuille est propre 👍</p>
          ) : (
            <ol className="grid gap-2 sm:grid-cols-2">
              {mauvaisPayeurs.slice(0, 6).map((c, i) => (
                <li key={c.id} className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
                  <span className="text-sm">
                    <strong>
                      {i + 1}. {c.name}
                    </strong>
                    <span className="block text-xs text-ink-500">
                      {c.enRetard} facture(s) en retard · {c.phone}
                    </span>
                  </span>
                  <span className="font-bold text-rose-700">{fcfa(c.du)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
