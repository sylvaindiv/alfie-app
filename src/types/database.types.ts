// Types correspondant à notre structure Supabase

export interface User {
  id: string;
  telephone: string;
  nom: string;
  prenom: string;
  email: string | null;
  photo_profil_url: string | null;
  code_postal: string;
  adresse_complete: string | null;
  role: 'ambassadeur' | 'gerant_asso' | 'gerant_entreprise' | 'admin';
  statut_onboarding: 'incomplet' | 'complet';
  created_at: string;
}

export interface Association {
  id: string;
  nom: string;
  logo_url: string | null;
  description: string | null;
  adresse: string;
  email: string;
  telephone: string;
  cagnotte_actuelle: number;
  montant_minimum_retrait: number;
  total_commissions_gagnees: number;
  total_paiements_recus: number;
  statut: 'active' | 'inactive';
  created_at: string;
}

export interface CategorieEntreprise {
  id: string;
  nom: string;
  icone_url: string | null;
  ordre_affichage: number;
  statut: 'active' | 'inactive';
  created_at: string;
}

export interface SousCategorieEntreprise {
  id: string;
  nom: string;
  categorie_id: string;
  icone_url: string | null;
  ordre_affichage: number;
  statut: 'active' | 'inactive';
  created_at: string;
}

export interface Entreprise {
  id: string;
  nom_commercial: string;
  logo_url: string | null;
  description: string | null;
  categorie_id: string;
  sous_categorie_id: string;
  adresse: string;
  code_postal: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  horaires: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  type_commission: 'montant_fixe' | 'pourcentage';
  valeur_commission: number;
  type_recommandation_autorise: 'photo' | 'formulaire' | 'les_deux';
  statut_abonnement: 'actif' | 'inactif' | 'suspendu';
  montant_abonnement_mensuel: number | null;
  nb_leads_recus: number;
  nb_leads_valides: number;
  nb_leads_refuses: number;
  total_commissions_versees: number;
  created_at: string;
}