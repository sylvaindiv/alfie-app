import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { Association, Entreprise, User } from '../types/database.types';
import { Colors, Spacing, Typography, BorderRadius, CommonStyles, getShadow } from '../theme';

interface FormulaireRecoScreenProps {
  route: {
    params: {
      entrepriseId: string;
    };
  };
  navigation: any;
}

export default function FormulaireRecoScreen({
  route,
  navigation,
}: FormulaireRecoScreenProps) {
  // User hardcodé pour le MVP
  const USER_ID = 'c37e64bb-9b07-4e73-9950-2e71518c94bf'; // Sylvain DI VITO
  const { entrepriseId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userAssociations, setUserAssociations] = useState<Association[]>([]);
  const [selectedAssociationId, setSelectedAssociationId] = useState<string | null>(null);

  // Toggle "Pour moi" / "Pour quelqu'un"
  const [isForMe, setIsForMe] = useState(false);

  // Champs du formulaire
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Auto-remplir le formulaire quand "Pour moi" est activé
  useEffect(() => {
    if (isForMe && user) {
      setPrenom(user.prenom);
      setNom(user.nom);
      setTelephone(user.telephone);
      setEmail(user.email || '');
    } else if (!isForMe) {
      // Vider les champs quand on désactive "Pour moi"
      setPrenom('');
      setNom('');
      setTelephone('');
      setEmail('');
      setCommentaire('');
    }
  }, [isForMe, user]);

  async function loadData() {
    try {
      // Charger l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', USER_ID)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Charger l'entreprise
      const { data: entrepriseData, error: entrepriseError } = await supabase
        .from('entreprises')
        .select('*')
        .eq('id', entrepriseId)
        .single();

      if (entrepriseError) throw entrepriseError;
      setEntreprise(entrepriseData);

      // Charger les associations de l'utilisateur
      const { data: assosData, error: assosError } = await supabase
        .from('ambassadeurs')
        .select(`
          association:associations(*)
        `)
        .eq('user_id', USER_ID);

      if (assosError) throw assosError;

      const associations = (assosData || [])
        .map((item: any) => item.association)
        .filter((asso: any) => asso !== null);

      setUserAssociations(associations);

      // Si une seule association, la sélectionner automatiquement
      if (associations.length === 1) {
        setSelectedAssociationId(associations[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    // Validation
    if (!prenom.trim()) {
      Alert.alert('Erreur', 'Le prénom est obligatoire');
      return;
    }
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }
    if (!telephone.trim()) {
      Alert.alert('Erreur', 'Le téléphone est obligatoire');
      return;
    }
    if (!selectedAssociationId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une association');
      return;
    }

    setSubmitting(true);

    try {
      // Créer le deal
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert({
          type_deal: 'recommandation_tiers',
          ambassadeur_id: USER_ID,
          association_id: selectedAssociationId,
          entreprise_id: entrepriseId,
          statut: 'en_attente',
          nom_prospect: nom.trim(),
          prenom_prospect: prenom.trim(),
          telephone_prospect: telephone.trim(),
          email_prospect: email.trim() || null,
          commentaire_initial: commentaire.trim() || null,
          montant_commission: entreprise?.valeur_commission || null,
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Incrémenter le compteur nb_deals_crees de l'ambassadeur
      // On récupère d'abord la valeur actuelle
      const { data: ambassadeurData } = await supabase
        .from('ambassadeurs')
        .select('nb_deals_crees')
        .eq('user_id', USER_ID)
        .eq('association_id', selectedAssociationId)
        .single();

      if (ambassadeurData) {
        const { error: updateError } = await supabase
          .from('ambassadeurs')
          .update({
            nb_deals_crees: (ambassadeurData.nb_deals_crees || 0) + 1,
          })
          .eq('user_id', USER_ID)
          .eq('association_id', selectedAssociationId);

        if (updateError) {
          console.warn('Erreur mise à jour compteur ambassadeur:', updateError);
        }
      }

      // Incrémenter le compteur nb_deals_recus de l'entreprise
      const { data: entrepriseData } = await supabase
        .from('entreprises')
        .select('nb_deals_recus')
        .eq('id', entrepriseId)
        .single();

      if (entrepriseData) {
        await supabase
          .from('entreprises')
          .update({
            nb_deals_recus: (entrepriseData.nb_deals_recus || 0) + 1,
          })
          .eq('id', entrepriseId);
      }

      Alert.alert(
        'Recommandation envoyée !',
        `Votre recommandation pour ${entreprise?.nom_commercial} a été transmise avec succès.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Deals');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur création deal:', error);
      Alert.alert('Erreur', 'Impossible de créer la recommandation');
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.headerTitle}>Nouvelle recommandation</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Entreprise info */}
        <View style={styles.entrepriseCard}>
          <Text style={styles.entrepriseLabel}>Pour l'entreprise</Text>
          <Text style={styles.entrepriseName}>{entreprise?.nom_commercial}</Text>
        </View>

        {/* Toggle "Pour moi" / "Pour quelqu'un" */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Cette recommandation est pour moi</Text>
            <Switch
              value={isForMe}
              onValueChange={setIsForMe}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
          <Text style={styles.toggleHint}>
            {isForMe
              ? "Vous êtes vous-même intéressé(e) par cette entreprise"
              : "Vous recommandez cette entreprise à quelqu'un"}
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informations {isForMe ? 'de contact' : 'du prospect'}</Text>

          {/* Prénom */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Prénom <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Entrez le prénom"
              placeholderTextColor={Colors.textDisabled}
            />
          </View>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Nom <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Entrez le nom"
              placeholderTextColor={Colors.textDisabled}
            />
          </View>

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Téléphone <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={telephone}
              onChangeText={setTelephone}
              placeholder="06 12 34 56 78"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="phone-pad"
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="exemple@email.com"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Commentaire */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Commentaire (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={commentaire}
              onChangeText={setCommentaire}
              placeholder="Ajoutez des détails ou précisions..."
              placeholderTextColor={Colors.textDisabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Sélection association */}
        {userAssociations.length > 1 && (
          <View style={styles.associationSection}>
            <Text style={styles.sectionTitle}>
              Association bénéficiaire <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.associationHint}>
              Sélectionnez l'association qui recevra la commission
            </Text>
            {userAssociations.map((association) => (
              <TouchableOpacity
                key={association.id}
                style={[
                  styles.associationOption,
                  selectedAssociationId === association.id && styles.associationOptionSelected,
                ]}
                onPress={() => setSelectedAssociationId(association.id)}
              >
                <View style={styles.radioOuter}>
                  {selectedAssociationId === association.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.associationName,
                    selectedAssociationId === association.id && styles.associationNameSelected,
                  ]}
                >
                  {association.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bouton de soumission */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color={Colors.surface} />
              <Text style={styles.submitButtonText}>Envoyer la recommandation</Text>
            </>
          )}
        </TouchableOpacity>
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
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  entrepriseCard: {
    ...CommonStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  entrepriseLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  entrepriseName: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  toggleSection: {
    marginBottom: Spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  toggleLabel: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    flex: 1,
  },
  toggleHint: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  associationSection: {
    marginBottom: Spacing.xl,
  },
  associationHint: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  associationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  associationOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  associationName: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  associationNameSelected: {
    fontWeight: Typography.weight.semiBold,
    color: Colors.surface,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...getShadow('medium'),
    minHeight: 52,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textDisabled,
  },
  submitButtonText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.bold,
    color: Colors.surface,
  },
});
