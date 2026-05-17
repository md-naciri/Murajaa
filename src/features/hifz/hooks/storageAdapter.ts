import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// A unified storage adapter that provides synchronous localStorage on Web
// and falls back to AsyncStorage on Native (iOS/Android).
// This prevents Zustand persist middleware from failing or swallowing state
// updates on the web platform during development.

export const storageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(name);
      } catch (e) {
        return null;
      }
    }
    return await AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(name, value);
      } catch (e) {
        // ignore
      }
      return;
    }
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(name);
      } catch (e) {
        // ignore
      }
      return;
    }
    await AsyncStorage.removeItem(name);
  },
};
