# Configuration Firebase pour Alfie

## Étape 1 : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Nommez votre projet (ex: "alfie-prod")
4. Suivez les étapes de création

## Étape 2 : Activer l'authentification par téléphone

1. Dans la console Firebase, allez dans **Authentication** (menu de gauche)
2. Cliquez sur l'onglet **Sign-in method**
3. Activez le fournisseur **Phone**
4. Sauvegardez

## Étape 3 : Ajouter votre application iOS/Android

### Pour iOS :

1. Dans Project Settings, cliquez sur "Add app" → iOS
2. Entrez votre **iOS Bundle ID** (trouvé dans `app.json` : `expo.ios.bundleIdentifier`)
3. Téléchargez le fichier `GoogleService-Info.plist`
4. Placez-le à la racine du projet

### Pour Android :

1. Dans Project Settings, cliquez sur "Add app" → Android
2. Entrez votre **Android Package Name** (trouvé dans `app.json` : `expo.android.package`)
3. Téléchargez le fichier `google-services.json`
4. Placez-le à la racine du projet

## Étape 4 : Récupérer les clés Firebase

1. Dans Firebase Console, allez dans **Project Settings** (icône engrenage)
2. Descendez jusqu'à la section "Your apps"
3. Sélectionnez votre app web (ou créez-en une si nécessaire)
4. Copiez les valeurs de configuration Firebase :

```javascript
{
  apiKey: "AIza...",
  authDomain: "alfie-prod.firebaseapp.com",
  projectId: "alfie-prod",
  storageBucket: "alfie-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

## Étape 5 : Mettre à jour la configuration

Modifiez le fichier `src/config/firebase.ts` avec vos vraies clés :

```typescript
const firebaseConfig = {
  apiKey: 'VOTRE_API_KEY',
  authDomain: 'VOTRE_PROJECT_ID.firebaseapp.com',
  projectId: 'VOTRE_PROJECT_ID',
  storageBucket: 'VOTRE_PROJECT_ID.appspot.com',
  messagingSenderId: 'VOTRE_MESSAGING_SENDER_ID',
  appId: 'VOTRE_APP_ID',
};
```

## Étape 6 : Configurer le plan de facturation (Important !)

**Pour envoyer de vrais SMS OTP, vous devez configurer le plan Blaze (pay-as-you-go) :**

1. Dans Firebase Console, allez dans **⚙️ Project Settings** → **Usage and billing**
2. Cliquez sur **Modify plan**
3. Sélectionnez le plan **Blaze** (vous ne paierez que ce que vous consommez)

### Plan gratuit Firebase Auth :

- **10 000 vérifications gratuites par mois**
- Au-delà : **0,06$ pour 1000 vérifications** (très abordable)

## Étape 7 : Tester en mode développement

Firebase Auth permet de créer des **numéros de test** sans envoyer de vrais SMS :

1. Dans Firebase Console → **Authentication** → **Sign-in method**
2. Descendez jusqu'à la section **Phone numbers for testing**
3. Ajoutez des numéros de test, par exemple :
   - Numéro : `+33612345678`
   - Code : `123456`
4. Utilisez ces numéros dans l'app pour tester sans consommer de SMS

## Étape 8 : Configurer les identifiants pour iOS/Android

### iOS - Configuration APNs (Apple Push Notification service)

Firebase nécessite APNs pour l'authentification par téléphone sur iOS :

1. Connectez-vous à [Apple Developer](https://developer.apple.com/account/)
2. Créez une **APNs Authentication Key** :
   - Certificates, Identifiers & Profiles → Keys → "+"
   - Cochez "Apple Push Notifications service (APNs)"
   - Téléchargez le fichier `.p8`
3. Dans Firebase Console → **Project Settings** → **Cloud Messaging** :
   - Onglet **iOS app configuration**
   - Uploadez la clé APNs (fichier `.p8`)
   - Entrez le **Key ID** et **Team ID**

### Android - Configuration SHA

Firebase nécessite l'empreinte SHA pour Android :

1. Générez l'empreinte SHA-1 :
   ```bash
   # Pour le debug keystore (développement)
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
2. Copiez la valeur **SHA-1**
3. Dans Firebase Console → **Project Settings** → votre app Android
4. Ajoutez l'empreinte SHA-1

## Étape 9 : Rebuild de l'application

Après avoir ajouté les fichiers de configuration, rebuilder l'app :

```bash
# iOS
npx expo prebuild --clean
npx expo run:ios

# Android
npx expo prebuild --clean
npx expo run:android
```

## Troubleshooting

### Erreur "SMS not sent"

- Vérifiez que le plan Blaze est activé
- Vérifiez que l'authentification par téléphone est activée dans Firebase Console
- Pour iOS : vérifiez la configuration APNs
- Pour Android : vérifiez l'empreinte SHA

### Erreur "Invalid phone number"

- Le numéro doit être au format international : `+33612345678`
- Pas d'espaces, pas de tirets
- Le code pays est obligatoire

### Code OTP non reçu

- Utilisez les numéros de test en développement
- Vérifiez les quotas Firebase (10K gratuits/mois)
- Vérifiez les logs Firebase Console → Authentication → Usage

## Ressources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Phone Authentication for React Native](https://rnfirebase.io/auth/phone-auth)
- [Firebase Pricing](https://firebase.google.com/pricing)
