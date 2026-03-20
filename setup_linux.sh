#!/bin/bash

# ==========================================================
# SFR3-Darwin-Notebook : Script d'Installation (Linux)
# =0=========================================================

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}>>> Début de l'installation du projet SFR3-Darwin-Notebook <<<${NC}"

# 1. Vérification / Installation de l'environnement système
echo -e "\n${YELLOW}[Step 1/5] Vérification de l'environnement système...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installation de Node.js via NodeSource...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js est déjà présent ($(node -v))${NC}"
fi

# Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Installation de Python3...${NC}"
    sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv
else
    echo -e "${GREEN}Python3 est déjà présent ($(python3 --version))${NC}"
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installation de PM2 via npm...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}PM2 est déjà présent ($(pm2 -v))${NC}"
fi

# 2. Installation des dépendances Backend
echo -e "\n${YELLOW}[Step 2/5] Installation des dépendances BackEnd...${NC}"
if [ -d "BackEnd" ]; then
    cd BackEnd
    npm install
    cd ..
    echo -e "${GREEN}BackEnd prêt !${NC}"
else
    echo -e "${RED}Erreur : Répertoire 'BackEnd' manquant.${NC}"
fi

# 3. Installation des dépendances FrontEnd
echo -e "\n${YELLOW}[Step 3/5] Installation des dépendances FrontEnd...${NC}"
if [ -d "FrontEnd" ]; then
    cd FrontEnd
    npm install
    cd ..
    echo -e "${GREEN}FrontEnd prêt !${NC}"
else
    echo -e "${RED}Erreur : Répertoire 'FrontEnd' manquant.${NC}"
fi

# 4. Installation des dépendances Python API
echo -e "\n${YELLOW}[Step 4/5] Installation des dépendances PythonApi...${NC}"
if [ -d "PythonApi" ]; then
    cd PythonApi
    # On crée/active l'environnement virtuel pour éviter les conflits systèmes
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install --upgrade pip
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    fi
    deactivate
    cd ..
    echo -e "${GREEN}PythonApi prêt ! (avec venv)${NC}"
else
    echo -e "${RED}Erreur : Répertoire 'PythonApi' manquant.${NC}"
fi

# 5. Lancement des services avec PM2
echo -e "\n${YELLOW}[Step 5/5] Lancement des services via ecosystem.config.js...${NC}"
if [ -f "ecosystem.config.js" ]; then
    # On vérifie si pm2 tourne déjà, sinon on le "reset" pour éviter les doublons
    pm2 delete all 2>/dev/null
    
    # On lance l'orchestration PM2
    pm2 start ecosystem.config.js
    
    # Optionnel : On sauvegarde pour redémarrer automatiquement après un reboot
    pm2 save
    
    echo -e "\n${GREEN}==============================================${NC}"
    echo -e "${GREEN}L'installation est terminée avec succès !${NC}"
    echo -e "${GREEN}Utilisez 'pm2 list' pour voir l'état des services.${NC}"
    echo -e "${GREEN}==============================================${NC}"
    pm2 list
else
    echo -e "${RED}Fichier 'ecosystem.config.js' manquant. Lancement impossible.${NC}"
fi
