import '../global.css';

import React, { useEffect } from 'react';
import { UIManager, Platform, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';

import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { DatabaseService } from '@/data/db/DatabaseService';

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    // Initialize SQLite database (if on native)
    DatabaseService.initDb();

    // Listen to notification taps to route correctly
    let isMounted = true;
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      if (isMounted) {
        router.push('/(tabs)');
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <View style={{ flex: 1, backgroundColor: '#0d1117' }}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
        </Stack>
      </View>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
