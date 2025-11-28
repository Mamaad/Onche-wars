
# GUIDE DU FONDATEUR & COMPRÉHENSION (ONCHE WARS)

Ce document est votre tableau de bord technique. Il liste où trouver et comment modifier les paramètres critiques du jeu.

---

## 1. Vitesse du Jeu & Production

Pour accélérer ou ralentir l'univers entier.

*   **Fichier :** `utils.ts`
*   **Fonction :** `getProduction`
*   **Ligne à modifier :** Cherchez `return Math.floor(raw * 0.09 * ratio);` à la fin de la fonction.
    *   `0.09` = Vitesse actuelle.
    *   `0.18` = Jeu 2x plus rapide.
    *   `0.01` = Jeu très lent.

## 2. Équilibrage des Bâtiments (Coût & Temps)

Pour modifier le prix, la courbe de progression ou le temps de construction de base.

*   **Fichier :** `constants.ts`
*   **Variable :** `BUILDING_DB`
*   **Propriétés clés :**
    *   `baseCost`: Coût niveau 1.
    *   `costFactor`: Multiplicateur de coût par niveau (ex: 1.5 = +50% par niveau).
    *   `baseTime`: Temps en secondes pour le niveau 1 (ex: 10 pour être rapide au début).
    *   `timeFactor`: Multiplicateur de temps par niveau (ex: 1.6 = Le temps augmente de 60% par niveau).

## 3. Capacité de Stockage

Pour changer la formule des hangars.

*   **Fichier :** `utils.ts`
*   **Fonction :** `getStorageCapacity`
*   **Formule actuelle :** `100000 * Math.pow(3, level - 1)`
    *   `100000` = Stockage niveau 1.
    *   `3` = Multiplicateur par niveau (Triple).

## 4. Flotte & Défense (Stats de Combat)

Pour nerfer ou buffer des vaisseaux.

*   **Fichier :** `constants.ts`
*   **Variable :** `SHIP_DB` et `DEFENSE_DB`
*   **Stats :**
    *   `attack`: Dégâts par tir.
    *   `defense`: Bouclier (se régénère à chaque tour).
    *   `hull`: Points de structure (PV).
    *   `rapidFire`: Liste des cibles sur lesquelles le vaisseau tire encore s'il touche.

## 5. Système de Combat

Si vous voulez changer les règles (nombre de tours, débris...).

*   **Fichier :** `utils.ts`
*   **Fonction :** `calculateCombat`
*   **Variables :**
    *   `rounds = 6` : Durée max du combat.
    *   `debris = ... * 0.3` : 30% des vaisseaux détruits vont dans le champ de débris.

## 6. Système RPG (Futur & Actuel)

Actuellement, le côté RPG est géré par :
1.  **Officiers (`OFFICER_DB` dans `constants.ts`)** : Bonus passifs achetables.
2.  **Quêtes (`QUEST_DB` dans `constants.ts`)** : Missions guidées.

**Pour implémenter un vrai niveau de Commandant :**
*   Il faut modifier l'interface `User` dans `types.ts` pour ajouter `commanderLevel` et `skillPoints`.
*   Créer une fonction `checkLevelUp` dans `api.ts` appelée après chaque gain de points.
*   Créer une nouvelle vue `CommanderView.tsx` pour dépenser les points.

## 7. Administration & Triche

Pour vous donner des ressources ou tester.

*   **Accès Admin :** Dans `api.ts`, la fonction `createInitialUser` définit `isAdmin` à true si le pseudo est "admin".
*   **Commandes :** Allez dans l'onglet "Administration" (visible seulement si admin) pour vous ajouter des ressources.

---

**NOTE IMPORTANTE SUR LE DÉPLOIEMENT :**
Si vous modifiez ces fichiers, n'oubliez pas de re-builder le projet (`npm run build`) et de redémarrer le serveur Node (`pm2 restart onchewars`) si vous êtes en production.
