import { initializeApp, getApps, FirebaseApp } from '@react-native-firebase/app';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Configuration Firebase
// IMPORTANT: Remplacer ces valeurs par vos véritables clés Firebase
// depuis la console Firebase (Project Settings > General)
const firebaseConfig = {
  apiKey: "AIzaSyDYhtctVmNomiPFq0sZzYlhKeq6LvsaD4s",
  authDomain: "jrcrc7wj399i8wr7v0bh6wee75t0zj.firebaseapp.com",
  projectId: "jrcrc7wj399i8wr7v0bh6wee75t0zj",
  storageBucket: "jrcrc7wj399i8wr7v0bh6wee75t0zj.firebasestorage.app",
  messagingSenderId: "308438952265",
  appId: "1:308438952265:web:e25b44970db66008b29298"
};

// Initialiser Firebase si pas déjà fait
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Export de l'instance auth
export const firebaseAuth = auth();

// Types Firebase Auth
export type AuthConfirmation = FirebaseAuthTypes.ConfirmationResult;
export type AuthUser = FirebaseAuthTypes.User;

// Fonction pour envoyer le code OTP
export const sendPhoneVerification = async (
  phoneNumber: string,
): Promise<AuthConfirmation> => {
  try {
    // Le numéro doit être au format international (ex: +33612345678)
    const confirmation = await firebaseAuth.signInWithPhoneNumber(phoneNumber);
    return confirmation;
  } catch (error) {
    console.error('Erreur envoi OTP:', error);
    throw error;
  }
};

// Fonction pour vérifier le code OTP
export const verifyOTP = async (
  confirmation: AuthConfirmation,
  code: string,
): Promise<AuthUser | null> => {
  try {
    const credential = await confirmation.confirm(code);
    return credential.user;
  } catch (error) {
    console.error('Erreur vérification OTP:', error);
    throw error;
  }
};

// Fonction pour déconnexion
export const signOut = async (): Promise<void> => {
  try {
    await firebaseAuth.signOut();
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    throw error;
  }
};

export default app;
