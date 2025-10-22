import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { supabase } from '../config/supabase';
import DealCard from '../components/DealCard';
import { Colors, Spacing, Typography, CommonStyles, BorderRadius } from '../theme';

interface Deal {
  id: string;
  type_deal: 'auto_recommandation' | 'recommandation_tiers';
  statut: 'en_attente' | 'en_cours' | 'valide' | 'refuse';
  date_creation: string;
  montant_commission: number | null;
  mois_validation: number | null;
  annee_validation: number | null;
  entreprise: {
    nom_commercial: string;
    logo_url: string | null;
  };
}

type FilterType = 'tous' | 'en_attente' | 'en_cours' | 'valide' | 'refuse';

export default function DealsScreen({ navigation }: any) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('tous');

  // Stats
  const [validesThisMonth, setValidesThisMonth] = useState(0);
  const [totalCommissions, setTotalCommissions] = useState(0);

  // TODO: Récupérer le vrai user connecté
  const currentUserId = 'c37e64bb-9b07-4e73-9950-2e71518c94bf'; // Sylvain DI VITO

  useEffect(() => {
    fetchDeals();
    fetchStats();
  }, []);

  async function fetchDeals() {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(
          `
          id,
          type_deal,
          statut,
          date_creation,
          montant_commission,
          mois_validation,
          annee_validation,
          entreprises (
            nom_commercial,
            logo_url
          )
        `
        )
        .eq('ambassadeur_id', currentUserId)
        .order('date_creation', { ascending: false });

      if (error) throw error;

      // Formater les données
      const formattedDeals = data.map((deal: any) => ({
        id: deal.id,
        type_deal: deal.type_deal,
        statut: deal.statut,
        date_creation: deal.date_creation,
        montant_commission: deal.montant_commission,
        mois_validation: deal.mois_validation,
        annee_validation: deal.annee_validation,
        entreprise: {
          nom_commercial: deal.entreprises.nom_commercial,
          logo_url: deal.entreprises.logo_url,
        },
      }));

      setDeals(formattedDeals);
    } catch (error) {
      console.error('Erreur chargement deals:', error);
      Alert.alert('Erreur', 'Impossible de charger vos recommandations');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const currentYear = new Date().getFullYear();

      // Validés ce mois
      const { data: validesData, error: errorValides } = await supabase
        .from('deals')
        .select('montant_commission')
        .eq('ambassadeur_id', currentUserId)
        .eq('statut', 'valide')
        .eq('mois_validation', currentMonth)
        .eq('annee_validation', currentYear);

      if (errorValides) throw errorValides;

      const countValides = validesData.length;

      setValidesThisMonth(countValides);

      // Total commissions (depuis ambassadeurs)
      const { data: ambassadeurData, error: errorAmbassadeur } = await supabase
        .from('ambassadeurs')
        .select('total_commissions')
        .eq('user_id', currentUserId);

      if (errorAmbassadeur) throw errorAmbassadeur;

      const total = ambassadeurData.reduce(
        (sum, amb) => sum + (amb.total_commissions || 0),
        0
      );

      setTotalCommissions(total);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([fetchDeals(), fetchStats()]);
    setRefreshing(false);
  }

  // Filtrer les deals
  const dealsFiltres =
    selectedFilter === 'tous'
      ? deals
      : deals.filter((deal) => deal.statut === selectedFilter);

  function handleDealPress(deal: Deal) {
  navigation.navigate('DealDetail', {
    dealId: deal.id,
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[2]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Deals</Text>
        </View>

        {/* Stats cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>✅ Validées ce mois</Text>
            <Text style={styles.statValue}>{validesThisMonth}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>💰 Total</Text>
            <Text style={styles.statValue}>{totalCommissions.toFixed(0)}€</Text>
          </View>
        </View>

        {/* Filtres statuts - sticky */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === 'tous' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter('tous')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'tous' && styles.filterChipTextActive,
                ]}
              >
                Tous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === 'en_attente' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter('en_attente')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'en_attente' && styles.filterChipTextActive,
                ]}
              >
                En attente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === 'en_cours' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter('en_cours')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'en_cours' && styles.filterChipTextActive,
                ]}
              >
                En cours
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === 'valide' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter('valide')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'valide' && styles.filterChipTextActive,
                ]}
              >
                Validés
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === 'refuse' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter('refuse')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === 'refuse' && styles.filterChipTextActive,
                ]}
              >
                Refusés
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Liste des deals */}
        <View style={styles.listContainer}>
          {dealsFiltres.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'tous'
                  ? 'Aucune recommandation pour le moment'
                  : `Aucune recommandation ${
                      selectedFilter === 'en_attente'
                        ? 'en attente'
                        : selectedFilter === 'en_cours'
                        ? 'en cours'
                        : selectedFilter === 'valide'
                        ? 'validée'
                        : 'refusée'
                    }`}
              </Text>
            </View>
          ) : (
            dealsFiltres.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onPress={() => handleDealPress(deal)}
              />
            ))
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: Typography.size.xxxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.background,
    zIndex: 2,
  },
  statCard: {
    flex: 1,
    ...CommonStyles.card,
    paddingVertical: Spacing.md,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.size.xxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textPrimary,
  },
  filtersContainer: {
    backgroundColor: Colors.background,
    height: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
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
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.textOnPrimary,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textDisabled,
    textAlign: 'center',
  },
});