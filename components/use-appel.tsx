'use client';

// =============================================================================
// MB Mustapha — Hook partagé par tous les formulaires clients
// Centralise : état de chargement, messages de retour, rafraîchissement.
// =============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type Etat = { type: 'vide' | 'ok' | 'erreur' | 'info'; texte: string };

export function useAppel() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [etat, setEtat] = useState<Etat>({ type: 'vide', texte: '' });

  async function appeler(url: string, corps: unknown, apres?: (json: any) => void) {
    setChargement(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps),
      });
      const json = await res.json();
      setEtat({
        type: json.ok ? 'ok' : 'erreur',
        texte: json.message || (json.ok ? 'Opération réussie.' : 'Échec de l’opération.'),
      });
      if (json.ok) {
        router.refresh();
        apres?.(json);
      }
      return json;
    } catch (e) {
      setEtat({ type: 'erreur', texte: `Erreur réseau : ${(e as Error).message}` });
      return { ok: false };
    } finally {
      setChargement(false);
    }
  }

  return { appeler, chargement, etat, setEtat };
}
