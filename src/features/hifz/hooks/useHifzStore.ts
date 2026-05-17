import { create } from 'zustand';

export interface HifzState {
  memorizedEighths: number;
  weeklyGoalEighths: number;
  izharDay: number; // 0-6 (Sunday-Saturday)
  reviewCursor: number;
}

export interface HifzActions {
  setMemorizedEighths: (amount: number) => void;
  setWeeklyGoal: (amount: number) => void;
  setIzharDay: (day: number) => void;
  setReviewCursor: (cursor: number) => void;
  addMemorizedEighths: (amount: number) => void;
}

/**
 * Zustand store representing the current state of the user's Hifz settings.
 * In a real offline-first app, this store will eventually be synced with SQLite/Supabase.
 */
export const useHifzStore = create<HifzState & HifzActions>((set) => ({
  memorizedEighths: 0,
  weeklyGoalEighths: 2,
  izharDay: 4, // Thursday default
  reviewCursor: 0,

  setMemorizedEighths: (amount) => set({ memorizedEighths: amount }),
  setWeeklyGoal: (amount) => set({ weeklyGoalEighths: amount }),
  setIzharDay: (day) => set({ izharDay: day }),
  setReviewCursor: (cursor) => set({ reviewCursor: cursor }),
  addMemorizedEighths: (amount) => set((state) => ({ 
    memorizedEighths: state.memorizedEighths + amount 
  })),
}));
