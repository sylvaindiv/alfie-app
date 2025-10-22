# Fonctionnalité de Localisation

## Vue d'ensemble

Le composant `LocationButton` permet aux utilisateurs de définir leur position de deux manières :
1. **"Autour de moi"** : Utilise la géolocalisation GPS de l'appareil
2. **Saisie manuelle d'adresse** : L'utilisateur entre une adresse qui est ensuite géocodée

## Technologies utilisées

### Expo Location
- **Géolocalisation** : Récupère la position GPS actuelle de l'utilisateur
- **Géocodage** : Convertit une adresse textuelle en coordonnées GPS (latitude/longitude)
- **Avantages** :
  - ✅ Gratuit
  - ✅ Aucune configuration API nécessaire
  - ✅ Fonctionne hors ligne pour la géolocalisation
  - ✅ Simple à utiliser

### Permissions

Les permissions sont configurées dans `app.json` :

**iOS** :
```json
"infoPlist": {
  "NSLocationWhenInUseUsageDescription": "Nous avons besoin de votre position..."
}
```

**Android** :
```json
"permissions": [
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION"
]
```

## Utilisation

### Dans HomeScreen

```typescript
import LocationButton, { LocationData } from '../components/LocationButton';

const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

<LocationButton onLocationSelected={setSelectedLocation} />
```

### Structure de LocationData

```typescript
interface LocationData {
  type: 'current' | 'address';
  latitude?: number;
  longitude?: number;
  address?: string;
}
```

## Fonctionnalités futures possibles

### Autocomplétion Google Places (nécessite un backend)

Pour implémenter l'autocomplétion en temps réel avec Google Places :

1. **Créer une API backend** (Node.js, Python, etc.)
2. **Endpoints nécessaires** :
   - `POST /api/places/autocomplete` : Recherche d'adresses
   - `POST /api/places/details` : Détails d'une place

3. **Avantages d'un backend** :
   - ✅ Sécurité de la clé API
   - ✅ Contrôle des coûts
   - ✅ Cache des résultats
   - ✅ Évite les problèmes CORS

4. **Coûts Google Places API** :
   - 200 $ de crédit gratuit/mois
   - Autocomplétion : ~2,83 $/1000 requêtes
   - Détails de place : ~17 $/1000 requêtes

## Améliorations possibles

1. **Historique des adresses** : Sauvegarder les adresses récentes dans AsyncStorage
2. **Adresses favorites** : Permettre de sauvegarder des adresses (Maison, Travail, etc.)
3. **Affichage sur carte** : Intégrer React Native Maps pour visualiser la position
4. **Rayon de recherche** : Permettre de définir un rayon autour de la position (5km, 10km, etc.)
5. **Filtrage des entreprises** : Utiliser la position pour trier les entreprises par distance

## Calcul de distance

Pour calculer la distance entre deux coordonnées GPS, vous pouvez utiliser la formule de Haversine :

```typescript
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance en km
}
```

## Troubleshooting

### La géolocalisation ne fonctionne pas
- Vérifier que les permissions sont accordées dans les paramètres de l'appareil
- Sur iOS : Réglages → Confidentialité → Service de localisation
- Sur Android : Paramètres → Applications → Autorisations

### Le géocodage d'adresse échoue
- Vérifier la connexion Internet
- S'assurer que l'adresse est assez précise (ville + rue)
- Expo Location utilise le service de géocodage natif de la plateforme

### Le clavier cache le champ de saisie
- Le composant utilise `KeyboardAvoidingView` pour ajuster automatiquement
- Si le problème persiste, vérifier que le `ScrollView` parent a bien `keyboardShouldPersistTaps="handled"`
