import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, listStock } from '@/lib/store';
import { Barre, Card, StatCard } from '@/components/ui';
import { StockMouvement } from '@/components/forms-app';
import { fcfa } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Stock() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, articles] = await Promise.all([getOrganization(orgId), listStock(orgId)]);

  const alertes = articles.filter((a) => a.qty <= a.threshold);
  const valeur = articles.reduce((s, a) => s + a.qty * a.price, 0);
  const ruptures = articles.filter((a) => a.qty === 0);

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={org?.name || 'Mon entreprise'}
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="titre-page">Stock & alertes</h1>
            <p className="sous-titre">
              Chaque franchissement de seuil déclenche automatiquement un SMS au gérant et un message au
              fournisseur (scénario Make.com n°2).
            </p>
          </div>
          <Link href="/messages" className="btn-ghost">
            Prévenir un fournisseur
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Articles suivis" valeur={String(articles.length)} icone="📦" />
          <StatCard label="Valeur du stock" valeur={fcfa(valeur)} icone="💰" ton="vert" />
          <StatCard label="Sous le seuil" valeur={String(alertes.length)} icone="⚠️" ton="ambre" />
          <StatCard label="En rupture" valeur={String(ruptures.length)} icone="🚨" ton="rouge" />
        </div>

        {alertes.length > 0 && (
          <Card titre="À commander maintenant" sousTitre="Ces articles sont sous leur seuil d’alerte">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alertes.map((a) => (
                <div key={a.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="font-bold text-ink-900">{a.name}</p>
                  <p className="text-xs text-ink-600">{a.sku} · fournisseur : {a.supplier}</p>
                  <p className="mt-2 text-sm">
                    <strong className={a.qty === 0 ? 'text-rose-700' : 'text-amber-800'}>
                      {a.qty} {a.unit}
                    </strong>{' '}
                    <span className="text-ink-500">/ seuil {a.threshold}</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-500">Valeur unitaire {fcfa(a.price)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card
          titre="Inventaire"
          sousTitre="Boutons − / + pour enregistrer une sortie ou une entrée (utilisable au comptoir, sur téléphone)"
        >
          {articles.length === 0 ? (
            <p className="text-sm text-ink-500">Aucun article. Ajoutez vos produits pour activer les alertes.</p>
          ) : (
            <div className="scroll-x">
              <table className="table min-w-[820px]">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>SKU</th>
                    <th>Quantité</th>
                    <th>Seuil</th>
                    <th>Niveau</th>
                    <th>Prix unitaire</th>
                    <th>Valeur</th>
                    <th>Mouvement</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => {
                    const niveau = a.threshold ? (a.qty / (a.threshold * 3)) * 100 : 100;
                    return (
                      <tr key={a.id}>
                        <td>
                          <div className="font-semibold text-ink-800">{a.name}</div>
                          <div className="text-xs text-ink-500">{a.supplier}</div>
                        </td>
                        <td className="font-mono text-xs">{a.sku}</td>
                        <td className="font-bold">
                          {a.qty} <span className="text-xs font-normal text-ink-500">{a.unit}</span>
                        </td>
                        <td className="text-sm text-ink-500">{a.threshold}</td>
                        <td className="w-[140px]">
                          <Barre valeur={niveau} ton={a.qty <= a.threshold ? 'rose' : 'brand'} />
                        </td>
                        <td className="whitespace-nowrap text-sm">{fcfa(a.price)}</td>
                        <td className="whitespace-nowrap text-sm font-semibold">{fcfa(a.qty * a.price)}</td>
                        <td>
                          <div className="flex gap-1">
                            <StockMouvement stockId={a.id} delta={-1} libelle="−1" />
                            <StockMouvement stockId={a.id} delta={1} libelle="+1" />
                            <StockMouvement stockId={a.id} delta={-10} libelle="−10" />
                            <StockMouvement stockId={a.id} delta={10} libelle="+10" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card titre="Fonctionnement hors-ligne" sousTitre="Parce que le réseau tombe souvent">
          <p className="text-sm text-ink-600">
            Sur téléphone, vous pouvez ajouter MB Mustapha à l’écran d’accueil (« Installer l’application »). Les
            derniers écrans consultés restent utilisables sans réseau ; les mouvements saisis sont envoyés dès le
            retour de la connexion. Pour les zones très isolées, le pointage et les confirmations peuvent passer
            par SMS (le scénario Make.com est prévu pour cela).
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
