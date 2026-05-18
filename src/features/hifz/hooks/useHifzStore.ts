import { create } from 'zustand';
import { storageAdapter } from './storageAdapter';

export interface HifzState {
  memorizedEighths: number;
  weeklyGoalEighths: number;
  izharDay: number; // 0-6 (Sunday-Saturday)
  hasCompletedOnboarding: boolean;
  _hasHydrated: boolean; // Flag to indicate if initial load from storage is done
  devDateOffset: number; // For development testing: shift the app's current date
}

export interface HifzActions {
  setMemorizedEighths: (amount: number) => void;
  setWeeklyGoal: (amount: number) => void;
  setIzharDay: (day: number) => void;
  addMemorizedEighths: (amount: number) => void;
  completeOnboarding: () => void;
  _setHydrated: (state: Partial<HifzState>) => void;
  setDevDateOffset: (offset: number) => void;
}

export const useHifzStore = create<HifzState & HifzActions>((set) => ({
  memorizedEighths: 0,
  weeklyGoalEighths: 2,
  izharDay: 4, // Thursday default
  hasCompletedOnboarding: false,
  _hasHydrated: false,
  devDateOffset: 0,

  setMemorizedEighths: (amount) => set({ memorizedEighths: amount }),
  setWeeklyGoal: (amount) => set({ weeklyGoalEighths: amount }),
  setIzharDay: (day) => set({ izharDay: day }),
  addMemorizedEighths: (amount) => set((state) => ({ 
    memorizedEighths: Math.max(0, state.memorizedEighths + amount)
  })),
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  _setHydrated: (persistedState) => set({ ...persistedState, _hasHydrated: true }),
  setDevDateOffset: (offset) => set({ devDateOffset: offset }),
}));

// --- Manual Persistence Sync ---
// This avoids bugs with Zustand v5's persist middleware in React 19 on Web.

const STORAGE_KEY = 'murajaa-hifz-state';

// 1. Hydrate state on startup
storageAdapter.getItem(STORAGE_KEY).then((data) => {
  if (data) {
    try {
      const parsed = JSON.parse(data);
      useHifzStore.getState()._setHydrated(parsed);
    } catch (e) {
      console.error("Failed to parse persisted state", e);
      useHifzStore.getState()._setHydrated({});
    }
  } else {
    useHifzStore.getState()._setHydrated({});
  }
});

// 2. Subscribe to changes and save automatically
useHifzStore.subscribe((state, prevState) => {
  if (!state._hasHydrated) return; // Don't overwrite storage before hydration is complete
  
  // Only save if the actual data changed
  if (
    state.memorizedEighths !== prevState.memorizedEighths ||
    state.weeklyGoalEighths !== prevState.weeklyGoalEighths ||
    state.izharDay !== prevState.izharDay ||
    state.hasCompletedOnboarding !== prevState.hasCompletedOnboarding
  ) {
    const stateToSave = {
      memorizedEighths: state.memorizedEighths,
      weeklyGoalEighths: state.weeklyGoalEighths,
      izharDay: state.izharDay,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
    };
    storageAdapter.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }
});
