# Module PaieLocal — CNPS / CNSS + IRPP / ITS (Cameroun, Tchad, Bénin, Togo)

Documentation complète du calcul de paie : méthode, taux, exemples chiffrés vérifiables à la main, et
procédure de mise à jour annuelle.

> ⚠️ **À lire avant de payer vos premiers salaires.** La **méthode de calcul** de ce module est correcte et
> testée (voir `npm run test:paie`). Les **taux et barèmes** sont des valeurs de travail arrondies, tirées des
> usages les plus couramment cités : ils **changent chaque année** en loi de finances. Faites-les confirmer par
> votre comptable ou auprès de l'organisme (`CNPS`, `CNSS`, `DGI`, `OTR`) avant usage réel, puis mettez-les à
> jour dans **un seul endroit** : `lib/config.ts → PAIE_PARAMS`.

---

## 1. Ce que le module fait

| Fonction | Détail |
|---|---|
| Fiche employé | mensuel ou **journalier** (payé à la journée), primes, indemnité de transport, avances |
| Pointage journalier | nombre de jours travaillés → brut automatique |
| Cotisations salariales | taux **plafonné** selon l'organisme du pays (CNPS/CNSS) et cotisations annexes |
| Abattement | frais professionnels (20 % ou 30 % selon le pays) appliqué avant l'impôt |
| Impôt progressif | barème **par tranches** (IRPP au Cameroun/Tchad/Togo, ITS au Bénin) |
| Taxe communale | centimes additionnels (Cameroun : 10 % de l'impôt) |
| Net à payer | brut − cotisations − impôt − avances |
| Part patronale | coût réel employeur (brut + charges patronales) |
| Bulletin imprimable | document remis au salarié, avec détail ligne par ligne |
| Déclaration CNPS/CNSS | récapitulatif mensuel : part salariale + part patronale à verser |
| Simulateur brut → net | pour négocier un salaire ou répondre à un employé |
| Contrôles automatiques | SMIG, plafond de cotisation, transport excédentaire, avances > salaire |

## 2. Ce que le module ne fait PAS (par honnêteté)

- Il ne **transmet pas** la déclaration à la CNPS/CNSS ni à la DGI/OTR (ce sont des télédéclarations
  propres à chaque pays : à faire manuellement ou via un module Make.com dédié).
- Il ne gère pas les **conventions collectives** (grilles sectorielles, primes d'ancienneté négociées).
- Il ne gère pas la **retenue à la source pour les expatriés** ni les conventions fiscales.
- Il n'intègre pas (encore) la **réduction pour charges de famille** de l'ITS béninois : elle est à saisir
  manuellement en ajustant l'impôt si votre comptable l'exige.

Ces limites sont normales : aucun logiciel simple ne couvre toute la réglementation sociale de 4 pays. Le
module fait **90 % du travail** (les calculs) et vous gagnez 2 jours par mois.

---

## 3. Paramètres par pays (à confirmer)

| | 🇨🇲 Cameroun | 🇹🇩 Tchad | 🇧🇯 Bénin | 🇹🇬 Togo |
|---|---|---|---|---|
| Organisme | CNPS | CNPS | CNSS | CNSS |
| Cotisation salariale principale | 4,2 % (plafond 750 000) | 3,5 % (plafond 500 000) | 3,6 % (plafond 208 333) | 4 % (plafond 400 000) |
| Cotisation annexe salarié | Crédit foncier 1 % (plafond 750 000) | — | — | — |
| Part patronale | 16,2 % (plafond 750 000) | 16,5 % (plafond 500 000) | 15,4 % (plafond 208 333) | 17,5 % (plafond 400 000) |
| Abattement frais professionnels | 30 % | 20 % | 20 % | 20 % |
| Impôt | IRPP progressif | IRPP progressif | ITS progressif | IRPP/IGIS progressif |
| Taxe communale | CAC 10 % de l'impôt | — | — | — |
| SMIG de référence | 41 875 | 60 000 | 52 000 | 52 500 |
| Transport exonéré | 30 000 / mois | 30 000 / mois | 30 000 / mois | 30 000 / mois |

**Barèmes d'impôt (tranches mensuelles appliquées par le moteur) :**

| Pays | Tranches (FCFA / mois) et taux marginaux |
|---|---|
| 🇨🇲 Cameroun | 0 – 166 667 : **11 %** · 166 667 – 250 000 : **15 %** · 250 000 – 416 667 : **25 %** · au-delà : **35 %** |
| 🇹🇩 Tchad | 0 – 100 000 : **0 %** · 100 000 – 200 000 : **10 %** · 200 000 – 350 000 : **15 %** · 350 000 – 600 000 : **20 %** · au-delà : **25 %** |
| 🇧🇯 Bénin | 0 – 60 000 : **0 %** · 60 000 – 200 000 : **10 %** · 200 000 – 300 000 : **15 %** · 300 000 – 500 000 : **19 %** · au-delà : **30 %** |
| 🇹🇬 Togo | 0 – 60 000 : **0 %** · 60 000 – 150 000 : **10 %** · 150 000 – 300 000 : **15 %** · 300 000 – 500 000 : **20 %** · au-delà : **25 %** |

> Ces barèmes sont les équivalents mensuels de grilles annuelles. Les organismes à contacter pour vérification
> sont indiqués dans `PAIE_PARAMS[code].aVerifier` et affichés directement dans la page **/paie**.

---

## 4. Méthode de calcul (l'ordre compte)

```
1.  Brut de base            = salaire mensuel   OU   jours pointés × taux journalier
2.  Brut total              = base + transport + primes + autres gains
3.  Brut imposable          = brut total − transport exonéré (max 30 000 FCFA/mois)
4.  Cotisations salariales  = taux × MIN(brut imposable ; plafond de l'organisme)
                              (+ cotisations annexes, ex. crédit foncier au Cameroun)
5.  Base imposable          = (brut imposable − cotisations salariales) × (1 − abattement %)
6.  Impôt                   = barème progressif par tranches sur la base imposable
                              (+ taxe communale, ex. CAC 10% de l'impôt au Cameroun)
7.  Net à payer             = brut total − cotisations − impôt − avances déjà versées
8.  Coût employeur          = brut total + part patronale (taux × MIN(brut imposable ; plafond))
```

Trois subtilités que le moteur gère correctement (et que les tableurs maison ratent souvent) :

- **Le plafond de cotisation** : au-delà du plafond, la fraction n'est plus cotisable — mais elle reste
  imposable, et l'impôt peut donc augmenter alors que la cotisation stagne.
- **L'abattement s'applique APRÈS déduction des cotisations**, pas sur le brut.
- **Le transport est exonéré jusqu'à un plafond**, pas totalement : la fraction excédentaire est réintégrée
  dans l'imposable (le module le signale par une alerte).
- **La part patronale est elle aussi plafonnée** : au Bénin par exemple, un salaire de 245 000 FCFA imposables
  ne génère une cotisation patronale que sur 208 333 FCFA.

---

## 5. Quatre exemples chiffrés (vérifiables à la main)

Ces 4 cas sont **automatiqument testés** par `npm run test:paie` (route `/api/v1/paie/verifier`).

### 🇨🇲 Cameroun — mensuel 200 000 FCFA + 20 000 de transport

| Étape | Calcul | Résultat |
|---|---|---|
| Brut total | 200 000 + 20 000 | **220 000** |
| CNPS salarié | 4,2 % × 200 000 | 8 400 |
| Crédit foncier | 1 % × 200 000 | 2 000 |
| Base imposable | (200 000 − 10 400) × 70 % | 132 720 |
| IRPP (11 %) | 132 720 × 11 % | 14 599 |
| CAC (10 %) | 14 599 × 10 % | 1 460 |
| **Net à payer** | 220 000 − 10 400 − 16 059 | **193 541** |
| **Coût employeur** | 220 000 + 16,2 % × 200 000 | **252 400** |

### 🇹🇩 Tchad — journalier : 24 jours × 3 000 FCFA

| Étape | Calcul | Résultat |
|---|---|---|
| Brut total | 24 × 3 000 | **72 000** |
| CNPS salarié | 3,5 % × 72 000 | 2 520 |
| Base imposable | (72 000 − 2 520) × 80 % | 55 584 (sous 100 000 → 0 %) |
| Impôt | tranche à 0 % | **0** |
| **Net à payer** | 72 000 − 2 520 | **69 480** |
| **Coût employeur** | 72 000 + 16,5 % × 72 000 | **83 880** |

### 🇧🇯 Bénin — mensuel 220 000 + primes 25 000 + transport 20 000

| Étape | Calcul | Résultat |
|---|---|---|
| Brut total | 220 000 + 25 000 + 20 000 | **265 000** |
| Brut imposable | 245 000 (transport exonéré) | 245 000 |
| CNSS salarié | 3,6 % × **208 333** (plafond atteint) | 7 500 |
| Base imposable | (245 000 − 7 500) × 80 % | 190 000 |
| ITS | 10 % sur 130 000 (fraction 60 000 → 200 000) | 13 000 |
| **Net à payer** | 265 000 − 7 500 − 13 000 | **244 500** |
| **Coût employeur** | 265 000 + 15,4 % × **208 333** (plafond patronal) | **297 083** |

### 🇹🇬 Togo — mensuel 85 000 + transport 10 000, avance de 5 000

| Étape | Calcul | Résultat |
|---|---|---|
| Brut total | 85 000 + 10 000 | **95 000** |
| CNSS salarié | 4 % × 85 000 | 3 400 |
| Base imposable | (85 000 − 3 400) × 80 % | 65 280 |
| Impôt | 10 % sur 5 280 (fraction au-dessus de 60 000) | 528 |
| **Net à payer** | 95 000 − 3 400 − 528 − 5 000 | **86 072** |
| **Coût employeur** | 95 000 + 17,5 % × 85 000 | **109 875** |

> **Lecture commerciale à retenir** : pour un salaire de 200 000 FCFA au Cameroun, le patron dépense
> **252 400 FCFA** et le salarié reçoit **193 541 FCFA**. Connaître ces deux chiffres est ce qui vous fera
> passer pour un professionnel devant un patron — et c'est exactement ce que le module lui calcule.

---

## 6. Mettre à jour les taux (une fois par an)

1. Ouvrez `lib/config.ts` → `PAIE_PARAMS`.
2. Modifiez la ligne du pays concerné (`tauxSalarie`, `plafondSalarie`, `tauxPatronal`, `abattementImpot`,
   `tranches`, `taxeCommunale`, `smig`).
3. Vérifiez que les calculs restent cohérents :
   ```bash
   npm run dev          # dans un terminal
   npm run test:paie    # dans un autre
   ```
   Si vous changez un taux, le test signalera un écart **normal** : remplacez alors les valeurs attendues
   dans `app/api/v1/paie/verifier/route.ts` par vos nouveaux calculs validés par le comptable.
4. Les bulletins déjà émis ne changent pas : un nouveau calcul écrase seulement les bulletins du mois
   relancé.

## 7. Utilisation au quotidien

| Quand | Quoi faire |
|---|---|
| À l'embauche | `/employes` → **Ajouter un employé** : saisir salaire, transport, primes (le net et le coût réel s'affichent avant validation) |
| Chaque soir (journaliers) | `/paie` → **Pointage des journaliers** → bouton **+1 / −1** puis *Enregistrer* |
| Fin de mois | `/paie` → choisir le mois → **Calculer la paie du mois** |
| Avant de payer | `/paie` → **Préparer la déclaration CNPS/CNSS** : part salariale + part patronale à verser |
| Paiement des salaires | `/paiements` (Mobile Money groupé) ou espèces, puis remise du bulletin imprimé à chaque salarié |
| Négociation d'un salaire | `/paie` → **Simulateur brut → net** |

## 8. Obligations et bonnes pratiques

- **Conservez les bulletins** (imprimés ou PDF) : l'inspection du travail et l'organisme social peuvent les
  demander, parfois sur plusieurs années.
- **Versez les cotisations dans les délais** : les majorations de retard sont souvent plus coûteuses que
  l'impôt lui-même (le module vous donne le montant exact à verser, le calendrier fiscal est dans le module
  Conformité+).
- **Déclarez le SMIG** : payer sous le SMIG est un risque de redressement (le module vous alerte
  automatiquement).
- **Mettez à jour une fois par an** : les lois de finances et les plafonds sociaux changent presque chaque
  année dans les quatre pays.
- **Considérez les charges patronales dans vos prix** : un salarié à 200 000 FCFA au Cameroun coûte 252 400
  FCFA. Le module affiche ce montant partout pour éviter les mauvaises surprises de trésorerie.
