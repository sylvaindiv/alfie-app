#!/bin/bash

# Configuration de l'encodage pour éviter les problèmes avec CocoaPods
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "🚀 Démarrage de l'application Alfie sur iOS..."

# Lancer Expo avec l'option pour iOS
# --no-install pour ne pas réinstaller les dépendances
LANG=en_US.UTF-8 npx expo run:ios

# Note: Cette commande:
# 1. Démarre le serveur Metro automatiquement
# 2. Ouvre le simulateur iOS
# 3. Build et installe l'app
# 4. Lance l'app dans le simulateur
