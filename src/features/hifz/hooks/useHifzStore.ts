import { create } from 'zustand';
import { storageAdapter } from './storageAdapter';

export interface HifzState {
  memorizedEighths: number;
  weeklyGoalEighths: number;
  izharDay: number; // 0-6 (Sunday-Saturday)
  reviewCursor: number;
  _hasHydrated: boolean; // Flag to indicate if initial load from storage is done
}

export interface HifzActions {
  setMemorizedEighths: (amount: number) => void;
  setWeeklyGoal: (amount: number) => void;
  setIzharDay: (day: number) => void;
  setReviewCursor: (cursor: number) => void;
  addMemorizedEighths: (amount: number) => void;
  _setHydrated: (state: Partial<HifzState>) => void;
}

export const useHifzStore = create<HifzState & HifzActions>((set) => ({
  memorizedEighths: 0,
  weeklyGoalEighths: 2,
  izharDay: 4, // Thursday default
  reviewCursor: 0,
  _hasHydrated: false,

  setMemorizedEighths: (amount) => set({ memorizedEighths: amount }),
  setWeeklyGoal: (amount) => set({ weeklyGoalEighths: amount }),
  setIzharDay: (day) => set({ izharDay: day }),
  setReviewCursor: (cursor) => set({ reviewCursor: cursor }),
  addMemorizedEighths: (amount) => set((state) => ({ 
    memorizedEighths: Math.max(0, state.memorizedEighths + amount)
  })),
  _setHydrated: (persistedState) => set({ ...persistedState, _hasHydrated: true }),
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
    state.reviewCursor !== prevState.reviewCursor
  ) {
    const stateToSave = {
      memorizedEighths: state.memorizedEighths,
      weeklyGoalEighths: state.weeklyGoalEighths,
      izharDay: state.izharDay,
      reviewCursor: state.reviewCursor,
    };
    storageAdapter.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }
});
