import Link from 'next/link';
import { requireOwner } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_ADMIN } from '@/lib/nav';
import { listWebhookLogs } from '@/lib/store';
import { BadgeStatut, Card, Cellule, StatCard } from '@/components/ui';
import { actionTesterMake } from '../actions';
import { integrationStatus, MAKE_SCENARIOS } from '@/lib/config';
import { frDateTime, pct } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminMake() {
  const session = await requireOwner();
  const logs = await listWebhookLogs(60);
  const integ = integrationStatus();

  const erreurs = logs.filter((l) => l.status === 'ERREUR');
  const tauxErreur = logs.length ? pct(erreurs.length, logs.length) : 0;
  const sortants = logs.filter((l) => l.direction === 'SORTANT').length;
  const entrants = logs.filter((l) => l.direction === 'ENTRANT').length;

  return (
    <DashboardShell
      nav={NAV_ADMIN}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte="MB Mustapha — édition du SaaS"
      variante="admin"
    >
      <div className="grid gap-5">
        <div>
          <h1 className="titre-page">Make.com & journal d’automatisation</h1>
          <p className="sous-titre">
            Ici vous voyez tout ce qui entre et sort de l’application : relances, alertes stock, paiements,
            messages. C’est votre tableau de bord technique.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Échanges journalisés" valeur={String(logs.length)} icone="📜" />
          <StatCard label="MB Mustapha → Make" valeur={String(sortants)} aide="événements envoyés" icone="📤" />
          <StatCard label="Make → MB Mustapha" valeur={String(entrants)} aide="retours de Make" icone="📥" />
          <StatCard label="Taux d’erreur" valeur={`${tauxErreur}%`} aide={`${erreurs.length} erreur(s)`} icone="⚠️" ton={tauxErreur > 10 ? 'rouge' : 'vert'} />
        </div>

        <Card
          titre="Tester la connexion"
          sousTitre="Envoie un événement « ping » à Make. Si le scénario répond, la chaîne est bonne."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(['relance', 'stock', 'paiement', 'message', 'rapport'] as const).map((s) => (
              <form action={actionTesterMake} key={s}>
                <input type="hidden" name="scenario" value={s} />
                <button className="btn-ghost w-full">🧪 Tester « {s} »</button>
              </form>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Sans URL de webhook configurée, le test est enregistré en « mode simulation » dans le journal — cela
            vous permet de vérifier que l’application fonctionne avant même d’avoir un compte Make.
          </p>
        </Card>

        <Card titre="Les 6 scénarios à créer dans Make.com" sousTitre="Blueprints JSON fournis dans le dossier make-blueprints/">
          <div className="scroll-x">
            <table className="table min-w-[900px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Scénario</th>
                  <th>Sens</th>
                  <th>Déclencheur</th>
                  <th>Variable d’environnement</th>
                  <th>État</th>
                  <th>Blueprint</th>
                </tr>
              </thead>
              <tbody>
                {MAKE_SCENARIOS.map((s) => {
                  const configure = Boolean(process.env[s.envKey]);
                  return (
                    <tr key={s.id}>
                      <td className="font-semibold">{s.name}</td>
                      <td>
                        <span className="badge-gray">{s.sens}</span>
                      </td>
                      <td className="max-w-[320px] text-xs text-ink-600">{s.declencheur}</td>
                      <td className="font-mono text-[11px]">{s.envKey}</td>
                      <td>{configure ? <BadgeStatut statut="OK" /> : <span className="badge-amber">à configurer</span>}</td>
                      <td className="font-mono text-[11px] text-ink-500">{s.blueprint || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card titre="Journal détaillé" sousTitre="60 derniers échanges — utilisez-le pour diagnostiquer une relance qui ne part pas">
          <div className="scroll-x">
            <table className="table min-w-[900px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Quand</th>
                  <th>Sens</th>
                  <th>Événement</th>
                  <th>Scénario</th>
                  <th>Code</th>
                  <th>Charge utile</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap text-xs text-ink-500">{frDateTime(l.at)}</td>
                    <td className="text-xs">{l.direction}</td>
                    <td className="font-mono text-xs font-semibold">{l.event}</td>
                    <td className="text-xs text-ink-600">{l.scenario}</td>
                    <td className="text-xs">{l.statusCode}</td>
                    <td className="max-w-[260px] truncate font-mono text-[10px] text-ink-500">{l.payloadPreview}</td>
                    <td>
                      <BadgeStatut statut={l.status} />
                      {l.error && <div className="mt-1 max-w-[220px] text-[10px] text-rose-600">{l.error}</div>}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-ink-500">
                      Aucun échange pour le moment. Déclenchez une relance ou testez un scénario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card titre="Schéma des flux" sousTitre="Rappel visuel — la version longue est sur /assistant et dans docs/CONNEXION-MAKE.md">
            <div className="scroll-x">
              <pre className="min-w-[560px] rounded-xl bg-ink-900 p-4 font-mono text-[11px] leading-relaxed text-white/90">
{`MB Mustapha ──(1) événement signé HMAC──▶ Make.com
                                        │
                    ┌───────────────────┼────────────────────┐
                    ▼                   ▼                    ▼
             WhatsApp Cloud      SMS Africa's         Google Sheets
             API (client)        Talking (gérant)     (journal)
                    │
                    ▼
              Client paie (Airtel/MTN/Orange/Moov)
                    │
                    ▼
        (2) Make vérifie puis POST /api/v1/paiements
            Header: Authorization: Bearer AFRIFLOW_API_KEY
                    │
                    ▼
        Facture → PAYÉE · Reçu → WhatsApp + SMS
        (3) Rapport quotidien 7h → patron + vous`}
              </pre>
            </div>
          </Card>

          <Card titre="État des intégrations" sousTitre="Vérifié à chaque chargement de page">
            <ul className="grid gap-2">
              {Object.entries(integ).map(([cle, v]) => (
                <li key={cle} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2">
                  <Cellule principal={v.label} secondaire={cle} />
                  {v.ok ? <BadgeStatut statut="OK" /> : <span className="badge-amber">non configuré</span>}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
              <p className="font-bold text-ink-800">Où coller les URLs de webhook ?</p>
              <p className="mt-1">
                Vercel → votre projet → Settings → Environment Variables. Ajoutez{' '}
                <code>MAKE_WEBHOOK_RELANCE</code>, <code>MAKE_WEBHOOK_STOCK</code>,{' '}
                <code>MAKE_WEBHOOK_PAIEMENT</code>, <code>MAKE_WEBHOOK_MESSAGE</code>,{' '}
                <code>MAKE_WEBHOOK_RAPPORT</code>, <code>MAKE_WEBHOOK_GENERIC</code> puis redéployez.
              </p>
            </div>
            <Link href="/assistant" className="lien mt-3 inline-block">
              Procédure pas à pas (page publique) →
            </Link>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
