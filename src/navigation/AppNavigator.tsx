import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

// Import des écrans
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import EntreprisesListScreen from '../screens/EntreprisesListScreen';
import EntrepriseDetailScreen from '../screens/EntrepriseDetailScreen';
import FormulaireRecoScreen from '../screens/FormulaireRecoScreen';
import PhotoRecoScreen from '../screens/PhotoRecoScreen';
import ChoixTypeRecoScreen from '../screens/ChoixTypeRecoScreen';
import DealsScreen from '../screens/DealsScreen';
import DealDetailScreen from '../screens/DealDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../theme';
import { supabase } from '../config/supabase';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

// Stack pour l'onglet Home
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="EntreprisesList" component={EntreprisesListScreen} />
      <Stack.Screen name="EntrepriseDetail" component={EntrepriseDetailScreen} />
      <Stack.Screen name="ChoixTypeReco" component={ChoixTypeRecoScreen} />
      <Stack.Screen name="FormulaireReco" component={FormulaireRecoScreen} />
      <Stack.Screen name="PhotoReco" component={PhotoRecoScreen} />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Deals (NOUVEAU)
function DealsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DealsMain" component={DealsScreen} />
      <Stack.Screen name="DealDetail" component={DealDetailScreen} />
    </Stack.Navigator>
  );
}

// Tab Navigator principal (app authentifiée)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Deals') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="Deals"
        component={DealsStack}
        options={{ tabBarLabel: 'Mes deals' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  // TEMPORAIRE : Bypass de l'authentification pour le développement
  // Utilisateur hardcodé : Sylvain DI VITO (c37e64bb-9b07-4e73-9950-2e71518c94bf)
  const DEV_MODE = true; // Mettre à false pour réactiver l'authentification

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    DEV_MODE ? true : null,
  );
  const [loading, setLoading] = useState(!DEV_MODE);

  // Vérifier l'état d'authentification au démarrage (sauf en mode dev)
  useEffect(() => {
    if (DEV_MODE) {
      // En mode dev, on skip l'authentification
      return;
    }

    // Vérifier la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    // Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Écran de chargement pendant la vérification
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="MainApp" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}