# Base de données — installation, modèles et exploitation

## 1. Pourquoi une base ? Et pourquoi ce n'est pas bloquant

Sans `DATABASE_URL`, MB Mustapha tourne en **mode démonstration** : les 5 entreprises, 17 factures, stock et
tontines viennent de `lib/demo-data.ts`. Parfait pour vendre, démontrer et développer.

Dès que vous voulez des **vraies données**, créez une base PostgreSQL gratuite (Neon ou Supabase) et
collez son URL dans `DATABASE_URL`.

| Fournisseur | Offre gratuite | Région conseillée | Remarque |
|---|---|---|---|
| [Neon](https://neon.tech) | 0,5 Go, branche par projet | `eu-central-1` (Francfort) | le plus simple, latence correcte depuis le Tchad/Cameroun |
| [Supabase](https://supabase.com) | 500 Mo + auth + storage | `eu-west-3` (Paris) | utile si vous voulez aussi du stockage de fichiers |

## 2. Installation en 3 commandes

```bash
# 1. Créer les tables (depuis votre machine, avec l'URL de production)
DATABASE_URL="postgresql://user:pass@host/afriflow?sslmode=require" npx prisma db push

# 2. Remplir avec les données de démonstration (optionnel)
DATABASE_URL="postgresql://…" node scripts/seed.mjs

# 3. Visualiser les données dans le navigateur
DATABASE_URL="postgresql://…" npx prisma studio
```

Collez ensuite la même URL dans **Vercel → Settings → Environment Variables → `DATABASE_URL`** (Production
**et** Preview), puis redéployez.

## 3. Modèles (10 tables)

| Table | Rôle | Champs clés |
|---|---|---|
| `Organization` | une entreprise cliente | `country`, `currency` (XAF/XOF), `plan`, `planStatus`, `vatRate` |
| `User` | utilisateurs (vous + clients) | `role` = `OWNER` / `CLIENT_ADMIN` / `CLIENT_USER` |
| `Client` | clients finaux d'une entreprise | `phone`, `type` (PARTICULIER, ENTREPRISE, ECOLE, COOPERATIVE) |
| `Invoice` | factures | `number` (unique, sans trou), `amount` HT, `vatRate`, `total`, `paid`, `status` |
| `Payment` | encaissements | `provider`, `reference`, `status` (EN_ATTENTE/REUSSI/ECHOUE) |
| `StockItem` | inventaire | `sku`, `qty`, `threshold` (seuil d'alerte), `supplier` |
| `Tontine` + `Contribution` | tontines/njangi/coopératives | `contribution`, `membersCount`, `pot`, `beneficiary` |
| `Subscription` | abonnement SaaS d'une entreprise | `plan`, `amount`, `renewAt`, `status` |
| `Message` | SMS / WhatsApp / e-mail envoyés | `channel`, `to`, `body`, `status` |
| `WebhookLog` | journal Make.com | `direction`, `event`, `statusCode`, `error` |

### Règles de conception à respecter

1. **Montants = entiers** (`Int`), en FCFA. Jamais de `Float`, jamais de centimes.
2. **Cloisonnement** : toute table métier porte `orgId` + un index pour garantir des requêtes rapides et
   l'isolation entre clients.
3. **Statuts en français** pour rester lisible par un non-technicien : `PAYEE`, `IMPAYEE`, `EN_ATTENTE`.
4. **Suppression en cascade** : supprimer une entreprise efface ses données (RGPD-friendly).

## 4. Numérotation des factures

`FAC-AAAA-NNNN` (ex. `FAC-2026-0007`), générée par `lib/utils.ts → invoiceNumber()` à partir du nombre de
factures existantes de l'organisation. Une numérotation **continue et sans trou** est exigée par les
administrations fiscales (DGI, OTR) : ne jamais supprimer une facture, utilisez le statut `ANNULEE`.

## 5. Sauvegarde et restauration

```bash
# Sauvegarde (format SQL) — à faire au minimum une fois par semaine
pg_dump "$DATABASE_URL" > sauvegarde-afriflow-$(date +%F).sql

# Restauration
psql "$DATABASE_URL" < sauvegarde-afriflow-2026-02-11.sql
```

Neon et Supabase proposent aussi un historique de branche (rétention 7 jours sur les offres gratuites) qui
permet de revenir à un état antérieur en un clic.

## 6. Migrations (quand vous modifierez le schéma)

| Situation | Commande |
|---|---|
| Développement rapide, base jetable | `npx prisma db push` |
| Production, historique à conserver | `npx prisma migrate dev --name ajout_module_paie` puis `npx prisma migrate deploy` sur Vercel |

## 7. Passer en production « propre »

- [ ] `sSLmode=require` dans l'URL de connexion.
- [ ] Un utilisateur de base dédié au projet (pas le compte propriétaire).
- [ ] Sauvegarde automatique activée.
- [ ] `node scripts/seed.mjs` exécuté **une seule fois**, puis comptes de démonstration supprimés.
- [ ] `npx prisma studio` **non exposé publiquement** (outil local uniquement).
- [ ] Vérifier la politique de conservation des données (les données financières doivent souvent être
      conservées 10 ans dans l'espace UEMOA/CEMAC — ne supprimez pas les factures, archivez-les).
