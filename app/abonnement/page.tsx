import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, getSubscription } from '@/lib/store';
import { BadgeStatut, Card, StatCard } from '@/components/ui';
import { SouscrireBouton } from '@/components/forms-app';
import { COUNTRIES, PLAN_BY_ID, PLANS, PROVIDERS } from '@/lib/config';
import { fcfa, frDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Abonnement() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, abo] = await Promise.all([getOrganization(orgId), getSubscription(orgId)]);
  const plan = PLAN_BY_ID(org?.plan || 'STARTER');
  const pays = COUNTRIES.find((c) => c.code === (org?.country || 'TD')) || COUNTRIES[0];

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={org?.name || 'Mon entreprise'}
    >
      <div className="grid gap-5">
        <div>
          <h1 className="titre-page">Mon abonnement</h1>
          <p className="sous-titre">
            Paiement en FCFA par Mobile Money, sans engagement. Changement d’offre immédiat, au prorata.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Offre actuelle" valeur={plan.name} icone="🎫" />
          <StatCard
            label="Montant mensuel"
            valeur={plan.price === 0 ? 'Gratuit' : fcfa(plan.price)}
            aide={plan.annual ? `ou ${fcfa(plan.annual)} / an` : undefined}
            icone="💳"
            ton="vert"
          />
          <StatCard label="Statut" valeur={org?.planStatus || 'ACTIF'} aide={abo?.renewAt ? `Renouvellement ${frDate(abo.renewAt)}` : undefined} icone="📅" ton={org?.planStatus === 'EN_RETARD' ? 'rouge' : 'neutre'} />
          <StatCard label="Pays / devise" valeur={`${pays.flag} ${pays.name}`} aide={`${pays.currency === 'XAF' ? 'FCFA CEMAC' : 'FCFA UEMOA'} · TVA ${pays.vat}%`} icone="🌍" />
        </div>

        <Card titre="Changer d’offre" sousTitre="Le montant est calculé automatiquement selon votre pays et votre devise">
          <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {PLANS.map((p) => {
              const actuel = p.id === plan.id;
              return (
                <div key={p.id} className={actuel ? 'card-tight border-brand-300 ring-1 ring-brand-200' : 'card-tight'}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-ink-900">{p.name}</h3>
                    {actuel ? <BadgeStatut statut="ACTIF" /> : p.popular ? <span className="badge-green">Populaire</span> : null}
                  </div>
                  <p className="text-xs text-ink-500">{p.tagline}</p>
                  <p className="mt-2 text-xl font-extrabold text-brand-700">
                    {p.price === 0 ? 'Gratuit' : fcfa(p.price)}
                    {p.price > 0 && <span className="text-xs font-semibold text-ink-500"> /mois</span>}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-ink-600">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    {actuel ? (
                      <span className="btn-ghost w-full cursor-default">Offre en cours</span>
                    ) : (
                      <SouscrireBouton plan={p} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card titre="Payer en Mobile Money" sousTitre={`Opérateurs disponibles : ${pays.mobileMoney.join(', ')}`}>
            <ol className="space-y-2 text-sm text-ink-600">
              <li>
                <strong className="text-ink-900">1.</strong> Choisissez votre nouvelle offre et cliquez sur son
                bouton.
              </li>
              <li>
                <strong className="text-ink-900">2.</strong> Si une passerelle est configurée (Kkiapay, CinetPay…),
                la page de paiement s’ouvre : validez sur votre téléphone.
              </li>
              <li>
                <strong className="text-ink-900">3.</strong> Sinon, envoyez le montant sur le numéro marchand
                affiché, avec la référence indiquée, puis prévenez-nous sur WhatsApp.
              </li>
              <li>
                <strong className="text-ink-900">4.</strong> Votre abonnement est activé et le reçu PDF avec TVA
                vous est envoyé.
              </li>
            </ol>
          </Card>

          <Card titre="Passerelles de paiement prévues" sousTitre="Selon votre pays, l’éditeur active la meilleure option">
            <div className="scroll-x">
              <table className="table min-w-[480px]">
                <thead>
                  <tr className="bg-ink-50">
                    <th>Prestataire</th>
                    <th>Couverture</th>
                    <th>Frais indicatifs</th>
                  </tr>
                </thead>
                <tbody>
                  {PROVIDERS.map((p) => (
                    <tr key={p.id}>
                      <td className="font-semibold">{p.name}</td>
                      <td className="text-xs text-ink-600">{p.pays.slice(0, 4).join(' · ')}</td>
                      <td className="text-xs text-ink-600">{p.frais}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Au Tchad, le paiement manuel reste souvent la seule option : il est prévu et sécurisé par la
              validation en un clic.
            </p>
          </Card>
        </div>

        <Card titre="Besoin d’une facture au nom de votre société ?" sousTitre="Facultatif : utile pour votre comptabilité">
          <p className="text-sm text-ink-600">
            Indiquez votre NIF/RCCM dans les informations de l’entreprise (ou envoyez-le par WhatsApp) : chaque
            reçu d’abonnement portera alors les mentions légales complètes avec la TVA de votre pays ({pays.vat}
            %). Ces dépenses sont déductibles de vos charges.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/factures" className="btn-ghost">
              Voir mes factures
            </Link>
            <Link href="/assistant" className="btn-ghost">
              Aide & connexion Make
            </Link>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
