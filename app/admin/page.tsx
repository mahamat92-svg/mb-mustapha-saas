import Link from 'next/link';
import { requireOwner } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_ADMIN } from '@/lib/nav';
import { getGlobalStats, listPayments } from '@/lib/store';
import { BadgeStatut, BandeauDemo, Barre, Card, Cellule, StatCard } from '@/components/ui';
import { actionResetDemo, actionTrancherPaiement } from './actions';
import { fcfa, frDateTime, pct } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminPilotage() {
  const session = await requireOwner();
  const [stats, paiements] = await Promise.all([getGlobalStats(), listPayments(null)]);

  const enAttente = paiements.filter((p) => p.status === 'EN_ATTENTE');
  const objectifMrr = 1_832_000; // scénario "100 clients" présenté dans l'étude de marché

  return (
    <DashboardShell
      nav={NAV_ADMIN}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte="MB Mustapha — édition du SaaS"
      variante="admin"
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="titre-page">Pilotage du SaaS</h1>
            <p className="sous-titre">
              Vue réservée au propriétaire — entreprises clientes, revenus récurrents et opérations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/make" className="btn-ghost">
              ⚙️ Tester Make
            </Link>
            <Link href="/admin/revenus" className="btn-primary">
              📈 Voir les revenus
            </Link>
          </div>
        </div>

        <BandeauDemo />

        {/* KPIs SaaS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="MRR (revenu mensuel)" valeur={fcfa(stats.mrr)} aide={`${stats.clientsActifs} client(s) actif(s)`} icone="💵" ton="vert" />
          <StatCard label="ARR (projection annuelle)" valeur={fcfa(stats.arr)} aide={`Panier moyen ${fcfa(stats.arpu)}`} icone="📈" />
          <StatCard label="Entreprises clientes" valeur={String(stats.nbClients)} aide={`${stats.enEssai} en essai · ${stats.enRetard} en retard`} icone="🏢" />
          <StatCard label="Paiements à valider" valeur={String(enAttente.length)} aide={fcfa(enAttente.reduce((s, p) => s + p.amount, 0))} icone="✅" ton={enAttente.length ? 'ambre' : 'neutre'} />
        </div>

        <Card
          titre="Progression vers l’objectif des 100 clients"
          sousTitre="Objectif de référence : 1 832 000 FCFA de MRR (voir la page Marché & offre)"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Barre valeur={pct(stats.mrr, objectifMrr)} />
            </div>
            <p className="text-xl font-extrabold text-brand-700">{pct(stats.mrr, objectifMrr)}%</p>
          </div>
          <p className="mt-2 text-xs text-ink-500">
            Il reste {fcfa(Math.max(0, objectifMrr - stats.mrr))} de MRR à conquérir. Chaque nouveau client Pro
            ajoute 24 900 FCFA/mois — il suffit d’environ 13 clients Pro par mois pendant 9 mois.
          </p>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          {/* Paiements à valider */}
          <Card
            titre="Paiements Mobile Money en attente"
            sousTitre="Les clients qui ont envoyé l’argent manuellement (Airtel, Moov, virement) attendent votre validation"
          >
            {enAttente.length === 0 ? (
              <p className="text-sm text-ink-500">Aucun paiement en attente. Tout est à jour 👍</p>
            ) : (
              <div className="grid gap-3">
                {enAttente.map((p) => (
                  <div key={p.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Cellule
                        principal={`${fcfa(p.amount)} — ${p.provider}`}
                        secondaire={`Réf. ${p.reference} · ${p.phone || 'téléphone non fourni'} · ${frDateTime(p.createdAt)}`}
                      />
                      <div className="flex gap-2">
                        <form action={actionTrancherPaiement}>
                          <input type="hidden" name="paiementId" value={p.id} />
                          <input type="hidden" name="decision" value="REUSSI" />
                          <button className="btn-primary btn-sm">✅ Valider</button>
                        </form>
                        <form action={actionTrancherPaiement}>
                          <input type="hidden" name="paiementId" value={p.id} />
                          <input type="hidden" name="decision" value="ECHOUE" />
                          <button className="btn-ghost btn-sm">✖ Rejeter</button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-ink-500">
              La validation met automatiquement la facture à « Payée » et déclenche le reçu WhatsApp/SMS au client.
            </p>
          </Card>

          {/* Journal Make */}
          <Card
            titre="Journal des échanges Make.com"
            sousTitre={`Taux d’erreur récent : ${stats.tauxErreurWebhooks}%`}
            action={
              <Link href="/admin/make" className="btn-ghost btn-sm">
                Tout voir
              </Link>
            }
          >
            <ul className="grid gap-2">
              {stats.logs.slice(0, 7).map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2">
                  <Cellule
                    principal={<span className="font-mono text-xs">{l.event}</span>}
                    secondaire={`${l.direction} · ${frDateTime(l.at)} · ${l.scenario}`}
                  />
                  <BadgeStatut statut={l.status} />
                </li>
              ))}
              {stats.logs.length === 0 && <p className="text-sm text-ink-500">Aucun échange enregistré.</p>}
            </ul>
          </Card>
        </div>

        {/* Clients par pays */}
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card titre="Répartition par pays" sousTitre="Où sont vos revenus aujourd’hui">
            <ul className="grid gap-2">
              {stats.parPays.map((p) => (
                <li key={p.pays} className="rounded-xl bg-ink-50 px-3 py-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-800">{p.pays}</span>
                    <span className="text-xs text-ink-500">{p.clients} client(s)</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <Barre valeur={p.mrr} max={Math.max(...stats.parPays.map((x) => x.mrr), 1)} />
                    </div>
                    <span className="text-xs font-bold">{fcfa(p.mrr)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card titre="Opérations rapides">
            <div className="grid gap-3">
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-sm font-semibold text-ink-800">Réinitialiser la démonstration</p>
                <p className="mt-1 text-xs text-ink-500">
                  Remet les données fictives à zéro — pratique avant de montrer le SaaS à un prospect. Sans effet
                  si une base de données est branchée.
                </p>
                <form action={actionResetDemo} className="mt-2">
                  <button className="btn-ghost btn-sm">🔄 Réinitialiser</button>
                </form>
              </div>

              <Link href="/admin/clients" className="rounded-xl bg-ink-50 p-3 hover:bg-brand-50">
                <p className="text-sm font-semibold text-ink-800">🏢 Gérer les entreprises clientes</p>
                <p className="mt-1 text-xs text-ink-500">Changer une offre, suspendre un compte en retard, activer un abonnement.</p>
              </Link>

              <Link href="/admin/parametres" className="rounded-xl bg-ink-50 p-3 hover:bg-brand-50">
                <p className="text-sm font-semibold text-ink-800">🔑 Clés, sécurité et intégrations</p>
                <p className="mt-1 text-xs text-ink-500">État des variables d’environnement et bonnes pratiques avant mise en production.</p>
              </Link>
            </div>
          </Card>
        </div>

        <Card titre="Ce qu’il vous reste à faire pour encaisser vos premiers FCFA" sousTitre="Feuille de route courte">
          <ol className="grid gap-3 text-sm text-ink-600 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Brancher la base de données', 'Créez un compte gratuit sur Neon ou Supabase et collez l’URL dans DATABASE_URL (Vercel). Vos données deviennent permanentes.'],
              ['Changer vos secrets', 'AUTH_SECRET, ADMIN_PASSCODE et AFRIFLOW_API_KEY doivent être uniques avant l’ouverture au public.'],
              ['Activer une passerelle de paiement', 'Kkiapay (Bénin/Togo), CinetPay (Cameroun), ou le mode manuel au Tchad — déjà codé dans lib/paiements.ts.'],
              ['Connecter Make.com', '5 webhooks à coller dans les variables. Les scénarios et blueprints sont fournis.'],
              ['Trouver vos 10 premiers clients', 'Marchés, groupements de commerçants, écoles, coopératives : la méthode est décrite dans docs/PLAN-AFFAIRES.md.'],
              ['Facturer en FCFA', 'Activez les abonnements depuis /admin/clients et suivez le MRR sur /admin/revenus.'],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-xl bg-ink-50 p-3">
                <p className="font-bold text-ink-900">
                  {i + 1}. {t}
                </p>
                <p className="mt-1 text-xs">{d}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </DashboardShell>
  );
}
