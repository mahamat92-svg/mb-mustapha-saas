import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, listClients, listMessages } from '@/lib/store';
import { BadgeStatut, Card, Cellule, StatCard } from '@/components/ui';
import { MessageEnvoiForm } from '@/components/forms-app';
import { integrationStatus, PLAN_BY_ID } from '@/lib/config';
import { frDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Messages() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, clients, messages] = await Promise.all([
    getOrganization(orgId),
    listClients(orgId),
    listMessages(orgId, 40),
  ]);

  const integ = integrationStatus();
  const plan = PLAN_BY_ID(org?.plan || 'STARTER');
  const quotas = plan.limits.messages;
  const utilises = messages.length;

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={org?.name || 'Mon entreprise'}
    >
      <div className="grid gap-5">
        <div>
          <h1 className="titre-page">SMS & WhatsApp</h1>
          <p className="sous-titre">
            Les messages partent par Make.com vers WhatsApp Cloud API ou Africa’s Talking (SMS). Ils arrivent
            même sur les téléphones à touches, en zone rurale.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Messages envoyés (30 j)" valeur={String(utilises)} icone="💬" />
          <StatCard label="Quota de l’offre" valeur={quotas.toLocaleString('fr-FR')} aide={`Offre ${plan.name}`} icone="🎯" />
          <StatCard label="Clients avec téléphone" valeur={String(clients.filter((c) => c.phone).length)} icone="📱" ton="vert" />
          <StatCard
            label="Connexion Make.com"
            valeur={integ.make.ok ? 'Active' : 'En attente'}
            aide={integ.make.ok ? 'Webhooks configurés' : 'Ajoutez MAKE_WEBHOOK_* dans Vercel'}
            icone="⚙️"
            ton={integ.make.ok ? 'vert' : 'ambre'}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card titre="Composer un message" sousTitre="Campagne groupée ou message individuel">
            <MessageEnvoiForm clients={clients} />
            <div className="mt-4 rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
              <p className="font-bold text-ink-800">Modèles qui font payer</p>
              <ul className="mt-1 space-y-1">
                <li>« Bonjour [nom], votre facture [n°] de [montant] FCFA arrive à échéance le [date]. Payez par Mobile Money en 30 secondes. »</li>
                <li>« Merci [nom] ! Nous avons bien reçu [montant] FCFA. Votre reçu est joint. »</li>
                <li>« [nom], arrivage de [produit] demain matin. Réservez par retour de message. »</li>
              </ul>
            </div>
          </Card>

          <Card titre="Historique" sousTitre="Journal des derniers messages (relances automatiques incluses)">
            {messages.length === 0 ? (
              <p className="text-sm text-ink-500">Aucun message pour l’instant.</p>
            ) : (
              <ul className="grid gap-2">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-xl border border-ink-100 bg-white px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <Cellule
                        principal={
                          <span className="text-xs font-bold uppercase text-ink-500">
                            {m.channel} → {m.to}
                          </span>
                        }
                        secondaire={frDateTime(m.at)}
                      />
                      <BadgeStatut statut={m.status} />
                    </div>
                    <p className="mt-1.5 text-sm text-ink-700">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card titre="Combien ça coûte vraiment ?" sousTitre="Le SMS reste le canal le moins cher et le plus fiable en Afrique">
          <div className="scroll-x">
            <table className="table min-w-[560px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Canal</th>
                  <th>Coût indicatif</th>
                  <th>Quand l’utiliser</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">SMS (Africa’s Talking, Orange, Airtel)</td>
                  <td>15 – 35 FCFA / SMS</td>
                  <td>Relances, confirmations, zones sans internet, téléphones à touches</td>
                </tr>
                <tr>
                  <td className="font-semibold">WhatsApp Business (Cloud API)</td>
                  <td>≈ 25 – 45 FCFA / conversation</td>
                  <td>Reçus avec PDF, photos de produits, relances riches, AfriBot</td>
                </tr>
                <tr>
                  <td className="font-semibold">E-mail</td>
                  <td>Quasi gratuit</td>
                  <td>Factures aux entreprises, écoles, ONG</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Les tarifs dépendent du pays et de l’opérateur : vérifiez auprès de votre fournisseur. Vous pouvez
            revendre des packs SMS à vos clients avec une marge (voir la page Tarifs).
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
