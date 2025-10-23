// Types correspondant à notre structure Supabase
// Généré à partir de l'export de schéma Supabase

export interface User {
  id: string;
  telephone: string;
  nom: string;
  prenom: string;
  email: string | null;
  photo_profil_url: string | null;
  code_postal: string;
  adresse_complete: string | null;
  ville: string | null;
  role: 'ambassadeur' | 'gerant_asso' | 'gerant_entreprise' | 'admin';
  statut_onboarding: 'incomplet' | 'complet';
  is_admin: boolean;
  created_at: string;
}

export interface Ambassadeur {
  id: string;
  user_id: string;
  association_id: string;
  date_rattachement: string;
  nb_deals_crees: number;
  nb_deals_valides: number;
  total_commissions: number;
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

export interface AssociationGerant {
  id: string;
  association_id: string;
  user_id: string;
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
  logo_upload: string | null;
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
  secteur_achete: string | null;
  exclusivite: boolean;
  nombre_habitants: number | null;
  type_abonnement: string | null;
  montant_abonnement_mensuel: number | null;
  statut_abonnement: 'actif' | 'inactif' | 'suspendu';
  date_debut_abonnement: string | null;
  date_fin_abonnement: string | null;
  type_commission: 'montant_fixe' | 'pourcentage';
  valeur_commission: number;
  base_calcul_pourcentage: string | null;
  type_recommandation_autorise: 'photo' | 'formulaire' | 'les_deux';
  nb_leads_recus: number;
  nb_leads_valides: number;
  nb_leads_refuses: number;
  total_commissions_versees: number;
  texte_commission: string | null;
  adresse_masquee: boolean;
  created_at: string;
}

export interface EntrepriseGerant {
  id: string;
  entreprise_id: string;
  user_id: string;
  created_at: string;
}

export interface EntrepriseCategorie {
  id: string;
  entreprise_id: string;
  categorie_id: string;
  sous_categorie_id: string;
  est_principale: boolean;
  created_at: string;
}

export interface EntreprisePhoto {
  id: string;
  entreprise_id: string;
  photo_url: string;
  ordre_affichage: number;
  created_at: string;
}

export interface Deal {
  id: string;
  type_deal: 'auto_recommandation' | 'recommandation_tiers';
  nom_prospect: string | null;
  prenom_prospect: string | null;
  telephone_prospect: string | null;
  email_prospect: string | null;
  commentaire_initial: string | null;
  ambassadeur_id: string;
  association_id: string;
  entreprise_id: string;
  date_creation: string;
  statut: 'en_attente' | 'en_cours' | 'valide' | 'refuse';
  date_changement_statut: string | null;
  valide_par_user_id: string | null;
  motif_refus: string | null;
  montant_commission: number;
  mois_validation: number | null;
  annee_validation: number | null;
}

export interface PreuvePhoto {
  id: string;
  deal_id: string;
  photo_url: string;
  date_photo: string;
  statut: 'en_attente' | 'validee' | 'refusee';
  nom_commerce_extrait: string | null;
  date_ticket_extrait: string | null;
  montant_ticket_extrait: string | null;
  numero_ticket_extrait: string | null;
  hash_image: string | null;
  date_validation: string | null;
  motif_refus: string | null;
}

export interface CommentaireDeal {
  id: string;
  deal_id: string;
  auteur_user_id: string;
  texte_commentaire: string;
  type_commentaire: 'note_interne' | 'suivi' | 'refus';
  created_at: string;
}

export interface DemandePaiement {
  id: string;
  association_id: string;
  gerant_demandeur_id: string;
  montant_demande: number;
  date_demande: string;
  statut: 'en_attente' | 'approuvee' | 'refusee' | 'payee';
  date_traitement: string | null;
  admin_traitant_id: string | null;
  motif_refus: string | null;
  notes: string | null;
}

export interface CategorieFaq {
  id: string;
  entreprise_id: string;
  nom: string;
  ordre_affichage: number;
  created_at: string;
}

export interface FaqEntreprise {
  id: string;
  entreprise_id: string;
  categorie_id: string;
  question: string;
  reponse: string;
  ordre_affichage: number;
  created_at: string;
}

export interface CategoriePrestation {
  id: string;
  entreprise_id: string;
  nom: string;
  ordre_affichage: number;
  created_at: string;
}

export interface PrestationEntreprise {
  id: string;
  entreprise_id: string;
  categorie_id: string;
  nom: string;
  description: string | null;
  prix: number | null;
  ordre_affichage: number;
  statut: 'active' | 'inactive';
  created_at: string;
}

// Tables de démo/exemple (peuvent être ignorées si non utilisées)
export interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  read_time: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  category: string;
  in_stock: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: any; // jsonb
  steps: any; // jsonb
  user_id: string;
  created_at: string;
  updated_at: string;
}
