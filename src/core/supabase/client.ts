import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';

const supabaseUrl = 'https://qjeddieqlbsmxtulfyzg.supabase.co';
const supabaseAnonKey = 'sb_publishable_oiuNlQslPoK3wJyDkjxrsQ_2H0RWlHX';

const isBrowser = typeof window !== 'undefined';

// Universal Storage Adapter to prevent SSR crashes (window is not defined)
export const universalStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (isBrowser) return window.localStorage.getItem(key);
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (isBrowser) window.localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (isBrowser) window.localStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: universalStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// AppState listeners
if (Platform.OS !== 'web' || isBrowser) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
