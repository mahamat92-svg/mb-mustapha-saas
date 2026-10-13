import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { Card } from '@/components/ui';
import { MAKE_SCENARIOS, MODULES } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Assistant & connexion Make.com',
  description:
    'Comment connecter MB Mustapha à Make.com : webhooks, scénarios prêts à l’emploi, schéma complet, variables d’environnement et test en une commande.',
};

const VARIABLES = [
  ['MAKE_WEBHOOK_RELANCE', 'Webhook du scénario « Relance des factures impayées »'],
  ['MAKE_WEBHOOK_STOCK', 'Webhook du scénario « Alerte de rupture de stock »'],
  ['MAKE_WEBHOOK_PAIEMENT', 'Webhook du scénario « Paiement Mobile Money → reçu client »'],
  ['MAKE_WEBHOOK_MESSAGE', 'Webhook du scénario « Envoi SMS / WhatsApp »'],
  ['MAKE_WEBHOOK_RAPPORT', 'Webhook du scénario « Rapport quotidien du patron »'],
  ['MAKE_WEBHOOK_GENERIC', 'Webhook « fourre-tout » (AfriBot, tests)'],
  ['MAKE_WEBHOOK_SECRET', 'Secret partagé qui signe les appels (HMAC SHA-256)'],
  ['AFRIFLOW_API_KEY', 'Clé que Make utilise pour appeler MB Mustapha (Bearer)'],
];

export default function Assistant() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <header className="max-w-3xl">
          <h1 className="titre-page sm:text-3xl">Connecter MB Mustapha à Make.com</h1>
          <p className="sous-titre mt-3">
            Make.com est le chef d’orchestre : il reçoit les événements d’MB Mustapha et déclenche WhatsApp, les SMS,
            les e-mails, Google Sheets ou votre comptabilité. Voici le schéma complet, les 6 scénarios livrés et
            la procédure pas à pas.
          </p>
        </header>

        {/* SCHÉMA */}
        <Card className="mt-8" titre="Le schéma de connexion (vue d’ensemble)">
          <div className="scroll-x">
            <pre className="min-w-[720px] rounded-xl bg-ink-900 p-4 font-mono text-[11.5px] leading-relaxed text-white/90">
{`┌──────────────────────────── VOTRE APPLICATION (Vercel) ────────────────────────────┐
│                                                                                    │
│  ESPACE PUBLIC (vos clients)         ESPACE PRIVÉ (vous)                           │
│  /tableau-de-bord  /factures         /admin  /admin/revenus  /admin/make           │
│           │                                  │                                     │
│           └───────────────┬──────────────────┘                                     │
│                           ▼                                                        │
│                 API MB Mustapha  /api/v1/...  (+ /api/cron/relances à 7h00)           │
│                           │                                                        │
│         BASE DE DONNÉES   │   PostgreSQL (Neon/Supabase)                           │
└───────────────────────────┼────────────────────────────────────────────────────────┘
                            │
        (1) SORTANT : MB Mustapha → Make          (2) ENTRANT : Make → MB Mustapha
        POST webhook signé HMAC SHA-256         POST /api/webhooks/make
        Header: x-afriflow-signature            Header: Authorization: Bearer AFRIFLOW_API_KEY
                            │                                   ▲
                            ▼                                   │
        ┌───────────────────────────────────────────────────────────────────────┐
        │                          M A K E . C O M                              │
        │                                                                       │
        │  Scénario 1  Relance impayés        Scénario 4  Campagnes SMS/WhatsApp │
        │  Scénario 2  Alerte stock           Scénario 5  Rapport quotidien 7h   │
        │  Scénario 3  Paiement Mobile Money  Scénario 6  AfriBot WhatsApp       │
        │                                                                       │
        │  Modules : Webhook → Router → WhatsApp Cloud API / Africa's Talking   │
        │            → Google Sheets → Gmail → HTTP (retour vers MB Mustapha)       │
        └───────────────────────────────────────────────────────────────────────┘
                 │                 │                  │                │
                 ▼                 ▼                  ▼                ▼
          WhatsApp client     SMS gérant       Google Sheet      Mobile Money
          + reçu PDF          fournisseur      (journal)         Airtel/MTN/Orange
                 │                                                   │
                 └──────── (3) Le client paie → callback agrégateur ─┘
                                    → Make vérifie
                                    → POST /api/v1/paiements (clé API)
                                    → facture « PAYÉE » + reçu au client`}
            </pre>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Une version encore plus détaillée (numérotée étape par étape) se trouve dans le dossier du projet :{' '}
            <code>docs/CONNEXION-MAKE.md</code> et le schéma Mermaid <code>docs/SCHEMA-MAKE.md</code>.
          </p>
        </Card>

        {/* PROCEDURE */}
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card titre="Procédure pas à pas (15 minutes)">
            <ol className="space-y-3 text-sm text-ink-600">
              <li>
                <strong className="text-ink-900">1.</strong> Créez un compte sur{' '}
                <a className="lien" href="https://www.make.com" target="_blank" rel="noreferrer">
                  make.com
                </a>{' '}
                (offre gratuite suffisante pour tester).
              </li>
              <li>
                <strong className="text-ink-900">2.</strong> Créez un scénario → ajoutez le module{' '}
                <strong>Webhooks → Custom webhook</strong> → « Add » → copiez l’adresse.
              </li>
              <li>
                <strong className="text-ink-900">3.</strong> Dans Vercel → Settings → Environment Variables,
                collez-la dans <code>MAKE_WEBHOOK_RELANCE</code> (idem pour les autres scénarios).
              </li>
              <li>
                <strong className="text-ink-900">4.</strong> Ajoutez les modules d’action : WhatsApp Cloud API
                (ou 360dialog), Africa’s Talking (SMS), Google Sheets, Gmail…
              </li>
              <li>
                <strong className="text-ink-900">5.</strong> Dans MB Mustapha, ouvrez une facture impayée → bouton{' '}
                <strong>Relancer</strong>. Make reçoit immédiatement les données.
              </li>
              <li>
                <strong className="text-ink-900">6.</strong> Pour le retour (Make → MB Mustapha), ajoutez un module{' '}
                <strong>HTTP → Make a request</strong> vers{' '}
                <code>/api/webhooks/make</code> avec l’en-tête{' '}
                <code>Authorization: Bearer &lt;AFRIFLOW_API_KEY&gt;</code>.
              </li>
            </ol>
          </Card>

          <Card titre="Variables d’environnement à créer">
            <div className="scroll-x">
              <table className="table min-w-[520px]">
                <tbody>
                  {VARIABLES.map(([v, d]) => (
                    <tr key={v}>
                      <td className="whitespace-nowrap font-mono text-xs font-semibold text-brand-700">{v}</td>
                      <td className="text-xs text-ink-600">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-xs text-ink-600">
              Sans ces variables, MB Mustapha fonctionne quand même : les événements sont écrits dans le journal
              interne (<Link className="lien" href="/espace-prive">espace privé → Journal</Link>) au lieu d’être
              envoyés.
            </p>
          </Card>
        </section>

        {/* SCENARIOS */}
        <section className="mt-8">
          <h2 className="titre-page">Les 6 scénarios livrés</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {MAKE_SCENARIOS.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-ink-900">{s.name}</h3>
                  <span className={s.sens === 'BIDIRECTIONNEL' ? 'badge-blue' : s.sens === 'APP → MAKE' ? 'badge-green' : 'badge-amber'}>
                    {s.sens}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-600">
                  <strong>Déclencheur :</strong> {s.declencheur}
                </p>
                <p className="mt-1.5 text-sm text-ink-600">
                  <strong>Actions :</strong> {s.actions}
                </p>
                <p className="mt-2 font-mono text-[11px] text-ink-500">
                  {s.envKey}
                  {s.blueprint && ` · ${s.blueprint}`}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* TEST */}
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card titre="Tester en une commande">
            <p className="text-sm text-ink-600">
              Dans le dossier du projet, après <code>npm install</code> (aucune base requise) :
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-ink-900 p-4 font-mono text-[11.5px] text-white/90">
{`# 1. Lancer l'application
npm run dev

# 2. Simuler un paiement Mobile Money arrivant de Make
node scripts/make-test.mjs paiement.reussi

# 3. Simuler un ping (vérifier la connexion)
node scripts/make-test.mjs ping`}
            </pre>
          </Card>

          <Card titre="Bonnes pratiques">
            <ul className="space-y-2 text-sm text-ink-600">
              <li>✓ Gardez le <strong>paiement manuel</strong> en secours : au Tchad, certaines passerelles n’existent pas.</li>
              <li>✓ Vérifiez toujours la <strong>signature</strong> avant de créditer une facture.</li>
              <li>✓ Faites relancer la facture <strong>au maximum 4 fois</strong> automatiquement (déjà paramétré), pour ne pas harceler le client.</li>
              <li>✓ Écrivez un message court, poli, avec le montant et le lien de paiement : c’est ce qui fait payer.</li>
              <li>✓ « Scénario ON » : un scénario Make désactivé est la première cause de relance non envoyée.</li>
            </ul>
          </Card>
        </section>

        {/* MODULES */}
        <section className="mt-8">
          <h2 className="titre-page">Quel module pour quel problème ?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <div key={m.id} className="card-tight">
                <p className="text-2xl">{m.icon}</p>
                <p className="mt-1 font-bold text-ink-900">{m.name}</p>
                <p className="text-xs text-ink-500">{m.impact}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl2 border border-brand-200 bg-brand-50 p-6 text-center">
          <h2 className="text-lg font-extrabold text-ink-900">Besoin d’aide pour votre premier scénario ?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-600">
            Nous configurons votre relance WhatsApp + SMS en visio, avec vos vrais clients, pendant l’essai
            gratuit.
          </p>
          <Link href="/inscription" className="btn-primary mt-4">
            Créer mon compte et demander de l’aide
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
