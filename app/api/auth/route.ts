// =============================================================================
// POST /api/auth/connexion   -> ouvre une session
// POST /api/auth/deconnexion -> ferme la session
// POST /api/auth/inscription -> cree une entreprise cliente + essai 14 jours
// =============================================================================
import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  checkAdminPasscode,
  cookieOptions,
  createToken,
  hashPassword,
  verifyPassword,
  type Session,
} from '@/lib/auth';
import { erreur, handler, ok } from '@/lib/api';
import { createClient, createUser, getUserByEmail, listUsers } from '@/lib/store';
import { COUNTRY_BY_CODE, PLAN_BY_ID } from '@/lib/config';
import { uid } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Corps = {
  action?: 'connexion' | 'deconnexion' | 'inscription';
  email?: string;
  password?: string;
  passcode?: string;
  entreprise?: string;
  pays?: string;
  ville?: string;
  telephone?: string;
  nom?: string;
  plan?: string;
};

export const POST = handler(async (req: Request) => {
  const corps = (await req.json().catch(() => ({}))) as Corps;
  const action = corps.action || 'connexion';

  // --- Deconnexion ---------------------------------------------------------
  if (action === 'deconnexion') {
    const res = NextResponse.json({ ok: true, message: 'Déconnecté.' });
    res.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
    return res;
  }

  // --- Connexion -----------------------------------------------------------
  if (action === 'connexion') {
    const email = (corps.email || '').trim().toLowerCase();
    if (!email || !corps.password) return erreur('E-mail et mot de passe obligatoires.');

    const user = await getUserByEmail(email);
    if (!user) return erreur('Aucun compte avec cet e-mail.', 401);

    const motDePasseOk = await verifyPassword(corps.password, user.password);
    if (!motDePasseOk) return erreur('Mot de passe incorrect.', 401);

    // L'espace prive exige un code confidentiel en plus
    if (user.role === 'OWNER' && !checkAdminPasscode(corps.passcode || '')) {
      return erreur('Code confidentiel de l’espace privé incorrect.', 403);
    }

    const session: Session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      country: null,
    };
    const token = await createToken(session);
    const res = NextResponse.json({
      ok: true,
      redirection: user.role === 'OWNER' ? '/admin' : '/tableau-de-bord',
      user: { name: user.name, email: user.email, role: user.role, orgId: user.orgId },
    });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions);
    return res;
  }

  // --- Inscription (nouveau client du SaaS) --------------------------------
  if (action === 'inscription') {
    const email = (corps.email || '').trim().toLowerCase();
    const entreprise = (corps.entreprise || '').trim();
    if (!email || !corps.password || !entreprise) {
      return erreur('Entreprise, e-mail et mot de passe sont obligatoires.');
    }
    if ((corps.password || '').length < 6) {
      return erreur('Le mot de passe doit contenir au moins 6 caractères.');
    }
    const dejaPris = await getUserByEmail(email);
    if (dejaPris) return erreur('Un compte existe déjà avec cet e-mail. Connectez-vous.');

    const paysCode = corps.pays || 'TD';
    const pays = COUNTRY_BY_CODE(paysCode);
    const orgId = uid('org');
    const plan = corps.plan && PLAN_BY_ID(corps.plan) ? corps.plan : 'DECOUVERTE';

    // Creer l'organisation cliente en base (ou dans le jeu de demo)
    const { getPrisma } = await import('@/lib/db');
    const db = await getPrisma();
    if (db) {
      await db.organization.create({
        data: {
          id: orgId,
          name: entreprise,
          country: pays.code,
          city: corps.ville || pays.villes[0],
          currency: pays.currency,
          phone: corps.telephone || null,
          contactEmail: email,
          plan,
          planStatus: plan === 'DECOUVERTE' ? 'ACTIF' : 'ESSAI',
          vatRate: pays.vat,
        },
      });
      await db.subscription.create({
        data: {
          orgId,
          plan,
          amount: PLAN_BY_ID(plan)?.price || 0,
          currency: pays.currency,
          status: plan === 'DECOUVERTE' ? 'ACTIF' : 'ESSAI',
          renewAt: new Date(Date.now() + 14 * 86_400_000),
        },
      });
    } else {
      // Pas de base de donnees : on ajoute l'entreprise au jeu de demonstration
      const { ajouterOrganisationDemo } = await import('@/lib/store');
      await ajouterOrganisationDemo(
        {
          id: orgId,
          name: entreprise,
          country: pays.code,
          countryName: pays.name,
          city: corps.ville || pays.villes[0],
          currency: pays.currency,
          plan,
          planStatus: plan === 'DECOUVERTE' ? 'ACTIF' : 'ESSAI',
          phone: corps.telephone || '',
          contactEmail: email,
          mrr: PLAN_BY_ID(plan)?.price || 0,
          createdAt: new Date().toISOString(),
        },
        plan,
      );
    }

    const motDePasseHache = await hashPassword(corps.password);
    const user = await createUser({
      orgId,
      name: corps.nom || entreprise,
      email,
      password: motDePasseHache,
      phone: corps.telephone,
      role: 'CLIENT_ADMIN',
    });

    // Un client de demonstration tout pret, pour ne pas arriver dans le vide
    await createClient(orgId, {
      name: 'Client de démonstration',
      phone: corps.telephone || '',
      city: corps.ville || pays.villes[0],
      type: 'PARTICULIER',
    });

    const session: Session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'CLIENT_ADMIN',
      orgId,
      orgName: entreprise,
      country: pays.name,
    };
    const token = await createToken(session);
    const res = NextResponse.json({
      ok: true,
      redirection: '/tableau-de-bord',
      message: `Bienvenue ${corps.nom || entreprise} ! Votre essai de 14 jours sur l’offre ${PLAN_BY_ID(plan)?.name} est ouvert.`,
      essaiJours: plan === 'DECOUVERTE' ? 0 : 14,
    });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions);
    return res;
  }

  return erreur('Action inconnue.');
});

export async function GET() {
  const users = await listUsers();
  return ok({ utilisateurs: users.map((u) => ({ email: u.email, role: u.role, orgId: u.orgId })) });
}
