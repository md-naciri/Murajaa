import { create } from 'zustand';
import { storageAdapter } from './storageAdapter';

export interface HifzState {
  memorizedEighths: number;
  memorizationMode: 'forward' | 'reverse'; // direction: forward (1->60) or reverse (60->1)
  memorizedAtWeekStart: number; // frozen progress count at the start of the current week cycle
  weekStartSavedDate: string | null; // the week start date string mapped to the frozen count
  izharDay: number; // 0-6 (Sunday-Saturday) representing start of the weekly review cycle
  hasCompletedOnboarding: boolean;
  _hasHydrated: boolean; // Flag to indicate if initial load from storage is done
  appStartDate: string | null; // The date the app was first setup
  remindersEnabled: boolean; // Whether reminders are enabled (default: true)
  reminderTime: string; // Time to trigger notification (format: HH:MM, default: 20:00)
}

export interface HifzActions {
  setMemorizedEighths: (amount: number) => void;
  setMemorizationMode: (mode: 'forward' | 'reverse') => void;
  setMemorizedAtWeekStart: (amount: number) => void;
  setWeekStartSavedDate: (dateStr: string | null) => void;
  setIzharDay: (day: number) => void;
  addMemorizedEighths: (amount: number) => void;
  completeOnboarding: () => void;
  _setHydrated: (state: Partial<HifzState>) => void;
  setAppStartDate: (dateStr: string) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderTime: (timeStr: string) => void;
}

export const useHifzStore = create<HifzState & HifzActions>((set) => ({
  memorizedEighths: 0,
  memorizationMode: 'forward',
  memorizedAtWeekStart: 0,
  weekStartSavedDate: null,
  izharDay: 4, // Thursday default
  hasCompletedOnboarding: false,
  _hasHydrated: false,
  appStartDate: null,
  remindersEnabled: true,
  reminderTime: '20:00',

  setMemorizedEighths: (amount) => set({ memorizedEighths: amount }),
  setMemorizationMode: (mode) => set({ memorizationMode: mode }),
  setMemorizedAtWeekStart: (amount) => set({ memorizedAtWeekStart: amount }),
  setWeekStartSavedDate: (dateStr) => set({ weekStartSavedDate: dateStr }),
  setIzharDay: (day) => set({ izharDay: day }),
  addMemorizedEighths: (amount) => set((state) => ({ 
    memorizedEighths: Math.max(0, state.memorizedEighths + amount)
  })),
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  _setHydrated: (persistedState) => set({ ...persistedState, _hasHydrated: true }),
  setAppStartDate: (dateStr) => set({ appStartDate: dateStr }),
  setRemindersEnabled: (enabled) => set({ remindersEnabled: enabled }),
  setReminderTime: (timeStr) => set({ reminderTime: timeStr }),
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
    state.memorizationMode !== prevState.memorizationMode ||
    state.memorizedAtWeekStart !== prevState.memorizedAtWeekStart ||
    state.weekStartSavedDate !== prevState.weekStartSavedDate ||
    state.izharDay !== prevState.izharDay ||
    state.hasCompletedOnboarding !== prevState.hasCompletedOnboarding ||
    state.remindersEnabled !== prevState.remindersEnabled ||
    state.reminderTime !== prevState.reminderTime
  ) {
    const stateToSave = {
      memorizedEighths: state.memorizedEighths,
      memorizationMode: state.memorizationMode,
      memorizedAtWeekStart: state.memorizedAtWeekStart,
      weekStartSavedDate: state.weekStartSavedDate,
      izharDay: state.izharDay,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      appStartDate: state.appStartDate,
      remindersEnabled: state.remindersEnabled,
      reminderTime: state.reminderTime,
    };
    storageAdapter.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }
});
