import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../config/supabase';
import { Colors, Spacing, Typography, BorderRadius, CommonStyles, Layout } from '../theme';
import { useHasEntreprise } from '../hooks/useHasEntreprise';
import FormInput from '../components/FormInput';
import HorairesSelector from '../components/HorairesSelector';
import ImageUploader from '../components/ImageUploader';
import DraggableList from '../components/DraggableList';
import {
  validateEmail,
  validatePhone,
  validateWebsite,
  ensureUrlProtocol,
} from '../utils/validation';
import type { Database } from '../types/database.types';

type Entreprise = Database['public']['Tables']['entreprises']['Row'];
type EntreprisePhoto = Database['public']['Tables']['entreprises_photos']['Row'];
type CategoriePrestation = Database['public']['Tables']['categories_prestations']['Row'];
type PrestationEntreprise = Database['public']['Tables']['prestations_entreprise']['Row'];
type CategorieFaq = Database['public']['Tables']['categories_faq']['Row'];
type FaqEntreprise = Database['public']['Tables']['faq_entreprise']['Row'];

type Tab = 'dashboard' | 'infos' | 'photos' | 'prestations' | 'faq';

export default function EntrepriseManagementScreen() {
  const { entrepriseId, loading: loadingEntreprise } = useHasEntreprise();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entrepriseId) {
      loadEntrepriseData();
    }
  }, [entrepriseId]);

  const loadEntrepriseData = async () => {
    try {
      const { data, error } = await supabase
        .from('entreprises')
        .select('*')
        .eq('id', entrepriseId)
        .single();

      if (error) throw error;
      setEntreprise(data);
    } catch (err) {
      console.error('Erreur chargement entreprise:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les données',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingEntreprise || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!entreprise) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Entreprise introuvable</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header sticky */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {entreprise.logo_url && (
            <Image
              source={{ uri: entreprise.logo_url }}
              style={styles.headerLogo}
            />
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{entreprise.nom_commercial}</Text>
            <Text style={styles.headerSubtitle}>Gestion de votre entreprise</Text>
          </View>
        </View>

        {/* Stats CA */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>CA généré</Text>
            <Text style={styles.statValue}>45 000 €</Text>
          </View>
        </View>

        {/* Onglets */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
            onPress={() => setActiveTab('dashboard')}
          >
            <Feather
              name="bar-chart-2"
              size={18}
              color={activeTab === 'dashboard' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'dashboard' && styles.tabTextActive,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'infos' && styles.tabActive]}
            onPress={() => setActiveTab('infos')}
          >
            <Feather
              name="info"
              size={18}
              color={activeTab === 'infos' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'infos' && styles.tabTextActive]}
            >
              Infos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
            onPress={() => setActiveTab('photos')}
          >
            <Feather
              name="image"
              size={18}
              color={activeTab === 'photos' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'photos' && styles.tabTextActive,
              ]}
            >
              Photos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'prestations' && styles.tabActive]}
            onPress={() => setActiveTab('prestations')}
          >
            <Feather
              name="package"
              size={18}
              color={activeTab === 'prestations' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'prestations' && styles.tabTextActive,
              ]}
            >
              Prestations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'faq' && styles.tabActive]}
            onPress={() => setActiveTab('faq')}
          >
            <Feather
              name="help-circle"
              size={18}
              color={activeTab === 'faq' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}
            >
              FAQ
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contenu des onglets */}
      <ScrollView style={styles.content}>
        {activeTab === 'dashboard' && (
          <DashboardTab entreprise={entreprise} />
        )}
        {activeTab === 'infos' && (
          <InfosTab entreprise={entreprise} onUpdate={loadEntrepriseData} />
        )}
        {activeTab === 'photos' && (
          <PhotosTab entrepriseId={entrepriseId!} entreprise={entreprise} onUpdate={loadEntrepriseData} />
        )}
        {activeTab === 'prestations' && (
          <PrestationsTab entrepriseId={entrepriseId!} />
        )}
        {activeTab === 'faq' && <FaqTab entrepriseId={entrepriseId!} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== DASHBOARD TAB =====
function DashboardTab({ entreprise }: { entreprise: Entreprise }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Statistiques</Text>
      <View style={styles.dashboardCard}>
        <Feather name="trending-up" size={32} color={Colors.success} />
        <Text style={styles.dashboardCardTitle}>Chiffre d'affaires généré</Text>
        <Text style={styles.dashboardCardValue}>45 000 €</Text>
        <Text style={styles.dashboardCardSubtitle}>Depuis le début</Text>
      </View>

      <Text style={styles.sectionTitle}>Informations rapides</Text>
      <View style={styles.quickInfoCard}>
        <View style={styles.quickInfoRow}>
          <Feather name="briefcase" size={20} color={Colors.textSecondary} />
          <Text style={styles.quickInfoLabel}>Nom</Text>
          <Text style={styles.quickInfoValue}>{entreprise.nom_commercial}</Text>
        </View>
        {entreprise.telephone && (
          <View style={styles.quickInfoRow}>
            <Feather name="phone" size={20} color={Colors.textSecondary} />
            <Text style={styles.quickInfoLabel}>Téléphone</Text>
            <Text style={styles.quickInfoValue}>{entreprise.telephone}</Text>
          </View>
        )}
        {entreprise.email && (
          <View style={styles.quickInfoRow}>
            <Feather name="mail" size={20} color={Colors.textSecondary} />
            <Text style={styles.quickInfoLabel}>Email</Text>
            <Text style={styles.quickInfoValue}>{entreprise.email}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ===== INFOS TAB =====
function InfosTab({
  entreprise,
  onUpdate,
}: {
  entreprise: Entreprise;
  onUpdate: () => void;
}) {
  const [form, setForm] = useState({
    nom: entreprise.nom_commercial || '',
    description: entreprise.description || '',
    adresse: entreprise.adresse || '',
    telephone: entreprise.telephone || '',
    email: entreprise.email || '',
    site_web: entreprise.site_web || '',
    horaires: entreprise.horaires || '',
    type_commission: entreprise.type_commission || 'montant_fixe',
    valeur_commission: entreprise.valeur_commission?.toString() || '',
    texte_commission: entreprise.texte_commission || '',
    type_recommandation_autorise: entreprise.type_recommandation_autorise || 'les_deux',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (form.email && !validateEmail(form.email)) {
      newErrors.email = 'Email invalide';
    }

    if (form.telephone && !validatePhone(form.telephone)) {
      newErrors.telephone = 'Téléphone invalide';
    }

    if (form.site_web && !validateWebsite(form.site_web)) {
      newErrors.site_web = 'URL invalide';
    }

    if (!form.valeur_commission || parseFloat(form.valeur_commission) <= 0) {
      newErrors.valeur_commission = 'La valeur de commission est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez corriger les erreurs',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('entreprises')
        .update({
          nom_commercial: form.nom,
          description: form.description,
          adresse: form.adresse,
          telephone: form.telephone,
          email: form.email,
          site_web: form.site_web ? ensureUrlProtocol(form.site_web) : null,
          horaires: form.horaires,
          type_commission: form.type_commission,
          valeur_commission: parseFloat(form.valeur_commission),
          texte_commission: form.texte_commission || null,
          type_recommandation_autorise: form.type_recommandation_autorise,
        })
        .eq('id', entreprise.id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'Informations enregistrées',
      });
      onUpdate();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'enregistrer',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      nom: entreprise.nom_commercial || '',
      description: entreprise.description || '',
      adresse: entreprise.adresse || '',
      telephone: entreprise.telephone || '',
      email: entreprise.email || '',
      site_web: entreprise.site_web || '',
      horaires: entreprise.horaires || '',
      type_commission: entreprise.type_commission || 'montant_fixe',
      valeur_commission: entreprise.valeur_commission?.toString() || '',
      texte_commission: entreprise.texte_commission || '',
      type_recommandation_autorise: entreprise.type_recommandation_autorise || 'les_deux',
    });
    setErrors({});
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Informations générales</Text>

      <FormInput
        label="Nom de l'entreprise"
        value={form.nom}
        onChangeText={(text) => setForm({ ...form, nom: text })}
        error={errors.nom}
        required
      />

      <FormInput
        label="Description"
        value={form.description}
        onChangeText={(text) => setForm({ ...form, description: text })}
        multiline
        numberOfLines={4}
      />

      <FormInput
        label="Adresse"
        value={form.adresse}
        onChangeText={(text) => setForm({ ...form, adresse: text })}
        multiline
        numberOfLines={2}
      />

      <FormInput
        label="Téléphone"
        value={form.telephone}
        onChangeText={(text) => setForm({ ...form, telephone: text })}
        error={errors.telephone}
        keyboardType="phone-pad"
      />

      <FormInput
        label="Email"
        value={form.email}
        onChangeText={(text) => setForm({ ...form, email: text })}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormInput
        label="Site web"
        value={form.site_web}
        onChangeText={(text) => setForm({ ...form, site_web: text })}
        error={errors.site_web}
        keyboardType="url"
        autoCapitalize="none"
      />

      <HorairesSelector
        value={form.horaires}
        onChange={(value) => setForm({ ...form, horaires: value })}
      />

      {/* Commission */}
      <Text style={styles.sectionTitle}>Commission</Text>

      <Text style={styles.fieldLabel}>Type de commission</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={[
            styles.radioOption,
            form.type_commission === 'montant_fixe' && styles.radioOptionActive,
          ]}
          onPress={() => setForm({ ...form, type_commission: 'montant_fixe' })}
        >
          <View style={styles.radioCircle}>
            {form.type_commission === 'montant_fixe' && (
              <View style={styles.radioCircleInner} />
            )}
          </View>
          <Text
            style={[
              styles.radioLabel,
              form.type_commission === 'montant_fixe' && styles.radioLabelActive,
            ]}
          >
            Montant fixe (€)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.radioOption,
            form.type_commission === 'pourcentage' && styles.radioOptionActive,
          ]}
          onPress={() => setForm({ ...form, type_commission: 'pourcentage' })}
        >
          <View style={styles.radioCircle}>
            {form.type_commission === 'pourcentage' && (
              <View style={styles.radioCircleInner} />
            )}
          </View>
          <Text
            style={[
              styles.radioLabel,
              form.type_commission === 'pourcentage' && styles.radioLabelActive,
            ]}
          >
            Pourcentage (%)
          </Text>
        </TouchableOpacity>
      </View>

      <FormInput
        label={
          form.type_commission === 'montant_fixe'
            ? 'Valeur de la commission (€)'
            : 'Valeur de la commission (%)'
        }
        value={form.valeur_commission}
        onChangeText={(text) => setForm({ ...form, valeur_commission: text })}
        error={errors.valeur_commission}
        keyboardType="decimal-pad"
        required
      />

      <FormInput
        label="Description de la commission"
        value={form.texte_commission}
        onChangeText={(text) => setForm({ ...form, texte_commission: text })}
        multiline
        numberOfLines={3}
        placeholder="Ex: Commission versée après validation de la vente"
      />

      <Text style={styles.fieldLabel}>Type de recommandation autorisée</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={[
            styles.radioOption,
            form.type_recommandation_autorise === 'photo' && styles.radioOptionActive,
          ]}
          onPress={() => setForm({ ...form, type_recommandation_autorise: 'photo' })}
        >
          <View style={styles.radioCircle}>
            {form.type_recommandation_autorise === 'photo' && (
              <View style={styles.radioCircleInner} />
            )}
          </View>
          <Text
            style={[
              styles.radioLabel,
              form.type_recommandation_autorise === 'photo' && styles.radioLabelActive,
            ]}
          >
            Photo uniquement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.radioOption,
            form.type_recommandation_autorise === 'formulaire' &&
              styles.radioOptionActive,
          ]}
          onPress={() =>
            setForm({ ...form, type_recommandation_autorise: 'formulaire' })
          }
        >
          <View style={styles.radioCircle}>
            {form.type_recommandation_autorise === 'formulaire' && (
              <View style={styles.radioCircleInner} />
            )}
          </View>
          <Text
            style={[
              styles.radioLabel,
              form.type_recommandation_autorise === 'formulaire' &&
                styles.radioLabelActive,
            ]}
          >
            Formulaire uniquement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.radioOption,
            form.type_recommandation_autorise === 'les_deux' &&
              styles.radioOptionActive,
          ]}
          onPress={() => setForm({ ...form, type_recommandation_autorise: 'les_deux' })}
        >
          <View style={styles.radioCircle}>
            {form.type_recommandation_autorise === 'les_deux' && (
              <View style={styles.radioCircleInner} />
            )}
          </View>
          <Text
            style={[
              styles.radioLabel,
              form.type_recommandation_autorise === 'les_deux' &&
                styles.radioLabelActive,
            ]}
          >
            Les deux
          </Text>
        </TouchableOpacity>
      </View>

      {/* Boutons */}
      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleCancel}
          disabled={saving}
        >
          <Text style={styles.buttonSecondaryText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonPrimary, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Text style={styles.buttonPrimaryText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===== PHOTOS TAB =====
function PhotosTab({
  entrepriseId,
  entreprise,
  onUpdate,
}: {
  entrepriseId: string;
  entreprise: Entreprise;
  onUpdate: () => void;
}) {
  const [photos, setPhotos] = useState<EntreprisePhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('entreprises_photos')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .order('ordre_affichage', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (err) {
      console.error('Erreur chargement photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const uploadLogo = async (uri: string) => {
    setUploadingLogo(true);
    try {
      const fileName = `${entrepriseId}-${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('entreprises-logos')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('entreprises-logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('entreprises')
        .update({ logo_url: publicUrl.publicUrl })
        .eq('id', entrepriseId);

      if (updateError) throw updateError;

      Toast.show({
        type: 'success',
        text1: 'Logo uploadé',
      });
      onUpdate();
    } catch (err) {
      console.error('Erreur upload logo:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'uploader le logo',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    Alert.alert('Supprimer le logo', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('entreprises')
              .update({ logo_url: null })
              .eq('id', entrepriseId);

            if (error) throw error;
            onUpdate();
          } catch (err) {
            console.error('Erreur suppression logo:', err);
          }
        },
      },
    ]);
  };

  const uploadPhoto = async (uri: string) => {
    if (photos.length >= 8) {
      Toast.show({
        type: 'error',
        text1: 'Limite atteinte',
        text2: 'Maximum 8 photos',
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileName = `${entrepriseId}-${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('entreprises-photos')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('entreprises-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('entreprises_photos')
        .insert({
          entreprise_id: entrepriseId,
          photo_url: publicUrl.publicUrl,
          ordre_affichage: photos.length + 1,
        });

      if (insertError) throw insertError;

      Toast.show({
        type: 'success',
        text1: 'Photo ajoutée',
      });
      loadPhotos();
    } catch (err) {
      console.error('Erreur upload photo:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'uploader la photo',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    Alert.alert('Supprimer la photo', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('entreprises_photos')
              .delete()
              .eq('id', photoId);

            if (error) throw error;
            loadPhotos();
          } catch (err) {
            console.error('Erreur suppression photo:', err);
          }
        },
      },
    ]);
  };

  const reorderPhotos = async (newPhotos: EntreprisePhoto[]) => {
    setPhotos(newPhotos);

    // Mettre à jour l'ordre dans la DB
    try {
      const updates = newPhotos.map((photo, index) => ({
        id: photo.id,
        ordre_affichage: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('entreprises_photos')
          .update({ ordre_affichage: update.ordre_affichage })
          .eq('id', update.id);
      }
    } catch (err) {
      console.error('Erreur réorganisation photos:', err);
    }
  };

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Logo</Text>
      <ImageUploader
        label="Logo de l'entreprise"
        imageUri={entreprise.logo_url}
        onImageSelected={uploadLogo}
        onImageRemoved={removeLogo}
        loading={uploadingLogo}
        aspectRatio={[1, 1]}
        maxImages={1}
      />

      <Text style={styles.sectionTitle}>Photos ({photos.length}/8)</Text>
      {photos.length < 8 && (
        <ImageUploader
          label="Ajouter une photo"
          imageUri={null}
          onImageSelected={uploadPhoto}
          onImageRemoved={() => {}}
          loading={uploadingPhoto}
          aspectRatio={[16, 9]}
          maxImages={8}
        />
      )}

      {loadingPhotos ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <DraggableList
          data={photos}
          onReorder={reorderPhotos}
          renderItem={(photo) => (
            <Image source={{ uri: photo.photo_url }} style={styles.photoThumb} />
          )}
          onDelete={(photo) => deletePhoto(photo.id)}
          emptyText="Aucune photo"
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

// ===== PRESTATIONS TAB =====
function PrestationsTab({ entrepriseId }: { entrepriseId: string }) {
  const [categories, setCategories] = useState<CategoriePrestation[]>([]);
  const [prestations, setPrestations] = useState<PrestationEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'categorie' | 'prestation'>('categorie');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catData, prestData] = await Promise.all([
        supabase
          .from('categories_prestations')
          .select('*')
          .eq('entreprise_id', entrepriseId)
          .order('ordre', { ascending: true }),
        supabase
          .from('prestations_entreprise')
          .select('*')
          .eq('entreprise_id', entrepriseId)
          .order('ordre', { ascending: true }),
      ]);

      setCategories(catData.data || []);
      setPrestations(prestData.data || []);
    } catch (err) {
      console.error('Erreur chargement prestations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCategorieModal = (categorie?: CategoriePrestation) => {
    setModalType('categorie');
    setEditingItem(categorie || null);
    setModalVisible(true);
  };

  const openPrestationModal = (categorieId: string, prestation?: PrestationEntreprise) => {
    setModalType('prestation');
    setSelectedCategorie(categorieId);
    setEditingItem(prestation || null);
    setModalVisible(true);
  };

  const deleteCategorie = async (id: string) => {
    Alert.alert('Supprimer la catégorie', 'Toutes les prestations seront supprimées', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('categories_prestations').delete().eq('id', id);
            loadData();
          } catch (err) {
            console.error('Erreur suppression:', err);
          }
        },
      },
    ]);
  };

  const deletePrestation = async (id: string) => {
    Alert.alert('Supprimer la prestation', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('prestations_entreprise').delete().eq('id', id);
            loadData();
          } catch (err) {
            console.error('Erreur suppression:', err);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Catégories de prestations</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openCategorieModal()}
        >
          <Feather name="plus" size={20} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.categorieContainer}>
              <View style={styles.categorieHeader}>
                <Text style={styles.categorieTitle}>{cat.nom}</Text>
                <View style={styles.categorieActions}>
                  <TouchableOpacity onPress={() => openCategorieModal(cat)}>
                    <Feather name="edit-2" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCategorie(cat.id)}>
                    <Feather name="trash-2" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Prestations de cette catégorie */}
              <View style={styles.prestationsContainer}>
                {prestations
                  .filter((p) => p.categorie_id === cat.id)
                  .map((prestation) => (
                    <View key={prestation.id} style={styles.prestationItem}>
                      <View style={styles.prestationContent}>
                        <Text style={styles.prestationNom}>{prestation.nom}</Text>
                        {prestation.description && (
                          <Text style={styles.prestationDescription}>
                            {prestation.description}
                          </Text>
                        )}
                        {prestation.prix && (
                          <Text style={styles.prestationPrix}>{prestation.prix} €</Text>
                        )}
                      </View>
                      <View style={styles.prestationActions}>
                        <TouchableOpacity
                          onPress={() => openPrestationModal(cat.id, prestation)}
                        >
                          <Feather name="edit-2" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deletePrestation(prestation.id)}
                        >
                          <Feather name="trash-2" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                <TouchableOpacity
                  style={styles.addPrestationButton}
                  onPress={() => openPrestationModal(cat.id)}
                >
                  <Feather name="plus" size={16} color={Colors.primary} />
                  <Text style={styles.addPrestationText}>Ajouter une prestation</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {categories.length === 0 && (
            <Text style={styles.placeholderText}>
              Aucune catégorie. Cliquez sur + pour en ajouter.
            </Text>
          )}
        </>
      )}

      <PrestationModal
        visible={modalVisible}
        type={modalType}
        editingItem={editingItem}
        entrepriseId={entrepriseId}
        categorieId={selectedCategorie}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
          setSelectedCategorie(null);
        }}
        onSave={loadData}
      />
    </View>
  );
}

// ===== FAQ TAB =====
function FaqTab({ entrepriseId }: { entrepriseId: string }) {
  const [categories, setCategories] = useState<CategorieFaq[]>([]);
  const [faqs, setFaqs] = useState<FaqEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'categorie' | 'faq'>('categorie');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catData, faqData] = await Promise.all([
        supabase
          .from('categories_faq')
          .select('*')
          .eq('entreprise_id', entrepriseId)
          .order('ordre', { ascending: true }),
        supabase
          .from('faq_entreprise')
          .select('*')
          .eq('entreprise_id', entrepriseId)
          .order('ordre', { ascending: true }),
      ]);

      setCategories(catData.data || []);
      setFaqs(faqData.data || []);
    } catch (err) {
      console.error('Erreur chargement FAQ:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCategorieModal = (categorie?: CategorieFaq) => {
    setModalType('categorie');
    setEditingItem(categorie || null);
    setModalVisible(true);
  };

  const openFaqModal = (categorieId: string, faq?: FaqEntreprise) => {
    setModalType('faq');
    setSelectedCategorie(categorieId);
    setEditingItem(faq || null);
    setModalVisible(true);
  };

  const deleteCategorie = async (id: string) => {
    Alert.alert('Supprimer la catégorie', 'Toutes les questions seront supprimées', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('categories_faq').delete().eq('id', id);
            loadData();
          } catch (err) {
            console.error('Erreur suppression:', err);
          }
        },
      },
    ]);
  };

  const deleteFaq = async (id: string) => {
    Alert.alert('Supprimer la question', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('faq_entreprise').delete().eq('id', id);
            loadData();
          } catch (err) {
            console.error('Erreur suppression:', err);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Catégories FAQ</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openCategorieModal()}
        >
          <Feather name="plus" size={20} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.categorieContainer}>
              <View style={styles.categorieHeader}>
                <Text style={styles.categorieTitle}>{cat.nom}</Text>
                <View style={styles.categorieActions}>
                  <TouchableOpacity onPress={() => openCategorieModal(cat)}>
                    <Feather name="edit-2" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCategorie(cat.id)}>
                    <Feather name="trash-2" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Questions de cette catégorie */}
              <View style={styles.prestationsContainer}>
                {faqs
                  .filter((f) => f.categorie_id === cat.id)
                  .map((faq) => (
                    <View key={faq.id} style={styles.faqItem}>
                      <View style={styles.faqContent}>
                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                        <Text style={styles.faqReponse}>{faq.reponse}</Text>
                      </View>
                      <View style={styles.prestationActions}>
                        <TouchableOpacity onPress={() => openFaqModal(cat.id, faq)}>
                          <Feather name="edit-2" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteFaq(faq.id)}>
                          <Feather name="trash-2" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                <TouchableOpacity
                  style={styles.addPrestationButton}
                  onPress={() => openFaqModal(cat.id)}
                >
                  <Feather name="plus" size={16} color={Colors.primary} />
                  <Text style={styles.addPrestationText}>Ajouter une question</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {categories.length === 0 && (
            <Text style={styles.placeholderText}>
              Aucune catégorie. Cliquez sur + pour en ajouter.
            </Text>
          )}
        </>
      )}

      <FaqModal
        visible={modalVisible}
        type={modalType}
        editingItem={editingItem}
        entrepriseId={entrepriseId}
        categorieId={selectedCategorie}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
          setSelectedCategorie(null);
        }}
        onSave={loadData}
      />
    </View>
  );
}

// ===== PRESTATION MODAL =====
function PrestationModal({
  visible,
  type,
  editingItem,
  entrepriseId,
  categorieId,
  onClose,
  onSave,
}: {
  visible: boolean;
  type: 'categorie' | 'prestation';
  editingItem: any;
  entrepriseId: string;
  categorieId: string | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    nom: '',
    description: '',
    prix: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingItem) {
        setForm({
          nom: editingItem.nom || '',
          description: editingItem.description || '',
          prix: editingItem.prix?.toString() || '',
        });
      } else {
        setForm({ nom: '', description: '', prix: '' });
      }
    }
  }, [visible, editingItem]);

  const handleSave = async () => {
    if (!form.nom.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Le nom est requis',
      });
      return;
    }

    setSaving(true);
    try {
      if (type === 'categorie') {
        if (editingItem) {
          await supabase
            .from('categories_prestations')
            .update({ nom: form.nom })
            .eq('id', editingItem.id);
        } else {
          await supabase.from('categories_prestations').insert({
            entreprise_id: entrepriseId,
            nom: form.nom,
            ordre: 999,
          });
        }
      } else {
        const data: any = {
          nom: form.nom,
          description: form.description || null,
          prix: form.prix ? parseFloat(form.prix) : null,
        };

        if (editingItem) {
          await supabase
            .from('prestations_entreprise')
            .update(data)
            .eq('id', editingItem.id);
        } else {
          await supabase.from('prestations_entreprise').insert({
            ...data,
            entreprise_id: entrepriseId,
            categorie_id: categorieId,
            ordre: 999,
          });
        }
      }

      Toast.show({
        type: 'success',
        text1: editingItem ? 'Modifié' : 'Ajouté',
      });
      onSave();
      onClose();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>
              {type === 'categorie'
                ? editingItem
                  ? 'Modifier la catégorie'
                  : 'Nouvelle catégorie'
                : editingItem
                  ? 'Modifier la prestation'
                  : 'Nouvelle prestation'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.content}>
            <FormInput
              label="Nom"
              value={form.nom}
              onChangeText={(text) => setForm({ ...form, nom: text })}
              required
            />

            {type === 'prestation' && (
              <>
                <FormInput
                  label="Description"
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                  numberOfLines={3}
                />

                <FormInput
                  label="Prix (€)"
                  value={form.prix}
                  onChangeText={(text) => setForm({ ...form, prix: text })}
                  keyboardType="decimal-pad"
                />
              </>
            )}
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.buttonSecondary]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={modalStyles.buttonSecondaryText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modalStyles.button, modalStyles.buttonPrimary]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Text style={modalStyles.buttonPrimaryText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ===== FAQ MODAL =====
function FaqModal({
  visible,
  type,
  editingItem,
  entrepriseId,
  categorieId,
  onClose,
  onSave,
}: {
  visible: boolean;
  type: 'categorie' | 'faq';
  editingItem: any;
  entrepriseId: string;
  categorieId: string | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    nom: '',
    question: '',
    reponse: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingItem) {
        setForm({
          nom: editingItem.nom || '',
          question: editingItem.question || '',
          reponse: editingItem.reponse || '',
        });
      } else {
        setForm({ nom: '', question: '', reponse: '' });
      }
    }
  }, [visible, editingItem]);

  const handleSave = async () => {
    if (type === 'categorie' && !form.nom.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Le nom est requis',
      });
      return;
    }

    if (type === 'faq' && (!form.question.trim() || !form.reponse.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Question et réponse requises',
      });
      return;
    }

    setSaving(true);
    try {
      if (type === 'categorie') {
        if (editingItem) {
          await supabase
            .from('categories_faq')
            .update({ nom: form.nom })
            .eq('id', editingItem.id);
        } else {
          await supabase.from('categories_faq').insert({
            entreprise_id: entrepriseId,
            nom: form.nom,
            ordre: 999,
          });
        }
      } else {
        const data = {
          question: form.question,
          reponse: form.reponse,
        };

        if (editingItem) {
          await supabase.from('faq_entreprise').update(data).eq('id', editingItem.id);
        } else {
          await supabase.from('faq_entreprise').insert({
            ...data,
            entreprise_id: entrepriseId,
            categorie_id: categorieId,
            ordre: 999,
          });
        }
      }

      Toast.show({
        type: 'success',
        text1: editingItem ? 'Modifié' : 'Ajouté',
      });
      onSave();
      onClose();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>
              {type === 'categorie'
                ? editingItem
                  ? 'Modifier la catégorie'
                  : 'Nouvelle catégorie'
                : editingItem
                  ? 'Modifier la question'
                  : 'Nouvelle question'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.content}>
            {type === 'categorie' ? (
              <FormInput
                label="Nom"
                value={form.nom}
                onChangeText={(text) => setForm({ ...form, nom: text })}
                required
              />
            ) : (
              <>
                <FormInput
                  label="Question"
                  value={form.question}
                  onChangeText={(text) => setForm({ ...form, question: text })}
                  multiline
                  numberOfLines={2}
                  required
                />

                <FormInput
                  label="Réponse"
                  value={form.reponse}
                  onChangeText={(text) => setForm({ ...form, reponse: text })}
                  multiline
                  numberOfLines={4}
                  required
                />
              </>
            )}
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.buttonSecondary]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={modalStyles.buttonSecondaryText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modalStyles.button, modalStyles.buttonPrimary]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Text style={modalStyles.buttonPrimaryText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonPrimaryText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.surface,
  },
  buttonSecondaryText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
});

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.lg,
    color: Colors.error,
    marginTop: Spacing.md,
  },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  headerLogo: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  statCard: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.surface,
  },
  statValue: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.bold,
    color: Colors.surface,
    marginTop: Spacing.xs,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  dashboardCard: {
    ...CommonStyles.card,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dashboardCardTitle: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  dashboardCardValue: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.huge,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  dashboardCardSubtitle: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  quickInfoCard: {
    ...CommonStyles.card,
  },
  quickInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  quickInfoLabel: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    flex: 1,
  },
  quickInfoValue: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.semiBold,
    flex: 2,
  },
  commissionCard: {
    ...CommonStyles.card,
    backgroundColor: Colors.backgroundLight,
    marginBottom: Spacing.xl,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  commissionLabel: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
  },
  commissionValue: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.semiBold,
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  buttonPrimary: {
    ...CommonStyles.buttonPrimary,
    flex: 1,
  },
  buttonSecondary: {
    ...CommonStyles.buttonSecondary,
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPrimaryText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.surface,
  },
  buttonSecondaryText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
  fieldLabel: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  radioGroup: {
    marginBottom: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  radioOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    flex: 1,
  },
  radioLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  photoThumb: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.sm,
    resizeMode: 'cover',
  },
  placeholderText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categorieContainer: {
    ...CommonStyles.card,
    marginBottom: Spacing.lg,
  },
  categorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categorieTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  categorieActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  prestationsContainer: {
    marginTop: Spacing.md,
  },
  prestationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  prestationContent: {
    flex: 1,
  },
  prestationNom: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
  prestationDescription: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  prestationPrix: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  prestationActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginLeft: Spacing.md,
  },
  addPrestationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  addPrestationText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  faqContent: {
    flex: 1,
  },
  faqQuestion: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
  faqReponse: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
