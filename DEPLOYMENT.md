
# Guide de Déploiement - Onche Wars (Ubuntu 24.04)

Ce guide permet d'installer le jeu en mode Production (Node.js + MariaDB).

**Serveur Cible :**
- IP: 51.77.211.21
- Port App: 1000
- OS: Ubuntu 24.04

---

## 1. Installation des Prérequis

Connectez-vous en root sur votre serveur.

```bash
# Mise à jour
apt update && apt upgrade -y

# Installation Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | -E bash -
apt install -y nodejs

# Installation MariaDB
apt install -y mariadb-server
systemctl start mariadb
systemctl enable mariadb
```

---

## 2. Configuration Base de Données

Lancez la console SQL :
```bash
mysql -u root
```

Copiez-collez ces commandes (avec tes identifiants spécifiques) :
```sql
CREATE DATABASE IF NOT EXISTS onchewars_db;
CREATE USER IF NOT EXISTS 'onchewars_user'@'localhost' IDENTIFIED BY 'Onchewars94,';
GRANT ALL PRIVILEGES ON onchewars_db.* TO 'onchewars_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 3. Installation des Fichiers

Nous allons structurer le projet en deux dossiers : `client` (le React) et `server` (l'API Node).

1.  Créez le dossier racine :
    ```bash
    mkdir -p /var/www/onchewars
    cd /var/www/onchewars
    ```

2.  **COPIEZ LES FICHIERS GÉNÉRÉS PAR L'IA :**
    *   Mettez le contenu de `server/package.json` dans `/var/www/onchewars/server/package.json`
    *   Mettez le contenu de `server/tsconfig.json` dans `/var/www/onchewars/server/tsconfig.json`
    *   Mettez le contenu de `server/src/index.ts` dans `/var/www/onchewars/server/src/index.ts`
    *   Mettez le contenu de `server/src/data-source.ts` dans `/var/www/onchewars/server/src/data-source.ts`
    *   Mettez le contenu de `server/src/entity/User.ts` dans `/var/www/onchewars/server/src/entity/User.ts`
    *   **Frontend :** Buildez votre projet React localement (`npm run build`) et envoyez le dossier `dist` dans `/var/www/onchewars/client/dist`.

---

## 4. Démarrage du Serveur

Allez dans le dossier serveur et installez les dépendances :

```bash
cd /var/www/onchewars/server
npm install
```

Compilez et lancez avec PM2 (Gestionnaire de processus) :

```bash
# Installation de PM2
npm install -g pm2 typescript ts-node

# Démarrage
pm2 start src/index.ts --name "onchewars" --interpreter ./node_modules/.bin/ts-node

# Sauvegarde pour redémarrage auto
pm2 save
pm2 startup
```

## 5. Firewall

Ouvrez le port 1000 :
```bash
ufw allow 1000/tcp
```

Le jeu est accessible sur : **http://51.77.211.21:1000**
