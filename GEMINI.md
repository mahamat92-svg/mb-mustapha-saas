# GEMINI.md — règles spécifiques à Google Antigravity (afriFlow)

`AGENTS.md` contient les règles communes. Ce fichier ajoute les consignes propres à Antigravity.

## Comportement attendu de l'agent

1. **Réponds toujours en français** (l'utilisateur final et le propriétaire du projet sont francophones).
2. **Explore → planifie → exécute.** Avant toute modification touchant plus d'un fichier, commence par un
   plan court (fichiers concernés, actions, risques) puis attends l'accord.
3. **Vérifie après avoir écrit.** Termine une tâche par `npm run build` (ou au minimum `node --check`
   sur les scripts) et signale explicitement le résultat.
4. **Ne casse pas le mode démonstration.** `DATABASE_URL` peut être absente : l'application doit builder
   et afficher des données fictives. C'est le mode utilisé pour les démonstrations client.
5. **Chemins courts et stables.** Utilise l'alias `@/` (`@/lib/store`, `@/components/ui`) plutôt que des
   chemins relatifs profonds (`../../..`).
6. **Petites touches ciblées.** Évite les réécritures massives : le code est déjà complet et commenté.
   Préfère `edit_file` à une réécriture de fichier entier.

## Vérifications à exécuter avant de considérer une tâche terminée

```bash
npm run build          # build Vercel identique
npm run lint           # (facultatif, les règles sont tolérantes)
```

Et si la tâche touche l'automatisation :

```bash
node scripts/make-test.mjs ping
node scripts/make-test.mjs paiement.reussi
```

## Zones à ne pas modifier sans raison explicite

- `lib/config.ts` : la grille tarifaire (les prix sont un choix commercial validé).
- `lib/store.ts` : la couche d'accès aux données (tout le reste en dépend).
- `app/api/webhooks/make/route.ts` : les contrôles de sécurité (clé API + HMAC).
- `prisma/schema.prisma` : les entiers en FCFA (jamais de Float).

## Style de code

- 2 espaces d'indentation, guillemets simples, point-virgule en fin d'instruction.
- Composants serveur par défaut ; `'use client'` uniquement si un état ou un événement est nécessaire.
- Commentaires en français, orientés **pourquoi** (pas « ce que fait la ligne »).
- Aucune dépendance nouvelle sans l'avoir justifiée dans le plan.
