import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { alertesStock, getOrganization, getStats, getSubscription, listInvoices, listPayments } from '@/lib/store';
import { BandeauDemo, Barre, BadgeStatut, Card, Cellule, StatCard, Vide } from '@/components/ui';
import { RelanceButton } from '@/components/forms-app';
import { MODULES, PLAN_BY_ID, COUNTRY_BY_CODE } from '@/lib/config';
import { fcfa, frDate, pct } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function TableauDeBord() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, stats, factures, paiements, stock, abo] = await Promise.all([
    getOrganization(orgId),
    getStats(orgId),
    listInvoices(orgId),
    listPayments(orgId),
    alertesStock(orgId),
    getSubscription(orgId),
  ]);

  const enRetard = factures.filter((f) => f.status === 'IMPAYEE');
  const pays = COUNTRY_BY_CODE(org?.country || 'TD');
  const plan = PLAN_BY_ID(org?.plan || 'STARTER');
  const modulesActifs = MODULES.filter((m, i) => (plan.maxModules === 'illimite' ? true : i < (plan.maxModules as number)));

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={`${org?.name || 'Mon entreprise'} — ${pays.flag} ${pays.name}`}
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="titre-page">Bonjour {session.name.split(' ')[0]} 👋</h1>
            <p className="sous-titre">
              Vue du {frDate(new Date())} — activité de {org?.name} à {org?.city}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/factures" className="btn-primary">
              + Nouvelle facture
            </Link>
            <RelanceButton libelle={`Relancer ${enRetard.length} impayé(s)`} />
          </div>
        </div>

        <BandeauDemo />

        {/* Indicateurs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Chiffre d’affaires" valeur={fcfa(stats.chiffreAffaires)} aide={`${stats.nbFactures} factures émises`} icone="🧾" />
          <StatCard label="Encaissé" valeur={fcfa(stats.encaisse)} aide={`Panier moyen ${fcfa(stats.panierMoyen)}`} icone="💰" ton="vert" />
          <StatCard label="Impayé" valeur={fcfa(stats.impaye)} aide={`${stats.facturesEnRetard} facture(s) en retard`} icone="⏰" ton="rouge" />
          <StatCard label="Alertes de stock" valeur={String(stats.alertesStock)} aide="articles sous le seuil" icone="📦" ton="ambre" />
        </div>

        <Card titre="Taux de recouvrement" sousTitre="Part de votre chiffre d’affaires réellement rentrée en caisse">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Barre valeur={stats.tauxRecouvrement} />
            </div>
            <p className="text-2xl font-extrabold text-brand-700">{stats.tauxRecouvrement}%</p>
          </div>
          <p className="mt-2 text-xs text-ink-500">
            Objectif conseillé : plus de 85%. Chaque relance automatique envoyée fait bouger ce curseur.
          </p>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Factures */}
          <Card
            titre="Factures récentes"
            sousTitre={`${enRetard.length} en retard pour ${fcfa(enRetard.reduce((s, f) => s + (f.total - f.paid), 0))}`}
            action={
              <Link href="/factures" className="btn-ghost btn-sm">
                Tout voir
              </Link>
            }
          >
            {factures.length === 0 ? (
              <Vide message="Aucune facture pour le moment. Créez la première !" icone="🧾" />
            ) : (
              <div className="scroll-x">
                <table className="table min-w-[560px]">
                  <thead>
                    <tr>
                      <th>Facture</th>
                      <th>Client</th>
                      <th>Total</th>
                      <th>Reste</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factures.slice(0, 6).map((f) => (
                      <tr key={f.id}>
                        <td>
                          <Link className="lien" href={`/factures/${f.id}`}>
                            {f.number}
                          </Link>
                          <div className="text-xs text-ink-500">{frDate(f.issueDate)}</div>
                        </td>
                        <td className="text-sm">{f.clientName}</td>
                        <td className="whitespace-nowrap font-semibold">{fcfa(f.total)}</td>
                        <td className="whitespace-nowrap text-sm">{fcfa(f.total - f.paid)}</td>
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

          <div className="grid gap-5">
            {/* Abonnement */}
            <Card titre="Mon abonnement">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-ink-900">{plan.name}</p>
                  <p className="text-xs text-ink-500">{plan.tagline}</p>
                </div>
                <BadgeStatut statut={org?.planStatus || 'ACTIF'} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-brand-700">
                {plan.price === 0 ? 'Gratuit' : fcfa(plan.price)}
                {plan.price > 0 && <span className="text-xs font-semibold text-ink-500"> /mois</span>}
              </p>
              {abo?.renewAt && <p className="mt-1 text-xs text-ink-500">Renouvellement : {frDate(abo.renewAt)}</p>}
              <Link href="/abonnement" className="btn-primary mt-4 w-full">
                Gérer mon abonnement
              </Link>
            </Card>

            {/* Alertes stock */}
            <Card titre="Stock à surveiller" action={<Link href="/stock" className="btn-ghost btn-sm">Gérer</Link>}>
              {stock.length === 0 ? (
                <p className="text-sm text-ink-500">Aucune alerte : tous vos articles sont au-dessus du seuil 👍</p>
              ) : (
                <ul className="space-y-2">
                  {stock.slice(0, 4).map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
                      <Cellule principal={s.name} secondaire={`${s.sku} · ${s.supplier}`} />
                      <span className="badge-red">
                        {s.qty} {s.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Paiements */}
            <Card titre="Derniers paiements" action={<Link href="/paiements" className="btn-ghost btn-sm">Voir</Link>}>
              {paiements.length === 0 ? (
                <p className="text-sm text-ink-500">Aucun paiement enregistré.</p>
              ) : (
                <ul className="space-y-2">
                  {paiements.slice(0, 4).map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2">
                      <Cellule principal={fcfa(p.amount)} secondaire={`${p.provider} · ${p.reference}`} />
                      <BadgeStatut statut={p.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {/* Modules actifs */}
        <Card
          titre="Mes modules"
          sousTitre={`Offre ${plan.name} — ${plan.maxModules === 'illimite' ? 'les 10 modules' : plan.maxModules + ' modules activés'}`}
          action={
            <Link href="/abonnement" className="btn-ghost btn-sm">
              Débloquer plus de modules
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => {
              const actif = modulesActifs.some((a) => a.id === m.id);
              return (
                <div key={m.id} className={actif ? 'card-tight border-brand-200 bg-brand-50/40' : 'card-tight opacity-60'}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{m.icon}</span>
                    <span className={actif ? 'badge-green' : 'badge-gray'}>{actif ? 'Actif' : `dès ${m.planMin}`}</span>
                  </div>
                  <p className="mt-2 font-bold text-ink-900">{m.name}</p>
                  <p className="text-xs text-ink-500">{m.tagline}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Résumé du jour */}
        <Card titre="Le réflexe du jour">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-xs uppercase text-ink-500">À relancer</p>
              <p className="text-lg font-bold">{enRetard.length} facture(s)</p>
              <p className="text-xs text-ink-500">{fcfa(enRetard.reduce((s, f) => s + (f.total - f.paid), 0))} en jeu</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-xs uppercase text-ink-500">Clients</p>
              <p className="text-lg font-bold">{stats.nbClients}</p>
              <p className="text-xs text-ink-500">fiches actives</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-xs uppercase text-ink-500">Part encaissée</p>
              <p className="text-lg font-bold">{pct(stats.encaisse, stats.chiffreAffaires)}%</p>
              <p className="text-xs text-ink-500">de votre chiffre d’affaires</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
