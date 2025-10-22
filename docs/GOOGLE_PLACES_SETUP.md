# Configuration Google Places API

Pour activer l'autocomplétion d'adresses dans l'application, vous devez configurer Google Places API.

## Étapes de configuration

### 1. Créer un projet Google Cloud

1. Accédez à [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez l'ID du projet

### 2. Activer les APIs nécessaires

Dans votre projet Google Cloud, activez les APIs suivantes :

1. **Places API** : Pour l'autocomplétion d'adresses
2. **Geocoding API** : Pour convertir les adresses en coordonnées GPS

Pour activer une API :
- Allez dans "APIs & Services" > "Library"
- Recherchez l'API (ex: "Places API")
- Cliquez sur l'API puis sur "Enable"

### 3. Créer une clé API

1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "API key"
3. Votre clé API sera générée

### 4. Restreindre la clé API (recommandé pour la production)

Pour la sécurité, restreignez l'utilisation de votre clé :

#### Restrictions d'application
- **Pour iOS** : Restriction iOS apps
  - Ajoutez votre Bundle ID : `com.anonymous.alfieapp`

- **Pour Android** : Restriction Android apps
  - Ajoutez votre nom de package : `com.anonymous.alfieapp`
  - Ajoutez votre empreinte SHA-1

#### Restrictions d'API
Limitez la clé aux APIs suivantes :
- Places API
- Geocoding API

### 5. Configurer la clé dans l'application

Ouvrez le fichier `src/config/constants.ts` et remplacez :

```typescript
export const GOOGLE_PLACES_API_KEY = 'VOTRE_CLE_API_ICI';
```

## Tarification

Google Places API offre :
- **200 $ de crédit gratuit par mois**
- Autocomplétion : ~2,83 $ / 1000 requêtes (après crédit gratuit)
- Geocoding : ~5 $ / 1000 requêtes (après crédit gratuit)

Pour une utilisation normale d'une application mobile, le crédit gratuit devrait suffire.

## Surveillance de l'utilisation

1. Dans Google Cloud Console, allez dans "APIs & Services" > "Dashboard"
2. Vous pouvez voir l'utilisation de vos APIs
3. Configurez des alertes de facturation si nécessaire

## Dépannage

### L'autocomplétion ne fonctionne pas
- Vérifiez que la clé API est correctement configurée
- Vérifiez que les APIs sont bien activées
- Vérifiez les logs de la console pour les erreurs
- Assurez-vous que la facturation est activée sur votre projet Google Cloud

### Erreur "REQUEST_DENIED"
- La clé API n'a pas les bonnes permissions
- Les restrictions de la clé sont trop strictes
- La facturation n'est pas activée sur le projet

### Erreur "OVER_QUERY_LIMIT"
- Vous avez dépassé votre quota gratuit
- Vérifiez votre utilisation dans Google Cloud Console
