---
description: Déployer MB Mustapha sur Vercel (import GitHub ou CLI), brancher la base de données et vérifier la mise en ligne
---

# Workflow : déployer sur Vercel

## Étapes

1. Vérifier que le projet build :
   ```bash
   npm install
   npm run build
   ```
2. Mettre le dossier sous Git :
   ```bash
   git init && git add . && git commit -m "MB Mustapha v1"
   ```
3. Pousser sur GitHub (dépôt privé recommandé) :
   ```bash
   git remote add origin git@github.com:VOTRE_COMPTE/afriflow.git
   git branch -M main && git push -u origin main
   ```
4. Sur vercel.com → **Add New… → Project → Import** le dépôt. Vercel détecte Next.js automatiquement.
5. Ajouter les **Environment Variables** (Settings → Environment Variables) :
   `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_PASSCODE`, `AFRIFLOW_API_KEY`, `MAKE_WEBHOOK_SECRET`,
   `CRON_SECRET`, `MAKE_WEBHOOK_*`, `KIIAPAY_*`/`CINETPAY_*`, `NEXT_PUBLIC_APP_URL`.
6. Créer la base : neon.tech (ou supabase.com) → copier la chaîne de connexion → la coller dans
   `DATABASE_URL` (Production **et** Preview).
7. Créer les tables depuis la machine locale, avec la chaîne de production :
   ```bash
   DATABASE_URL="postgresql://…" npx prisma db push
   DATABASE_URL="postgresql://…" node scripts/seed.mjs
   ```
8. Redéployer (Deployments → … → Redeploy) puis vérifier :
   `https://VOTRE-APP.vercel.app/api/health` doit répondre `"ok": true`.

## Après la mise en ligne

- Cron : `vercel.json` déclare `/api/cron/relances` à 07:00 UTC. Sur le plan Hobby, vérifiez l'onglet
  **Cron Jobs** ; sinon utilisez un service externe (cron-job.org) qui appelle l'URL avec
  `Authorization: Bearer CRON_SECRET`.
- Domaine : Settings → Domains → ajouter `mbmustapha.com` (ou votre domaine) et suivre les DNS.
- Sécurité : changer `ADMIN_PASSCODE`, `AUTH_SECRET`, `AFRIFLOW_API_KEY` **avant** d'ouvrir au public.
- Sauvegarde : activer l'historique de branche Neon/Supabase (rétention 7 jours sur les offres gratuites).

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Le site affiche des données fictives | `DATABASE_URL` absente ou invalide → mode démonstration |
| « Mot de passe incorrect » sur un compte seedé | `scripts/seed.mjs` n'a pas été exécuté |
| Rien ne se passe au clic sur « Relancer » | URLs `MAKE_WEBHOOK_*` absentes → mode simulation (normal) |
| Erreur 500 sur `/admin` | Vous n'êtes pas connecté avec le rôle `OWNER` |
