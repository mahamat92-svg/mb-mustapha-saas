'use client';

// =============================================================================
// MB Mustapha — Formulaires du module PaieLocal (CNPS/CNSS + IRPP/ITS)
// =============================================================================

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fcfa } from '@/lib/utils';
import { calculerBulletin, REGLES_PAIE } from '@/lib/paie';
import { useAppel } from './use-appel';

// ---------------------------------------------------------------------------
// 1. Ajouter un employé (mensuel ou journalier)
// ---------------------------------------------------------------------------
export function NouvelEmployeForm({ paysCode }: { paysCode: string }) {
  const { appeler, chargement, etat } = useAppel();
  const [type, setType] = useState<'MENSUEL' | 'JOURNALIER'>('MENSUEL');
  const [salaire, setSalaire] = useState(150_000);
  const [tauxJour, setTauxJour] = useState(3_000);
  const [transport, setTransport] = useState(15_000);

  // Aperçu en direct : le patron voit immédiatement le net et le coût réel
  const apercu = useMemo(
    () =>
      calculerBulletin({
        pays: paysCode,
        type,
        salaireBrut: type === 'MENSUEL' ? salaire : 0,
        tauxJour: type === 'JOURNALIER' ? tauxJour : 0,
        joursTravailles: type === 'JOURNALIER' ? REGLES_PAIE.joursOuvresMois : 0,
        transport,
      }),
    [type, salaire, tauxJour, transport, paysCode],
  );

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const json = await appeler('/api/v1/paie', {
      action: 'creer_employe',
      nom: f.get('nom'),
      poste: f.get('poste'),
      type,
      salaireBrut: type === 'MENSUEL' ? Number(f.get('salaireBrut')) : 0,
      tauxJour: type === 'JOURNALIER' ? Number(f.get('tauxJour')) : 0,
      transport: Number(f.get('transport')),
      sursalaire: Number(f.get('sursalaire')),
      telephone: f.get('telephone'),
    });
    if (json?.ok) e.currentTarget.reset();
  }

  return (
    <form onSubmit={envoyer} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nom complet *</label>
          <input name="nom" required className="input" placeholder="Ex : Abakar Mahamat" />
        </div>
        <div>
          <label className="label">Poste</label>
          <input name="poste" className="input" placeholder="Ex : Chef magasinier" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Type de rémunération</label>
          <select className="select" value={type} onChange={(e) => setType(e.target.value as never)}>
            <option value="MENSUEL">Mensuel (salaire fixe)</option>
            <option value="JOURNALIER">Journalier (payé à la journée)</option>
          </select>
        </div>
        {type === 'MENSUEL' ? (
          <div>
            <label className="label">Salaire brut mensuel (FCFA) *</label>
            <input
              name="salaireBrut"
              type="number"
              min={1}
              className="input"
              value={salaire}
              onChange={(e) => setSalaire(Number(e.target.value))}
            />
          </div>
        ) : (
          <div>
            <label className="label">Taux journalier (FCFA / jour) *</label>
            <input
              name="tauxJour"
              type="number"
              min={1}
              className="input"
              value={tauxJour}
              onChange={(e) => setTauxJour(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Indemnité de transport (FCFA / mois)</label>
          <input
            name="transport"
            type="number"
            min={0}
            className="input"
            value={transport}
            onChange={(e) => setTransport(Number(e.target.value))}
          />
          <p className="mt-1 text-[11px] text-ink-500">
            Exonérée jusqu’à {fcfa(REGLES_PAIE.transportExonerePlafond)} ; au-delà, la fraction est imposable.
          </p>
        </div>
        <div>
          <label className="label">Primes / sursalaires (FCFA / mois)</label>
          <input name="sursalaire" type="number" min={0} defaultValue={0} className="input" />
        </div>
      </div>

      <div>
        <label className="label">Téléphone (pour le reçu SMS de paie)</label>
        <input name="telephone" className="input" placeholder="+235 66 00 00 00" />
      </div>

      {/* Aperçu du calcul en direct */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Aperçu du bulletin</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div>
            <p className="text-ink-500">Brut total</p>
            <p className="font-bold">{fcfa(apercu.brutTotal)}</p>
          </div>
          <div>
            <p className="text-ink-500">{apercu.organisme}</p>
            <p className="font-bold">− {fcfa(apercu.totalCotisationsSalarie)}</p>
          </div>
          <div>
            <p className="text-ink-500">Impôt + CAC</p>
            <p className="font-bold">− {fcfa(apercu.impotTotal)}</p>
          </div>
          <div>
            <p className="text-ink-500">Net à payer</p>
            <p className="font-extrabold text-brand-700">{fcfa(apercu.netAPayer)}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ink-600">
          Coût réel pour l’entreprise (avec la part patronale) : <strong>{fcfa(apercu.coutEmployeur)}</strong> par mois.
        </p>
        {apercu.alertes.map((a) => (
          <p key={a} className="mt-1 text-[11px] text-amber-700">
            ⚠️ {a}
          </p>
        ))}
      </div>

      {etat.type !== 'vide' && (
        <div
          className={
            etat.type === 'ok'
              ? 'rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-800'
              : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800'
          }
        >
          {etat.texte}
        </div>
      )}

      <button className="btn-primary justify-self-start" disabled={chargement}>
        {chargement ? 'Enregistrement…' : 'Ajouter l’employé'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 2. Lancer la paie du mois
// ---------------------------------------------------------------------------
export function GenererPaie({ periodeDefaut, organisme }: { periodeDefaut: string; organisme: string }) {
  const { appeler, chargement, etat } = useAppel();
  const [periode, setPeriode] = useState(periodeDefaut);

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="label">Mois de paie</label>
          <input type="month" className="input" value={periode} onChange={(e) => setPeriode(e.target.value)} />
        </div>
        <button
          className="btn-primary"
          disabled={chargement}
          onClick={() => appeler('/api/v1/paie', { action: 'generer_bulletins', periode })}
        >
          {chargement ? 'Calcul en cours…' : '🧮 Calculer la paie du mois'}
        </button>
      </div>
      {etat.type !== 'vide' && (
        <div
          className={
            etat.type === 'ok'
              ? 'rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-800'
              : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800'
          }
        >
          {etat.texte}
        </div>
      )}
      <p className="text-xs text-ink-500">
        Le calcul est refait pour chaque employé actif : cotisations plafonnées {organisme}, abattement
        pour frais professionnels, impôt progressif par tranches, puis net à payer et coût employeur. Relancer
        le même mois ne crée pas de doublon.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Pointage d'un journalier
// ---------------------------------------------------------------------------
export function PointageJournalier({
  employes,
}: {
  employes: { id: string; nom: string; tauxJour: number; jours: number }[];
}) {
  const { appeler, chargement } = useAppel();
  const [jours, setJours] = useState<Record<string, number>>(
    Object.fromEntries(employes.map((e) => [e.id, e.jours])),
  );

  if (!employes.length) {
    return (
      <p className="text-sm text-ink-500">
        Aucun journalier enregistré. Ajoutez vos manutentionnaires, vendeuses ou coursiers payés à la journée.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {employes.map((emp) => {
        const j = jours[emp.id] ?? 0;
        return (
          <div key={emp.id} className="rounded-xl border border-ink-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink-900">{emp.nom}</p>
                <p className="text-xs text-ink-500">
                  {fcfa(emp.tauxJour)} / jour — {j} jour(s) = {fcfa(j * emp.tauxJour)} brut
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost btn-sm" onClick={() => setJours((s) => ({ ...s, [emp.id]: Math.max(0, j - 1) }))}>
                  −1
                </button>
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={j}
                  onChange={(e) => setJours((s) => ({ ...s, [emp.id]: Number(e.target.value) }))}
                  className="input w-20 text-center"
                />
                <button className="btn-ghost btn-sm" onClick={() => setJours((s) => ({ ...s, [emp.id]: Math.min(31, j + 1) }))}>
                  +1
                </button>
                <button
                  className="btn-primary btn-sm"
                  disabled={chargement}
                  onClick={() => appeler('/api/v1/paie', { action: 'pointage', employeId: emp.id, jours: j })}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Simulateur brut → net (pour négocier un salaire)
// ---------------------------------------------------------------------------
export function SimulateurSalaire({ paysCode }: { paysCode: string }) {
  const [brut, setBrut] = useState(200_000);
  const [transport, setTransport] = useState(20_000);
  const [pays, setPays] = useState(paysCode);

  const res = useMemo(
    () => calculerBulletin({ pays, type: 'MENSUEL', salaireBrut: brut, transport }),
    [pays, brut, transport],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid gap-3">
        <div>
          <label className="label">Pays (barème appliqué)</label>
          <select className="select" value={pays} onChange={(e) => setPays(e.target.value)}>
            <option value="CM">Cameroun — CNPS + IRPP + CAC</option>
            <option value="TD">Tchad — CNPS + IRPP</option>
            <option value="BJ">Bénin — CNSS + ITS</option>
            <option value="TG">Togo — CNSS + IRPP/IGIS</option>
          </select>
        </div>
        <div>
          <label className="label">Salaire brut mensuel (FCFA)</label>
          <input type="number" min={0} step={5000} className="input" value={brut} onChange={(e) => setBrut(Number(e.target.value))} />
          <input
            type="range"
            min={0}
            max={1_500_000}
            step={5_000}
            value={brut}
            onChange={(e) => setBrut(Number(e.target.value))}
            className="mt-2 w-full accent-brand-600"
          />
        </div>
        <div>
          <label className="label">Indemnité de transport (FCFA)</label>
          <input type="number" min={0} step={5000} className="input" value={transport} onChange={(e) => setTransport(Number(e.target.value))} />
        </div>
      </div>

      <div className="rounded-xl2 border border-brand-200 bg-brand-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
          Résultat — {res.pays} · {res.organisme}
        </p>
        <p className="mt-2 text-3xl font-extrabold text-brand-800">{fcfa(res.netAPayer)}</p>
        <p className="text-xs text-ink-600">net à payer au salarié</p>

        <ul className="mt-4 space-y-1.5 text-sm">
          <li className="flex justify-between">
            <span className="text-ink-600">Brut total</span>
            <strong>{fcfa(res.brutTotal)}</strong>
          </li>
          <li className="flex justify-between">
            <span className="text-ink-600">{res.organisme} (salarié)</span>
            <strong className="text-rose-700">− {fcfa(res.totalCotisationsSalarie)}</strong>
          </li>
          <li className="flex justify-between">
            <span className="text-ink-600">Impôt sur le salaire</span>
            <strong className="text-rose-700">− {fcfa(res.impotBrut)}</strong>
          </li>
          {res.taxeCommunale > 0 && (
            <li className="flex justify-between">
              <span className="text-ink-600">Centimes additionnels</span>
              <strong className="text-rose-700">− {fcfa(res.taxeCommunale)}</strong>
            </li>
          )}
          <li className="flex justify-between border-t border-brand-200 pt-2">
            <span className="font-semibold">Coût réel pour l’entreprise</span>
            <strong className="text-brand-800">{fcfa(res.coutEmployeur)}</strong>
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-ink-500">
          Taux de retenues effectif : {res.tauxEffectif}% du brut. Base imposable après abattement : {fcfa(res.baseImpot)}.
          {res.alertes.length > 0 && <span className="block text-amber-700">⚠️ {res.alertes.join(' ')}</span>}
        </p>
      </div>
    </div>
  );
}
