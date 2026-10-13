# Déploiement sur Vercel — pas à pas

> Durée totale : 15 à 30 minutes. Aucune carte bancaire n'est nécessaire pour démarrer (offres gratuites
> Vercel, Neon, Make).

---

## Étape 0 — Pré-requis

- Un compte [GitHub](https://github.com) (gratuit).
- Un compte [Vercel](https://vercel.com) (gratuit) — connectez-le à GitHub.
- Node.js 18.18+ installé sur votre machine.
- Facultatif : un compte [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (base PostgreSQL gratuite).

---

## Étape 1 — Vérifier que tout compile en local

```bash
cd mb-mustapha-saas
npm install
npm run build     # doit se terminer par « ✓ Compiled successfully »
```

En cas d'erreur : supprimez `node_modules` et `.next`, puis relancez `npm install && npm run build`.

Test rapide de l'interface :

```bash
npm run dev
# ouvrez http://localhost:3000  (mode démonstration : données fictives, aucune base requise)
```

---

## Étape 2 — Mettre le projet sur GitHub

```bash
cd mb-mustapha-saas
git init
git add .
git commit -m "MB Mustapha v1.0 — SaaS de gestion PME Afrique"
git branch -M main
git remote add origin git@github.com:VOTRE_COMPTE/afriflow.git   # ou https://github.com/...
git push -u origin main
```

> Le fichier `.gitignore` protège déjà `.env`, `.next`, `node_modules`.

---

## Étape 3 — Créer la base de données (facultatif mais recommandé)

1. neon.tech → **Create project** → région `eu-central-1` (Francfort, la plus proche de l'Afrique centrale).
2. Copiez la **connection string** : `postgresql://user:motdepasse@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Créez les tables **depuis votre machine** :

```bash
DATABASE_URL="postgresql://…" npx prisma db push
DATABASE_URL="postgresql://…" node scripts/seed.mjs
```

Le seed crée : votre compte propriétaire + 4 entreprises clientes de démonstration + factures, stock,
tontines, abonnements.

> Sans base : l'application reste utilisable en **mode démonstration** (données fictives non persistantes).
> Vous pourrez vendre et démontrer, mais pas encaisser de vrais paiements ni conserver de vraies données.

---

## Étape 4 — Importer sur Vercel

1. vercel.com → **Add New… → Project → Import Git Repository** → choisissez `afriflow`.
2. Framework détecté : **Next.js** (ne rien changer). Build : `npm run build` — Output : `.next`.
3. Avant de cliquer sur Deploy, ouvrez **Environment Variables** et collez celles-ci :

| Variable | Valeur | Obligatoire |
|---|---|---|
| `DATABASE_URL` | chaîne Neon/Supabase | recommandé |
| `AUTH_SECRET` | `openssl rand -base64 32` | **oui en production** |
| `ADMIN_PASSCODE` | ex. `SAHEL-2026-FORT` | **oui** |
| `AFRIFLOW_API_KEY` | ex. `afk_live_…` (32 caractères) | oui pour Make |
| `MAKE_WEBHOOK_SECRET` | ex. `mks_…` | oui pour Make |
| `CRON_SECRET` | ex. `cron_…` | oui |
| `MAKE_WEBHOOK_RELANCE` … `_RAPPORT` | URLs Make (étape 6) | plus tard |
| `KIIAPAY_PRIVATE_KEY`, `KIIAPAY_SECRET` **ou** `CINETPAY_API_KEY`, `CINETPAY_SITE_ID` | clés agrégateur | plus tard |
| `MANUAL_PAYMENT_NUMBER` | `+235 66 00 00 00 (Airtel Money)` | recommandé au Tchad |
| `NEXT_PUBLIC_APP_URL` | `https://votre-domaine.vercel.app` | oui |
| `NEXT_PUBLIC_BRAND_NAME` | `MB Mustapha` (ou votre marque) | facultatif |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | votre numéro | recommandé |

4. **Deploy**.

---

## Étape 5 — Vérifications après déploiement

| Test | Résultat attendu |
|---|---|
| `https://votre-app.vercel.app/api/health` | `{"ok":true,...,"modeDemo":false}` |
| `/` | la page d'accueil s'affiche, le bandeau « mode démonstration » disparaît si la base est connectée |
| `/connexion` avec `demo@mbmustapha.com` / `demo2026` | accès au tableau de bord |
| `/espace-prive` avec `patron@mbmustapha.com` / `patron2026` / `PATRON-2026` | accès à `/admin` |

---

## Étape 6 — Activer les automatisations

Voir `docs/CONNEXION-MAKE.md`. En résumé : créez les 6 webhooks dans Make, collez leurs URL dans Vercel,
redéployez, puis testez avec `node scripts/make-test.mjs ping`.

---

## Étape 7 — Tâche planifiée (cron 7h)

`vercel.json` déclare :

```json
{ "crons": [{ "path": "/api/cron/relances", "schedule": "0 7 * * *" }] }
```

Ce cron envoie chaque matin : les relances d'impayés, les alertes de stock, et le rapport quotidien du
patron. Sur le plan **Hobby**, les crons ne peuvent s'exécuter qu'une fois par jour (ce qui suffit ici).

**Alternative** si votre hébergeur n'accepte pas les crons : sur [cron-job.org](https://cron-job.org),
créez une tâche quotidienne à 07:00 appelant
`https://votre-app.vercel.app/api/cron/relances` avec l'en-tête `Authorization: Bearer VOTRE_CRON_SECRET`.

---

## Étape 8 — Domaine et marque

1. Vercel → Settings → **Domains** → ajoutez `mbmustapha.com` (ou votre domaine) et suivez les DNS.
2. Mettez à jour `NEXT_PUBLIC_APP_URL` avec le domaine final (utilisé dans les liens de paiement et les QR).
3. Changez le logo (`components/Logo.tsx`) et la palette (`tailwind.config.ts`, section `brand`).

---

## Dépannage

| Problème | Cause / solution |
|---|---|
| Le site affiche « Mode démonstration » | `DATABASE_URL` absente ou invalide → vérifiez Vercel → Settings → Environment Variables, puis **Redeploy** |
| `PrismaClientInitializationError` | Vous avez oublié `npx prisma db push` avec l'URL de production |
| Connexion impossible avec les comptes seed | `node scripts/seed.mjs` n'a pas été exécuté (ou exécuté sur une autre base) |
| Les relances ne partent pas | `MAKE_WEBHOOK_RELANCE` vide → mode simulation (journalisé dans `/admin/make`) |
| « Code confidentiel incorrect » | `ADMIN_PASSCODE` de Vercel ≠ celui saisi |
| Le cron ne s'exécute pas | Plan Vercel / fuseau horaire (cron exprimé en **UTC** : 07:00 UTC = 08:00 à N'Djaména) |
| Build échoué sur Vercel mais OK en local | Vercel utilise Node 20 : ajoutez `"engines": { "node": ">=18.18.0" }` (déjà présent) et relancez |

---

## Mise en production « sérieuse » — liste finale

- [ ] `AUTH_SECRET`, `ADMIN_PASSCODE`, `AFRIFLOW_API_KEY`, `MAKE_WEBHOOK_SECRET`, `CRON_SECRET` uniques
- [ ] Mots de passe des comptes de démonstration changés ou comptes supprimés
- [ ] Base sauvegardée automatiquement (Neon/Supabase, rétention activée)
- [ ] Une passerelle de paiement réellement testée avec 100 FCFA
- [ ] Conditions générales et mention de protection des données publiées (obligation légale croissante en zone UEMOA/CEMAC)
- [ ] Numéro WhatsApp Support opérationnel et testé
