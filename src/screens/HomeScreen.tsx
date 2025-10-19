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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { CategorieEntreprise } from '../types/database.types';
import CategoryCard from '../components/CategoryCard';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme';

export default function HomeScreen({ navigation }: any) {
  const [categories, setCategories] = useState<CategorieEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Récupérer le vrai user connecté + ses associations
  const userName = 'Sylvain';
  const userPhoto = 'https://labaguettedigitale.fr/wp-content/uploads/2024/12/picture-copy.png';
  const associationLogos = [
    'https://i.pravatar.cc/100?img=1',
    'https://i.pravatar.cc/100?img=2',
    'https://i.pravatar.cc/100?img=3',
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories_entreprise')
        .select('*')
        .eq('statut', 'active')
        .order('ordre_affichage', { ascending: true });

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryPress(category: CategorieEntreprise) {
    navigation.navigate('EntreprisesList', {
      categorieId: category.id,
      categorieNom: category.nom,
    });
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header avec photos */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingLabel}>
              Bonjour, <Text style={styles.greetingName}>{userName}.</Text>
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* Logos associations */}
            <View style={styles.associationLogos}>
              {associationLogos.slice(0, 3).map((logo, index) => (
                <Image
                  key={index}
                  source={{ uri: logo }}
                  style={[
                    styles.associationLogo,
                    index > 0 && { marginLeft: -8 },
                  ]}
                />
              ))}
            </View>

            {/* Photo profil */}
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Image source={{ uri: userPhoto }} style={styles.profilePhoto} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Question */}
        <Text style={styles.question}>De quoi avez-vous besoin aujourd'hui ?</Text>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons
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

        {/* Titre section */}
        <Text style={styles.sectionTitle}>Catégories</Text>

        {/* Grille des catégories */}
        <View style={styles.gridContainer}>
          {categories.length === 0 ? (
            <Text style={styles.emptyText}>Aucune catégorie disponible</Text>
          ) : (
            categories.map((item, index) => {
              if (index % 2 === 0) {
                return (
                  <View key={item.id} style={styles.row}>
                    <View style={styles.cardWrapper}>
                      <CategoryCard
                        nom={item.nom}
                        imageUrl={item.icone_url}
                        onPress={() => handleCategoryPress(item)}
                      />
                    </View>
                    {categories[index + 1] && (
                      <View style={styles.cardWrapper}>
                        <CategoryCard
                          nom={categories[index + 1].nom}
                          imageUrl={categories[index + 1].icone_url}
                          onPress={() => handleCategoryPress(categories[index + 1])}
                        />
                      </View>
                    )}
                    {!categories[index + 1] && <View style={styles.cardWrapper} />}
                  </View>
                );
              }
              return null;
            })
          )}
        </View>
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
    paddingBottom: Spacing.md,
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
    marginRight: Spacing.sm,
  },
  associationLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  question: {
    fontSize: Typography.size.xxl,
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
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    height: 52,
    ...Shadows.small,
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
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  gridContainer: {
    paddingHorizontal: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginTop: 40,
  },
});