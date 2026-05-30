import { create } from 'zustand';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import 'react-native-url-polyfill/auto';
import { createClient, Session, User } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useToastStore } from '@/core/store/useToastStore';
import { useHifzStore, rehydrateHifzStore, clearHifzSession } from '@/features/hifz/hooks/useHifzStore';
import { useProfileStore, rehydrateProfileStore, clearProfileSession } from '@/features/profile/hooks/useProfileStore';
import { storageAdapter } from '@/features/hifz/hooks/storageAdapter';
import { supabaseUrl, supabaseAnonKey, supabase } from '@/core/supabase/client';

const WEB_CLIENT_ID = '34347173524-lfrq4uc6l8mubpsr5jjk285ga840da5v.apps.googleusercontent.com';

if (Platform.OS !== 'web') {
  if (__DEV__) console.log('[Google Sign-In Debug] Configuring with Web Client ID:', WEB_CLIENT_ID);
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });
}

interface AuthState {
  session: Session | null;
  user: User | null;
  isAnonymous: boolean;
  isHydrated: boolean;
  dismissedLinkingBanner: boolean;
  pendingIdToken: string | null;
  pendingGoogleName: string | null;
  pendingGoogleEmail: string | null;
  setSession: (session: Session | null) => void;
  signInAnonymously: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  confirmRecoveryLogin: () => Promise<boolean>;
  cancelRecovery: () => void;
  signOut: () => Promise<void>;
  dismissBanner: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isAnonymous: true,
  isHydrated: false,
  dismissedLinkingBanner: false,
  pendingIdToken: null,
  pendingGoogleName: null,
  pendingGoogleEmail: null,

  setSession: (session) => {
    const previousUid = get().user?.id;
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

    const newUid = user?.id;
    if (newUid) {
      if (previousUid !== newUid) {
        const isReturningUser = !!(user && user.created_at && user.last_sign_in_at && 
          new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime() > 10000);

        // SYNCHRONOUS LOCK: Force hydration to false immediately.
        // This prevents _layout from rendering intermediate stale states before the async SQLite reads begin.
        useHifzStore.setState({ _hasHydrated: false });
        useProfileStore.setState({ _hasHydrated: false });

        // Now initiate the asynchronous rehydration safely
        rehydrateHifzStore(newUid, isReturningUser);
        rehydrateProfileStore(newUid);
      }
    } else {
      // If there is no active session (e.g. startup before Skip, or after sign out),
      // we must reset the stores to default empty state and explicitly nullify the UIDs
      // so the Zustand subscription doesn't overwrite the active user's SQLite data with empty values!
      clearHifzSession();
      clearProfileSession();
    }

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
        
        if (__DEV__) console.log('[Supabase Auth Debug] refreshUser canonical isAnonymous:', purelyAnonymous);
        
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
    if (__DEV__) console.log('[Supabase Auth] Starting signInAnonymously...');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Supabase Auth] getSession error:', sessionError);
      }

      if (__DEV__) console.log('[Supabase Auth] Existing session:', session ? 'Found' : 'None');

      if (!session) {
        if (__DEV__) console.log('[Supabase Auth] Attempting to create new anonymous session...');
        const { data, error: signInError } = await supabase.auth.signInAnonymously();
        
        if (signInError) {
          console.error('[Supabase Auth] signInAnonymously error:', signInError);
          useToastStore.getState().showToast('خطأ في الاتصال بالخادم', 'error');
        } else {
          if (__DEV__) console.log('[Supabase Auth] Successfully created anonymous user:', data.user?.id);
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
        if (__DEV__) console.log('[Google Sign-In Debug] Starting web OAuth linking...');
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
          useToastStore.getState().showToast('فشل ربط الحساب، يرجى المحاولة لاحقاً', 'error');
          throw error;
        }
      } catch (err: any) {
        console.error('[Google Sign-In Debug] Web link FULL ERROR:', err);
        useToastStore.getState().showToast('حدث خطأ أثناء الاتصال', 'error');
        throw err;
      }
      return;
    }

    try {
      if (__DEV__) console.log('[Google Sign-In Debug] Checking Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      if (__DEV__) console.log('[Google Sign-In Debug] Attempting to sign in with config webClientId:', WEB_CLIENT_ID);
      const userInfo = await GoogleSignin.signIn();
      
      if (__DEV__) console.log('[Google Sign-In Debug] SignIn success! Received ID token:', !!userInfo.data?.idToken);

      if (userInfo.data?.idToken) {
        if (__DEV__) console.log('[Google Sign-In Debug] Exchanging ID token with Supabase...');
        
        let supabaseUser = null;
        const currentSession = get().session;

        if (!currentSession) {
          // If no anonymous session exists yet (e.g. from Optional Auth), just sign in directly!
          if (__DEV__) console.log('[Supabase Auth] No active session found, signing in directly...');
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: userInfo.data.idToken,
          });

          if (error) {
            console.error('[Supabase Auth] Error signing in with Google:', error);
            useToastStore.getState().showToast('فشل تسجيل الدخول', 'error');
            throw error;
          }
          
          if (data.session) get().setSession(data.session);
          supabaseUser = data.user;
          if (__DEV__) console.log('[Supabase Auth] Direct Google login successful! UID:', supabaseUser?.id);
        } else {
          // We have an active anonymous session, so we link it
          if (__DEV__) console.log('[Supabase Auth] Active session found, attempting to link identity...');
          const { data, error } = await supabase.auth.linkIdentity({
            provider: 'google',
            token: userInfo.data.idToken,
          });
          
          if (error) {
            if (error.code === 'identity_already_exists' || error.message?.includes('already linked')) {
              if (__DEV__) console.log('[Supabase Auth] Intercepted identity_already_exists, requiring recovery...');
              set({ 
                pendingIdToken: userInfo.data.idToken,
                pendingGoogleName: userInfo.data.user?.name || null,
                pendingGoogleEmail: userInfo.data.user?.email || null,
              });
              throw new Error('RECOVERY_REQUIRED');
            }
            console.error('[Supabase Auth] Error linking Google account:', error);
            useToastStore.getState().showToast('فشل ربط الحساب', 'error');
            throw error;
          }
          
          supabaseUser = data.user;
          if (__DEV__) console.log('[Supabase Auth] Google account linked successfully! UID remains:', supabaseUser?.id);
        }
        
        const gUser = userInfo.data.user;
        const extractedName = gUser?.name || [gUser?.givenName, gUser?.familyName].filter(Boolean).join(' ') || null;

        // Auto-import profile info if local profile is empty
        useProfileStore.getState().importGoogleProfile(
          extractedName,
          gUser?.email || null
        );

        useToastStore.getState().showToast('تم ربط حسابك بـ Google بنجاح!', 'success');
      } else {
        console.error('[Google Sign-In Debug] No ID token present in userInfo object!');
        throw new Error('No ID token present');
      }
    } catch (error: any) {
      if (error.message === 'RECOVERY_REQUIRED') {
        throw error;
      }
      console.error('[Google Sign-In Debug] Google link failed:', error?.message || error, error?.code);
      if (error.code !== 'SIGN_IN_CANCELLED' && error.code !== '12501') {
        useToastStore.getState().showToast('إلغاء أو فشل تسجيل الدخول', 'error');
      }
      throw error;
    }
  },

  confirmRecoveryLogin: async () => {
    const { pendingIdToken, pendingGoogleName, pendingGoogleEmail, session: currentSession, user: currentUser } = get();
    if (!pendingIdToken) return false;
    
    // 1. Capture the orphan's credentials BEFORE the swap
    const orphanUid = currentUser?.id;
    const orphanAccessToken = currentSession?.access_token;
    
    try {
      if (__DEV__) console.log('[Supabase Auth] Confirming recovery login... swapping to Google');
      
      // 2. Safely authenticate the Google user first
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: pendingIdToken,
      });

      if (error) throw error;
      
      set({ pendingIdToken: null, pendingGoogleName: null, pendingGoogleEmail: null });
      if (data.session) {
        get().setSession(data.session);
      }
      
      useProfileStore.getState().importGoogleProfile(pendingGoogleName, pendingGoogleEmail);
      
      // 3. Post-recovery cleanup: Terminate the abandoned orphan
      if (orphanAccessToken && orphanUid) {
        console.log(`\n[DEBUG TRACE - ORPHAN CLEANUP]`);
        console.log(`[ORPHAN CLEANUP] 1. Google login successful. Proceeding to terminate abandoned orphan UID: ${orphanUid}`);
        
        try {
          // Explicitly wipe local SQLite scopes for the orphan so they don't bloat local storage
          await storageAdapter.removeItem(`murajaa-hifz-state-${orphanUid}`);
          await storageAdapter.removeItem(`murajaa-profile-${orphanUid}`);
          
          console.log(`[ORPHAN CLEANUP] 2. SQLite local scopes wiped for ${orphanUid}`);
          console.log(`[ORPHAN CLEANUP] 3. Creating temporary Supabase client using snapshotted anonymous token...`);

          // Instantiate a temporary client using the orphan's token to self-delete from the server
          const orphanClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${orphanAccessToken}`,
              },
            },
          });
          
          console.log(`[ORPHAN CLEANUP] 4. Temporary client created. Calling RPC delete_self...`);
          
          const rpcResult = await orphanClient.rpc('delete_self');
          
          console.log(`[ORPHAN CLEANUP] 5. RPC Call Completed. Raw Result:`, JSON.stringify(rpcResult, null, 2));

          if (rpcResult.error) {
            console.error('[ORPHAN CLEANUP] ERROR: Failed to terminate orphan via RPC:', rpcResult.error);
          } else {
            console.log('[ORPHAN CLEANUP] SUCCESS: Orphan successfully terminated from Supabase.');
          }
        } catch (cleanupError) {
          console.error('[ORPHAN CLEANUP] CRITICAL ERROR during post-recovery cleanup:', cleanupError);
        }
        console.log(`[DEBUG TRACE - ORPHAN CLEANUP END]\n`);
      }
      
      useToastStore.getState().showToast('تم استرجاع الحساب بنجاح!', 'success');
      return true;
    } catch (err) {
      console.error('[Supabase Auth] Recovery login error:', err);
      useToastStore.getState().showToast('فشل استرجاع الحساب', 'error');
      set({ pendingIdToken: null, pendingGoogleName: null, pendingGoogleEmail: null });
      return false;
    }
  },

  cancelRecovery: () => set({ pendingIdToken: null, pendingGoogleName: null, pendingGoogleEmail: null }),

  signOut: async () => {
    try {
      if (__DEV__) console.log('[Supabase Auth] Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Wipe the store session. The _layout onAuthStateChange will also fire, 
      // but we force a clean start immediately.
      set({ session: null, user: null, isAnonymous: true });
      
      // Navigate explicitly to intro to maintain deterministic routing
      router.replace('/intro');
      
      useToastStore.getState().showToast('تم تسجيل الخروج بنجاح', 'success');
    } catch (err) {
      console.error('[Supabase Auth] Sign out error:', err);
      useToastStore.getState().showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
    }
  },

  dismissBanner: () => set({ dismissedLinkingBanner: true }),
}));
