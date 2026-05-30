import { create } from 'zustand';
import { storageAdapter } from '@/features/hifz/hooks/storageAdapter';
import { User } from '@supabase/supabase-js';

export interface ProfileState {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  _hasHydrated: boolean;
}

export interface ProfileActions {
  updateProfile: (updates: Partial<ProfileState>) => void;
  importGoogleProfile: (name: string | null, email: string | null) => void;
  _setHydrated: (state: Partial<ProfileState>) => void;
  resetProfile: () => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState & ProfileActions>((set, get) => ({
  displayName: '',
  email: null,
  avatarUrl: null,
  _hasHydrated: false,

  updateProfile: (updates) => set((state) => ({ ...state, ...updates })),
  
  importGoogleProfile: (name, email) => {
    const currentName = get().displayName;
    // Only auto-import if the user hasn't explicitly set a display name
    if (!currentName || currentName.trim() === '') {
      set({ 
        displayName: name || '',
        email: email || null
      });
    }
  },

  _setHydrated: (state) => set({ ...state, _hasHydrated: true }),
  
  // Used during hydration when SQLite is empty, preserves imported Google data if present
  resetProfile: () => set((state) => ({
    displayName: state.displayName || '',
    email: state.email || null,
    avatarUrl: state.avatarUrl || null,
    _hasHydrated: true,
  })),

  // Used on explicitly logging out
  clearProfile: () => set({
    displayName: '',
    email: null,
    avatarUrl: null,
    _hasHydrated: true,
  }),
}));

let currentProfileUid: string | null = null;

export const rehydrateProfileStore = async (uid: string) => {
  currentProfileUid = uid;
  const STORAGE_KEY = `murajaa-profile-${uid}`;
  
  try {
    const data = await storageAdapter.getItem(STORAGE_KEY);
    
    if (data) {
      useProfileStore.getState()._setHydrated(JSON.parse(data));
    } else {
      useProfileStore.getState().resetProfile();
    }
  } catch (e) {
    console.error("Failed to parse profile state", e);
    useProfileStore.getState().resetProfile();
  }
};

export const clearProfileSession = () => {
  currentProfileUid = null;
  useProfileStore.getState().clearProfile();
};

useProfileStore.subscribe((state, prevState) => {
  if (!state._hasHydrated || !currentProfileUid) return;
  
  if (
    state.displayName !== prevState.displayName ||
    state.email !== prevState.email ||
    state.avatarUrl !== prevState.avatarUrl
  ) {
    const stateToSave = {
      displayName: state.displayName,
      email: state.email,
      avatarUrl: state.avatarUrl,
    };
    storageAdapter.setItem(`murajaa-profile-${currentProfileUid}`, JSON.stringify(stateToSave));
  }
});
