
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
*   **Commerce :** Place du marché (P2P) et Marché Noir (NPC).
*   **Interface :** UI "Cyberpunk/Space", responsive, scanlines, effets sonores visuels.

## 3. Modifications Récentes (À conserver)
1.  **Énergie :** Seules les Mines (Risitium, Stickers, Sel) consomment de l'énergie. Les autres bâtiments sont passifs. Satellites Solaires fonctionnels.
2.  **Stockage :** Plafond de ressources implémenté.
3.  **Vitesse :** Temps de construction ajustés (Installations plus rapides au début).
4.  **Commerce :** Système d'offres P2P ajouté dans `api.ts` (simulé).

## 4. Objectifs pour la Prochaine IA (Backend Migration)
Le code actuel est 100% côté client. La priorité absolue est la migration backend.

### A. Stack Backend requise
*   **Node.js / Express** (ou NestJS).
*   **MariaDB** (SQL).
*   **ORM :** TypeORM ou Prisma.
*   **Socket.io :** Pour le temps réel (Chat, Notifications d'attaque).

### B. Tâches Prioritaires
1.  **Modélisation BDD :**
    *   Créer les tables `users`, `planets`, `buildings`, `fleets`, `reports`, `trade_offers`.
2.  **Migration API :**
    *   Remplacer les appels `localStorage` dans `api.ts` par des `fetch()` vers le backend.
3.  **Logique Serveur (Anti-Cheat) :**
    *   Validation stricte des ressources et des temps de construction.
4.  **Implémentation WebSockets :**
    *   Le client React doit se connecter via `socket.io-client`.
    *   Le serveur doit push les événements : "Attaque Entrante", "Message Reçu", "Mise à jour Marché".
    *   *Note:* Impossible à faire en client-only actuel.

### C. Déploiement
*   Suivre le fichier `DEPLOYMENT.md` présent à la racine pour l'installation sur le serveur Ubuntu (IP: 51.77.211.21, Port: 1000).

## 5. Règles de Code
*   Garder le style **Tailwind** et l'ambiance "Dark Space".
*   Utiliser **Lucide-React** pour les icônes.
*   Ne jamais afficher de décimales pour les ressources (utiliser `formatNumber` avec séparateur espace).
*   **Strict TypeScript**.
