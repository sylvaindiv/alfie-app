import React from 'react';
import { View, Text, Platform } from 'react-native';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme';

export default function App() {
  // Skip font loading on web for now to test
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // On web, skip font loading check
  if (!fontsLoaded && Platform.OS !== 'web') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.background,
        }}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}