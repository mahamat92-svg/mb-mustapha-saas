'use client';

// =============================================================================
// MB Mustapha - Formulaires interactifs de l'espace client (et de l'admin)
// Tout passe par l'API REST : si un jour vous ajoutez une application mobile,
// elle utilisera exactement les memes points d'entree.
// =============================================================================

import React from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fcfa } from '@/lib/utils';
import type { ClientRec, Plan } from '@/lib/types-fwd';
import { useAppel } from './use-appel';

type Etat = { type: 'vide' | 'ok' | 'erreur' | 'info'; texte: string };

function Flash({ etat }: { etat: Etat }) {
  if (etat.type === 'vide') return null;
  const classes = {
    ok: 'border-brand-200 bg-brand-50 text-brand-800',
    erreur: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    vide: '',
  } as const;
  return <div className={`rounded-xl border px-3 py-2.5 text-sm ${classes[etat.type]}`}>{etat.texte}</div>;
}

// ---------------------------------------------------------------------------
// 1. Creer une facture
// ---------------------------------------------------------------------------
export function NouvelleFactureForm({ clients, tvaDefaut = 18 }: { clients: ClientRec[]; tvaDefaut?: number }) {
  const { appeler, chargement, etat } = useAppel();

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const client = clients.find((c) => c.id === f.get('clientId'));
    const json = await appeler('/api/v1/factures', {
      clientId: f.get('clientId'),
      clientName: client?.name || String(f.get('clientName') || 'Client'),
      montant: Number(f.get('montant')),
      libelle: f.get('libelle'),
      tva: Number(f.get('tva')),
      delai: Number(f.get('delai')),
      canal: 'MANUEL',
    });
    if (json?.ok) e.currentTarget.reset();
  }

  return (
    <form onSubmit={envoyer} className="grid gap-3">
      <div>
        <label className="label" htmlFor="clientId">Client</label>
        <select id="clientId" name="clientId" className="select" required defaultValue={clients[0]?.id || ''}>
          {clients.length === 0 && <option value="">— Créez d’abord un client —</option>}
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.phone ? `· ${c.phone}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="libelle">Désignation</label>
        <input id="libelle" name="libelle" className="input" placeholder="Ex : 20 sacs de riz 50 kg" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 sm:col-span-1">
          <label className="label" htmlFor="montant">Montant HT (FCFA)</label>
          <input id="montant" name="montant" type="number" min={1} required className="input" placeholder="250000" />
        </div>
        <div>
          <label className="label" htmlFor="tva">TVA %</label>
          <input id="tva" name="tva" type="number" step="0.25" defaultValue={tvaDefaut} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="delai">Délai (jours)</label>
          <input id="delai" name="delai" type="number" defaultValue={15} className="input" />
        </div>
      </div>
      <Flash etat={etat} />
      <button className="btn-primary" disabled={chargement || clients.length === 0}>
        {chargement ? 'Création…' : 'Créer la facture'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 2. Creer un client
// ---------------------------------------------------------------------------
export function NouveauClientForm() {
  const { appeler, chargement, etat } = useAppel();

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const json = await appeler('/api/v1/clients', {
      name: f.get('name'),
      phone: f.get('phone'),
      city: f.get('city'),
      email: f.get('email'),
      type: f.get('type'),
    });
    if (json?.ok) e.currentTarget.reset();
  }

  return (
    <form onSubmit={envoyer} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Nom / raison sociale</label>
          <input id="name" name="name" required className="input" placeholder="Ex : Boutique Al-Nour" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Téléphone (WhatsApp)</label>
          <input id="phone" name="phone" className="input" placeholder="+235 63 00 00 00" />
        </div>
        <div>
          <label className="label" htmlFor="city">Ville</label>
          <input id="city" name="city" className="input" placeholder="N’Djaména" />
        </div>
        <div>
          <label className="label" htmlFor="type">Type</label>
          <select id="type" name="type" className="select" defaultValue="ENTREPRISE">
            <option value="PARTICULIER">Particulier</option>
            <option value="ENTREPRISE">Entreprise</option>
            <option value="ECOLE">École</option>
            <option value="COOPERATIVE">Coopérative / Tontine</option>
          </select>
        </div>
      </div>
      <Flash etat={etat} />
      <button className="btn-ghost" disabled={chargement}>
        {chargement ? 'Enregistrement…' : 'Ajouter le client'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 3. Relancer les impayes (Make.com)
// ---------------------------------------------------------------------------
export function RelanceButton({
  factureIds,
  libelle = 'Relancer tous les impayés',
  seuilJours,
  variante = 'accent',
}: {
  factureIds?: string[];
  libelle?: string;
  seuilJours?: number;
  variante?: 'accent' | 'ghost' | 'primary';
}) {
  const { appeler, chargement, etat } = useAppel();
  const classe = variante === 'accent' ? 'btn-accent' : variante === 'primary' ? 'btn-primary' : 'btn-ghost';

  return (
    <div className="grid gap-2">
      <button
        className={classe}
        disabled={chargement}
        onClick={() =>
          appeler('/api/v1/factures/relancer', { factureIds, seuilJours }, (json) => {
            const premier = json.relances?.[0];
            if (premier?.simule) {
              setEtat({
                type: 'info',
                texte: `${json.message} ℹ️ Mode simulation : ajoutez MAKE_WEBHOOK_RELANCE dans Vercel pour un envoi WhatsApp/SMS réel.`,
              });
            }
          })
        }
      >
        {chargement ? 'Envoi en cours…' : `📣 ${libelle}`}
      </button>
      <Flash etat={etat} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Mouvement de stock (+/-) avec alerte Make automatique
// ---------------------------------------------------------------------------
export function StockMouvement({ stockId, delta, libelle }: { stockId: string; delta: number; libelle: string }) {
  const { appeler, chargement } = useAppel();
  return (
    <button
      className="btn-ghost btn-sm"
      disabled={chargement}
      onClick={() => appeler('/api/v1/stock', { stockId, delta })}
      title={libelle}
    >
      {libelle}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 5. Enregistrer une cotisation de tontine
// ---------------------------------------------------------------------------
export function CotisationForm({ tontineId, membres }: { tontineId: string; membres: string[] }) {
  const { appeler, chargement, etat } = useAppel();

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const json = await appeler('/api/v1/tontines', {
      tontineId,
      membre: f.get('membre'),
      montant: Number(f.get('montant')),
      canal: f.get('canal'),
    });
    if (json?.ok) e.currentTarget.reset();
  }

  return (
    <form onSubmit={envoyer} className="grid gap-2 rounded-xl bg-ink-50 p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label className="label">Membre</label>
          <input name="membre" list={`membres-${tontineId}`} required className="input" placeholder="Nom du membre" />
          <datalist id={`membres-${tontineId}`}>
            {membres.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label">Montant (FCFA)</label>
          <input name="montant" type="number" min={1} required className="input" placeholder="25000" />
        </div>
        <div>
          <label className="label">Canal</label>
          <select name="canal" className="select" defaultValue="ESPECES">
            <option value="ESPECES">Espèces</option>
            <option value="MTN_MOMO">MTN MoMo</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="MOOV">Moov Money</option>
            <option value="AIRTEL">Airtel Money</option>
            <option value="T_MONEY">T-Money</option>
            <option value="WAVE">Wave</option>
          </select>
        </div>
      </div>
      <Flash etat={etat} />
      <button className="btn-primary btn-sm justify-self-start" disabled={chargement}>
        {chargement ? 'Enregistrement…' : 'Enregistrer la cotisation'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 6. Envoyer SMS / WhatsApp (via Make)
// ---------------------------------------------------------------------------
export function MessageEnvoiForm({ clients }: { clients: ClientRec[] }) {
  const { appeler, chargement, etat } = useAppel();

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const cible = String(f.get('cible'));
    const corps: Record<string, unknown> = {
      canal: f.get('canal'),
      texte: f.get('texte'),
    };
    if (cible === 'tous') corps.campagne = 'tous_les_clients';
    else corps.to = cible;
    await appeler('/api/v1/messages', corps);
  }

  return (
    <form onSubmit={envoyer} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Canal</label>
          <select name="canal" className="select" defaultValue="WHATSAPP">
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">E-mail</option>
          </select>
        </div>
        <div>
          <label className="label">Destinataires</label>
          <select name="cible" className="select" defaultValue="tous">
            <option value="tous">Tous les clients ({clients.length})</option>
            {clients
              .filter((c) => c.phone)
              .map((c) => (
                <option key={c.id} value={c.phone}>
                  {c.name} · {c.phone}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Message</label>
        <textarea
          name="texte"
          required
          className="textarea"
          defaultValue="Bonjour, rappel : vos achats du mois sont arrivés. Passez nous voir ou répondez à ce message. Merci !"
        />
      </div>
      <Flash etat={etat} />
      <button className="btn-primary justify-self-start" disabled={chargement}>
        {chargement ? 'Envoi…' : 'Envoyer maintenant'}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 7. Souscrire / changer d'offre (Mobile Money FCFA)
// ---------------------------------------------------------------------------
export function SouscrireBouton({ plan }: { plan: Plan }) {
  const { appeler, chargement, setEtat } = useAppel();
  const [instructions, setInstructions] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  function souscrire() {
    appeler('/api/v1/abonnements', { plan: plan.id }, (json) => {
      const p = json.paiement;
      if (!p) return;
      if (p.mode === 'EN_LIGNE' && p.url) {
        window.location.href = p.url;
      } else {
        setInstructions(p.instructions || p.message);
        setReference(p.reference);
        setEtat({ type: 'info', texte: `Référence à indiquer : ${p.reference}` });
      }
    });
  }

  return (
    <div className="grid gap-2">
      <button
        className={plan.popular ? 'btn-accent w-full' : 'btn-primary w-full'}
        onClick={souscrire}
        disabled={chargement}
      >
        {chargement ? 'Traitement…' : plan.cta}
      </button>
      {plan.price > 0 && <p className="text-center text-xs text-ink-500">{fcfa(plan.price)} / mois — Mobile Money</p>}

      {instructions && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs whitespace-pre-line text-sky-900">
          <p className="mb-1 font-bold">Paiement Mobile Money (référence {reference})</p>
          {instructions}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. Declarer un paiement manuel (le client a envoye l'argent par Airtel/Moov)
// ---------------------------------------------------------------------------
export function DeclarerPaiementForm({
  factureId,
  reste,
  telephone,
}: {
  factureId: string;
  reste: number;
  telephone?: string;
}) {
  const { appeler, chargement, etat } = useAppel();

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await appeler('/api/v1/paiements', {
      factureId,
      montant: Number(f.get('montant')),
      provider: f.get('provider'),
      reference: f.get('reference'),
      telephone: f.get('telephone'),
      statut: 'EN_ATTENTE',
    });
  }

  return (
    <form onSubmit={envoyer} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Montant envoyé (FCFA)</label>
          <input name="montant" type="number" required defaultValue={reste} className="input" />
        </div>
        <div>
          <label className="label">Opérateur</label>
          <select name="provider" className="select" defaultValue="airtel">
            <option value="airtel">Airtel Money</option>
            <option value="moov">Moov Africa</option>
            <option value="mtn">MTN MoMo</option>
            <option value="orange">Orange Money</option>
            <option value="t_money">T-Money</option>
            <option value="wave">Wave</option>
            <option value="virement">Virement bancaire</option>
            <option value="especes">Espèces en boutique</option>
          </select>
        </div>
        <div>
          <label className="label">Téléphone utilisé</label>
          <input name="telephone" className="input" defaultValue={telephone || ''} placeholder="+235 …" />
        </div>
      </div>
      <div>
        <label className="label">Référence de la transaction (reçue par SMS)</label>
        <input name="reference" required className="input" placeholder="Ex : AM-8845120" />
      </div>
      <Flash etat={etat} />
      <button className="btn-primary justify-self-start" disabled={chargement}>
        {chargement ? 'Envoi…' : 'Déclarer le paiement'}
      </button>
      <p className="text-xs text-ink-500">
        Le patron valide en un clic depuis son espace privé : la facture passe automatiquement en « payée » et le
        reçu part par WhatsApp.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// 9. Bouton generique (reinitialiser la demo, etc.)
// ---------------------------------------------------------------------------
export function BoutonAction({
  url,
  corps,
  libelle,
  confirmation,
  variante = 'ghost',
}: {
  url: string;
  corps: unknown;
  libelle: string;
  confirmation?: string;
  variante?: 'ghost' | 'primary' | 'dark';
}) {
  const { appeler, chargement, etat } = useAppel();
  const classe = variante === 'primary' ? 'btn-primary' : variante === 'dark' ? 'btn-dark' : 'btn-ghost';

  return (
    <div className="grid gap-2">
      <button
        className={classe}
        disabled={chargement}
        onClick={() => {
          if (confirmation && !window.confirm(confirmation)) return;
          appeler(url, corps);
        }}
      >
        {chargement ? '…' : libelle}
      </button>
      <Flash etat={etat} />
    </div>
  );
}
