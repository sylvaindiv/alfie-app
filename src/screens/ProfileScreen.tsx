import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    leadsCreated: 0,
    leadsValidated: 0,
    totalCommissions: 0,
  });
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);

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
      let totalLeadsCreated = 0;
      let totalLeadsValidated = 0;
      let totalCommissions = 0;

      if (assosData) {
        assosData.forEach((ambassadeur: any) => {
          totalLeadsCreated += ambassadeur.nb_leads_crees || 0;
          totalLeadsValidated += ambassadeur.nb_leads_valides || 0;
          totalCommissions += parseFloat(ambassadeur.total_commissions || 0);
        });
      }

      setStats({
        leadsCreated: totalLeadsCreated,
        leadsValidated: totalLeadsValidated,
        totalCommissions: totalCommissions,
      });
    } catch (error) {
      console.error('Erreur chargement user:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
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
              <Ionicons name="person" size={60} color={Colors.textSecondary} />
            </View>
          )}
          {/* Bouton modifier photo */}
          <TouchableOpacity style={styles.editPhotoButton}>
            <Ionicons name="camera" size={20} color={Colors.textOnPrimary} onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')} />
          </TouchableOpacity>
        </View>

        {/* Nom + Prénom */}
        <Text style={styles.name}>
          {user.prenom} {user.nom}
        </Text>

        {/* Téléphone (non modifiable) */}
        <View style={styles.phoneContainer}>
          <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.phone}>{user.telephone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        {/* Email */}
        <View style={styles.infoRow}>
          <View style={styles.infoContent}>
            <View style={styles.infoIconLabel}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <Text style={styles.infoValue}>
              {user.email || 'Non renseigné'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={18} color={Colors.primary} onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')} />
          </TouchableOpacity>
        </View>

        {/* Code postal */}
        <View style={styles.infoRow}>
          <View style={styles.infoContent}>
            <View style={styles.infoIconLabel}>
              <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Code postal</Text>
            </View>
            <Text style={styles.infoValue}>{user.code_postal}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={18} color={Colors.primary} onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')} />
          </TouchableOpacity>
        </View>

        {/* Adresse complète */}
        <View style={styles.infoRow}>
          <View style={styles.infoContent}>
            <View style={styles.infoIconLabel}>
              <Ionicons name="home-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Adresse complète</Text>
            </View>
            <Text style={styles.infoValue}>
              {user.adresse_complete || 'Non renseignée'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={18} color={Colors.primary} onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')} />
          </TouchableOpacity>
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
                  <Ionicons name="business" size={24} color={Colors.textSecondary} />
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
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Message si aucune association */}
        {associations.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.textDisabled} />
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
          <Ionicons name="add-circle" size={24} color={Colors.primary} />
          <Text style={styles.addButtonText}>Ajouter une association</Text>
        </TouchableOpacity>
      </View>
      {/* SECTION : Statistiques */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiques</Text>

        <View style={styles.statsContainer}>
          {/* Leads créés */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.info + '20' }]}>
              <Ionicons name="add-circle" size={28} color={Colors.info} />
            </View>
            <Text style={styles.statValue}>{stats.leadsCreated}</Text>
            <Text style={styles.statLabel}>Leads créés</Text>
          </View>

          {/* Leads validés */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{stats.leadsValidated}</Text>
            <Text style={styles.statLabel}>Validés</Text>
          </View>

          {/* Total commissions */}
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name="cash" size={28} color={Colors.primary} />
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
              <Ionicons name="notifications-outline" size={24} color={Colors.textSecondary} />
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
              <Ionicons name="mail-outline" size={24} color={Colors.textSecondary} />
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
              <Ionicons name="settings-outline" size={24} color={Colors.primary} />
              <Text style={styles.adminText}>Gérer les catégories et entreprises</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
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
            <Ionicons name="document-text-outline" size={24} color={Colors.textSecondary} />
            <Text style={styles.legalText}>Conditions générales d'utilisation</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textDisabled} />
        </TouchableOpacity>

        {/* Politique de confidentialité */}
        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => Alert.alert('Confidentialité', 'Page à venir')}
        >
          <View style={styles.legalContent}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.textSecondary} />
            <Text style={styles.legalText}>Politique de confidentialité</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textDisabled} />
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
          <Ionicons name="log-out-outline" size={24} color={Colors.error} />
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
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <AdminScreen />
        </View>
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
    fontWeight: Typography.weight.bold,
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
    backgroundColor: Colors.surface,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    fontFamily: Typography.fontFamily.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  // === INFO ROW ===
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoContent: {
    flex: 1,
  },
  infoIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  infoLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
  editButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
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
    fontWeight: Typography.weight.semiBold,
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
    fontWeight: Typography.weight.semiBold,
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
    fontWeight: Typography.weight.bold,
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
    fontWeight: Typography.weight.semiBold,
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
    fontWeight: Typography.weight.semiBold,
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
    fontWeight: Typography.weight.semiBold,
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
});