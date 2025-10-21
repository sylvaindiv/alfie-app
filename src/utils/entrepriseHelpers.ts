import { supabase } from '../config/supabase';
import { Entreprise } from '../types/database.types';

/**
 * Récupère l'URL du logo d'une entreprise selon la priorité suivante :
 * 1. logo_upload (logo uploadé dans le bucket Supabase)
 * 2. logo_url (URL externe)
 * 3. Première photo de la galerie
 * 4. null si aucune source disponible
 */
export async function getEntrepriseLogoUrl(
  entreprise: Entreprise
): Promise<string | null> {
  // Priorité 1 : Logo uploadé
  if (entreprise.logo_upload) {
    const { data } = supabase.storage
      .from('galerie')
      .getPublicUrl(entreprise.logo_upload);
    return data.publicUrl;
  }

  // Priorité 2 : URL externe
  if (entreprise.logo_url) {
    return entreprise.logo_url;
  }

  // Priorité 3 : Première photo de la galerie
  try {
    const { data: photos, error } = await supabase
      .from('photo_entreprises')
      .select('url_photo, storage_path')
      .eq('entreprise_id', entreprise.id)
      .order('ordre_affichage', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Erreur lors de la récupération de la photo:', error);
      return null;
    }

    if (photos && photos.length > 0) {
      const photo = photos[0];
      // Si la photo est stockée dans Supabase Storage
      if (photo.storage_path) {
        const { data } = supabase.storage
          .from('galerie')
          .getPublicUrl(photo.storage_path);
        return data.publicUrl;
      }
      // Sinon utiliser l'URL externe
      return photo.url_photo;
    }
  } catch (error) {
    console.error(
      'Erreur lors de la récupération de la première photo:',
      error
    );
  }

  return null;
}

/**
 * Récupère l'URL du logo de manière synchrone (sans fallback sur la galerie)
 * Utilisé pour l'affichage immédiat dans les composants
 */
export function getEntrepriseLogoUrlSync(entreprise: Entreprise): string | null {
  // Priorité 1 : Logo uploadé
  if (entreprise.logo_upload) {
    const { data } = supabase.storage
      .from('galerie')
      .getPublicUrl(entreprise.logo_upload);
    return data.publicUrl;
  }

  // Priorité 2 : URL externe
  if (entreprise.logo_url) {
    return entreprise.logo_url;
  }

  return null;
}
