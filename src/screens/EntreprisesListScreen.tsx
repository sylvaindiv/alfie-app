import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { Entreprise, SousCategorieEntreprise } from '../types/database.types';
import EntrepriseCard from '../components/EntrepriseCard';
import { Colors, Spacing, Typography, CommonStyles, BorderRadius } from '../theme';

interface EntreprisesListScreenProps {
  route: {
    params: {
      categorieId: string;
      categorieNom: string;
    };
  };
  navigation: any;
}

export default function EntreprisesListScreen({
  route,
  navigation,
}: EntreprisesListScreenProps) {
  const { categorieId, categorieNom } = route.params;

  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorieEntreprise[]>([]);
  const [selectedSousCategorie, setSelectedSousCategorie] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [categorieId]);

  async function fetchData() {
    try {
      // Récupérer les sous-catégories
      const { data: sousCategs, error: errorSousCategs } = await supabase
        .from('sous_categories_entreprise')
        .select('*')
        .eq('categorie_id', categorieId)
        .eq('statut', 'active')
        .order('ordre_affichage', { ascending: true });

      if (errorSousCategs) throw errorSousCategs;
      setSousCategories(sousCategs || []);

      // Récupérer les entreprises de cette catégorie
      const { data: entreprisesData, error: errorEntreprises } = await supabase
        .from('entreprises')
        .select('*')
        .eq('categorie_id', categorieId)
        .eq('statut_abonnement', 'actif')
        .order('nom_commercial', { ascending: true });

      if (errorEntreprises) throw errorEntreprises;
      setEntreprises(entreprisesData || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les entreprises');
    } finally {
      setLoading(false);
    }
  }

  // Filtrer les entreprises par sous-catégorie
  const entreprisesFiltrees = selectedSousCategorie
    ? entreprises.filter((e) => e.sous_categorie_id === selectedSousCategorie)
    : entreprises;

  function handleEntreprisePress(entreprise: Entreprise) {
    navigation.navigate('EntrepriseDetail', {
      entrepriseId: entreprise.id,
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categorieNom}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filtres sous-catégories */}
      {sousCategories.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {/* Chip "Toutes" */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedSousCategorie === null && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSousCategorie(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSousCategorie === null && styles.filterChipTextActive,
                ]}
              >
                Toutes
              </Text>
            </TouchableOpacity>

            {/* Chips sous-catégories */}
            {sousCategories.map((sousCateg) => (
              <TouchableOpacity
                key={sousCateg.id}
                style={[
                  styles.filterChip,
                  selectedSousCategorie === sousCateg.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedSousCategorie(sousCateg.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedSousCategorie === sousCateg.id &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {sousCateg.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Compteur résultats */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {entreprisesFiltrees.length} entreprise
          {entreprisesFiltrees.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Liste des entreprises */}
      <FlatList
        data={entreprisesFiltrees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <EntrepriseCard
            entreprise={item}
            distance={null}
            onPress={() => handleEntreprisePress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={Colors.textDisabled} />
            <Text style={styles.emptyText}>
              Aucune entreprise dans cette catégorie
            </Text>
          </View>
        }
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  filtersContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    height: 64,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.backgroundLight,
    marginRight: Spacing.sm,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textOnPrimary,
  },
  countContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  countText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textDisabled,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});