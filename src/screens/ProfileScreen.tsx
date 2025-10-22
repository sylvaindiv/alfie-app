import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';
import { supabase } from '../config/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from './AdminScreen';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  // User hardcodé pour le MVP
  const USER_ID = 'c37e64bb-9b07-4e73-9950-2e71518c94bf'; // Sylvain DI VITO

  const [user, setUser] = useState<any>(null);
  const [associations, setAssociations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    dealsCreated: 0,
    dealsValidated: 0,
    totalCommissions: 0,
  });
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // États pour le formulaire d'édition
  const [editEmail, setEditEmail] = useState('');
  const [editAdresseComplete, setEditAdresseComplete] = useState('');
  const [editCodePostal, setEditCodePostal] = useState('');
  const [editVille, setEditVille] = useState('');

  // Animation pour l'overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Charger les données utilisateur
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Charger l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', USER_ID)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Charger ses associations
      const { data: assosData, error: assosError } = await supabase
        .from('ambassadeurs')
        .select(`
          *,
          association:associations(*)
        `)
        .eq('user_id', USER_ID);

      if (assosError) throw assosError;
      setAssociations(assosData || []);

      // Calculer les statistiques
      let totalDealsCreated = 0;
      let totalDealsValidated = 0;
      let totalCommissions = 0;

      if (assosData) {
        assosData.forEach((ambassadeur: any) => {
          totalDealsCreated += ambassadeur.nb_deals_crees || 0;
          totalDealsValidated += ambassadeur.nb_deals_valides || 0;
          totalCommissions += parseFloat(ambassadeur.total_commissions || 0);
        });
      }

      setStats({
        dealsCreated: totalDealsCreated,
        dealsValidated: totalDealsValidated,
        totalCommissions: totalCommissions,
      });
    } catch (error) {
      console.error('Erreur chargement user:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setEditEmail(user?.email || '');
    setEditAdresseComplete(user?.adresse_complete || '');
    setEditCodePostal(user?.code_postal || '');
    setEditVille(user?.ville || '');
    setShowEditModal(true);
    // Animation de fade in pour l'overlay
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeEditModal = () => {
    // Animation de fade out pour l'overlay
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowEditModal(false);
    });
  };

  const saveUserInfo = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          email: editEmail,
          adresse_complete: editAdresseComplete,
          code_postal: editCodePostal,
          ville: editVille,
        })
        .eq('id', USER_ID);

      if (error) throw error;

      // Recharger les données
      await loadUserData();
      closeEditModal();
      Alert.alert('Succès', 'Informations mises à jour');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADER : Photo + Nom + Téléphone */}
      <View style={styles.header}>
        {/* Photo de profil */}
        <View style={styles.photoContainer}>
          {user.photo_profil_url ? (
            <Image
              source={{ uri: user.photo_profil_url }}
              style={styles.photo}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Feather name="user" size={54} color={Colors.textSecondary} />
            </View>
          )}
          {/* Bouton modifier photo */}
          <TouchableOpacity style={styles.editPhotoButton}>
            <Feather name="camera" size={18} color={Colors.textOnPrimary} onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')} />
          </TouchableOpacity>
        </View>

        {/* Nom + Prénom */}
        <Text style={styles.name}>
          {user.prenom} {user.nom}
        </Text>

        {/* Téléphone (non modifiable) */}
        <View style={styles.phoneContainer}>
          <Feather name="phone" size={12} color={Colors.textSecondary} />
          <Text style={styles.phone}>{user.telephone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <TouchableOpacity
            style={styles.editIconButton}
            onPress={openEditModal}
          >
            <Feather name="edit-2" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Email */}
        <View style={styles.compactInfoRow}>
          <Feather name="mail" size={18} color={Colors.textSecondary} />
          <Text style={styles.compactInfoText}>
            {user.email || 'Non renseigné'}
          </Text>
        </View>

        {/* Adresse */}
        <View style={styles.compactInfoRow}>
          <Feather name="map-pin" size={18} color={Colors.textSecondary} />
          <Text style={styles.compactInfoText}>
            {user.adresse_complete && user.code_postal && user.ville
              ? `${user.adresse_complete}, ${user.code_postal} ${user.ville}`
              : 'Adresse non renseignée'}
          </Text>
        </View>
      </View>
      {/* SECTION : Mes associations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes associations</Text>

        {/* Liste des associations */}
        {associations.map((ambassadeur) => (
          <View key={ambassadeur.id} style={styles.assoCard}>
            {/* Logo + Nom */}
            <View style={styles.assoContent}>
              {ambassadeur.association.logo_url ? (
                <Image
                  source={{ uri: ambassadeur.association.logo_url }}
                  style={styles.assoLogo}
                />
              ) : (
                <View style={styles.assoLogoPlaceholder}>
                  <Feather name="briefcase" size={22} color={Colors.textSecondary} />
                </View>
              )}
              <Text style={styles.assoName}>
                {ambassadeur.association.nom}
              </Text>
            </View>

            {/* Bouton retirer (si plusieurs associations) */}
            {associations.length >= 2 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
              >
                <Feather name="x-circle" size={22} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Message si aucune association */}
        {associations.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="alert-circle" size={44} color={Colors.textDisabled} />
            <Text style={styles.emptyText}>
              Aucune association pour le moment
            </Text>
          </View>
        )}

        {/* Bouton ajouter */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
        >
          <Feather name="plus-circle" size={22} color={Colors.primary} />
          <Text style={styles.addButtonText}>Ajouter une association</Text>
        </TouchableOpacity>
      </View>
      {/* SECTION : Statistiques */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiques</Text>

        <View style={styles.statsContainer}>
          {/* Deals créés */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.info + '20' }]}>
              <Feather name="plus-circle" size={22} color={Colors.info} />
            </View>
            <Text style={styles.statValue}>{stats.dealsCreated}</Text>
            <Text style={styles.statLabel}>Deals créés</Text>
          </View>

          {/* Deals validés */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + '20' }]}>
              <Feather name="check-circle" size={22} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{stats.dealsValidated}</Text>
            <Text style={styles.statLabel}>Validés</Text>
          </View>

          {/* Total commissions */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Feather name="dollar-sign" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalCommissions.toFixed(0)}€</Text>
            <Text style={styles.statLabel}>Commissions</Text>
          </View>
        </View>
      </View>
      {/* SECTION : Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        {/* Toggle Push */}
        <View style={styles.notifRow}>
          <View style={styles.notifContent}>
            <View style={styles.notifIconLabel}>
              <Feather name="bell" size={22} color={Colors.textSecondary} />
              <View style={styles.notifTextContainer}>
                <Text style={styles.notifLabel}>Notifications push</Text>
                <Text style={styles.notifSubtext}>
                  Recevoir des alertes sur votre appareil
                </Text>
              </View>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={(value) => {
              setPushEnabled(value);
              Alert.alert('Info', 'Préférence enregistrée');
            }}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.surface}
          />
        </View>

        {/* Toggle Email */}
        <View style={styles.notifRow}>
          <View style={styles.notifContent}>
            <View style={styles.notifIconLabel}>
              <Feather name="mail" size={22} color={Colors.textSecondary} />
              <View style={styles.notifTextContainer}>
                <Text style={styles.notifLabel}>Notifications email</Text>
                <Text style={styles.notifSubtext}>
                  Recevoir des emails de suivi
                </Text>
              </View>
            </View>
          </View>
          <Switch
            value={emailEnabled}
            onValueChange={(value) => {
              setEmailEnabled(value);
              Alert.alert('Info', 'Préférence enregistrée');
            }}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.surface}
          />
        </View>
      </View>
      {/* SECTION : Administration (uniquement si admin) */}
      {user.is_admin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration</Text>
          <TouchableOpacity
            style={styles.adminRow}
            onPress={() => setShowAdminModal(true)}
          >
            <View style={styles.legalContent}>
              <Feather name="settings" size={22} color={Colors.primary} />
              <Text style={styles.adminText}>Gérer les catégories et entreprises</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* SECTION : Informations légales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations légales</Text>

        {/* CGU */}
        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => Alert.alert('CGU', 'Page à venir')}
        >
          <View style={styles.legalContent}>
            <Feather name="file-text" size={22} color={Colors.textSecondary} />
            <Text style={styles.legalText}>Conditions générales d'utilisation</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textDisabled} />
        </TouchableOpacity>

        {/* Politique de confidentialité */}
        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => Alert.alert('Confidentialité', 'Page à venir')}
        >
          <View style={styles.legalContent}>
            <Feather name="shield" size={22} color={Colors.textSecondary} />
            <Text style={styles.legalText}>Politique de confidentialité</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textDisabled} />
        </TouchableOpacity>
      </View>
      {/* BOUTON DÉCONNEXION */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            Alert.alert(
              'Déconnexion',
              'Êtes-vous sûr de vouloir vous déconnecter ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Déconnexion',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await supabase.auth.signOut();
                      // La navigation se fera automatiquement via le listener
                      // dans AppNavigator (onAuthStateChange)
                    } catch (error) {
                      console.error('Erreur déconnexion:', error);
                      Alert.alert('Erreur', 'Impossible de se déconnecter');
                    }
                  },
                },
              ],
            );
          }}
        >
          <Feather name="log-out" size={22} color={Colors.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Administration */}
      <Modal
        visible={showAdminModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAdminModal(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <AdminScreen />
        </View>
      </Modal>

      {/* Modal Édition Informations */}
      <Modal
        visible={showEditModal}
        animationType="none"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: overlayOpacity }
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={closeEditModal}
          />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContentContainer}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: overlayOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  })
                }]
              }
            ]}
          >
            <View style={styles.modalHeaderEdit}>
              <Text style={styles.modalTitle}>Modifier mes informations</Text>
              <TouchableOpacity
                onPress={closeEditModal}
                style={styles.closeButtonEdit}
              >
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="votre.email@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Adresse complète */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Adresse postale</Text>
                <TextInput
                  style={styles.formInput}
                  value={editAdresseComplete}
                  onChangeText={setEditAdresseComplete}
                  placeholder="123 rue de la Paix"
                />
              </View>

              {/* Code postal */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Code postal</Text>
                <TextInput
                  style={styles.formInput}
                  value={editCodePostal}
                  onChangeText={setEditCodePostal}
                  placeholder="75000"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              {/* Ville */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ville</Text>
                <TextInput
                  style={styles.formInput}
                  value={editVille}
                  onChangeText={setEditVille}
                  placeholder="Paris"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeEditModal}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveUserInfo}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
  },

  // === HEADER ===
  header: {
    backgroundColor: Colors.surface,
    paddingTop: Spacing.xxxl + 40, // Ajout de 40px en plus
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  name: {
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.bold as any,
    fontFamily: Typography.fontFamily.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  phone: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
  },

  // Placeholder pour les sections suivantes
  placeholder: {
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
  },
  // === SECTION ===
  section: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold as any,
    fontFamily: Typography.fontFamily.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  editIconButton: {
    padding: Spacing.sm,
  },

  // === COMPACT INFO ROW ===
  compactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  compactInfoText: {
    flex: 1,
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
  },
  // === ASSOCIATIONS ===
  assoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assoLogo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    marginRight: Spacing.md,
  },
  assoLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assoName: {
    flex: 1,
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textPrimary,
  },
  removeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textDisabled,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  // === STATISTIQUES ===
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: Typography.size.xxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // === NOTIFICATIONS ===
  notifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  notifContent: {
    flex: 1,
  },
  notifIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notifTextContainer: {
    flex: 1,
  },
  notifLabel: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  notifSubtext: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
  },// === LÉGAL ===
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  legalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  legalText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
  },
  // === DÉCONNEXION ===
  logoutSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.error,
    gap: Spacing.md,
  },
  logoutText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.error,
  },
  // === ADMIN ===
  adminRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  adminText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.primary,
  },
  // === MODAL ===
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    paddingTop: Spacing.xxxl + 40,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    alignSelf: 'flex-start',
  },

  // === MODAL EDIT ===
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContentContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '80%',
  },
  modalHeaderEdit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold as any,
    fontFamily: Typography.fontFamily.heading,
    color: Colors.textPrimary,
  },
  closeButtonEdit: {
    padding: Spacing.xs,
  },
  modalForm: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold as any,
    color: Colors.textOnPrimary,
  },
});