import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, listTontines } from '@/lib/store';
import { BadgeStatut, Card, StatCard, Vide } from '@/components/ui';
import { CotisationForm } from '@/components/forms-app';
import { fcfa, frDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Tontines() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, tontines] = await Promise.all([getOrganization(orgId), listTontines(orgId)]);

  const cagnotteTotale = tontines.reduce((s, t) => s + t.pot, 0);
  const membres = tontines.reduce((s, t) => s + t.membersCount, 0);
  const retards = tontines.flatMap((t) => t.contributions).filter((c) => c.status === 'RETARD');

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={org?.name || 'Mon entreprise'}
    >
      <div className="grid gap-5">
        <div>
          <h1 className="titre-page">Tontines, njangi & coopératives</h1>
          <p className="sous-titre">
            La tontine est le système d’épargne le plus utilisé en Afrique centrale et de l’Ouest. Ici, chaque
            cotisation est tracée, le membre reçoit un SMS, et les tours ne se discutent plus.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Groupes gérés" valeur={String(tontines.length)} icone="🤝" />
          <StatCard label="Cagnottes du tour" valeur={fcfa(cagnotteTotale)} icone="💰" ton="vert" />
          <StatCard label="Cotisations en retard" valeur={String(retards.length)} aide={`${membres} membres au total`} icone="⚠️" ton="rouge" />
        </div>

        {tontines.length === 0 ? (
          <Vide message="Aucune tontine enregistrée pour cette entreprise." icone="🤝" />
        ) : (
          <div className="grid gap-5">
            {tontines.map((t) => {
              const recu = t.contributions.filter((c) => c.status === 'RECU').reduce((s, c) => s + c.amount, 0);
              const membresNoms = Array.from(new Set(t.contributions.map((c) => c.member)));
              return (
                <Card
                  key={t.id}
                  titre={t.name}
                  sousTitre={`${t.membersCount} membres · cotisation ${fcfa(t.contribution)} · ${t.cycle === 'MENSUEL' ? 'cycle mensuel' : 'cycle hebdomadaire'}`}
                  action={<BadgeStatut statut={t.pot >= t.contribution * t.membersCount ? 'RECU' : 'EN_ATTENTE'} />}
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                    <div className="grid content-start gap-3">
                      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Cagnotte du tour</p>
                        <p className="mt-1 text-2xl font-extrabold text-brand-800">{fcfa(t.pot)}</p>
                        <p className="mt-1 text-xs text-ink-600">
                          Bénéficiaire : <strong>{t.beneficiary}</strong>
                        </p>
                        <p className="text-xs text-ink-600">Prochain tour : {frDate(t.nextDate)}</p>
                      </div>
                      <div className="rounded-xl bg-ink-50 p-4 text-sm">
                        <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Ce cycle</p>
                        <p className="mt-1">
                          Cotisations reçues : <strong>{fcfa(recu)}</strong>
                        </p>
                        <p className="text-xs text-ink-500">
                          Chaque membre reçoit un SMS de confirmation automatiquement (Make.com).
                        </p>
                      </div>
                      <CotisationForm tontineId={t.id} membres={membresNoms} />
                    </div>

                    <div className="scroll-x">
                      <table className="table min-w-[420px]">
                        <thead>
                          <tr>
                            <th>Membre</th>
                            <th>Montant</th>
                            <th>Canal</th>
                            <th>Date</th>
                            <th>État</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.contributions.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-sm text-ink-500">
                                Aucune cotisation enregistrée pour ce cycle.
                              </td>
                            </tr>
                          )}
                          {t.contributions.map((c) => (
                            <tr key={c.id}>
                              <td className="text-sm font-semibold">{c.member}</td>
                              <td className="whitespace-nowrap text-sm">{fcfa(c.amount)}</td>
                              <td className="text-xs text-ink-500">{c.channel.replace('_', ' ')}</td>
                              <td className="whitespace-nowrap text-xs text-ink-500">{frDate(c.paidAt)}</td>
                              <td>
                                <BadgeStatut statut={c.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card titre="Pourquoi c’est important" sousTitre="Le module le plus demandé dans les communautés">
          <div className="grid gap-4 sm:grid-cols-3 text-sm text-ink-600">
            <div>
              <p className="font-bold text-ink-900">Fin des disputes</p>
              <p className="mt-1">
                Le reçu SMS arrive sur le téléphone du membre : personne ne peut plus dire « j’ai déjà payé »
                sans preuve.
              </p>
            </div>
            <div>
              <p className="font-bold text-ink-900">Collecte plus rapide</p>
              <p className="mt-1">
                Les cotisations arrivent par Mobile Money, la cagnotte se remplit avant la date du tour, même
                pour les membres en voyage.
              </p>
            </div>
            <div>
              <p className="font-bold text-ink-900">Confiance et croissance</p>
              <p className="mt-1">
                Un historique propre permet d’ouvrir une coopérative d’épargne, d’obtenir un microcrédit ou de
                justifier ses comptes devant les autorités.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
