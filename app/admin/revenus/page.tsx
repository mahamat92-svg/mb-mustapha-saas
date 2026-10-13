import { requireOwner } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_ADMIN } from '@/lib/nav';
import { getGlobalStats, listSubscriptions } from '@/lib/store';
import { Barre, BadgeStatut, Card, Cellule, StatCard } from '@/components/ui';
import { REVENDEUR_COMMISSION } from '@/lib/config';
import { fcfa, frDate, pct } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const OBJECTIFS = [
  { clients: 10, mrr: 147_600 },
  { clients: 30, mrr: 582_400 },
  { clients: 100, mrr: 1_832_000 },
  { clients: 300, mrr: 5_652_000 },
];

export default async function AdminRevenus() {
  const session = await requireOwner();
  const [stats, subs] = await Promise.all([getGlobalStats(), listSubscriptions()]);

  const actifs = subs.filter((s) => s.status === 'ACTIF');
  const enRetard = subs.filter((s) => s.status === 'EN_RETARD');
  const essais = subs.filter((s) => s.status === 'ESSAI');
  const prochaines = [...subs].sort((a, b) => new Date(a.renewAt).getTime() - new Date(b.renewAt).getTime());

  const parPlan = subs.reduce<Record<string, { n: number; mrr: number }>>((acc, s) => {
    if (s.status !== 'ACTIF') return acc;
    acc[s.plan] = acc[s.plan] || { n: 0, mrr: 0 };
    acc[s.plan].n += 1;
    acc[s.plan].mrr += s.amount;
    return acc;
  }, {});

  return (
    <DashboardShell
      nav={NAV_ADMIN}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte="MB Mustapha — édition du SaaS"
      variante="admin"
    >
      <div className="grid gap-5">
        <div>
          <h1 className="titre-page">Revenus récurrents</h1>
          <p className="sous-titre">
            MRR (mensuel), ARR (annuel projeté), panier moyen et échéancier des renouvellements — tout en FCFA.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="MRR" valeur={fcfa(stats.mrr)} icone="💵" ton="vert" />
          <StatCard label="ARR" valeur={fcfa(stats.arr)} icone="📈" />
          <StatCard label="Panier moyen (ARPU)" valeur={fcfa(stats.arpu)} icone="🎯" />
          <StatCard label="Abonnements actifs" valeur={String(actifs.length)} aide={`${essais.length} en essai`} icone="✅" />
          <StatCard label="Impayés d’abonnement" valeur={String(enRetard.length)} aide={fcfa(enRetard.reduce((s, x) => s + x.amount, 0))} icone="⚠️" ton="rouge" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card titre="Objectifs de croissance" sousTitre="Combien de clients pour atteindre tel revenu (calcul exact sur vos prix)">
            <ul className="grid gap-3">
              {OBJECTIFS.map((o) => (
                <li key={o.clients} className="rounded-xl bg-ink-50 px-3 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-800">{o.clients} clients payants</span>
                    <span className="font-bold text-brand-700">{fcfa(o.mrr)} / mois</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <Barre valeur={pct(stats.mrr, o.mrr)} />
                    </div>
                    <span className="text-xs text-ink-500">{pct(stats.mrr, o.mrr)}% atteint</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    soit {fcfa(o.mrr * 12)} par an — {o.clients <= 30 ? 'objectif des 6 premiers mois' : 'objectif à 12–24 mois'}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid content-start gap-5">
            <Card titre="Répartition par offre">
              {Object.keys(parPlan).length === 0 ? (
                <p className="text-sm text-ink-500">Aucun abonnement actif pour l’instant.</p>
              ) : (
                <ul className="grid gap-2">
                  {Object.entries(parPlan).map(([plan, v]) => (
                    <li key={plan} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-sm">
                      <span className="font-semibold">{plan}</span>
                      <span className="text-xs text-ink-500">{v.n} client(s)</span>
                      <span className="font-bold">{fcfa(v.mrr)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card titre="Programme revendeurs" sousTitre={`${Math.round(REVENDEUR_COMMISSION * 100)}% la 1ʳᵉ année, 15% ensuite`}>
              <p className="text-sm text-ink-600">
                Un revendeur qui apporte 10 clients Starter vous coûte {fcfa(9900 * 0.3 * 10)} FCFA par mois de
                commission… mais vous laisse {fcfa(9900 * 0.7 * 10)} FCFA de revenu net récurrent, sans effort de
                vente. C’est le levier le plus rapide en Afrique : le réseau compte plus que la publicité.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-ink-500">
                <li>• Paiement des commissions en Mobile Money chaque 1ᵉʳ du mois.</li>
                <li>• Tableau de suivi : un code revendeur par partenaire (à brancher dans le module Clients).</li>
                <li>• Formation gratuite et supports de vente fournis.</li>
              </ul>
            </Card>
          </div>
        </div>

        <Card titre="Abonnements & renouvellements" sousTitre="Trié par date de renouvellement — relancez 5 jours avant">
          <div className="scroll-x">
            <table className="table min-w-[760px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Entreprise</th>
                  <th>Offre</th>
                  <th>Montant</th>
                  <th>Moyen de paiement</th>
                  <th>Renouvellement</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {prochaines.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Cellule principal={s.orgName || s.orgId} secondaire={`Début ${frDate(s.startedAt)}`} />
                    </td>
                    <td>
                      <span className="badge-blue">{s.plan}</span>
                    </td>
                    <td className="whitespace-nowrap font-bold">
                      {fcfa(s.amount)} <span className="text-xs font-normal text-ink-500">/ mois</span>
                    </td>
                    <td className="text-sm">{s.provider}</td>
                    <td className="whitespace-nowrap text-sm">{frDate(s.renewAt)}</td>
                    <td>
                      <BadgeStatut statut={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card titre="Trésorerie : d’où vient chaque franc" sousTitre="Modèle économique complet">
          <div className="scroll-x">
            <table className="table min-w-[720px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Source</th>
                  <th>Nature</th>
                  <th>Exemple de montant</th>
                  <th>Marge</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Abonnements FCFA</td>
                  <td>Récurrent mensuel</td>
                  <td>9 900 → 149 000 FCFA / client</td>
                  <td>≈ 85%</td>
                </tr>
                <tr>
                  <td className="font-semibold">Packs SMS</td>
                  <td>Récurrent à l’usage</td>
                  <td>12 500 FCFA / 500 SMS</td>
                  <td>≈ 40%</td>
                </tr>
                <tr>
                  <td className="font-semibold">Installation & formation</td>
                  <td>Ponctuel</td>
                  <td>50 000 → 250 000 FCFA</td>
                  <td>Variable (temps)</td>
                </tr>
                <tr>
                  <td className="font-semibold">Sur-mesure / ONG</td>
                  <td>Projet</td>
                  <td>500 000 FCFA et plus</td>
                  <td>Selon périmètre</td>
                </tr>
                <tr>
                  <td className="font-semibold">Commissions revendeurs (négatif)</td>
                  <td>Coût d’acquisition</td>
                  <td>−30% la 1ʳᵉ année</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Charges typiques à prévoir : hébergement (Vercel/Neon gratuits au démarrage, puis 20 000–40 000
            FCFA/mois), SMS/WhatsApp à l’usage, frais d’agrégateur (2–3,5% des transactions).
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
