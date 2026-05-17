import { calcDailyReview } from './hizbMath';

export const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const DAY_NAMES_SHORT = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

// ============================================================
// DATE HELPERS
// ============================================================
export function dateToStr(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function todayStr(): string {
  return dateToStr(new Date());
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
export function getWeekDates(izharDay: number): string[] {
  const now = new Date();
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
}

export function buildWeekSchedule(totalEighths: number, reviewCursor: number, weekDates: string[]): DaySchedule[] {
  const daily = calcDailyReview(totalEighths);

  if (totalEighths === 0) {
    return weekDates.map(date => ({ date, eighths: [], amount: 0 }));
  }

  let cursor = reviewCursor % totalEighths;
  return weekDates.map(date => {
    const dayEighths: number[] = [];
    for (let e = 0; e < daily; e++) {
      dayEighths.push(cursor % totalEighths);
      cursor = (cursor + 1) % totalEighths;
    }
    return { date, eighths: dayEighths, amount: daily };
  });
}
