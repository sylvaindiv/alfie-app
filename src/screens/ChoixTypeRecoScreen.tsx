import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { Entreprise } from '../types/database.types';
import { Colors, Spacing, Typography, BorderRadius, CommonStyles, Shadows } from '../theme';

interface ChoixTypeRecoScreenProps {
  route: {
    params: {
      entrepriseId: string;
    };
  };
  navigation: any;
}

export default function ChoixTypeRecoScreen({
  route,
  navigation,
}: ChoixTypeRecoScreenProps) {
  const { entrepriseId } = route.params;
  const [loading, setLoading] = useState(true);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);

  useEffect(() => {
    loadEntreprise();
  }, []);

  async function loadEntreprise() {
    try {
      const { data, error } = await supabase
        .from('entreprises')
        .select('*')
        .eq('id', entrepriseId)
        .single();

      if (error) throw error;
      setEntreprise(data);
    } catch (error) {
      console.error('Erreur chargement entreprise:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de l\'entreprise');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChoice() {
    navigation.navigate('PhotoReco', { entrepriseId });
  }

  function handleFormulaireChoice() {
    navigation.navigate('FormulaireReco', { entrepriseId });
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommandation</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {/* Titre */}
        <Text style={styles.title}>Comment souhaitez-vous recommander ?</Text>
        <Text style={styles.subtitle}>
          {entreprise?.nom_commercial} accepte les deux types de recommandation
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Option Photo */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handlePhotoChoice}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconContainer, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="camera" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.optionTitle}>Auto-recommandation</Text>
            <Text style={styles.optionDescription}>
              Prenez une photo de votre ticket de caisse ou preuve d'achat
            </Text>
            <View style={styles.optionBadge}>
              <Ionicons name="flash" size={16} color={Colors.warning} />
              <Text style={styles.optionBadgeText}>Validation rapide</Text>
            </View>
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OU</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Option Formulaire */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleFormulaireChoice}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconContainer, { backgroundColor: Colors.info + '15' }]}>
              <Ionicons name="people" size={48} color={Colors.info} />
            </View>
            <Text style={styles.optionTitle}>Recommandation de tiers</Text>
            <Text style={styles.optionDescription}>
              Recommandez cette entreprise à quelqu'un ou pour vous-même
            </Text>
            <View style={[styles.optionBadge, { backgroundColor: Colors.info + '15' }]}>
              <Ionicons name="person-add" size={16} color={Colors.info} />
              <Text style={[styles.optionBadgeText, { color: Colors.info }]}>Formulaire simple</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info commission */}
        {entreprise && (
          <View style={styles.commissionInfo}>
            <Ionicons name="gift-outline" size={20} color={Colors.success} />
            <Text style={styles.commissionText}>
              Commission :{' '}
              <Text style={styles.commissionAmount}>
                {entreprise.type_commission === 'montant_fixe'
                  ? `${entreprise.valeur_commission}€`
                  : `${entreprise.valeur_commission}%`}
              </Text>
            </Text>
          </View>
        )}
      </View>
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
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionCard: {
    ...CommonStyles.card,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.medium,
  },
  optionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  optionTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  optionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    gap: Spacing.xs,
  },
  optionBadgeText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.warning,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  separatorText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.bold,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  commissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  commissionText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
  },
  commissionAmount: {
    fontWeight: Typography.weight.bold,
    color: Colors.success,
    fontSize: Typography.size.lg,
  },
});
