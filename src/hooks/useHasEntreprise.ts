import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface UseHasEntrepriseResult {
  hasEntreprise: boolean;
  entrepriseId: string | null;
  loading: boolean;
}

/**
 * Hook pour vérifier si l'utilisateur connecté a une entreprise assignée
 * Vérifie dans la table entreprises_gerants
 */
export const useHasEntreprise = (): UseHasEntrepriseResult => {
  const [hasEntreprise, setHasEntreprise] = useState(false);
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEntreprise = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // En mode DEV, utiliser l'ID hardcodé si pas d'utilisateur authentifié
        const userId = user?.id || 'c37e64bb-9b07-4e73-9950-2e71518c94bf';

        // Vérifier si l'utilisateur est gérant d'une entreprise
        const { data, error } = await supabase
          .from('entreprises_gerants')
          .select('entreprise_id')
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          console.log('Aucune entreprise trouvée pour l\'utilisateur:', userId);
          setHasEntreprise(false);
          setEntrepriseId(null);
        } else {
          console.log('Entreprise trouvée:', data.entreprise_id);
          setHasEntreprise(true);
          setEntrepriseId(data.entreprise_id);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'entreprise:', err);
        setHasEntreprise(false);
        setEntrepriseId(null);
      } finally {
        setLoading(false);
      }
    };

    checkEntreprise();
  }, []);

  return { hasEntreprise, entrepriseId, loading };
};
