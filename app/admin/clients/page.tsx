import Link from 'next/link';
import { requireOwner } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_ADMIN } from '@/lib/nav';
import { getGlobalStats, listOrganizations } from '@/lib/store';
import { BadgeStatut, Card, Cellule, StatCard } from '@/components/ui';
import { actionActiverAbonnement, actionChangerStatut } from '../actions';
import { PLANS } from '@/lib/config';
import { fcfa, frDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminClients() {
  const session = await requireOwner();
  const [orgs, stats] = await Promise.all([listOrganizations(), getGlobalStats()]);

  const mrrTotal = orgs.reduce((s, o) => s + o.mrr, 0);

  return (
    <DashboardShell
      nav={NAV_ADMIN}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte="MB Mustapha — édition du SaaS"
      variante="admin"
    >
      <div className="grid gap-5">
        <div>
          <h1 className="titre-page">Entreprises clientes</h1>
          <p className="sous-titre">
            {orgs.length} compte(s) — changez une offre, activez un abonnement après réception du paiement, ou
            suspendez un compte en retard de plus de 15 jours.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Comptes" valeur={String(orgs.length)} icone="🏢" />
          <StatCard label="MRR total" valeur={fcfa(mrrTotal)} icone="💵" ton="vert" />
          <StatCard label="En essai" valeur={String(stats.enEssai)} aide="à convertir avant la fin des 14 jours" icone="🎯" ton="ambre" />
          <StatCard label="En retard de paiement" valeur={String(stats.enRetard)} aide="à relancer en priorité" icone="⚠️" ton="rouge" />
        </div>

        <Card titre="Tableau des comptes" sousTitre="Toutes les actions sont immédiates (server actions sécurisées)">
          <div className="scroll-x">
            <table className="table min-w-[1000px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Entreprise</th>
                  <th>Pays / ville</th>
                  <th>Contact</th>
                  <th>Offre</th>
                  <th>MRR</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Cellule principal={o.name} secondaire={o.id} />
                    </td>
                    <td className="text-sm">
                      {o.countryName}
                      <div className="text-xs text-ink-500">{o.city}</div>
                    </td>
                    <td className="text-xs">
                      {o.contactEmail}
                      <div className="text-ink-500">{o.phone}</div>
                    </td>
                    <td>
                      <span className="badge-blue">{o.plan}</span>
                    </td>
                    <td className="whitespace-nowrap font-bold">{o.plan === 'DECOUVERTE' ? 'Gratuit' : fcfa(o.mrr)}</td>
                    <td>
                      <BadgeStatut statut={o.planStatus} />
                    </td>
                    <td className="whitespace-nowrap text-xs text-ink-500">{frDate(o.createdAt)}</td>
                    <td>
                      <div className="grid gap-2">
                        <form action={actionActiverAbonnement} className="flex items-center gap-1">
                          <input type="hidden" name="orgId" value={o.id} />
                          <select name="plan" defaultValue={o.plan} className="rounded-lg border border-ink-200 px-2 py-1 text-xs">
                            {PLANS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {p.price === 0 ? 'gratuit' : fcfa(p.price)}
                              </option>
                            ))}
                          </select>
                          <input type="hidden" name="provider" value="manuel" />
                          <button className="btn-primary btn-sm">Activer</button>
                        </form>

                        <form action={actionChangerStatut} className="flex items-center gap-1">
                          <input type="hidden" name="orgId" value={o.id} />
                          <select name="statut" defaultValue={o.planStatus} className="rounded-lg border border-ink-200 px-2 py-1 text-xs">
                            <option value="ACTIF">Actif</option>
                            <option value="ESSAI">Essai</option>
                            <option value="EN_RETARD">En retard</option>
                            <option value="SUSPENDU">Suspendu</option>
                          </select>
                          <button className="btn-ghost btn-sm">Appliquer</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card titre="Méthode de relance de VOS clients en retard" sousTitre="Vous avez le même problème que vos clients… et la même solution">
            <ol className="space-y-2 text-sm text-ink-600">
              <li>1. J+1 après l’échéance : WhatsApp automatique « votre abonnement arrive à échéance ».</li>
              <li>2. J+5 : SMS + lien de paiement Mobile Money.</li>
              <li>3. J+10 : appel téléphonique (le patron est souvent en déplacement, insistez sur la reprise du service).</li>
              <li>4. J+15 : basculement en « En retard » (modules en lecture seule) — l’accès en écriture revient dès le paiement.</li>
              <li>5. J+30 : proposition d’un paiement partiel ou d’un passage à l’offre inférieure plutôt qu’une perte définitive.</li>
            </ol>
          </Card>

          <Card titre="Comment marier offre et besoins" sousTitre="Discours commercial prêt à l’emploi">
            <ul className="space-y-3 text-sm text-ink-600">
              <li>
                <strong className="text-ink-900">Boutique / marché</strong> → Starter : factures, stock, relances. Le
                gagnant : le stock qui ne tombe plus en rupture.
              </li>
              <li>
                <strong className="text-ink-900">PME / distributeur</strong> → Pro : recouvrement + paiements
                Mobile Money + 2 000 factures. Le gagnant : la trésorerie.
              </li>
              <li>
                <strong className="text-ink-900">École / clinique</strong> → Pro : frais scolaires, échéanciers,
                relances aux parents.
              </li>
              <li>
                <strong className="text-ink-900">Coopérative / tontine</strong> → Coopérative : cotisations,
                cagnottes, PV de séance, formation sur site.
              </li>
              <li>
                <strong className="text-ink-900">ONG / bailleur</strong> → Business : traçabilité agricole,
                rapports, hébergement à leur nom.
              </li>
            </ul>
            <Link href="/tarifs" className="lien mt-3 inline-block">
              Voir la grille tarifaire complète →
            </Link>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
