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
import { supabase } from '../config/supabase';
import LeadCard from '../components/LeadCard';
import { Colors, Spacing, Typography, CommonStyles, BorderRadius } from '../theme';

interface Lead {
  id: string;
  type_lead: 'auto_recommandation' | 'recommandation_tiers';
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

export default function LeadsScreen({ navigation }: any) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('tous');

  // Stats
  const [validesThisMonth, setValidesThisMonth] = useState(0);
  const [totalValidesThisMonth, setTotalValidesThisMonth] = useState(0);
  const [totalCommissions, setTotalCommissions] = useState(0);

  // TODO: Récupérer le vrai user connecté
  const currentUserId = '90d20625-d3dc-470b-98bb-f55ab8391ffc'; // Marie Dubois

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, []);

  async function fetchLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(
          `
          id,
          type_lead,
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
      const formattedLeads = data.map((lead: any) => ({
        id: lead.id,
        type_lead: lead.type_lead,
        statut: lead.statut,
        date_creation: lead.date_creation,
        montant_commission: lead.montant_commission,
        mois_validation: lead.mois_validation,
        annee_validation: lead.annee_validation,
        entreprise: {
          nom_commercial: lead.entreprises.nom_commercial,
          logo_url: lead.entreprises.logo_url,
        },
      }));

      setLeads(formattedLeads);
    } catch (error) {
      console.error('Erreur chargement leads:', error);
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
        .from('leads')
        .select('montant_commission')
        .eq('ambassadeur_id', currentUserId)
        .eq('statut', 'valide')
        .eq('mois_validation', currentMonth)
        .eq('annee_validation', currentYear);

      if (errorValides) throw errorValides;

      const countValides = validesData.length;
      const totalValides = validesData.reduce(
        (sum, lead) => sum + (lead.montant_commission || 0),
        0
      );

      setValidesThisMonth(countValides);
      setTotalValidesThisMonth(totalValides);

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

  // Filtrer les leads
  const leadsFiltres =
    selectedFilter === 'tous'
      ? leads
      : leads.filter((lead) => lead.statut === selectedFilter);

  function handleLeadPress(lead: Lead) {
  navigation.navigate('LeadDetail', {
    leadId: lead.id,
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
        <Text style={styles.headerTitle}>Mes recommandations</Text>
      </View>

      {/* Stats cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>✅ Validées ce mois</Text>
          <Text style={styles.statValue}>{validesThisMonth}</Text>
          <Text style={styles.statSubValue}>
            {totalValidesThisMonth.toFixed(0)}€
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>💰 Total</Text>
          <Text style={styles.statValue}>{totalCommissions.toFixed(0)}€</Text>
          <Text style={styles.statSubValue}>Commissions générées</Text>
        </View>
      </View>

      {/* Filtres statuts */}
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

      {/* Liste des leads */}
      <FlatList
        data={leadsFiltres}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <LeadCard lead={item} onPress={() => handleLeadPress(item)} />
        )}
        ListEmptyComponent={
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
    ...CommonStyles.screenHeader,
  },
  headerTitle: {
    fontSize: Typography.size.xxxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    ...CommonStyles.card,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.size.xxxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statSubValue: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
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
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
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