---
description: Connecter MB Mustapha à Make.com — créer les webhooks, importer les blueprints, tester la chaîne complète
---

# Workflow : connecter Make.com de bout en bout

## A. Sens MB Mustapha → Make (l'application déclenche)

1. make.com → **Scenarios → Create a new scenario → + → Webhooks → Custom webhook → Add**.
2. Nommer le webhook (`afriflow-relance`), cliquer **Save**, copier l'**adresse** (https://hook.eu1.make.com/…).
3. Vercel → Settings → Environment Variables → créer `MAKE_WEBHOOK_RELANCE` avec cette adresse.
4. Répéter pour : `MAKE_WEBHOOK_STOCK`, `MAKE_WEBHOOK_PAIEMENT`, `MAKE_WEBHOOK_MESSAGE`,
   `MAKE_WEBHOOK_RAPPORT`, `MAKE_WEBHOOK_GENERIC` (AfriBot / tests).
5. **Redeploy** le projet Vercel (les variables ne sont prises en compte qu'au redéploiement).
6. Dans MB Mustapha : ouvrir une facture impayée → **Relancer**. Make affiche « Successfully determined »
   puis les champs reçus (`facture`, `client`, `resteAPayer`, `message`…).

## B. Sens Make → MB Mustapha (l'application reçoit)

1. Ajouter un module **HTTP → Make a request** (ou « HTTP > Make an OAuth 2.0 request »).
2. URL : `https://VOTRE-APP.vercel.app/api/webhooks/make`
3. Méthode : `POST`. En-têtes :
   - `Authorization: Bearer <AFRIFLOW_API_KEY>`
   - `Content-Type: application/json`
   - `x-afriflow-event: paiement.reussi` (l'événement traité)
4. Corps JSON (exemple de paiement) :
   ```json
   { "event": "paiement.reussi", "orgId": "org_ndjamena",
     "data": { "factureId": "…", "montant": 200000, "provider": "airtel", "reference": "AM-123456" } }
   ```
5. Pour la signature (recommandé) : ajouter un module **Tools → Set variable** qui calcule
   `hmac_sha256(MAKE_WEBHOOK_SECRET, body)` puis l'envoyer dans `x-afriflow-signature`.
   (Sinon, la clé API suffit en attendant.)

## C. Vérifier (sans rien casser)

```bash
npm run dev                                   # dans un terminal
node scripts/make-test.mjs ping               # dans un autre
node scripts/make-test.mjs paiement.reussi
```

Réponse attendue : `{"ok":true,"evenement":"ping","resultat":{…}}` puis, dans `/admin/make`, une ligne
`OK` dans le journal. Si vous voyez `mode simulation`, c'est que les URLs de webhook ne sont pas encore
définies : l'application journalise au lieu d'envoyer (aucune erreur, aucun blocage).

## D. Le réflexe de diagnostic

Tout est tracé dans **`/admin/make`** : qui a appelé qui, quand, avec quel code HTTP et quelle erreur.
C'est là qu'on regarde en premier quand « une relance n'est pas partie ».
