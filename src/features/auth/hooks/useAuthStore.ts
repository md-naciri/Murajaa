import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase } from '@/core/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = '34347173524-lfrq4uc6l8mubpsr5jjk285ga840da5v.apps.googleusercontent.com';

if (Platform.OS !== 'web') {
  console.log('[Google Sign-In Debug] Configuring with Web Client ID:', WEB_CLIENT_ID);
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
  });
}

interface AuthState {
  session: Session | null;
  user: User | null;
  isAnonymous: boolean;
  isHydrated: boolean;
  dismissedLinkingBanner: boolean;
  setSession: (session: Session | null) => void;
  signInAnonymously: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  dismissBanner: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isAnonymous: true,
  isHydrated: false,
  dismissedLinkingBanner: false,

  setSession: (session) => {
    const user = session?.user ?? null;
    
    const hasGoogleLinked = user?.app_metadata?.providers?.includes('google') 
                         || user?.identities?.some(id => id.provider === 'google');
                         
    const purelyAnonymous = user ? (user.is_anonymous && !hasGoogleLinked) : true;

    set({
      session,
      user,
      isAnonymous: purelyAnonymous,
      isHydrated: true,
    });

    // Trigger a background refresh to get the canonical server user,
    // bypassing any stale local JWT caching on OAuth redirect return.
    if (session) {
      get().refreshUser();
    }
  },

  refreshUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        const hasGoogleLinked = user.app_metadata?.providers?.includes('google') 
                             || user.identities?.some(id => id.provider === 'google');
        const purelyAnonymous = user.is_anonymous && !hasGoogleLinked;
        
        console.log('[Supabase Auth Debug] refreshUser canonical isAnonymous:', purelyAnonymous);
        
        set({
          user,
          isAnonymous: purelyAnonymous,
        });
      }
    } catch (err) {
      console.error('[Supabase Auth Debug] refreshUser failed:', err);
    }
  },

  signInAnonymously: async () => {
    console.log('[Supabase Auth] Starting signInAnonymously...');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Supabase Auth] getSession error:', sessionError);
      }

      console.log('[Supabase Auth] Existing session:', session ? 'Found' : 'None');

      if (!session) {
        console.log('[Supabase Auth] Attempting to create new anonymous session...');
        const { data, error: signInError } = await supabase.auth.signInAnonymously();
        
        if (signInError) {
          console.error('[Supabase Auth] signInAnonymously error:', signInError);
          // Force an alert to surface the error directly on device
          import('react-native').then(({ Alert }) => {
            Alert.alert('Auth Debug Error', signInError.message);
          });
        } else {
          console.log('[Supabase Auth] Successfully created anonymous user:', data.user?.id);
        }

        if (data && data.session) {
          get().setSession(data.session);
        }
      } else {
        get().setSession(session);
      }
    } catch (err: any) {
      console.error('[Supabase Auth] Unexpected error in signInAnonymously:', err);
    }
  },

  linkGoogleAccount: async () => {
    if (Platform.OS === 'web') {
      try {
        console.log('[Google Sign-In Debug] Starting web OAuth linking...');
        // Standard OAuth redirect flow for the web.
        // Since we are using linkIdentity, it preserves the existing anonymous UID.
        const { data, error } = await supabase.auth.linkIdentity({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          }
        });
        
        if (error) {
          console.error('[Supabase Auth] Web link error:', error);
          throw error;
        }
      } catch (err: any) {
        console.error('[Google Sign-In Debug] Web link FULL ERROR:', err);
        throw err;
      }
      return;
    }

    try {
      console.log('[Google Sign-In Debug] Checking Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      console.log('[Google Sign-In Debug] Attempting to sign in with config webClientId:', WEB_CLIENT_ID);
      const userInfo = await GoogleSignin.signIn();
      
      console.log('[Google Sign-In Debug] SignIn success! Received ID token:', !!userInfo.data?.idToken);

      if (userInfo.data?.idToken) {
        console.log('[Google Sign-In Debug] Passing ID token to Supabase linkIdentity...');
        // We must use linkIdentity to attach this Google account to the existing anonymous user
        const { data, error } = await supabase.auth.linkIdentity({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        
        if (error) {
          console.error('[Supabase Auth] Error linking Google account:', error);
          throw error;
        }
        console.log('[Supabase Auth] Google account linked successfully! UID remains:', data.user?.id);
      } else {
        console.error('[Google Sign-In Debug] No ID token present in userInfo object!');
        throw new Error('No ID token present');
      }
    } catch (error: any) {
      console.error('[Google Sign-In Debug] Google link failed FULL ERROR:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  dismissBanner: () => set({ dismissedLinkingBanner: true }),
}));
