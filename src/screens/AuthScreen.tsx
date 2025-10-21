import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../config/supabase';
import { User } from '../types/database.types';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  CommonStyles,
  Layout,
} from '../theme';

type AuthScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type AuthStep = 'phone' | 'otp' | 'onboarding';

export default function AuthScreen({ navigation }: AuthScreenProps) {
  // State pour les étapes
  const [step, setStep] = useState<AuthStep>('phone');
  const [loading, setLoading] = useState(false);

  // State pour téléphone et OTP
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  // State pour onboarding
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [adresse, setAdresse] = useState('');

  // Envoyer le code OTP
  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setLoading(true);
    try {
      // Formater le numéro au format international
      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+33${phoneNumber.substring(1)}`;

      // Utiliser Supabase Auth avec OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      setStep('otp');
      Alert.alert('Succès', 'Code envoyé par SMS');
    } catch (error: any) {
      console.error('Erreur envoi OTP:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer le code');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier le code OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer un code à 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      // Formater le numéro au format international
      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+33${phoneNumber.substring(1)}`;

      // Vérifier l'OTP avec Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Échec de la vérification');
      }

      // Vérifier si l'utilisateur existe déjà dans la table users
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('telephone', formattedPhone)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingUser) {
        // Utilisateur existant, connexion directe
        navigation.replace('MainApp');
      } else {
        // Nouveau compte, passer à l'onboarding
        setStep('onboarding');
      }
    } catch (error: any) {
      console.error('Erreur vérification OTP:', error);
      Alert.alert('Erreur', 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  // Créer le compte (onboarding)
  const handleCreateAccount = async () => {
    if (!prenom || !nom || !codePostal) {
      Alert.alert(
        'Erreur',
        'Veuillez remplir tous les champs obligatoires (Prénom, Nom, Code postal)',
      );
      return;
    }

    setLoading(true);
    try {
      // Créer l'utilisateur dans Supabase
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telephone: phoneNumber,
          nom,
          prenom,
          email: email || null,
          code_postal: codePostal,
          adresse_complete: adresse || null,
          role: 'ambassadeur',
          statut_onboarding: 'incomplet', // Pas d'association pour l'instant
        })
        .select()
        .single();

      if (insertError) throw insertError;

      Alert.alert(
        'Bienvenue !',
        'Votre compte a été créé. Pensez à rejoindre une association dans votre profil.',
      );
      navigation.replace('MainApp');
    } catch (error: any) {
      console.error('Erreur création compte:', error);
      Alert.alert('Erreur', 'Impossible de créer le compte');
    } finally {
      setLoading(false);
    }
  };

  // Rendu pour l'étape téléphone
  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Bienvenue sur Alfie</Text>
      <Text style={styles.subtitle}>
        Entrez votre numéro de téléphone pour commencer
      </Text>

      <TextInput
        style={styles.input}
        placeholder="06 12 34 56 78"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        maxLength={14}
        editable={!loading}
      />

      <TouchableOpacity
        style={[
          CommonStyles.buttonPrimary,
          loading && styles.buttonDisabled,
          styles.button,
        ]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.textOnPrimary} />
        ) : (
          <Text style={styles.buttonText}>Recevoir un code</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Rendu pour l'étape OTP
  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Vérification</Text>
      <Text style={styles.subtitle}>
        Entrez le code reçu par SMS au {phoneNumber}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Code à 6 chiffres"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        maxLength={6}
        editable={!loading}
      />

      <TouchableOpacity
        style={[
          CommonStyles.buttonPrimary,
          loading && styles.buttonDisabled,
          styles.button,
        ]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.textOnPrimary} />
        ) : (
          <Text style={styles.buttonText}>Vérifier</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setStep('phone')}
        disabled={loading}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Modifier le numéro</Text>
      </TouchableOpacity>
    </View>
  );

  // Rendu pour l'étape onboarding
  const renderOnboardingStep = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.stepContainer}
    >
      <Text style={styles.title}>Créez votre compte</Text>
      <Text style={styles.subtitle}>
        Quelques informations pour finaliser votre inscription
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Prénom <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Votre prénom"
          value={prenom}
          onChangeText={setPrenom}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Nom <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Votre nom"
          value={nom}
          onChangeText={setNom}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email (optionnel)</Text>
        <TextInput
          style={styles.input}
          placeholder="votre@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Code postal <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="75001"
          keyboardType="number-pad"
          maxLength={5}
          value={codePostal}
          onChangeText={setCodePostal}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Adresse complète (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Votre adresse complète"
          multiline
          numberOfLines={3}
          value={adresse}
          onChangeText={setAdresse}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[
          CommonStyles.buttonPrimary,
          loading && styles.buttonDisabled,
          styles.button,
        ]}
        onPress={handleCreateAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.textOnPrimary} />
        ) : (
          <Text style={styles.buttonText}>Créer mon compte</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {step === 'phone' && renderPhoneStep()}
      {step === 'otp' && renderOTPStep()}
      {step === 'onboarding' && renderOnboardingStep()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl * 2,
    paddingBottom: Spacing.xxl,
  },
  title: {
    ...CommonStyles.heading,
    fontSize: Typography.size.huge,
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...CommonStyles.bodyText,
    fontSize: Typography.size.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: Layout.inputHeight,
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    fontSize: Typography.size.lg,
    color: Colors.textOnPrimary,
  },
  backButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.semiBold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.error,
  },
});
