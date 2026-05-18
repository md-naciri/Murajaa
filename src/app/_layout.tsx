import '../global.css';

import React, { useEffect } from 'react';
import { UIManager, Platform, Text } from 'react-native';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';

// Force default font settings for Android to improve Arabic rendering
if (Platform.OS === 'android') {
  // @ts-ignore
  const oldRender = Text.render;
  if (oldRender) {
    // @ts-ignore
    Text.render = function (...args) {
      const origin = oldRender.call(this, ...args);
      return React.cloneElement(origin, {
        style: [{ fontFamily: 'sans-serif' }, origin.props.style]
      });
    };
  }
}
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DatabaseService } from '@/data/db/DatabaseService';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    // Initialize SQLite database (if on native)
    DatabaseService.initDb();
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

