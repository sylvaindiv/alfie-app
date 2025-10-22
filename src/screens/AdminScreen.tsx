import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import {
  CategorieEntreprise,
  SousCategorieEntreprise,
  Entreprise,
  EntrepriseCategorie,
} from '../types/database.types';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  CommonStyles,
} from '../theme';

type TabType = 'categories' | 'entreprises';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [loading, setLoading] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<CategorieEntreprise[]>([]);
  const [sousCategories, setSousCategories] = useState<
    SousCategorieEntreprise[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [categoriesUsageCount, setCategoriesUsageCount] = useState<
    Record<string, number>
  >({});
  const [sousCategoriesUsageCount, setSousCategoriesUsageCount] = useState<
    Record<string, number>
  >({});

  // Entreprises state
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [selectedEntreprise, setSelectedEntreprise] =
    useState<Entreprise | null>(null);
  const [editablePhotos, setEditablePhotos] = useState<any[]>([]);
  const [entrepriseCategories, setEntrepriseCategories] = useState<
    EntrepriseCategorie[]
  >([]);
  const [newSousCategorieInputs, setNewSousCategorieInputs] = useState<
    Record<string, string>
  >({});
  const [showCategoriesToggle, setShowCategoriesToggle] = useState<
    Record<string, boolean>
  >({});
  const [entrepriseFirstPhotos, setEntrepriseFirstPhotos] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    loadCategories();
    loadEntreprises();
  }, []);

  // Charger les premières photos des entreprises
  useEffect(() => {
    const loadFirstPhotos = async () => {
      const photosMap: Record<string, string> = {};

      for (const ent of entreprises) {
        const { data, error } = await supabase
          .from('entreprises_photos')
          .select('photo_url')
          .eq('entreprise_id', ent.id)
          .order('ordre_affichage', { ascending: true })
          .limit(1)
          .single();

        if (!error && data?.photo_url) {
          photosMap[ent.id] = data.photo_url;
        }
      }

      setEntrepriseFirstPhotos(photosMap);
    };

    if (entreprises.length > 0) {
      loadFirstPhotos();
    }
  }, [entreprises]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data: cats, error: catsError } = await supabase
        .from('categories_entreprise')
        .select('*')
        .order('ordre_affichage', { ascending: true });

      const { data: sousCats, error: sousCatsError } = await supabase
        .from('sous_categories_entreprise')
        .select('*')
        .order('ordre_affichage', { ascending: true });

      if (catsError) throw catsError;
      if (sousCatsError) throw sousCatsError;

      setCategories(cats || []);
      setSousCategories(sousCats || []);

      // Charger les compteurs d'utilisation
      const { data: allEntreprises, error: entError } = await supabase
        .from('entreprises')
        .select('categorie_id, sous_categorie_id');

      if (!entError && allEntreprises) {
        // Compter les catégories
        const catCount: Record<string, number> = {};
        const scCount: Record<string, number> = {};

        allEntreprises.forEach((ent) => {
          if (ent.categorie_id) {
            catCount[ent.categorie_id] = (catCount[ent.categorie_id] || 0) + 1;
          }
          if (ent.sous_categorie_id) {
            scCount[ent.sous_categorie_id] =
              (scCount[ent.sous_categorie_id] || 0) + 1;
          }
        });

        setCategoriesUsageCount(catCount);
        setSousCategoriesUsageCount(scCount);
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  const loadEntreprises = async () => {
    try {
      const { data, error } = await supabase
        .from('entreprises')
        .select('*')
        .order('nom_commercial', { ascending: true });

      if (error) throw error;
      setEntreprises(data || []);
    } catch (error) {
      console.error('Erreur chargement entreprises:', error);
      Alert.alert('Erreur', 'Impossible de charger les entreprises');
    }
  };

  const loadEntreprisePhotos = async (entrepriseId: string) => {
    try {
      const { data, error } = await supabase
        .from('entreprises_photos')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .order('ordre_affichage', { ascending: true});

      if (error) throw error;
      setEditablePhotos(data || []);
    } catch (error) {
      console.error('Erreur chargement photos:', error);
      Alert.alert('Erreur', 'Impossible de charger les photos');
    }
  };

  const loadEntrepriseCategories = async (entrepriseId: string) => {
    try {
      const { data, error } = await supabase
        .from('entreprises_categories')
        .select('*')
        .eq('entreprise_id', entrepriseId);

      if (error) throw error;
      setEntrepriseCategories(data || []);
    } catch (error) {
      console.error('Erreur chargement catégories entreprise:', error);
      // Si la table n'existe pas encore, ne pas afficher d'erreur
      if (error.code !== 'PGRST116') {
        Alert.alert('Erreur', 'Impossible de charger les catégories');
      }
      setEntrepriseCategories([]);
    }
  };

  const updateCategory = async (
    categoryId: string,
    updates: Partial<CategorieEntreprise>
  ) => {
    try {
      const { error } = await supabase
        .from('categories_entreprise')
        .update(updates)
        .eq('id', categoryId);

      if (error) throw error;
      await loadCategories();
      Alert.alert('Succès', 'Catégorie mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour catégorie:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la catégorie');
    }
  };

  const saveCategoryWithSubCategories = async (categoryId: string) => {
    try {
      // Trouver la catégorie
      const category = categories.find((c) => c.id === categoryId);
      if (!category) return;

      // Sauvegarder la catégorie
      const { error: catError } = await supabase
        .from('categories_entreprise')
        .update({
          nom: category.nom,
          ordre_affichage: category.ordre_affichage,
        })
        .eq('id', categoryId);

      if (catError) throw catError;

      // Sauvegarder toutes les sous-catégories de cette catégorie
      const filteredSousCategories = sousCategories.filter(
        (sc) => sc.categorie_id === categoryId
      );

      for (const sousCat of filteredSousCategories) {
        const { error: scError } = await supabase
          .from('sous_categories_entreprise')
          .update({
            nom: sousCat.nom,
            ordre_affichage: sousCat.ordre_affichage,
          })
          .eq('id', sousCat.id);

        if (scError) throw scError;
      }

      await loadCategories();
      Alert.alert('Succès', 'Catégorie et sous-catégories sauvegardées');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    }
  };

  const updateSousCategory = async (
    sousCategoryId: string,
    updates: Partial<SousCategorieEntreprise>
  ) => {
    try {
      const { error } = await supabase
        .from('sous_categories_entreprise')
        .update(updates)
        .eq('id', sousCategoryId);

      if (error) throw error;
      await loadCategories();
      Alert.alert('Succès', 'Sous-catégorie mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour sous-catégorie:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la sous-catégorie');
    }
  };

  const createCategory = async () => {
    try {
      const maxOrdre = Math.max(...categories.map((c) => c.ordre_affichage), 0);
      const { error } = await supabase
        .from('categories_entreprise')
        .insert({
          nom: 'Nouvelle catégorie',
          ordre_affichage: maxOrdre + 1,
          statut: 'active',
        });

      if (error) throw error;
      await loadCategories();
      Alert.alert('Succès', 'Catégorie créée');
    } catch (error) {
      console.error('Erreur création catégorie:', error);
      Alert.alert('Erreur', 'Impossible de créer la catégorie');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      // Vérifier si des entreprises utilisent cette catégorie
      const { data: entreprisesUsingCategory, error: checkError } =
        await supabase
          .from('entreprises')
          .select('id')
          .eq('categorie_id', categoryId);

      if (checkError) throw checkError;

      if (entreprisesUsingCategory && entreprisesUsingCategory.length > 0) {
        Alert.alert(
          'Suppression impossible',
          `Cette catégorie est utilisée par ${entreprisesUsingCategory.length} entreprise(s). Veuillez d'abord modifier ou supprimer ces entreprises.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Vérifier si des sous-catégories existent
      const { data: sousCategs, error: scError } = await supabase
        .from('sous_categories_entreprise')
        .select('id')
        .eq('categorie_id', categoryId);

      if (scError) throw scError;

      const message =
        sousCategs && sousCategs.length > 0
          ? `Cette catégorie contient ${sousCategs.length} sous-catégorie(s). Elles seront également supprimées. Êtes-vous sûr ?`
          : 'Êtes-vous sûr de vouloir supprimer cette catégorie ?';

      Alert.alert('Supprimer la catégorie', message, [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Supprimer d'abord les sous-catégories
              if (sousCategs && sousCategs.length > 0) {
                const { error: deleteScError } = await supabase
                  .from('sous_categories_entreprise')
                  .delete()
                  .eq('categorie_id', categoryId);

                if (deleteScError) throw deleteScError;
              }

              // Puis supprimer la catégorie
              const { error } = await supabase
                .from('categories_entreprise')
                .delete()
                .eq('id', categoryId);

              if (error) throw error;
              await loadCategories();
              Alert.alert('Succès', 'Catégorie supprimée');
            } catch (error: any) {
              console.error('Erreur suppression catégorie:', error);
              if (error.code === '23503') {
                Alert.alert(
                  'Erreur',
                  'Cette catégorie est encore utilisée. Impossible de la supprimer.'
                );
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la catégorie');
              }
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Erreur vérification catégorie:', error);
      Alert.alert('Erreur', 'Impossible de vérifier la catégorie');
    }
  };

  const createSousCategory = async (categoryId: string) => {
    try {
      const filteredSousCategories = sousCategories.filter(
        (sc) => sc.categorie_id === categoryId
      );
      const maxOrdre = Math.max(
        ...filteredSousCategories.map((sc) => sc.ordre_affichage),
        0
      );
      const { error } = await supabase
        .from('sous_categories_entreprise')
        .insert({
          nom: 'Nouvelle sous-catégorie',
          categorie_id: categoryId,
          ordre_affichage: maxOrdre + 1,
          statut: 'active',
        });

      if (error) throw error;
      await loadCategories();
      Alert.alert('Succès', 'Sous-catégorie créée');
    } catch (error) {
      console.error('Erreur création sous-catégorie:', error);
      Alert.alert('Erreur', 'Impossible de créer la sous-catégorie');
    }
  };

  const deleteSousCategory = async (sousCategoryId: string) => {
    try {
      // Vérifier si des entreprises utilisent cette sous-catégorie
      const { data: entreprisesUsingSousCategory, error: checkError } =
        await supabase
          .from('entreprises')
          .select('id')
          .eq('sous_categorie_id', sousCategoryId);

      if (checkError) throw checkError;

      if (
        entreprisesUsingSousCategory &&
        entreprisesUsingSousCategory.length > 0
      ) {
        Alert.alert(
          'Suppression impossible',
          `Cette sous-catégorie est utilisée par ${entreprisesUsingSousCategory.length} entreprise(s). Veuillez d'abord modifier ou supprimer ces entreprises.`,
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Supprimer la sous-catégorie',
        'Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('sous_categories_entreprise')
                  .delete()
                  .eq('id', sousCategoryId);

                if (error) throw error;
                await loadCategories();
                Alert.alert('Succès', 'Sous-catégorie supprimée');
              } catch (error: any) {
                console.error('Erreur suppression sous-catégorie:', error);
                if (error.code === '23503') {
                  Alert.alert(
                    'Erreur',
                    'Cette sous-catégorie est encore utilisée. Impossible de la supprimer.'
                  );
                } else {
                  Alert.alert(
                    'Erreur',
                    'Impossible de supprimer la sous-catégorie'
                  );
                }
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur vérification sous-catégorie:', error);
      Alert.alert('Erreur', 'Impossible de vérifier la sous-catégorie');
    }
  };

  const updateEntreprise = async (
    entrepriseId: string,
    updates: Partial<Entreprise>
  ) => {
    try {
      const { error } = await supabase
        .from('entreprises')
        .update(updates)
        .eq('id', entrepriseId);

      if (error) throw error;
      await loadEntreprises();
      Alert.alert('Succès', 'Entreprise mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour entreprise:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'entreprise');
    }
  };

  const toggleEntrepriseCategory = async (
    entrepriseId: string,
    categorieId: string,
    sousCategorieId: string,
    isChecked: boolean
  ) => {
    try {
      if (isChecked) {
        // Ajouter l'association
        const { data, error } = await supabase
          .from('entreprises_categories')
          .insert({
            entreprise_id: entrepriseId,
            categorie_id: categorieId,
            sous_categorie_id: sousCategorieId,
            est_principale: entrepriseCategories.length === 0, // Première = principale
          })
          .select()
          .single();

        if (error) throw error;

        // Mise à jour optimiste de l'état local
        if (data) {
          setEntrepriseCategories([...entrepriseCategories, data]);
        }
      } else {
        // Retirer l'association
        const { error } = await supabase
          .from('entreprises_categories')
          .delete()
          .eq('entreprise_id', entrepriseId)
          .eq('categorie_id', categorieId)
          .eq('sous_categorie_id', sousCategorieId);

        if (error) throw error;

        // Mise à jour optimiste de l'état local
        setEntrepriseCategories(
          entrepriseCategories.filter(
            (ec) =>
              !(
                ec.entreprise_id === entrepriseId &&
                ec.categorie_id === categorieId &&
                ec.sous_categorie_id === sousCategorieId
              )
          )
        );
      }
    } catch (error) {
      console.error('Erreur modification catégorie:', error);
      Alert.alert('Erreur', 'Impossible de modifier la catégorie');
      // En cas d'erreur, recharger pour avoir l'état correct
      await loadEntrepriseCategories(entrepriseId);
    }
  };

  const setCategoriePrincipale = async (
    entrepriseId: string,
    categorieId: string,
    sousCategorieId: string
  ) => {
    try {
      // D'abord retirer le flag principal de toutes les catégories
      const { error: resetError } = await supabase
        .from('entreprises_categories')
        .update({ est_principale: false })
        .eq('entreprise_id', entrepriseId);

      if (resetError) throw resetError;

      // Puis marquer celle-ci comme principale
      const { error: setError } = await supabase
        .from('entreprises_categories')
        .update({ est_principale: true })
        .eq('entreprise_id', entrepriseId)
        .eq('categorie_id', categorieId)
        .eq('sous_categorie_id', sousCategorieId);

      if (setError) throw setError;

      // Mettre à jour aussi les colonnes de compatibilité
      const { error: updateError } = await supabase
        .from('entreprises')
        .update({
          categorie_id: categorieId,
          sous_categorie_id: sousCategorieId,
        })
        .eq('id', entrepriseId);

      if (updateError) throw updateError;

      // Mise à jour optimiste de l'état local
      setEntrepriseCategories(
        entrepriseCategories.map((ec) => ({
          ...ec,
          est_principale:
            ec.entreprise_id === entrepriseId &&
            ec.categorie_id === categorieId &&
            ec.sous_categorie_id === sousCategorieId,
        }))
      );

      // Mettre à jour l'entreprise sélectionnée si nécessaire
      if (selectedEntreprise?.id === entrepriseId) {
        setSelectedEntreprise({
          ...selectedEntreprise,
          categorie_id: categorieId,
          sous_categorie_id: sousCategorieId,
        });
      }
    } catch (error) {
      console.error('Erreur définir catégorie principale:', error);
      Alert.alert('Erreur', 'Impossible de définir la catégorie principale');
      // En cas d'erreur, recharger pour avoir l'état correct
      await loadEntrepriseCategories(entrepriseId);
    }
  };

  const createAndAddSousCategorie = async (
    entrepriseId: string,
    categorieId: string,
    nomSousCategorie: string
  ) => {
    if (!nomSousCategorie.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de sous-catégorie');
      return;
    }

    try {
      // Calculer l'ordre d'affichage
      const existingSC = sousCategories.filter(
        (sc) => sc.categorie_id === categorieId
      );
      const maxOrdre = Math.max(
        ...existingSC.map((sc) => sc.ordre_affichage),
        0
      );

      // Créer la sous-catégorie
      const { data: newSC, error: createError } = await supabase
        .from('sous_categories_entreprise')
        .insert({
          nom: nomSousCategorie.trim(),
          categorie_id: categorieId,
          ordre_affichage: maxOrdre + 1,
          statut: 'active',
        })
        .select()
        .single();

      if (createError) throw createError;

      // L'associer à l'entreprise
      const { data: linkData, error: linkError } = await supabase
        .from('entreprises_categories')
        .insert({
          entreprise_id: entrepriseId,
          categorie_id: categorieId,
          sous_categorie_id: newSC.id,
          est_principale: entrepriseCategories.length === 0,
        })
        .select()
        .single();

      if (linkError) throw linkError;

      // Mise à jour optimiste de l'état local
      setSousCategories([...sousCategories, newSC]);
      if (linkData) {
        setEntrepriseCategories([...entrepriseCategories, linkData]);
      }

      // Réinitialiser le champ
      setNewSousCategorieInputs((prev) => ({
        ...prev,
        [categorieId]: '',
      }));
    } catch (error) {
      console.error('Erreur création sous-catégorie:', error);
      Alert.alert('Erreur', 'Impossible de créer la sous-catégorie');
    }
  };

  const saveEntreprisePhotos = async (entrepriseId: string) => {
    try {
      // Sauvegarder toutes les photos modifiées
      for (const photo of editablePhotos) {
        // Vérifier si l'URL est vide
        if (!photo.photo_url || photo.photo_url.trim() === '') {
          continue; // Ignorer les photos sans URL
        }

        const { error } = await supabase
          .from('entreprises_photos')
          .update({
            photo_url: photo.photo_url.trim(),
            ordre_affichage: photo.ordre_affichage,
          })
          .eq('id', photo.id);

        if (error) {
          console.error('Erreur pour photo:', photo.id, error);
          throw error;
        }
      }

      await loadEntreprisePhotos(entrepriseId);
      Alert.alert('Succès', 'Photos mises à jour');
    } catch (error: any) {
      console.error('Erreur sauvegarde photos:', error);
      Alert.alert(
        'Erreur',
        `Impossible de sauvegarder les photos: ${error.message || 'Erreur inconnue'}`
      );
    }
  };

  const deleteEntreprisePhoto = async (photoId: string, entrepriseId: string) => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette photo ?',
      [
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
              await loadEntreprisePhotos(entrepriseId);
              Alert.alert('Succès', 'Photo supprimée');
            } catch (error) {
              console.error('Erreur suppression photo:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la photo');
            }
          },
        },
      ]
    );
  };

  const addEntreprisePhoto = async (entrepriseId: string) => {
    try {
      const maxOrdre = Math.max(
        ...editablePhotos.map((p) => p.ordre_affichage),
        0
      );

      const { error } = await supabase
        .from('entreprises_photos')
        .insert({
          entreprise_id: entrepriseId,
          photo_url: '',
          ordre_affichage: maxOrdre + 1,
        });

      if (error) throw error;
      await loadEntreprisePhotos(entrepriseId);
      Alert.alert('Succès', 'Photo ajoutée');
    } catch (error) {
      console.error('Erreur ajout photo:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la photo');
    }
  };

  const renderCategoriesTab = () => {
    const filteredSousCategories = selectedCategoryId
      ? sousCategories.filter(
          (sc) => sc.categorie_id === selectedCategoryId
        )
      : [];

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories principales</Text>
          <TouchableOpacity style={styles.addButton} onPress={createCategory}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {categories.map((cat) => (
          <View key={cat.id} style={styles.categoryCard}>
            <TouchableOpacity
              style={styles.categoryHeaderCompact}
              onPress={() =>
                setSelectedCategoryId(
                  selectedCategoryId === cat.id ? null : cat.id
                )
              }
            >
              <View style={styles.categoryRowCompact}>
                <View style={styles.categoryMainInfo}>
                  <View style={styles.categoryNameRow}>
                    <Text style={styles.categoryNameCompact}>{cat.nom}</Text>
                    {categoriesUsageCount[cat.id] > 0 && (
                      <View style={styles.usageBadge}>
                        <Text style={styles.usageBadgeText}>
                          {categoriesUsageCount[cat.id]} 🏢
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.categoryOrderCompact}>
                    Ordre: {cat.ordre_affichage}
                  </Text>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteCategory(cat.id);
                    }}
                    style={styles.iconButton}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                  <Text style={styles.expandIcon}>
                    {selectedCategoryId === cat.id ? '▼' : '▶'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {selectedCategoryId === cat.id && (
              <View style={styles.categoryDetailsCompact}>
                {/* Édition catégorie */}
                <View style={styles.tableRow}>
                  <TextInput
                    style={[styles.tableInput, styles.tableInputLarge]}
                    value={cat.nom}
                    placeholder="Nom de la catégorie"
                    onChangeText={(text) => {
                      const updatedCats = categories.map((c) =>
                        c.id === cat.id ? { ...c, nom: text } : c
                      );
                      setCategories(updatedCats);
                    }}
                  />
                  <TextInput
                    style={[styles.tableInput, styles.tableInputSmall]}
                    value={String(cat.ordre_affichage)}
                    placeholder="Ordre"
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const updatedCats = categories.map((c) =>
                        c.id === cat.id
                          ? { ...c, ordre_affichage: parseInt(text) || 0 }
                          : c
                      );
                      setCategories(updatedCats);
                    }}
                  />
                </View>

                {/* Sous-catégories */}
                <View style={styles.subCategoriesSection}>
                  <View style={styles.subCategoriesHeader}>
                    <Text style={styles.subCategoriesTitle}>
                      Sous-catégories ({filteredSousCategories.length})
                    </Text>
                    <TouchableOpacity
                      style={styles.addButtonSmall}
                      onPress={() => createSousCategory(cat.id)}
                    >
                      <Text style={styles.addButtonText}>+ Ajouter</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tableau des sous-catégories */}
                  <View style={styles.table}>
                    {/* En-tête du tableau */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, styles.colLarge]}>
                        Nom
                      </Text>
                      <Text style={[styles.tableHeaderText, styles.colSmall]}>
                        Ordre
                      </Text>
                      <Text style={[styles.tableHeaderText, styles.colAction]}>

                      </Text>
                    </View>

                    {/* Lignes du tableau */}
                    {filteredSousCategories.map((sousCat) => {
                      const usageCount = sousCategoriesUsageCount[sousCat.id] || 0;
                      return (
                        <View key={sousCat.id} style={styles.tableRow}>
                          <View style={[styles.colLarge, styles.inputContainer]}>
                            <TextInput
                              style={[styles.tableInput, { flex: 1, marginRight: 0 }]}
                              value={sousCat.nom}
                              onChangeText={(text) => {
                                const updated = sousCategories.map((sc) =>
                                  sc.id === sousCat.id ? { ...sc, nom: text } : sc
                                );
                                setSousCategories(updated);
                              }}
                            />
                            {usageCount > 0 && (
                              <View style={styles.usageBadgeSmall}>
                                <Text style={styles.usageBadgeTextSmall}>
                                  {usageCount}
                                </Text>
                              </View>
                            )}
                          </View>
                          <TextInput
                            style={[styles.tableInput, styles.colSmall]}
                            value={String(sousCat.ordre_affichage)}
                            keyboardType="numeric"
                            onChangeText={(text) => {
                              const updated = sousCategories.map((sc) =>
                                sc.id === sousCat.id
                                  ? {
                                      ...sc,
                                      ordre_affichage: parseInt(text) || 0,
                                    }
                                  : sc
                              );
                              setSousCategories(updated);
                            }}
                          />
                          <TouchableOpacity
                            style={[styles.iconButton, styles.colAction]}
                            onPress={() => deleteSousCategory(sousCat.id)}
                          >
                            <Text style={styles.deleteIcon}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Bouton sauvegarder tout */}
                <TouchableOpacity
                  style={styles.saveAllButton}
                  onPress={() => saveCategoryWithSubCategories(cat.id)}
                >
                  <Text style={styles.saveAllButtonText}>
                    💾 Tout sauvegarder
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderEntreprisesTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Entreprises ({entreprises.length})</Text>
        {entreprises.map((ent) => {
          const firstPhotoUrl = entrepriseFirstPhotos[ent.id];
          const isSelected = selectedEntreprise?.id === ent.id;

          return (
            <View key={ent.id} style={styles.entrepriseCard}>
              <TouchableOpacity
                style={styles.entrepriseHeader}
                onPress={() => {
                  if (isSelected) {
                    setSelectedEntreprise(null);
                    setEditablePhotos([]);
                    setEntrepriseCategories([]);
                  } else {
                    setSelectedEntreprise(ent);
                    loadEntreprisePhotos(ent.id);
                    loadEntrepriseCategories(ent.id);
                  }
                }}
              >
                {firstPhotoUrl && (
                  <Image
                    source={{ uri: firstPhotoUrl }}
                    style={styles.entrepriseLogo as any}
                  />
                )}
                <View style={styles.entrepriseInfo}>
                  <Text style={styles.entrepriseName}>{ent.nom_commercial}</Text>
                  <Text style={styles.entrepriseCategory}>
                    {ent.ville} • {ent.code_postal}
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {isSelected ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {isSelected && (
                <View style={styles.entrepriseDetails}>
                  {/* Catégories et sous-catégories avec checkboxes - Toggle */}
                  <TouchableOpacity
                    style={styles.toggleHeader}
                    onPress={() =>
                      setShowCategoriesToggle({
                        ...showCategoriesToggle,
                        [ent.id]: !showCategoriesToggle[ent.id],
                      })
                    }
                  >
                    <Text style={styles.toggleHeaderText}>
                      {showCategoriesToggle[ent.id] ? '▼' : '▶'} Catégories (
                      {entrepriseCategories.length})
                    </Text>
                  </TouchableOpacity>

                  {showCategoriesToggle[ent.id] && (
                    <View style={styles.categoriesCheckboxContainer}>
                      {categories.map((cat) => {
                      const sousCats = sousCategories.filter(
                        (sc) => sc.categorie_id === cat.id
                      );
                      return (
                        <View key={cat.id} style={styles.categoryCheckboxSection}>
                          <Text style={styles.categoryCheckboxTitle}>
                            {cat.nom}
                          </Text>
                          {sousCats.map((sc) => {
                            const isChecked = entrepriseCategories.some(
                              (ec) =>
                                ec.categorie_id === cat.id &&
                                ec.sous_categorie_id === sc.id
                            );
                            const isPrincipale = entrepriseCategories.find(
                              (ec) =>
                                ec.categorie_id === cat.id &&
                                ec.sous_categorie_id === sc.id
                            )?.est_principale;

                            return (
                              <View
                                key={sc.id}
                                style={styles.sousCategoryCheckboxRow}
                              >
                                <TouchableOpacity
                                  style={styles.checkboxRow}
                                  onPress={() =>
                                    toggleEntrepriseCategory(
                                      ent.id,
                                      cat.id,
                                      sc.id,
                                      !isChecked
                                    )
                                  }
                                >
                                  <View
                                    style={[
                                      styles.checkbox,
                                      isChecked && styles.checkboxChecked,
                                    ]}
                                  >
                                    {isChecked && (
                                      <Text style={styles.checkboxIcon}>✓</Text>
                                    )}
                                  </View>
                                  <Text style={styles.checkboxLabel}>
                                    {sc.nom}
                                  </Text>
                                  {isPrincipale && (
                                    <View style={styles.principaleBadge}>
                                      <Text style={styles.principaleBadgeText}>
                                        Principale
                                      </Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                                {isChecked && !isPrincipale && (
                                  <TouchableOpacity
                                    style={styles.setPrincipaleButton}
                                    onPress={() =>
                                      setCategoriePrincipale(
                                        ent.id,
                                        cat.id,
                                        sc.id
                                      )
                                    }
                                  >
                                    <Text style={styles.setPrincipaleText}>
                                      Définir principale
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}

                          {/* Champ pour créer rapidement une nouvelle sous-catégorie */}
                          <View style={styles.newSousCategoryRow}>
                            <TextInput
                              style={styles.newSousCategoryInput}
                              placeholder="+ Nouvelle sous-catégorie..."
                              placeholderTextColor={Colors.textSecondary}
                              value={newSousCategorieInputs[cat.id] || ''}
                              onChangeText={(text) =>
                                setNewSousCategorieInputs({
                                  ...newSousCategorieInputs,
                                  [cat.id]: text,
                                })
                              }
                            />
                            {newSousCategorieInputs[cat.id]?.trim() && (
                              <TouchableOpacity
                                style={styles.addSousCategoryButton}
                                onPress={() =>
                                  createAndAddSousCategorie(
                                    ent.id,
                                    cat.id,
                                    newSousCategorieInputs[cat.id]
                                  )
                                }
                              >
                                <Text style={styles.addSousCategoryButtonText}>
                                  ✓ Créer et ajouter
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                    </View>
                  )}

                  {/* Formulaire en 2 colonnes pour plus de compacité */}
                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabelCompact}>Nom</Text>
                      <TextInput
                        style={styles.inputCompact}
                        value={ent.nom_commercial}
                        onChangeText={(text) => {
                          setSelectedEntreprise({ ...ent, nom_commercial: text });
                        }}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabelCompact}>Téléphone</Text>
                      <TextInput
                        style={styles.inputCompact}
                        value={ent.telephone || ''}
                        onChangeText={(text) => {
                          setSelectedEntreprise({ ...ent, telephone: text });
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabelCompact}>Email</Text>
                      <TextInput
                        style={styles.inputCompact}
                        value={ent.email || ''}
                        keyboardType="email-address"
                        onChangeText={(text) => {
                          setSelectedEntreprise({ ...ent, email: text });
                        }}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabelCompact}>Site web</Text>
                      <TextInput
                        style={styles.inputCompact}
                        value={ent.site_web || ''}
                        onChangeText={(text) => {
                          setSelectedEntreprise({ ...ent, site_web: text });
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabelCompact}>Logo URL</Text>
                    <TextInput
                      style={styles.inputCompact}
                      value={ent.logo_url || ''}
                      onChangeText={(text) => {
                        setSelectedEntreprise({ ...ent, logo_url: text });
                      }}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabelCompact}>Description</Text>
                    <TextInput
                      style={[styles.inputCompact, styles.textAreaCompact]}
                      value={ent.description || ''}
                      multiline
                      numberOfLines={3}
                      onChangeText={(text) => {
                        setSelectedEntreprise({ ...ent, description: text });
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.saveAllButton}
                    onPress={() => {
                      if (selectedEntreprise) {
                        updateEntreprise(selectedEntreprise.id, {
                          nom_commercial: selectedEntreprise.nom_commercial,
                          description: selectedEntreprise.description,
                          logo_url: selectedEntreprise.logo_url,
                          telephone: selectedEntreprise.telephone,
                          email: selectedEntreprise.email,
                          site_web: selectedEntreprise.site_web,
                        });
                      }
                    }}
                  >
                    <Text style={styles.saveAllButtonText}>
                      💾 Sauvegarder informations
                    </Text>
                  </TouchableOpacity>

                  {/* Galerie photos - Tableau éditable */}
                  <View style={styles.subCategoriesSection}>
                    <View style={styles.subCategoriesHeader}>
                      <Text style={styles.subCategoriesTitle}>
                        Photos de la galerie ({editablePhotos.length})
                      </Text>
                      <TouchableOpacity
                        style={styles.addButtonSmall}
                        onPress={() => addEntreprisePhoto(ent.id)}
                      >
                        <Text style={styles.addButtonText}>+ Ajouter</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Tableau des photos */}
                    <View style={styles.table}>
                      {/* En-tête du tableau */}
                      <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.colExtraLarge]}>
                          URL de l'image
                        </Text>
                        <Text style={[styles.tableHeaderText, styles.colSmall]}>
                          Ordre
                        </Text>
                        <Text style={[styles.tableHeaderText, styles.colAction]}>

                        </Text>
                      </View>

                      {/* Lignes du tableau */}
                      {editablePhotos.map((photo) => {
                        let photoUrl = photo.photo_url;
                        if (photo.storage_path) {
                          const { data } = supabase.storage
                            .from('galerie')
                            .getPublicUrl(photo.storage_path);
                          photoUrl = data.publicUrl;
                        }

                        return (
                          <View key={photo.id} style={styles.tableRow}>
                            <View style={[styles.colExtraLarge, styles.photoUrlContainer]}>
                              <TextInput
                                style={[styles.tableInput, { flex: 1, marginRight: Spacing.xs }]}
                                value={photo.photo_url || ''}
                                placeholder="https://..."
                                placeholderTextColor={Colors.textSecondary}
                                onChangeText={(text) => {
                                  const updated = editablePhotos.map((p) =>
                                    p.id === photo.id ? { ...p, photo_url: text } : p
                                  );
                                  setEditablePhotos(updated);
                                }}
                              />
                              {photoUrl && (
                                <Image
                                  source={{ uri: photoUrl }}
                                  style={styles.photoPreview as any}
                                />
                              )}
                            </View>
                            <TextInput
                              style={[styles.tableInput, styles.colSmall]}
                              value={String(photo.ordre_affichage)}
                              keyboardType="numeric"
                              onChangeText={(text) => {
                                const updated = editablePhotos.map((p) =>
                                  p.id === photo.id
                                    ? { ...p, ordre_affichage: parseInt(text) || 0 }
                                    : p
                                );
                                setEditablePhotos(updated);
                              }}
                            />
                            <TouchableOpacity
                              style={[styles.iconButton, styles.colAction]}
                              onPress={() => deleteEntreprisePhoto(photo.id, ent.id)}
                            >
                              <Text style={styles.deleteIcon}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>

                    {/* Bouton sauvegarder photos */}
                    <TouchableOpacity
                      style={styles.saveAllButton}
                      onPress={() => saveEntreprisePhotos(ent.id)}
                    >
                      <Text style={styles.saveAllButtonText}>
                        💾 Sauvegarder photos
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Administration</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'categories' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('categories')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'categories' && styles.activeTabText,
            ]}
          >
            Catégories
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'entreprises' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('entreprises')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'entreprises' && styles.activeTabText,
            ]}
          >
            Entreprises
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'categories'
        ? renderCategoriesTab()
        : renderEntreprisesTab()}
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
  },
  loadingText: {
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.xxl,
    color: Colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
  },
  subSectionTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonSmall: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  addButtonText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.surface,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.md,
    color: Colors.surface,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  categoryHeaderCompact: {
    padding: Spacing.md,
  },
  categoryRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryMainInfo: {
    flex: 1,
  },
  categoryNameCompact: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  categoryOrderCompact: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  deleteIcon: {
    fontSize: Typography.size.lg,
  },
  expandIcon: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  categoryDetailsCompact: {
    padding: Spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  categoryHeader: {
    padding: Spacing.md,
  },
  categoryName: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryOrder: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusActive: {
    backgroundColor: Colors.success,
  },
  statusInactive: {
    backgroundColor: Colors.textTertiary,
  },
  statusText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.xs,
    color: Colors.surface,
  },
  categoryDetails: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sousCategoryCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.md,
    color: Colors.surface,
  },
  entrepriseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  entrepriseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  entrepriseLogo: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  entrepriseInfo: {
    flex: 1,
  },
  entrepriseName: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  entrepriseCategory: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  entrepriseDetails: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  photoGallery: {
    flexDirection: 'row',
  },
  photoContainer: {
    marginRight: Spacing.md,
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.md,
  },
  photoInfo: {
    marginTop: Spacing.xs,
  },
  photoOrder: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // === TABLE STYLES ===
  subCategoriesSection: {
    marginTop: Spacing.md,
  },
  subCategoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subCategoriesTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  table: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.textSecondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tableHeaderText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.surface,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  tableInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    marginRight: Spacing.xs,
  },
  tableInputLarge: {
    flex: 3,
  },
  tableInputSmall: {
    flex: 1,
  },
  colLarge: {
    flex: 3,
    marginRight: Spacing.xs,
  },
  colSmall: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  colExtraLarge: {
    flex: 5,
    marginRight: Spacing.xs,
  },
  colAction: {
    width: 40,
    alignItems: 'center',
  },
  photoUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoPreview: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveAllButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveAllButtonText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.md,
    color: Colors.surface,
  },
  // === COMPACT FORM STYLES ===
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  formCol: {
    flex: 1,
  },
  inputLabelCompact: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.xs,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputCompact: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  textAreaCompact: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // === USAGE BADGES ===
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  usageBadge: {
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  usageBadgeText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.xs,
    color: Colors.surface,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageBadgeSmall: {
    backgroundColor: Colors.info,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    marginLeft: Spacing.xs,
    minWidth: 24,
    alignItems: 'center',
  },
  usageBadgeTextSmall: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.xs,
    color: Colors.surface,
  },
  // === CHECKBOX STYLES ===
  categoriesCheckboxContainer: {
    marginBottom: Spacing.lg,
  },
  categoryCheckboxSection: {
    marginBottom: Spacing.md,
  },
  categoryCheckboxTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sousCategoryCheckboxRow: {
    marginLeft: Spacing.md,
    marginBottom: Spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxIcon: {
    color: Colors.surface,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  checkboxLabel: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  principaleBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  principaleBadgeText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.xs,
    color: Colors.surface,
  },
  setPrincipaleButton: {
    marginLeft: 40,
    marginTop: Spacing.xs,
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  setPrincipaleText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.xs,
    color: Colors.surface,
  },
  newSousCategoryRow: {
    marginLeft: 40,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  newSousCategoryInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  addSousCategoryButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  addSousCategoryButtonText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.surface,
  },
  toggleHeader: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleHeaderText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
});
