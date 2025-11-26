
# PROMPT_IA - Contexte et Passation du Projet "Onche Wars"

## 1. Résumé du Projet
**Nom :** Onche Wars
**Type :** Jeu de stratégie spatiale massivement multijoueur (MMORTS) par navigateur.
**Inspiration :** OGame, avec un thème humoristique "Internet Culture / JVC".
**Stack Actuelle :** React 18 (Vite), TypeScript, Tailwind CSS.
**État des Données :** Simulation Client-Side via `localStorage` (Fichier `api.ts`).

## 2. Fonctionnalités Actuelles (Fonctionnelles)
*   **Ressources :** Risitium, Stickers, Sel (Deutérium), Karma (Énergie), Redpills (Premium).
*   **Temps Réel :** Boucle de jeu (Tick 1s) calculant la production et les files de construction.
*   **Bâtiments :** Mines (consomment énergie), Stockage (Hangars avec plafond), Installations (Usine, Labo, Chantier).
*   **Recherche :** Arbre technologique complet avec prérequis.
*   **Flotte & Chantier :** Construction de vaisseaux et défenses. Temps de construction réduit par l'Usine de Golems.
*   **Galaxie :** Vue système solaire (générée procéduralement), espionnage, attaque, missile.
*   **Combats :** Moteur de combat simulé (6 tours, bouclier, coque, rapid fire).
*   **Interface :** UI "Cyberpunk/Space", responsive, scanlines, effets sonores visuels.

## 3. Modifications Récentes (À conserver)
1.  **Énergie :** Seules les Mines (Risitium, Stickers, Sel) consomment de l'énergie. Les autres bâtiments sont passifs.
2.  **Stockage :** 
    *   Plafond de ressources implémenté (Bloque la prod si atteint).
    *   Bâtiments Hangar ajoutés (`hangar_risitasium`, etc.).
    *   Formule capacité : `50000 * 1.6^(lvl-1)`.
3.  **Vitesse :**
    *   Temps de construction augmenté drastiquement (Diviseur 500 au lieu de 2500).
    *   Formule : `(Coût / 500) * (1 / (NiveauUsineGolems + 1))`.

## 4. Objectifs pour la Prochaine IA (Backend Migration)
Le code actuel est 100% côté client (vulnérable à la triche, pas de vrai multijoueur). Ta mission est de migrer la logique vers un vrai backend.

### A. Stack Backend requise
*   **Node.js / Express** (ou NestJS).
*   **MariaDB** (SQL).
*   **ORM :** TypeORM ou Prisma.

### B. Tâches Prioritaires
1.  **Modélisation BDD :**
    *   Créer les tables `users`, `planets`, `buildings`, `fleets`, `reports`.
    *   Les données statiques (`constants.ts`) doivent rester dans le code ou aller en BDD config.
2.  **Migration API :**
    *   Remplacer les appels `localStorage` dans `api.ts` par des `fetch()` vers le backend.
    *   Créer les endpoints d'authentification (JWT).
3.  **Logique Serveur (Anti-Cheat) :**
    *   Le calcul des ressources (`App.tsx -> useEffect`) doit être validé par le serveur lors d'une action.
    *   Le serveur doit calculer les deltas de temps (`lastUpdate` vs `now`) pour créditer les ressources.
    *   Les combats doivent être résolus côté serveur.

### C. Déploiement
*   Suivre le fichier `DEPLOYMENT.md` présent à la racine pour l'installation sur le serveur Ubuntu (IP: 51.77.211.21, Port: 1000).

## 5. Règles de Code
*   Garder le style **Tailwind** et l'ambiance "Dark Space".
*   Utiliser **Lucide-React** pour les icônes.
*   Ne jamais afficher de décimales pour les ressources (utiliser `formatNumber` avec séparateur espace).
*   **Strict TypeScript**.
