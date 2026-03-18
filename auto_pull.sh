#!/bin/bash

# Configuration
PROJECT_DIR="/home/darwinnotbook/SFR3-Darwin-Notebook"
BRANCH="develop"
LOG_FILE="$PROJECT_DIR/auto_pull.log"

echo "$(date): Lancement de l'auto-pull sur la branche $BRANCH..." >> "$LOG_FILE"

cd "$PROJECT_DIR" || exit

# On s'assure d'être sur la bonne branche
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "$(date): Passage de $CURRENT_BRANCH à $BRANCH..." >> "$LOG_FILE"
    git checkout "$BRANCH" >> "$LOG_FILE" 2>&1
fi

# Récupération des dernières modifications
git fetch origin "$BRANCH" >> "$LOG_FILE" 2>&1

# Vérification s'il y a des changements
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo "$(date): Nouvelles modifications détectées. Mise à jour en cours..." >> "$LOG_FILE"
    
    # On tire les changements
    git pull origin "$BRANCH" >> "$LOG_FILE" 2>&1
    
    # Optionnel : si vous avez du backend Node.js, on peut relancer les installs
    if [ -f "BackEnd/package.json" ]; then
        echo "$(date): Mise à jour des dépendances BackEnd..." >> "$LOG_FILE"
        cd BackEnd && npm install >> "$LOG_FILE" 2>&1
        cd ..
    fi
    
    # Optionnel : Redémarrage des services (ex: pm2 restart)
    # pm2 restart all >> "$LOG_FILE" 2>&1
    
    echo "$(date): Mise à jour terminée avec succès." >> "$LOG_FILE"
else
    echo "$(date): Pas de modifications détectées." >> "$LOG_FILE"
fi

echo "------------------------------------------" >> "$LOG_FILE"
