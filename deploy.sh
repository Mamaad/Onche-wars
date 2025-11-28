#!/bin/bash

# --- CONFIGURATION ---
REPO_URL="https://github.com/Mamaad/Onche-wars"
APP_DIR="/var/www/onchewars"
DB_NAME="onchewars_db"
DB_USER="onchewars_user"
DB_PASS="Onchewars94,"

# --- COULEURS ---
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== DÉBUT DU DÉPLOIEMENT ONCHE WARS ===${NC}"

# 1. INSTALLATION DES DÉPENDANCES SYSTÈME
echo -e "${GREEN}[1/7] Mise à jour et installation des paquets...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update
# Installation de Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx mariadb-server git ufw

# Installation globale de PM2 (gestionnaire de processus Node)
npm install -g pm2 typescript ts-node

# 2. CONFIGURATION DE LA BASE DE DONNÉES
echo -e "${GREEN}[2/7] Configuration de MariaDB...${NC}"
systemctl start mariadb
systemctl enable mariadb

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# 3. CLONE DU PROJET
echo -e "${GREEN}[3/7] Récupération du code source...${NC}"
# Si le dossier existe déjà, on le supprime pour repartir propre (ou on pourrait faire un git pull)
rm -rf $APP_DIR
mkdir -p $APP_DIR
git clone $REPO_URL $APP_DIR/temp_clone

# Réorganisation des dossiers pour correspondre à la structure serveur attendue
# On s'attend à ce que ton repo contienne 'server' et tout le code React à la racine ou dans 'client'
# Si ton repo GitHub a le code React à la racine, on le déplace dans 'client'
mkdir -p $APP_DIR/client
mkdir -p $APP_DIR/server

# Déplacement intelligent (ajuste selon la structure réelle de ton git)
cp -r $APP_DIR/temp_clone/* $APP_DIR/client/
# Si tu as commité le dossier server séparément, on le déplace. 
# SINON, si le dossier server n'existe pas dans le git, le script plantera ici.
# J'assume que tu as pushé le dossier 'server' que j'ai généré dans le XML précédent.
if [ -d "$APP_DIR/temp_clone/server" ]; then
    cp -r $APP_DIR/temp_clone/server/* $APP_DIR/server/
    # Nettoyage du dossier server dans client pour éviter les doublons
    rm -rf $APP_DIR/client/server
fi

rm -rf $APP_DIR/temp_clone

# 4. BUILD FRONTEND (REACT)
echo -e "${GREEN}[4/7] Installation et Build du Client React...${NC}"
cd $APP_DIR/client
npm install
# Correction potentielle pour Vite en prod (mémoire)
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# 5. INSTALLATION BACKEND (NODE)
echo -e "${GREEN}[5/7] Installation du Serveur Node...${NC}"
cd $APP_DIR/server
npm install
# Compilation TypeScript
npx tsc

# 6. CONFIGURATION NGINX (PORT 1000)
echo -e "${GREEN}[6/7] Configuration Nginx sur le port 1000...${NC}"

cat > /etc/nginx/sites-available/onchewars <<EOF
server {
    listen 1000;
    server_name _;

    # Racine du frontend buildé
    root $APP_DIR/client/dist;
    index index.html;

    # Gestion des fichiers statiques React
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy vers l'API Node.js (qui tourne en interne sur 3000)
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Activation du site
ln -sf /etc/nginx/sites-available/onchewars /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Vérification et redémarrage Nginx
nginx -t && systemctl restart nginx

# 7. DÉMARRAGE PM2
echo -e "${GREEN}[7/7] Lancement du processus Node avec PM2...${NC}"
cd $APP_DIR/server
# On supprime l'ancien processus s'il existe
pm2 delete onchewars 2>/dev/null || true
# On lance le serveur (qui écoute sur 3000)
pm2 start dist/index.js --name "onchewars"
pm2 save
pm2 startup | bash

echo -e "${GREEN}=== DÉPLOIEMENT TERMINÉ ! ===${NC}"
echo -e "Le jeu est accessible sur : http://51.77.211.21:1000"