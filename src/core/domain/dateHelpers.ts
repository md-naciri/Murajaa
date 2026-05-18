import { calcDailyReview } from './hizbMath';

export const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const DAY_NAMES_SHORT = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

// ============================================================
// DATE HELPERS
// ============================================================

export function getAppDate(offset: number = 0): Date {
  const d = new Date();
  if (offset !== 0) {
    d.setDate(d.getDate() + offset);
  }
  return d;
}

export function dateToStr(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function todayStr(offset: number = 0): string {
  return dateToStr(getAppDate(offset));
}

export function formatDateLong(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("ar-MA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  return `${DAY_NAMES_SHORT[date.getDay()]} ${d}/${mo}`;
}

// ============================================================
// WEEK LOGIC
// ============================================================
export function getWeekDates(izharDay: number, offset: number = 0): string[] {
  const now = getAppDate(offset);
  now.setHours(0, 0, 0, 0);
  const todayDow = now.getDay();
  const daysBack = (todayDow - izharDay + 7) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysBack);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return dateToStr(d);
  });
}

export interface DaySchedule {
  date: string;
  eighths: number[];
  amount: number;
  isOptional: boolean;
}

export function buildWeekSchedule(totalEighths: number, weekDates: string[]): DaySchedule[] {
  const daily = calcDailyReview(totalEighths);

  if (totalEighths === 0) {
    return weekDates.map(date => ({ date, eighths: [], amount: 0, isOptional: false }));
  }

  let currentEighth = 0;
  return weekDates.map(date => {
    const dayEighths: number[] = [];
    for (let e = 0; e < daily; e++) {
      if (currentEighth < totalEighths) {
        dayEighths.push(currentEighth);
        currentEighth++;
      }
    }
    
    const amount = dayEighths.length;
    return { 
      date, 
      eighths: dayEighths, 
      amount,
      isOptional: amount === 0 
    };
  });
}
