// =============================================================================
// MB Mustapha - Authentification & sessions (JWT httpOnly + bcrypt)
// Deux niveaux d'acces :
//   OWNER        -> vous, l'editeur du SaaS. Interface privee /admin
//   CLIENT_ADMIN -> le patron de l'entreprise cliente. /tableau-de-bord
//   CLIENT_USER  -> un employe du client (droit reduit)
// =============================================================================

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const SESSION_COOKIE = 'afriflow_session';
const SECRET = process.env.AUTH_SECRET || 'afriflow-dev-secret-changez-moi-en-production-32';
const KEY = new TextEncoder().encode(SECRET);
const DUREE_JOURS = 7;

export type Role = 'OWNER' | 'CLIENT_ADMIN' | 'CLIENT_USER';

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  orgId: string | null;
  orgName?: string | null;
  country?: string | null;
};

// --- Mots de passe ---------------------------------------------------------
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * Verifie un mot de passe. Si le mot de passe enregistre est un hash bcrypt
 * (commence par $2) on compare normalement. Sinon == donnee de demonstration.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith('$2')) {
    try {
      return await bcrypt.compare(plain, stored);
    } catch {
      return false;
    }
  }
  return plain === stored;
}

// --- Jeton de session ------------------------------------------------------
export async function createToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('afriflow')
    .setExpirationTime(`${DUREE_JOURS}d`)
    .sign(KEY);
}

export async function readToken(token?: string | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, KEY, { issuer: 'afriflow' });
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: DUREE_JOURS * 24 * 60 * 60,
};

// --- Helpers cote serveur (Server Components / Route Handlers) -------------
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return readToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireSession(redirectTo = '/connexion'): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(redirectTo);
  return s;
}

export async function requireOwner(): Promise<Session> {
  const s = await requireSession('/connexion?next=/admin');
  if (s.role !== 'OWNER') redirect('/tableau-de-bord?ref=acces-refuse');
  return s;
}

export function estOwner(s: Session | null): boolean {
  return s?.role === 'OWNER';
}

// --- Verification du code confidentiel de l'espace prive -------------------
export function checkAdminPasscode(code: string): boolean {
  const expected = process.env.ADMIN_PASSCODE || 'PATRON-2026';
  return (code || '').trim() === expected;
}
