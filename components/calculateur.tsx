'use client';

// Petit calculateur de gain : montre au prospect combien il perd chaque mois.
// (Argument de vente tres efficace en rendez-vous client.)

import { useMemo, useState } from 'react';
import { fcfa } from '@/lib/utils';

export function CalculateurGain({ prixOffre = 24900 }: { prixOffre?: number }) {
  const [montantImpaye, setMontantImpaye] = useState(1_500_000);
  const [tauxRecuperation, setTauxRecuperation] = useState(35);
  const [heuresAdmin, setHeuresAdmin] = useState(20);
  const [coutHeure, setCoutHeure] = useState(1_500);

  const resultat = useMemo(() => {
    const recupere = Math.round((montantImpaye * tauxRecuperation) / 100);
    const economieTemps = heuresAdmin * coutHeure;
    const gainBrut = recupere + economieTemps;
    const coutAfriflow = prixOffre;
    const gainNet = gainBrut - coutAfriflow;
    return { recupere, economieTemps, gainBrut, gainNet, roi: coutAfriflow ? Math.round(gainBrut / coutAfriflow) : 0 };
  }, [montantImpaye, tauxRecuperation, heuresAdmin, coutHeure, prixOffre]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="grid gap-4">
        <div>
          <label className="label" htmlFor="impaye">
            Impayés clients qui dorment ({fcfa(montantImpaye)})
          </label>
          <input
            id="impaye"
            type="range"
            min={0}
            max={20_000_000}
            step={50_000}
            value={montantImpaye}
            onChange={(e) => setMontantImpaye(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
        <div>
          <label className="label" htmlFor="taux">
            Part que vous récupérez grâce aux relances automatiques : {tauxRecuperation}%
          </label>
          <input
            id="taux"
            type="range"
            min={5}
            max={60}
            step={5}
            value={tauxRecuperation}
            onChange={(e) => setTauxRecuperation(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="heures">Heures de paperasse / mois</label>
            <input
              id="heures"
              type="number"
              min={0}
              max={200}
              value={heuresAdmin}
              onChange={(e) => setHeuresAdmin(Number(e.target.value))}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="cout">Coût d’une heure (FCFA)</label>
            <input
              id="cout"
              type="number"
              min={0}
              step={100}
              value={coutHeure}
              onChange={(e) => setCoutHeure(Number(e.target.value))}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl2 border border-brand-200 bg-brand-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Gain estimé par mois</p>
        <p className="mt-2 text-3xl font-extrabold text-brand-800">{fcfa(resultat.gainBrut)}</p>
        <ul className="mt-4 space-y-2 text-sm text-ink-700">
          <li className="flex justify-between gap-3">
            <span>Créances récupérées</span> <strong>{fcfa(resultat.recupere)}</strong>
          </li>
          <li className="flex justify-between gap-3">
            <span>Temps administratif économisé</span> <strong>{fcfa(resultat.economieTemps)}</strong>
          </li>
          <li className="flex justify-between gap-3 border-t border-brand-200 pt-2">
            <span>Abonnement MB Mustapha Pro</span> <strong className="text-rose-700">− {fcfa(prixOffre)}</strong>
          </li>
          <li className="flex justify-between gap-3 border-t border-brand-200 pt-2 text-base">
            <span className="font-bold">Gain net</span>
            <strong className="text-brand-800">{fcfa(resultat.gainNet)}</strong>
          </li>
        </ul>
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-ink-600">
          Soit <strong>{resultat.roi} FCFA gagnés pour 1 FCFA dépensé</strong> dans l’abonnement. Estimation
          indicative : adaptez les curseurs à votre activité réelle.
        </p>
      </div>
    </div>
  );
}
