import Link from 'next/link';
import { requireOwner } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_ADMIN } from '@/lib/nav';
import { BadgeStatut, Card, Cellule, StatCard } from '@/components/ui';
import { BRAND, integrationStatus, PLANS, PROVIDERS } from '@/lib/config';
import { baseConfiguree } from '@/lib/db';
import { fcfa } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const A_FAIRE = [
  ['DATABASE_URL', 'Base Postgres (Neon ou Supabase) — sans elle, les données sont fictives.'],
  ['AUTH_SECRET', 'OpenSSL rand base64 32 — signe les sessions. Indispensable en production.'],
  ['ADMIN_PASSCODE', 'Code confidentiel de l’espace privé (à changer absolument).'],
  ['AFRIFLOW_API_KEY', 'Clé que Make utilise pour appeler votre API.'],
  ['MAKE_WEBHOOK_SECRET', 'Secret HMAC qui signe les échanges avec Make.'],
  ['CRON_SECRET', 'Protège /api/cron/relances (relances automatiques du matin).'],
  ['KIIAPAY_* ou CINETPAY_*', 'Clés de l’agrégateur Mobile Money de votre zone.'],
  ['WHATSAPP_TOKEN / AFRICASTALKING_*', 'Comptes d’envoi WhatsApp et SMS (utilisés par Make).'],
];

export default async function AdminParametres() {
  const session = await requireOwner();
  const integ = integrationStatus();

  return (
    <DashboardShell
      nav={NAV_ADMIN}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte="MB Mustapha — édition du SaaS"
      variante="admin"
    >
      <div className="grid gap-5">
        <div>
          <h1 className="titre-page">Paramètres, clés et sécurité</h1>
          <p className="sous-titre">
            Tout ce qui doit être branché avant d’ouvrir le service payant — et les réglages de marque.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Base de données" valeur={baseConfiguree() ? 'Connectée' : 'Démonstration'} aide={baseConfiguree() ? 'Données persistantes' : 'Données fictives'} icone="🗄️" ton={baseConfiguree() ? 'vert' : 'ambre'} />
          <StatCard label="Sessions sécurisées" valeur={integ.auth.ok ? 'Oui' : 'Code par défaut'} icone="🔐" ton={integ.auth.ok ? 'vert' : 'rouge'} />
          <StatCard label="Paiements Mobile Money" valeur={integ.paiement.ok ? 'Branchés' : 'Manuel'} icone="📱" ton={integ.paiement.ok ? 'vert' : 'ambre'} />
          <StatCard label="Marque" valeur={BRAND.name} aide="modifiable via NEXT_PUBLIC_BRAND_NAME" icone="🎨" />
        </div>

        <Card titre="Intégrations détectées" sousTitre="Toute variable absente = fonctionnalité désactivée, jamais une panne">
          <div className="scroll-x">
            <table className="table min-w-[620px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Intégration</th>
                  <th>Clé technique</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(integ).map(([cle, v]) => (
                  <tr key={cle}>
                    <td className="font-semibold">{v.label}</td>
                    <td className="font-mono text-xs text-ink-500">{cle}</td>
                    <td>{v.ok ? <BadgeStatut statut="OK" /> : <span className="badge-amber">non configuré</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card titre="Liste de contrôle avant mise en production">
            <ol className="grid gap-2 text-sm text-ink-600">
              {A_FAIRE.map(([cle, quoi]) => (
                <li key={cle} className="rounded-xl bg-ink-50 px-3 py-2">
                  <code className="font-mono text-xs font-bold text-brand-700">{cle}</code>
                  <p className="mt-0.5 text-xs">{quoi}</p>
                </li>
              ))}
            </ol>
          </Card>

          <div className="grid content-start gap-5">
            <Card titre="Où trouver ces clés (France/Afrique)">
              <ul className="space-y-2 text-sm text-ink-600">
                <li>
                  🗄️ <strong>Base de données</strong> : neon.tech (gratuit, 5 min) ou supabase.com
                </li>
                <li>
                  ⚙️ <strong>Make.com</strong> : make.com → Scenarios → Webhooks → Custom webhook → Copy address
                </li>
                <li>
                  💬 <strong>WhatsApp Cloud API</strong> : developers.facebook.com (gratuit jusqu’à un seuil de
                  conversations)
                </li>
                <li>
                  📩 <strong>SMS</strong> : africastalking.com (Kenya, couvre la zone) ou votre opérateur local
                </li>
                <li>
                  💳 <strong>Agrégateurs</strong> : {PROVIDERS.filter((p) => p.type === 'agregateur').map((p) => p.name).join(', ')}
                </li>
              </ul>
            </Card>

            <Card titre="Sécurité — les 6 règles à ne jamais oublier">
              <ul className="space-y-2 text-sm text-ink-600">
                <li>1. Ne commitez jamais le fichier <code>.env</code> (déjà protégé par <code>.gitignore</code>).</li>
                <li>2. Vérifiez la signature HMAC de tout webhook entrant (déjà fait dans le code).</li>
                <li>3. Le rôle <code>OWNER</code> est le seul à pouvoir lire les données de tous les clients : gardez un compte unique.</li>
                <li>4. Un client ne peut jamais lire les données d’un autre (contrôle <code>resoudreOrgId()</code> sur chaque route).</li>
                <li>5. Sauvegardez la base chaque semaine (export Neon/Supabase en un clic).</li>
                <li>6. Changez <code>ADMIN_PASSCODE</code> après chaque démonstration devant un tiers.</li>
              </ul>
            </Card>
          </div>
        </div>

        <Card titre="Marque blanche (à personnaliser avant de vendre)" sousTitre="Le nom du produit est déjà paramétrable">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
              <p className="font-bold text-ink-900">Variables de marque</p>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                <li>NEXT_PUBLIC_BRAND_NAME = {BRAND.name}</li>
                <li>NEXT_PUBLIC_BRAND_SIGLE = {BRAND.sigle}</li>
                <li>NEXT_PUBLIC_BRAND_BASELINE = {BRAND.baseline}</li>
                <li>NEXT_PUBLIC_BRAND_COLOR = {BRAND.couleur}</li>
                <li>NEXT_PUBLIC_BRAND_ACCENT = {BRAND.accent}</li>
                <li>NEXT_PUBLIC_FOUNDER_NAME = {BRAND.fondateur}</li>
                <li>NEXT_PUBLIC_SUPPORT_EMAIL = {BRAND.email}</li>
                <li>NEXT_PUBLIC_SUPPORT_WHATSAPP = {BRAND.whatsapp}</li>
                <li>NEXT_PUBLIC_APP_URL = votre domaine</li>
              </ul>
              <p className="mt-3 text-xs">
                Une seule commande fait tout : <code>node scripts/rebrand.mjs --nom &quot;Votre Nom&quot;</code> —
                elle écrit <code>.env.local</code> et régénère les logos SVG (le logo et la palette{' '}
                <code>brand</code> suivent automatiquement la couleur choisie).
              </p>
            </div>
            <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
              <p className="font-bold text-ink-900">Pourquoi votre nom comme marque</p>
              <p className="mt-2 text-xs">
                Dans le commerce sahélien, la confiance passe par le nom : un client qui lit{' '}
                <strong>« MB Mustapha »</strong> sur la facture sait qui il appelle si quelque chose ne va pas.
                C’est un argument de vente, pas un détail cosmétique — votre nom est déjà connu dans les marchés
                où vous travaillez.
              </p>
              <p className="mt-2 text-xs">
                Le <strong>sigle « MB »</strong> reste court pour le logo, l’icône du téléphone et les factures.
                Dans l’application, c’est le nom complet <strong>« Mahamat Bouba Mustapha »</strong> qui apparaît
                comme fondateur (pied de page, page d’accueil, contact).
              </p>
              <p className="mt-2 text-xs">
                Si vous voulez changer plus tard (créer une société, prendre un nom plus neutre comme « Sahel
                Gestion » ou « Njangi Manager »), une seule commande suffit :
                <code className="mt-1 block">node scripts/rebrand.mjs --nom &quot;Nouveau Nom&quot;</code>
              </p>
            </div>
          </div>
        </Card>

        <Card titre="Récapitulatif économique du SaaS" sousTitre="Vos prix, vos marges, vos partenaires">
          <div className="scroll-x">
            <table className="table min-w-[680px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Offre</th>
                  <th>Prix / mois</th>
                  <th>Prix / an</th>
                  <th>Cible</th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td>{p.price === 0 ? 'Gratuit' : fcfa(p.price)}</td>
                    <td>{p.annual === 0 ? '—' : fcfa(p.annual)}</td>
                    <td className="text-xs text-ink-600">{p.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-ink-50 p-3 text-sm">
              <p className="text-xs uppercase text-ink-500">Commission revendeur</p>
              <p className="font-bold">30% an 1 · 15% ensuite</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-3 text-sm">
              <p className="text-xs uppercase text-ink-500">Frais agrégateur</p>
              <p className="font-bold">1,8% – 3,5%</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-3 text-sm">
              <p className="text-xs uppercase text-ink-500">Coût d’un SMS</p>
              <p className="font-bold">15 – 35 FCFA</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Documentation complète : <code>README.md</code>, <code>docs/DEPLOIEMENT.md</code>,{' '}
            <code>docs/PLAN-AFFAIRES.md</code>, <code>docs/PROBLEMES-AFRICAINS.md</code>.
          </p>
          <Link href="/admin/revenus" className="lien mt-3 inline-block">
            Voir les revenus réels →
          </Link>
        </Card>
      </div>
    </DashboardShell>
  );
}
