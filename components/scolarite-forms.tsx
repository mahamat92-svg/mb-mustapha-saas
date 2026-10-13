'use client';

// =============================================================================
// MB Mustapha — Formulaires du module ScolaPay (écoles)
// =============================================================================

import { useMemo, useState } from 'react';
import { fcfa } from '@/lib/utils';
import { calculerEcheancier, REGLES_SCOLAIRE } from '@/lib/scolarite';
import { useAppel } from './use-appel';

// ---------------------------------------------------------------------------
// 1. Inscrire un élève (l'échéancier se crée tout seul)
// ---------------------------------------------------------------------------
export function InscriptionEleveForm({ classesSuggerees }: { classesSuggerees: string[] }) {
  const { appeler, chargement, etat } = useAppel();
  const [frais, setFrais] = useState(120_000);
  const [inscription, setInscription] = useState(15_000);
  const [nbTranches, setNbTranches] = useState(REGLES_SCOLAIRE.nbTranchesParDefaut);

  const echeancier = useMemo(
    () => calculerEcheancier(frais, nbTranches, new Date()),
    [frais, nbTranches],
  );

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const json = await appeler('/api/v1/scolarite', {
      action: 'inscrire_eleve',
      nom: f.get('nom'),
      sexe: f.get('sexe'),
      classe: f.get('classe'),
      parentNom: f.get('parentNom'),
      parentTelephone: f.get('parentTelephone'),
      fraisAnnuels: frais,
      fraisInscription: inscription,
      nbTranches,
    });
    if (json?.ok) e.currentTarget.reset();
  }

  return (
    <form onSubmit={envoyer} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nom et prénom de l’élève *</label>
          <input name="nom" required className="input" placeholder="Ex : Kodjo Ama" />
        </div>
        <div>
          <label className="label">Classe *</label>
          <input name="classe" required list="classes-connues" className="input" placeholder="Ex : CM2 A" />
          <datalist id="classes-connues">
            {classesSuggerees.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Sexe</label>
          <select name="sexe" className="select">
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>
        <div>
          <label className="label">Parent / tuteur *</label>
          <input name="parentNom" required className="input" placeholder="Ex : M. Kodjo Yao" />
        </div>
        <div>
          <label className="label">Téléphone du parent *</label>
          <input name="parentTelephone" required className="input" placeholder="+228 91 22 33 44" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Frais de scolarité annuels (FCFA) *</label>
          <input
            type="number"
            name="fraisAnnuels"
            min={0}
            step={5000}
            className="input"
            value={frais}
            onChange={(e) => setFrais(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Frais d’inscription (FCFA)</label>
          <input
            type="number"
            name="fraisInscription"
            min={0}
            step={5000}
            className="input"
            value={inscription}
            onChange={(e) => setInscription(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Nombre de tranches</label>
          <select className="select" value={nbTranches} onChange={(e) => setNbTranches(Number(e.target.value))}>
            <option value={1}>1 fois (paiement comptant)</option>
            <option value={2}>2 tranches</option>
            <option value={3}>3 tranches (recommandé)</option>
            <option value={4}>4 tranches</option>
          </select>
        </div>
      </div>

      {/* Aperçu de l'échéancier : le parent repart avec le calendrier */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Échéancier qui sera créé</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {echeancier.map((t) => (
            <div key={t.numero} className="rounded-lg bg-white px-3 py-2">
              <p className="text-[11px] text-ink-500">{t.libelle}</p>
              <p className="font-bold text-ink-900">{fcfa(t.montant)}</p>
              <p className="text-[11px] text-ink-500">
                échéance {new Date(t.echeance).toLocaleDateString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-600">
          Total : <strong>{fcfa(echeancier.reduce((s, t) => s + t.montant, 0))}</strong> — les tranches sont
          arrondies à {REGLES_SCOLAIRE.arrondiTranche} FCFA, le reliquat va sur la dernière.
        </p>
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
        {chargement ? 'Inscription…' : 'Inscrire l’élève'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 2. Encaisser rapidement (l'écran du matin, à la caisse)
// ---------------------------------------------------------------------------
export function EncaissementRapide({
  eleves,
}: {
  eleves: { id: string; nom: string; classe: string; reste: number; prochain: number }[];
}) {
  const { appeler, chargement, etat } = useAppel();
  const [eleveId, setEleveId] = useState(eleves[0]?.id || '');
  const [montant, setMontant] = useState(eleves[0]?.prochain || 0);
  const [canal, setCanal] = useState('ESPECES');
  const [note, setNote] = useState('');

  const choisi = eleves.find((e) => e.id === eleveId);
  const [dernierMessage, setDernierMessage] = useState('');

  async function envoyer() {
    if (!eleveId || !montant) return;
    const json = await appeler('/api/v1/scolarite', { action: 'encaisser', eleveId, montant, canal, note });
    if (json?.ok) {
      setDernierMessage(json.messageParent || '');
      setNote('');
      setMontant(0);
    }
  }

  if (!eleves.length) {
    return <p className="text-sm text-ink-500">Inscrivez d’abord des élèves pour encaisser des paiements.</p>;
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Élève</label>
          <select
            className="select"
            value={eleveId}
            onChange={(e) => {
              setEleveId(e.target.value);
              const nv = eleves.find((x) => x.id === e.target.value);
              setMontant(nv?.prochain || 0);
            }}
          >
            {eleves.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom} — {e.classe} ({fcfa(e.reste)} restant)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Montant encaissé (FCFA)</label>
          <input
            type="number"
            min={0}
            step={500}
            className="input"
            value={montant}
            onChange={(e) => setMontant(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="grow">
          <label className="label">Moyen de paiement</label>
          <select className="select" value={canal} onChange={(e) => setCanal(e.target.value)}>
            <option value="ESPECES">Espèces (caisse)</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="VIREMENT">Virement / dépôt bancaire</option>
          </select>
        </div>
        <div className="grow">
          <label className="label">Note (optionnel)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : 1re partie tranche 2" />
        </div>
        <button className="btn-primary" onClick={envoyer} disabled={chargement || !montant}>
          {chargement ? 'Enregistrement…' : '💰 Encaisser et envoyer le reçu'}
        </button>
      </div>

      {choisi && montant === choisi.prochain && choisi.prochain > 0 && (
        <p className="text-xs text-ink-500">
          Montant pré-rempli : prochaine tranche non réglée de {choisi.nom} ({fcfa(choisi.prochain)}).
        </p>
      )}

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

      {dernierMessage && (
        <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Message prêt à envoyer au parent</p>
          <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{dernierMessage}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Prévenir les parents (retards / échéances)
// ---------------------------------------------------------------------------
export function RelanceParents({
  lignes,
  numeroPaiement,
  type = 'retard',
  messageVide = 'Aucun parent à relancer : tous les élèves sont à jour.',
}: {
  lignes: { eleveId: string; nom: string; classe: string; parentNom: string; telephone: string; montant: number; jours: number; texte: string }[];
  numeroPaiement: string;
  type?: 'retard' | 'rappel';
  messageVide?: string;
}) {
  const { appeler, chargement, etat } = useAppel();
  const [copie, setCopie] = useState<string>('');

  if (!lignes.length) {
    return <p className="text-sm text-ink-500">{messageVide}</p>;
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs text-ink-500">
        Le numéro de paiement communiqué aux parents est <strong>{numeroPaiement}</strong> (modifiable dans vos
        réglages). Chaque message est journalisé dans <strong>Messages</strong>.
      </p>

      <div className="scroll-x">
        <table className="table min-w-[760px]">
          <thead>
            <tr className="bg-ink-50">
              <th>Élève</th>
              <th>Parent</th>
              <th>Retard</th>
              <th>Montant</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.eleveId}>
                <td>
                  <div className="font-semibold text-ink-800">{l.nom}</div>
                  <div className="text-xs text-ink-500">{l.classe}</div>
                </td>
                <td>
                  <div className="text-sm">{l.parentNom}</div>
                  <div className="text-xs text-ink-500">{l.telephone || 'téléphone manquant'}</div>
                </td>
                <td className="whitespace-nowrap text-sm text-rose-700">{l.jours} jour(s)</td>
                <td className="whitespace-nowrap font-bold">{fcfa(l.montant)}</td>
                <td>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => {
                        void navigator.clipboard?.writeText(l.texte);
                        setCopie(l.eleveId);
                      }}
                    >
                      {copie === l.eleveId ? '✅ Copié' : '📋 Copier'}
                    </button>
                    <a
                      className="btn-ghost btn-sm"
                      href={`https://wa.me/${l.telephone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(l.texte)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => appeler('/api/v1/scolarite', { action: 'relancer', eleveId: l.eleveId, type, canal: 'WHATSAPP' })}
                    >
                      WhatsApp
                    </a>
                    <a
                      className="btn-ghost btn-sm"
                      href={`sms:${l.telephone.replace(/\s/g, '')}?body=${encodeURIComponent(l.texte)}`}
                      onClick={() => appeler('/api/v1/scolarite', { action: 'relancer', eleveId: l.eleveId, type, canal: 'SMS' })}
                    >
                      SMS
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {etat.type !== 'vide' && <div className="rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-700">{etat.texte}</div>}
      {chargement && <p className="text-xs text-ink-500">Enregistrement…</p>}
    </div>
  );
}
