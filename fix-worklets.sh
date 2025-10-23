#!/bin/bash

echo "🧹 Nettoyage complet des dépendances et caches..."

# 1. Supprimer node_modules
echo "📦 Suppression de node_modules..."
rm -rf node_modules

# 2. Supprimer package-lock.json
echo "🔒 Suppression de package-lock.json..."
rm -f package-lock.json

# 3. Nettoyer le cache npm
echo "🗑️  Nettoyage du cache npm..."
npm cache clean --force

# 4. Nettoyer les caches Expo
echo "📱 Nettoyage des caches Expo..."
rm -rf .expo
npx expo start --clear

# 5. Nettoyer les pods iOS
if [ -d "ios" ]; then
  echo "🍎 Nettoyage des pods iOS..."
  cd ios
  rm -rf Pods
  rm -f Podfile.lock
  pod cache clean --all 2>/dev/null || true
  cd ..
fi

# 6. Nettoyer le cache Android
if [ -d "android" ]; then
  echo "🤖 Nettoyage du cache Android..."
  cd android
  ./gradlew clean 2>/dev/null || true
  rm -rf .gradle
  rm -rf build
  cd app
  rm -rf build
  cd ../..
fi

# 7. Réinstaller les dépendances
echo "📥 Réinstallation des dépendances..."
npm install

# 8. Réinstaller les pods iOS
if [ -d "ios" ]; then
  echo "🍎 Réinstallation des pods iOS..."
  cd ios
  pod install
  cd ..
fi

echo "✅ Nettoyage et réinstallation terminés!"
echo ""
echo "Prochaines étapes:"
echo "1. Lancez: npx expo run:ios"
echo "   ou: npx expo run:android"
echo ""
echo "⚠️  N'utilisez PAS 'npm start' ou 'expo start' - vous devez reconstruire l'app native!"
