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
  resetHifzStore: () => void;
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
  resetHifzStore: () => set({
    memorizedEighths: 0,
    memorizationMode: 'forward',
    memorizedAtWeekStart: 0,
    weekStartSavedDate: null,
    izharDay: 4,
    hasCompletedOnboarding: false,
    appStartDate: null,
    remindersEnabled: true,
    reminderTime: '20:00',
    _hasHydrated: true,
  }),
}));

let currentHifzUid: string | null = null;

// Rehydrate the store when the active user changes
export const rehydrateHifzStore = async (uid: string, isReturningUser: boolean = false) => {
  currentHifzUid = uid;
  const STORAGE_KEY = `murajaa-hifz-state-${uid}`;
  
  // Set to false initially to block router until the SQLite read completes
  useHifzStore.setState({ _hasHydrated: false });
  
  try {
    const data = await storageAdapter.getItem(STORAGE_KEY);
    
    if (data) {
      const parsed = JSON.parse(data);
      useHifzStore.getState()._setHydrated(parsed);
    } else {
      // If no data exists for this user, reset to empty state
      useHifzStore.getState()._setHydrated({
        memorizedEighths: 0,
        memorizationMode: 'forward',
        memorizedAtWeekStart: 0,
        weekStartSavedDate: null,
        izharDay: 4,
        hasCompletedOnboarding: !!isReturningUser,
        appStartDate: null,
        remindersEnabled: true,
        reminderTime: '20:00',
      });
    }
  } catch (e) {
    console.error("Failed to parse hifz state", e);
    useHifzStore.getState()._setHydrated({});
  }
};

export const clearHifzSession = () => {
  currentHifzUid = null;
  useHifzStore.getState().resetHifzStore();
};

// 2. Subscribe to changes and save automatically
useHifzStore.subscribe((state, prevState) => {
  if (!state._hasHydrated || !currentHifzUid) return; // Don't overwrite storage before hydration is complete
  
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
    storageAdapter.setItem(`murajaa-hifz-state-${currentHifzUid}`, JSON.stringify(stateToSave));
  }
});
