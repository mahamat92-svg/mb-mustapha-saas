'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { COUNTRIES } from '@/lib/config';

type Rep = { ok: boolean; message?: string; redirection?: string };

function Message({ etat }: { etat: { type: 'vide' | 'ok' | 'erreur'; texte: string } }) {
  if (etat.type === 'vide') return null;
  return (
    <div
      className={
        etat.type === 'ok'
          ? 'rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-800'
          : 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800'
      }
    >
      {etat.texte}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connexion client (public)
// ---------------------------------------------------------------------------
export function ConnexionForm() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [etat, setEtat] = useState<{ type: 'vide' | 'ok' | 'erreur'; texte: string }>({ type: 'vide', texte: '' });

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChargement(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'connexion',
        email: f.get('email'),
        password: f.get('password'),
      }),
    });
    const json: Rep = await res.json();
    setChargement(false);
    if (json.ok && json.redirection) {
      setEtat({ type: 'ok', texte: 'Connexion réussie, ouverture de votre espace…' });
      router.push(json.redirection);
      router.refresh();
    } else {
      setEtat({ type: 'erreur', texte: json.message || 'Connexion impossible.' });
    }
  }

  return (
    <form onSubmit={envoyer} className="grid gap-4">
      <div>
        <label className="label" htmlFor="email">Adresse e-mail</label>
        <input id="email" name="email" type="email" required className="input" placeholder="vous@entreprise.cm" defaultValue="demo@mbmustapha.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" required className="input" placeholder="••••••••" defaultValue="demo2026" />
      </div>
      <Message etat={etat} />
      <button className="btn-primary" disabled={chargement}>
        {chargement ? 'Connexion…' : 'Se connecter'}
      </button>
      <p className="text-center text-xs text-ink-500">
        Compte de démonstration : <strong>demo@mbmustapha.com</strong> / <strong>demo2026</strong>
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Creation de compte client (public) — essai 14 jours
// ---------------------------------------------------------------------------
export function InscriptionForm({ planChoisi }: { planChoisi?: string }) {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [etat, setEtat] = useState<{ type: 'vide' | 'ok' | 'erreur'; texte: string }>({ type: 'vide', texte: '' });
  const [pays, setPays] = useState('TD');

  const paysInfo = COUNTRIES.find((c) => c.code === pays) || COUNTRIES[0];

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChargement(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'inscription',
        entreprise: f.get('entreprise'),
        nom: f.get('nom'),
        email: f.get('email'),
        password: f.get('password'),
        telephone: f.get('telephone'),
        ville: f.get('ville'),
        pays,
        plan: planChoisi || f.get('plan') || 'STARTER',
      }),
    });
    const json: Rep = await res.json();
    setChargement(false);
    if (json.ok) {
      setEtat({ type: 'ok', texte: json.message || 'Compte créé !' });
      router.push(json.redirection || '/tableau-de-bord');
      router.refresh();
    } else {
      setEtat({ type: 'erreur', texte: json.message || 'Inscription impossible.' });
    }
  }

  return (
    <form onSubmit={envoyer} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="entreprise">Nom de l’entreprise *</label>
          <input id="entreprise" name="entreprise" required className="input" placeholder="Ex : Établissement Sahel SARL" />
        </div>
        <div>
          <label className="label" htmlFor="nom">Votre nom</label>
          <input id="nom" name="nom" className="input" placeholder="Ex : Abakar Mahamat" />
        </div>
        <div>
          <label className="label" htmlFor="pays">Pays *</label>
          <select id="pays" name="pays" className="select" value={pays} onChange={(e) => setPays(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} — TVA {c.vat}% · {c.currency === 'XAF' ? 'FCFA CEMAC' : 'FCFA UEMOA'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ville">Ville</label>
          <input id="ville" name="ville" className="input" placeholder={paysInfo.villes[0]} />
        </div>
        <div>
          <label className="label" htmlFor="email">Adresse e-mail *</label>
          <input id="email" name="email" type="email" required className="input" placeholder="vous@entreprise.td" />
        </div>
        <div>
          <label className="label" htmlFor="telephone">Téléphone (WhatsApp) *</label>
          <input id="telephone" name="telephone" className="input" placeholder="+235 66 00 00 00" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="password">Mot de passe *</label>
        <input id="password" name="password" type="password" required minLength={6} className="input" placeholder="6 caractères minimum" />
      </div>

      {!planChoisi && (
        <div>
          <label className="label" htmlFor="plan">Offre souhaitée</label>
          <select id="plan" name="plan" className="select" defaultValue="STARTER">
            <option value="DECOUVERTE">Découverte — gratuit</option>
            <option value="STARTER">Starter — 9 900 FCFA / mois</option>
            <option value="PRO">Pro — 24 900 FCFA / mois</option>
            <option value="BUSINESS">Business — 59 900 FCFA / mois</option>
            <option value="COOPERATIVE">Coopérative & Institution — 149 000 FCFA / mois</option>
          </select>
        </div>
      )}

      <div className="rounded-xl bg-ink-50 px-3 py-2.5 text-xs text-ink-600">
        Paiement par <strong>Mobile Money en FCFA</strong> ({paysInfo.mobileMoney.join(', ')}) · TVA appliquée
        automatiquement à {paysInfo.vat}% ({paysInfo.fiscal}) · Vous pouvez arrêter à tout moment.
      </div>

      <Message etat={etat} />
      <button className="btn-primary" disabled={chargement}>
        {chargement ? 'Création…' : 'Créer mon compte et essayer 14 jours'}
      </button>
      <p className="text-center text-xs text-ink-500">
        Déjà client ? <a className="lien" href="/connexion">Connectez-vous</a>
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Espace PRIVE du proprietaire (e-mail + mot de passe + code confidentiel)
// ---------------------------------------------------------------------------
export function EspacePriveForm() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [etat, setEtat] = useState<{ type: 'vide' | 'ok' | 'erreur'; texte: string }>({ type: 'vide', texte: '' });

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChargement(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'connexion',
        email: f.get('email'),
        password: f.get('password'),
        passcode: f.get('passcode'),
      }),
    });
    const json: Rep = await res.json();
    setChargement(false);
    if (json.ok && json.redirection) {
      setEtat({ type: 'ok', texte: 'Accès autorisé. Ouverture du poste de pilotage…' });
      router.push('/admin');
      router.refresh();
    } else {
      setEtat({ type: 'erreur', texte: json.message || 'Accès refusé.' });
    }
  }

  return (
    <form onSubmit={envoyer} className="grid gap-4">
      <div>
        <label className="label" htmlFor="email">E-mail du propriétaire</label>
        <input id="email" name="email" type="email" required className="input" defaultValue="patron@mbmustapha.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" required className="input" defaultValue="patron2026" />
      </div>
      <div>
        <label className="label" htmlFor="passcode">Code confidentiel (ADMIN_PASSCODE)</label>
        <input id="passcode" name="passcode" required className="input" defaultValue="PATRON-2026" />
      </div>
      <Message etat={etat} />
      <button className="btn-dark" disabled={chargement}>
        {chargement ? 'Vérification…' : '🔓 Entrer dans l’espace privé'}
      </button>
      <p className="text-xs text-ink-500">
        Démonstration : patron@mbmustapha.com / patron2026 / PATRON-2026. Changez ces valeurs dans les
        variables d’environnement Vercel avant la mise en production.
      </p>
    </form>
  );
}
