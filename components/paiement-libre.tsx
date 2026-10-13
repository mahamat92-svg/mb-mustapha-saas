'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fcfa } from '@/lib/utils';

type Facture = { id: string; number: string; clientName: string; reste: number };

export function DeclarationPaiementLibre({ factures }: { factures: Facture[] }) {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [selection, setSelection] = useState(factures[0]?.id || '');

  const facture = factures.find((f) => f.id === selection);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChargement(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch('/api/v1/paiements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factureId: selection || undefined,
        montant: Number(f.get('montant')),
        provider: f.get('provider'),
        reference: f.get('reference'),
        telephone: f.get('telephone'),
        statut: f.get('statut'),
      }),
    });
    const json = await res.json();
    setChargement(false);
    setMessage({ ok: json.ok, texte: json.message || 'Enregistré.' });
    if (json.ok) {
      router.refresh();
      e.currentTarget.reset();
    }
  }

  return (
    <form onSubmit={envoyer} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Facture concernée</label>
          <select className="select" value={selection} onChange={(e) => setSelection(e.target.value)}>
            <option value="">— Aucune (encaissement libre, avance client) —</option>
            {factures.map((f) => (
              <option key={f.id} value={f.id}>
                {f.number} · {f.clientName} · reste {f.reste.toLocaleString('fr-FR')} FCFA
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Montant reçu (FCFA)</label>
          <input name="montant" type="number" min={1} required className="input" defaultValue={facture?.reste || ''} key={selection} />
        </div>
        <div>
          <label className="label">Opérateur / moyen</label>
          <select name="provider" className="select" defaultValue="airtel">
            <option value="airtel">Airtel Money</option>
            <option value="moov">Moov Africa</option>
            <option value="mtn">MTN MoMo</option>
            <option value="orange">Orange Money</option>
            <option value="t_money">T-Money</option>
            <option value="wave">Wave</option>
            <option value="cinetpay">CinetPay (agrégateur)</option>
            <option value="kkiapay">Kkiapay (agrégateur)</option>
            <option value="virement">Virement bancaire</option>
            <option value="especes">Espèces en boutique</option>
          </select>
        </div>
        <div>
          <label className="label">Référence transaction</label>
          <input name="reference" required className="input" placeholder="Ex : AM-8845120" />
        </div>
        <div>
          <label className="label">Téléphone du payeur</label>
          <input name="telephone" className="input" placeholder="+235 66 …" />
        </div>
        <div>
          <label className="label">Statut</label>
          <select name="statut" className="select" defaultValue="REUSSI">
            <option value="REUSSI">Confirmé (encaissé)</option>
            <option value="EN_ATTENTE">À vérifier par le patron</option>
          </select>
        </div>
      </div>

      {message && (
        <div
          className={
            message.ok
              ? 'rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-800'
              : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800'
          }
        >
          {message.texte}
        </div>
      )}

      <button className="btn-primary justify-self-start" disabled={chargement}>
        {chargement ? 'Enregistrement…' : 'Enregistrer l’encaissement'}
      </button>
      <p className="text-xs text-ink-500">
        Astuce : en choisissant « À vérifier », la facture n’est pas modifiée tant que le propriétaire n’a pas
        validé depuis l’espace privé (idéal si un employé saisit l’information).
      </p>
    </form>
  );
}
