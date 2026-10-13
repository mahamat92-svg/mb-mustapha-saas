# Module ScolaPay — frais scolaires encaissés à temps (écoles, collèges, centres de formation)

Documentation complète du module école : modèle de données, calcul des échéanciers, récus, relances aux
parents, indicateurs du directeur et argumentaire de vente.

> **En une phrase :** à l'inscription, l'échéancier du parent se crée tout seul ; à chaque paiement, un reçu
> numéroté part avec le message de confirmation ; chaque semaine, l'école sait **qui doit combien** et envoie
> les rappels d'un clic.

---

## 1. Le problème réel (ce que vivent les directions d'école)

| Ce qui se passe aujourd'hui | Ce que ça coûte |
|---|---|
| Frais payés en 2 ou 3 tranches, notés sur un cahier | Cahier perdu = impayés oubliés |
| Le parent dit « j'ai payé » et le cahier ne le dit pas | Dispute devant les autres parents, perte de crédit |
| Le censeur recopie les listes d'impayés chaque mois | 2 jours de travail administratif perdu |
| Reçus manuscrits, parfois non remis | Contestation impossibles à trancher |
| Aucun rapport fiable pour le propriétaire | Décisions à l'aveugle, trésorerie sous tension |

**Résultat classique :** 20 à 30 % des frais annuels restent à recouvrer à la fin de l'année — sur une école
de 300 élèves à 120 000 FCFA, c'est **jusqu'à 10 millions de FCFA** qui restent dehors.

## 2. Ce que fait le module

| Fonction | Détail |
|---|---|
| Inscription d'un élève | Nom, classe, sexe, parent + téléphone, frais annuels, frais d'inscription |
| Échéancier automatique | 2, 3 ou 4 tranches, **arrondies à 500 FCFA**, la dernière absorbe le reliquat |
| Encaissement | Espèces, Mobile Money ou virement ; le système remplit les tranches échues dans l'ordre |
| Reçu numéroté | `REC-2026-0001`, propre à l'établissement, conservé pour toujours |
| Message au parent | Confirmation du paiement avec le **reste à payer** (WhatsApp ou SMS) |
| Liste des retards | Triée du **plus gros retard au plus petit**, avec le nombre de jours |
| Rappel avant échéance | 7 jours avant, message prêt à envoyer |
| Situation par élève | Document imprimable à remettre au parent (tranche par tranche) |
| Tableau de bord | Encaissé / attendu / reste, **taux de recouvrement par classe** |
| Frais d'inscription | Suivis séparément (un élève sur cinq ne les a pas payés — ça se voit) |

## 3. Le calcul des tranches (vérifiable à la main)

Règle : **tranches égales, arrondies à 500 FCFA vers le bas, le reliquat ajouté à la dernière tranche.**
Aucun centime, aucun arrondi flottant : tout est en FCFA entiers.

| Frais annuels | 3 tranches | Détail |
|---|---|---|
| 90 000 | 30 000 + 30 000 + 30 000 | 30 000 est un multiple de 500 |
| 100 000 | 33 000 + 33 000 + 34 000 | 33 000 = multiple de 500 ; reliquat 1 000 sur la 3ᵉ |
| 120 000 | 40 000 + 40 000 + 40 000 | cas standard d'une école primaire |
| 150 000 | 50 000 + 50 000 + 50 000 | collège |
| 180 000 | 60 000 + 60 000 + 60 000 | collège, classe d'examen |
| 250 000 | 4 tranches : 62 500 → 62 000 + 62 000 + 62 000 + 64 000 | arrondi aux 500 inférieurs |

> La fonction `verifierEcheancier()` (dans `lib/scolarite.ts`) contrôle que **la somme des tranches égale
> toujours les frais annuels** — c'est le test que fait automatiquement l'application.

## 4. Où ça se trouve dans l'application

| Écran | Ce qu'on y fait |
|---|---|
| **`/scolarite`** | Tableau de bord du directeur : encaissé, reste à recouvrer, taux de recouvrement, retards triés, encaissement rapide, inscription d'élève, répartition par classe |
| **`/scolarite/[id]`** | Fiche élève : échéancier, historique des reçus, **situation imprimable** (à remettre au parent), message prêt et boutons WhatsApp / SMS |
| **`/messages`** | Journal de tous les messages envoyés aux parents (preuve en cas de contestation) |
| **`/api/v1/scolarite`** | API utilisable par Make.com : inscrire, encaisser, relancer |

## 5. Travailler avec les parents (les messages exacts)

**Rappel avant échéance (7 jours avant) :**
> Bonjour {Parent}, {École} vous rappelle que la scolarité de {Élève} ({Classe}) arrive à échéance le
> {date}. Montant : {montant} FCFA. Paiement par Mobile Money au {numéro de l'école} ou à la caisse.
> Merci — et n'hésitez pas à appeler si vous souhaitez un échelonnement.

**Relance de retard :**
> Bonjour {Parent}, {École} concernant {Élève} ({Classe}) : il reste {montant} FCFA en retard ({n} jour(s)).
> Vous pouvez payer dès maintenant par Mobile Money au {numéro}. Si vous rencontrez une difficulté,
> appelez-nous : nous pouvons étaler le paiement. Merci de votre confiance.

**Confirmation de paiement (automatique, à chaque encaissement) :**
> Reçu {REC-2026-0001} — {École} a bien reçu {montant} FCFA pour la scolarité de {Élève}.
> Reste à payer : {reste} FCFA. Merci, et bonne journée.

> **Pourquoi ça marche** : le parent reçoit une **preuve** (le reçu) et un **chiffre clair** (ce qui reste).
> Les écoles qui appliquent ces trois messages récupèrent en général **5 à 15 points de recouvrement** dès le
> premier trimestre — sans un seul déplacement en plus.

**Les 3 phrases à dire de vive voix (formation des caissières) :**
1. « Votre enfant est en règle pour la 1ʳᵉ tranche : merci, c'est ce qui nous permet de payer les enseignants à temps. »
2. « Il reste 80 000 sur l'année. Vous pouvez régler 40 000 par Mobile Money, sans vous déplacer. »
3. « Si le mois est difficile, dites-le nous : on étale. Ce qui compte, c'est que l'enfant reste en classe. »

## 6. Indicateurs à montrer au propriétaire chaque mois

| Indicateur | Où le lire |
|---|---|
| Taux de recouvrement global | carte « Encaissé (année) » — en % |
| Reste à recouvrer | carte « Reste à recouvrer » |
| Montant en retard + nombre d'élèves | carte « En retard » |
| Recouvrement **par classe** | tableau « Par classe » (barres de progression) |
| Encaissé **ce mois-ci** | sous-titre « Derniers encaissements » |
| Frais d'inscription non payés | colonne « Statut » de la liste des élèves |

## 7. Argumentaire de vente (à utiliser devant un directeur)

**Version courte (45 secondes) :**
> « Monsieur le Directeur, aujourd'hui votre censeur passe deux jours par mois à recopier les listes
> d'impayés — et vous ne savez jamais exactement combien il reste à encaisser avant la fin du trimestre.
> Avec ScolaPay, à l'inscription l'échéancier du parent se crée tout seul, chaque paiement sort un reçu
> numéroté, et le parent reçoit un message avec le montant exact qu'il doit. Vous, vous voyez le taux de
> recouvrement par classe, en direct.
> Ça coûte **24 900 FCFA par mois**. Pour une école de 300 élèves, c'est **83 FCFA par élève et par mois** —
> **un seul impayé récupéré par classe paie l'abonnement de l'année entière.** »

**Les 3 objections et leurs réponses :**

| Objection | Réponse |
|---|---|
| « Nos parents ne connaissent pas le téléphone. » | « Vos parents utilisent déjà Mobile Money pour envoyer de l'argent. Et pour ceux qui n'ont pas de smartphone, tout part en **SMS** : même un téléphone à touches reçoit le montant dû. » |
| « On a déjà un cahier qui marche. » | « Il marche jusqu'au jour où un parent conteste un reçu. Ici, chaque paiement a un **numéro de reçu** que vous retrouvez en 3 secondes, même deux ans après. » |
| « C'est cher pour nous. » | « Combien vous reste-t-il à recouvrer à la fin du dernier trimestre ? *(il répond)* … Donc l'outil coûte 24 900 par mois et vous en récupérez dix fois plus. Le vrai coût, c'est l'argent qui reste dehors. » |

**Test à faire devant lui en 5 minutes** (démonstration) : inscrire un vrai élève avec son vrai parent, créer
les 3 tranches, encaisser un paiement et lui montrer **le message que le parent reçoit**. C'est ce message qui
fait signer : le directeur comprend immédiatement que l'école n'aura plus à courir après les impayés.

## 8. Sécurité et bonnes pratiques

- **Vos données restent vos données** : export CSV/Excel sur demande, à tout moment, sans frais.
- **Un reçu ne se supprime pas** : chaque encaissement est un enregistrement immuable (numéro + date + canal).
  Si une erreur est faite, on enregistre une correction, on ne masque jamais.
- **Accès limités par rôle** : la caissière encaisse, le directeur voit les rapports, seul le propriétaire du
  compte peut modifier les frais et les tranches.
- **Données des mineurs** : ne saisissez que ce qui est nécessaire (nom, classe, parent, téléphone). Pas de
  notes, pas de santé, pas d'adresse complète.
- **Message aux parents** : maximum **2 messages par semaine et par famille** (rappel + reçu). Harceler un
  parent en difficulté fait perdre des élèves — et des élèves, c'est ce que l'école vend.

## 9. Démonstration immédiate

| | |
|---|---|
| Compte de démonstration école | `ecole@mbmustapha.com` / `demo2026` |
| Établissement | **Lomé École Les Palmiers** (12 élèves, 3 classes, 12 échéanciers, paiements variés) |
| À montrer en priorité | la liste **« À relancer en priorité »** et le **message prêt** (bouton WhatsApp) |
| Fiche élève exemple | `/scolarite` → cliquer sur un élève → **Imprimer la situation** |

Avec une vraie base de données : `npm run db:seed` crée l'école et ses 12 élèves automatiquement.
