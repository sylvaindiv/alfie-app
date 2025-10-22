import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import type { ImageStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import {
  CategorieEntreprise,
  SousCategorieEntreprise,
  Entreprise,
  User,
  Association,
} from '../types/database.types';
import EntrepriseCardHorizontal from '../components/EntrepriseCardHorizontal';
import LocationButton, { LocationData } from '../components/LocationButton';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  getShadow,
} from '../theme';

interface CategorySection {
  category: CategorieEntreprise;
  sousCategories: SousCategorieEntreprise[];
  entreprises: Entreprise[];
}

export default function HomeScreen({ navigation }: any) {
  // User hardcodé pour le MVP
  const USER_ID = 'c37e64bb-9b07-4e73-9950-2e71518c94bf'; // Sylvain DI VITO

  const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCategories, setSelectedSubCategories] = useState<{
    [categoryId: string]: string | null;
  }>({});
  const [user, setUser] = useState<User | null>(null);
  const [userAssociations, setUserAssociations] = useState<Association[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [entreprisesBySubCategoryMap, setEntreprisesBySubCategoryMap] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setRefreshing(true);
      // Récupérer l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', USER_ID)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Récupérer ses associations
      const { data: assosData, error: assosError } = await supabase
        .from('ambassadeurs')
        .select(`
          association:associations(*)
        `)
        .eq('user_id', USER_ID);

      if (assosError) throw assosError;

      // Extraire les associations de la réponse
      const associations = (assosData || [])
        .map((item: any) => item.association)
        .filter((asso: any) => asso !== null);

      setUserAssociations(associations);

      // Récupérer toutes les catégories actives
      const { data: categories, error: catError } = await supabase
        .from('categories_entreprise')
        .select('*')
        .eq('statut', 'active')
        .order('ordre_affichage', { ascending: true });

      if (catError) throw catError;

      // Récupérer toutes les sous-catégories actives
      const { data: sousCategories, error: sousError } = await supabase
        .from('sous_categories_entreprise')
        .select('*')
        .eq('statut', 'active')
        .order('ordre_affichage', { ascending: true });

      if (sousError) throw sousError;

      // Récupérer toutes les entreprises avec abonnement actif
      const { data: entreprises, error: entError } = await supabase
        .from('entreprises')
        .select('*')
        .eq('statut_abonnement', 'actif');

      if (entError) throw entError;

      // Récupérer TOUTES les associations entreprises-catégories
      const { data: entreprisesCategories, error: ecError } = await supabase
        .from('entreprises_categories')
        .select('*');

      if (ecError) throw ecError;

      // Créer un map des entreprises par catégorie
      const entreprisesByCategoryMap = new Map<string, Set<string>>();
      const entreprisesBySubCategoryMap = new Map<string, Set<string>>();

      (entreprisesCategories || []).forEach((ec) => {
        // Ne garder que les catégories principales pour l'affichage des sections
        if (ec.est_principale) {
          if (!entreprisesByCategoryMap.has(ec.categorie_id)) {
            entreprisesByCategoryMap.set(ec.categorie_id, new Set());
          }
          entreprisesByCategoryMap.get(ec.categorie_id)!.add(ec.entreprise_id);
        }

        // Toutes les sous-catégories pour le filtrage
        if (!entreprisesBySubCategoryMap.has(ec.sous_categorie_id)) {
          entreprisesBySubCategoryMap.set(ec.sous_categorie_id, new Set());
        }
        entreprisesBySubCategoryMap.get(ec.sous_categorie_id)!.add(ec.entreprise_id);
      });

      // Organiser les données par section de catégorie
      const sections: CategorySection[] = (categories || []).map((category) => {
        const sousCats = (sousCategories || []).filter(
          (sc) => sc.categorie_id === category.id
        );

        // Filtrer les entreprises par catégorie principale
        const entrepriseIdsInCategory = entreprisesByCategoryMap.get(category.id) || new Set();
        const entreprisesInCategory = (entreprises || []).filter((ent) =>
          entrepriseIdsInCategory.has(ent.id)
        );

        return {
          category,
          sousCategories: sousCats,
          entreprises: entreprisesInCategory,
        };
      });

      // Ne garder que les sections qui ont au moins une entreprise
      const sectionsWithData = sections.filter(
        (section) => section.entreprises.length > 0
      );

      setCategorySections(sectionsWithData);
      setEntreprisesBySubCategoryMap(entreprisesBySubCategoryMap);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    await fetchAllData();
  }

  function handleEntreprisePress(entreprise: Entreprise) {
    navigation.navigate('EntrepriseDetail', { entrepriseId: entreprise.id });
  }

  function toggleSubCategory(categoryId: string, subCategoryId: string | null) {
    setSelectedSubCategories((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === subCategoryId ? null : subCategoryId,
    }));
  }

  function getFilteredEntreprises(section: CategorySection) {
    const selectedSubCat = selectedSubCategories[section.category.id];
    if (!selectedSubCat) {
      return section.entreprises;
    }
    // Utiliser la map des entreprises par sous-catégorie
    const entrepriseIdsInSubCategory = entreprisesBySubCategoryMap.get(selectedSubCat);
    if (!entrepriseIdsInSubCategory) {
      return [];
    }
    return section.entreprises.filter((ent) =>
      entrepriseIdsInSubCategory.has(ent.id)
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header avec photos */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingLabel}>
              Bonjour, <Text style={styles.greetingName}>{user?.prenom || 'Ambassadeur'}.</Text>
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* Logos associations ou bouton d'alerte */}
            {userAssociations.length > 0 ? (
              <View style={styles.associationLogos}>
                {[...userAssociations].reverse().map((association, index) => {
                  // Calcul de la taille : chaque logo suivant (vers la gauche) est réduit de 50%
                  const reversedIndex = userAssociations.length - 1 - index;
                  const baseSize = 38;
                  const size = baseSize * Math.pow(0.5, reversedIndex);
                  const borderRadius = size / 2;
                  const marginRight = index > 0 ? -(size * 0.3) : 0;

                  const dynamicStyle: ImageStyle = {
                    width: size,
                    height: size,
                    borderRadius: borderRadius,
                    marginRight: marginRight,
                    zIndex: index + 1,
                  };

                  return (
                    <Image
                      key={association.id}
                      source={{ uri: association.logo_url || 'https://via.placeholder.com/100' }}
                      style={[styles.associationLogo, dynamicStyle]}
                    />
                  );
                })}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.noAssociationButton}
                onPress={() =>
                  Alert.alert(
                    'Aucune association',
                    "Vous n'avez pas d'association attribuée"
                  )
                }
              >
                <Feather name="alert-triangle" size={18} color={Colors.surface} />
              </TouchableOpacity>
            )}

            {/* Photo profil */}
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image
                source={{ uri: user?.photo_profil_url || 'https://via.placeholder.com/150' }}
                style={styles.profilePhoto}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Question */}
        <Text style={styles.question}>De quoi avez-vous besoin ?</Text>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={20}
            color={Colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un commerce, un service..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textDisabled}
          />
        </View>

        {/* Bouton de localisation */}
        <View style={styles.locationButtonContainer}>
          <LocationButton onLocationSelected={setSelectedLocation} />
        </View>

        {/* Sections par catégorie */}
        {categorySections.length === 0 ? (
          <Text style={styles.emptyText}>Aucune entreprise disponible</Text>
        ) : (
          categorySections.map((section) => {
            const filteredEntreprises = getFilteredEntreprises(section);
            return (
              <View key={section.category.id} style={styles.categorySection}>
                {/* Titre de la catégorie */}
                <Text style={styles.categoryTitle}>{section.category.nom}</Text>

                {/* Filtres de sous-catégories */}
                {section.sousCategories.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                  >
                    {/* Chip "Tous" */}
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        !selectedSubCategories[section.category.id] &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        toggleSubCategory(section.category.id, null)
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          !selectedSubCategories[section.category.id] &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        Tous
                      </Text>
                    </TouchableOpacity>

                    {/* Chips des sous-catégories */}
                    {section.sousCategories.map((sousCat) => {
                      const isSelected =
                        selectedSubCategories[section.category.id] ===
                        sousCat.id;
                      return (
                        <TouchableOpacity
                          key={sousCat.id}
                          style={[
                            styles.filterChip,
                            isSelected && styles.filterChipActive,
                          ]}
                          onPress={() =>
                            toggleSubCategory(section.category.id, sousCat.id)
                          }
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              isSelected && styles.filterChipTextActive,
                            ]}
                          >
                            {sousCat.nom}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Liste des entreprises en scroll horizontal */}
                {filteredEntreprises.length === 0 ? (
                  <Text style={styles.emptySubText}>
                    Aucune entreprise dans cette catégorie
                  </Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.entreprisesScrollContainer}
                  >
                    {filteredEntreprises.map((entreprise) => (
                      <EntrepriseCardHorizontal
                        key={entreprise.id}
                        entreprise={entreprise}
                        onPress={() => handleEntreprisePress(entreprise)}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  headerLeft: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  greetingName: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  associationLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  associationLogo: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  } as ImageStyle,
  noAssociationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 9999,
  },
  question: {
    fontSize: Typography.size.huge,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    lineHeight: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    height: 52,
    ...getShadow('small'),
  },
  searchIcon: {
    marginRight: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
  },
  locationButtonContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxxl,
  },
  categorySection: {
    marginBottom: Spacing.xxxl,
  },
  categoryTitle: {
    fontSize: Typography.size.xxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,

  },
  filtersContainer: {
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingLeft: 0,
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.md,
    marginRight: Spacing.lg,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipFirst: {
    paddingLeft: 5,
  },
  filterChipActive: {
    backgroundColor: 'transparent',
  },
  filterChipText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.regular,
    color: '#8A8A8A',
    includeFontPadding: false,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.bold,
  },
  entreprisesScrollContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginTop: 40,
    paddingHorizontal: Spacing.xl,
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textDisabled,
    marginTop: Spacing.lg,
    fontStyle: 'italic',
  },
});