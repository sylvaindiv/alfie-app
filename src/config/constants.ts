/**
 * Configuration constants for the app
 *
 * IMPORTANT: Pour utiliser l'autocomplétion d'adresses, vous devez :
 * 1. Créer une clé API Google Places dans Google Cloud Console
 * 2. Activer les APIs suivantes :
 *    - Places API
 *    - Geocoding API
 * 3. Ajouter votre clé API dans le fichier .env
 *    EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=votre_clé_api
 */

export const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
