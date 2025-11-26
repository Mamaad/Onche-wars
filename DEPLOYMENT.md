
# Guide de Déploiement - Onche Wars (Ubuntu 24.04)

Ce guide détaille l'installation et la configuration du serveur pour transformer le client React actuel en une application Fullstack (Node.js + MariaDB).

**Serveur Cible :**
- IP: 51.77.211.21
- Port App: 1000
- OS: Ubuntu 24.04

---

## 1. Préparation du Serveur

Connectez-vous en SSH à votre serveur :
```bash
ssh root@51.77.211.21
```

### Mettre à jour le système
```bash
apt update && apt upgrade -y
```

### Installer les outils essentiels
```bash
apt install -y curl git unzip build-essential
```

---

## 2. Installation de l'environnement (Node.js & Base de Données)

### Installer Node.js (Version 20 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | -E bash -
apt install -y nodejs
# Vérification
node -v
npm -v
```

### Installer MariaDB (Serveur SQL)
```bash
apt install -y mariadb-server
systemctl start mariadb
systemctl enable mariadb
```

### Sécuriser et Configurer MariaDB
Lancez le script de sécurité (répondez Y à tout, définissez un mot de passe root).
```bash
mysql_secure_installation
```

Connectez-vous pour créer la base de données du jeu :
```bash
mysql -u root -p
```
Dans le prompt SQL :
```sql
CREATE DATABASE onchewars;
CREATE USER 'celestin'@'localhost' IDENTIFIED BY 'MOT_DE_PASSE_SOLIDE';
GRANT ALL PRIVILEGES ON onchewars.* TO 'celestin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 3. Architecture du Projet (Migration vers API Réelle)

Actuellement, le projet est un frontend React pur (navigateur). Pour le mettre en ligne avec une vraie base de données, il faut créer un **Backend API**.

### Structure recommandée :
```
/opt/onchewars/
├── client/      (Le code React actuel)
└── server/      (Le nouveau backend Node.js)
```

### Création du dossier
```bash
mkdir -p /opt/onchewars
cd /opt/onchewars
```

---

## 4. Création du Backend (API Express + TypeORM)

Puisque nous migrons `api.ts` (qui simulait le localStorage) vers un vrai serveur :

```bash
mkdir server
cd server
npm init -y
npm install express cors mysql2 typeorm reflect-metadata helmet dotenv class-validator
npm install --save-dev typescript @types/node @types/express @types/cors ts-node nodemon
```

### Configuration TypeScript (server/tsconfig.json)
Créez le fichier :
```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

### Création du serveur basique (server/src/index.ts)
```typescript
import "reflect-metadata";
import express from "express";
import cors from "cors";
import { DataSource } from "typeorm";

const app = express();
app.use(cors());
app.use(express.json());

// Configuration BDD
const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "celestin",
    password: "MOT_DE_PASSE_SOLIDE",
    database: "onchewars",
    synchronize: true, // Met à jour les tables auto (dev only)
    logging: false,
    entities: [], // À remplir avec les entités User, Planet...
});

AppDataSource.initialize().then(() => {
    console.log("Data Source initialized!");
    
    // API Routes
    app.get("/", (req, res) => res.send("Onche Wars API v1.0"));
    
    app.listen(1000, "0.0.0.0", () => {
        console.log("Server running on port 1000");
    });
}).catch((err) => console.error("Error during Data Source initialization", err));
```

### Lancement du serveur (Test)
```bash
# Ajoutez "start": "ts-node src/index.ts" dans package.json
npm start
```
*Le serveur doit afficher "Server running on port 1000".*

---

## 5. Déploiement du Client (Frontend)

Revenez à la racine `/opt/onchewars` et téléchargez votre code React actuel.

```bash
cd /opt/onchewars
# Clonez votre repo git ici ou uploadez les fichiers
# git clone https://github.com/votre-repo/onchewars-client.git client
```

Dans le dossier `client/` :
1. Modifiez `api.ts` pour qu'il fasse des `fetch('http://51.77.211.21:1000/...')` au lieu d'utiliser `localStorage`.
2. Buildez le projet :
```bash
npm install
npm run build
```

Cela va créer un dossier `dist/`.

### Servir le Frontend via le Backend
Pour simplifier (tout sur le port 1000), on va dire à Express de servir les fichiers statiques React.

Modifiez `server/src/index.ts` :
```typescript
// ... imports
import path from "path";

// ... après app.use(express.json());
app.use(express.static(path.join(__dirname, '../../client/dist')));

// ... avant app.listen
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```

---

## 6. Automatisation avec PM2 (Production)

PM2 permet de garder l'application active même après fermeture du terminal.

```bash
npm install -g pm2
cd /opt/onchewars/server
pm2 start src/index.ts --name "onchewars" --interpreter ./node_modules/.bin/ts-node
pm2 save
pm2 startup
```

---

## 7. Firewall (UFW)

Ouvrez le port 1000 pour que le monde puisse accéder au jeu.

```bash
ufw allow 1000/tcp
ufw allow 22/tcp
ufw enable
```

## Résumé pour l'accès
Le jeu sera accessible via : **http://51.77.211.21:1000**

---

## Pour la suite (Migration du code)

L'IA qui prendra le relais devra :
1. Créer les Entités TypeORM (User, Planet, Building, etc.) correspondant aux interfaces `types.ts`.
2. Migrer la logique de calcul (ressources, construction) du frontend vers le backend (Node.js) pour éviter la triche.
3. Mettre en place des CRON jobs sur le serveur pour calculer les points et les combats en temps réel.
