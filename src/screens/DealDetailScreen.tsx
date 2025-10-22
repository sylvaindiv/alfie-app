import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { Colors, Spacing, Typography, CommonStyles, BorderRadius, Shadows } from '../theme';

interface DealDetailScreenProps {
  route: {
    params: {
      dealId: string;
    };
  };
  navigation: any;
}

interface DealDetail {
  id: string;
  type_deal: 'auto_recommandation' | 'recommandation_tiers';
  statut: 'en_attente' | 'en_cours' | 'valide' | 'refuse';
  date_creation: string;
  date_changement_statut: string | null;
  montant_commission: number | null;
  motif_refus: string | null;
  
  // Infos prospect (si formulaire)
  nom_prospect: string | null;
  prenom_prospect: string | null;
  telephone_prospect: string | null;
  email_prospect: string | null;
  commentaire_initial: string | null;
  
  // Relations
  entreprise: {
    nom_commercial: string;
    logo_url: string | null;
  };
  association: {
    nom: string;
    logo_url: string | null;
  };
}

interface PreuvePhoto {
  id: string;
  photo_url: string;
  date_photo: string;
  statut: 'en_attente' | 'validee' | 'refusee';
}

interface Commentaire {
  id: string;
  texte_commentaire: string;
  type_commentaire: 'note_interne' | 'suivi' | 'refus';
  created_at: string;
  auteur: {
    nom: string;
    prenom: string;
  };
}

// Couleurs des badges selon statut
const STATUS_CONFIG = {
  en_attente: { bg: '#FF9800', text: 'En attente', icon: 'time-outline' as const },
  en_cours: { bg: '#2196F3', text: 'En cours', icon: 'hourglass-outline' as const },
  valide: { bg: '#4CAF50', text: 'Validé', icon: 'checkmark-circle-outline' as const },
  refuse: { bg: '#F44336', text: 'Refusé', icon: 'close-circle-outline' as const },
};

export default function DealDetailScreen({
  route,
  navigation,
}: DealDetailScreenProps) {
  const { dealId } = route.params;

  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [preuvePhoto, setPreuvePhoto] = useState<PreuvePhoto | null>(null);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDealDetails();
  }, [dealId]);

  async function fetchDealDetails() {
    try {
      // Récupérer le deal
      const { data: dealData, error: errorDeal } = await supabase
        .from('deals')
        .select(`
          *,
          entreprises (nom_commercial, logo_url),
          associations (nom, logo_url)
        `)
        .eq('id', dealId)
        .single();

      if (errorDeal) throw errorDeal;

      setDeal({
        id: dealData.id,
        type_deal: dealData.type_deal,
        statut: dealData.statut,
        date_creation: dealData.date_creation,
        date_changement_statut: dealData.date_changement_statut,
        montant_commission: dealData.montant_commission,
        motif_refus: dealData.motif_refus,
        nom_prospect: dealData.nom_prospect,
        prenom_prospect: dealData.prenom_prospect,
        telephone_prospect: dealData.telephone_prospect,
        email_prospect: dealData.email_prospect,
        commentaire_initial: dealData.commentaire_initial,
        entreprise: {
          nom_commercial: dealData.entreprises.nom_commercial,
          logo_url: dealData.entreprises.logo_url,
        },
        association: {
          nom: dealData.associations.nom,
          logo_url: dealData.associations.logo_url,
        },
      });

      // Si auto-recommandation, récupérer la preuve photo
      if (dealData.type_deal === 'auto_recommandation') {
        const { data: photoData, error: errorPhoto } = await supabase
          .from('preuves_photos')
          .select('*')
          .eq('deal_id', dealId)
          .single();

        if (!errorPhoto && photoData) {
          setPreuvePhoto(photoData);
        }
      }

      // Récupérer les commentaires
      const { data: commentsData, error: errorComments } = await supabase
        .from('commentaires_deals')
        .select(`
          *,
          users (nom, prenom)
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (!errorComments && commentsData) {
        const formattedComments = commentsData.map((c: any) => ({
          id: c.id,
          texte_commentaire: c.texte_commentaire,
          type_commentaire: c.type_commentaire,
          created_at: c.created_at,
          auteur: {
            nom: c.users.nom,
            prenom: c.users.prenom,
          },
        }));
        setCommentaires(formattedComments);
      }
    } catch (error) {
      console.error('Erreur chargement deal:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails');
    } finally {
      setLoading(false);
    }
  }

  function handleCall() {
    if (deal?.telephone_prospect) {
      Linking.openURL(`tel:${deal.telephone_prospect}`);
    }
  }

  function handleEmail() {
    if (deal?.email_prospect) {
      Linking.openURL(`mailto:${deal.email_prospect}`);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Deal introuvable</Text>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[deal.statut];

  // Format dates
  const dateCreation = new Date(deal.date_creation).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateValidation = deal.date_changement_statut
    ? new Date(deal.date_changement_statut).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

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
        <Text style={styles.headerTitle}>Détail recommandation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Entreprise */}
        <View style={styles.entrepriseCard}>
          {deal.entreprise.logo_url && (
            <Image
              source={{ uri: deal.entreprise.logo_url }}
              style={styles.entrepriseLogo}
            />
          )}
          <View style={styles.entrepriseInfo}>
            <Text style={styles.entrepriseNom}>
              {deal.entreprise.nom_commercial}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon} size={16} color="#FFFFFF" />
              <Text style={styles.statusText}>{statusConfig.text}</Text>
            </View>
          </View>
        </View>

        {/* Infos générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Informations</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type :</Text>
            <Text style={styles.infoValue}>
              {deal.type_deal === 'auto_recommandation'
                ? '📸 Auto-recommandation'
                : '📝 Recommandation tiers'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Créé le :</Text>
            <Text style={styles.infoValue}>{dateCreation}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Association :</Text>
            <Text style={styles.infoValue}>{deal.association.nom}</Text>
          </View>
        </View>

        {/* Infos prospect (si formulaire) */}
        {deal.type_deal === 'recommandation_tiers' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Prospect</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom :</Text>
              <Text style={styles.infoValue}>
                {deal.prenom_prospect} {deal.nom_prospect}
              </Text>
            </View>

            {deal.telephone_prospect && (
              <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
                <Text style={styles.contactText}>{deal.telephone_prospect}</Text>
              </TouchableOpacity>
            )}

            {deal.email_prospect && (
              <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                <Text style={styles.contactText}>{deal.email_prospect}</Text>
              </TouchableOpacity>
            )}

            {deal.commentaire_initial && (
              <View style={styles.commentBox}>
                <Text style={styles.commentLabel}>💬 Commentaire initial :</Text>
                <Text style={styles.commentText}>{deal.commentaire_initial}</Text>
              </View>
            )}
          </View>
        )}

        {/* Preuve photo (si auto-reco) */}
        {deal.type_deal === 'auto_recommandation' && preuvePhoto && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Preuve de visite</Text>
            <Image
              source={{ uri: preuvePhoto.photo_url }}
              style={styles.preuvePhoto}
              resizeMode="cover"
            />
            <View style={styles.preuveStatus}>
              <Text style={styles.preuveStatusText}>
                {preuvePhoto.statut === 'validee'
                  ? '✅ Validée'
                  : preuvePhoto.statut === 'refusee'
                  ? '❌ Refusée'
                  : '⏳ En attente'}
              </Text>
            </View>
          </View>
        )}

        {/* Commission (si validé) */}
        {deal.statut === 'valide' && deal.montant_commission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Commission</Text>
            <View style={styles.commissionCard}>
              <Text style={styles.commissionAmount}>
                {deal.montant_commission}€
              </Text>
              {dateValidation && (
                <Text style={styles.commissionDate}>
                  Validé le {dateValidation}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Motif refus */}
        {deal.statut === 'refuse' && deal.motif_refus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❌ Refus</Text>
            <View style={styles.refusCard}>
              <Text style={styles.refusText}>{deal.motif_refus}</Text>
            </View>
          </View>
        )}

        {/* Commentaires entreprise */}
        {commentaires.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Suivi entreprise</Text>
            {commentaires.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>
                    {comment.auteur.prenom} {comment.auteur.nom}
                  </Text>
                  <Text style={styles.commentDate}>
                    {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text style={styles.commentContent}>
                  {comment.texte_commentaire}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
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
  scrollView: {
    flex: 1,
  },
  entrepriseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  entrepriseLogo: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundLight,
    marginRight: Spacing.lg,
  },
  entrepriseInfo: {
    flex: 1,
  },
  entrepriseNom: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.bold,
  },
  section: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contactText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.primary,
    marginLeft: Spacing.md,
  },
  commentBox: {
    backgroundColor: Colors.backgroundLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  commentLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  commentText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  preuvePhoto: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundLight,
  },
  preuveStatus: {
    marginTop: Spacing.md,
  },
  preuveStatusText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
  commissionCard: {
    backgroundColor: Colors.success,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  commissionAmount: {
    fontSize: Typography.size.huge,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  commissionDate: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: '#FFFFFF',
  },
  refusCard: {
    backgroundColor: '#FFEBEE',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  refusText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.error,
    lineHeight: 22,
  },
  commentCard: {
    backgroundColor: Colors.backgroundLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  commentAuthor: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
  commentDate: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
  },
  commentContent: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
});