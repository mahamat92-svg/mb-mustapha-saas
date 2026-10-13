// =============================================================================
// MB Mustapha - Helpers communs aux routes API
// =============================================================================

import { NextResponse } from 'next/server';
import { getSession, type Session } from './auth';
import { modeDemo } from './store';

export function ok(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, modeDemo: modeDemo(), ...data }, { status });
}

export function erreur(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

/** Session obligatoire (client connecte). */
export async function exigerSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Reponse(erreur('Authentification requise.', 401));
  return s;
}

/** Session obligatoire ET role OWNER (interface privee). */
export async function exigerOwner(): Promise<Session> {
  const s = await exigerSession();
  if (s.role !== 'OWNER') throw new Reponse(erreur('Accès réservé à l’éditeur du SaaS.', 403));
  return s;
}

/**
 * Determine l'organisation cible :
 *  - un client ne peut agir que sur SA propre organisation
 *  - le proprietaire (OWNER) peut cibler n'importe quelle organisation
 */
export function resoudreOrgId(session: Session, orgIdDemande?: string | null): string {
  if (session.role === 'OWNER') {
    const cible = orgIdDemande || session.orgId;
    if (!cible) throw new Reponse(erreur('Précisez « orgId » (le propriétaire doit choisir un client).', 400));
    return cible;
  }
  if (orgIdDemande && orgIdDemande !== session.orgId) {
    throw new Reponse(erreur('Vous ne pouvez pas accéder aux données d’une autre entreprise.', 403));
  }
  if (!session.orgId) throw new Reponse(erreur('Aucune entreprise associée à ce compte.', 400));
  return session.orgId;
}

/** Permet de "lancer" une reponse depuis n'importe quel point du code. */
export class Reponse extends Error {
  response: NextResponse;
  constructor(response: NextResponse) {
    super('reponse');
    this.response = response;
  }
}

/** Enveloppe un handler pour transformer les Reponse en vraies reponses HTTP. */
export function handler<T extends unknown[]>(
  fn: (...args: T) => Promise<NextResponse>,
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof Reponse) return e.response;
      console.error('[MB Mustapha API]', e);
      return erreur((e as Error).message || 'Erreur interne', 500);
    }
  };
}

/** Secret pour les crons Vercel (header Authorization: Bearer CRON_SECRET). */
export function cronAutorise(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // en dev, on laisse passer pour tester
  const h = req.headers.get('authorization') || '';
  const v = req.headers.get('x-cron-secret') || '';
  return h === `Bearer ${secret}` || v === secret;
}

/** Cle API pour Make (Authorization: Bearer AFRIFLOW_API_KEY) ou signature HMAC. */
export function apiKeyValide(req: Request): boolean {
  const cle = process.env.AFRIFLOW_API_KEY;
  const h = req.headers.get('authorization') || '';
  if (!cle) return true; // pas de cle configuree : mode demonstration
  return h === `Bearer ${cle}`;
}
