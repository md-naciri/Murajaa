// ============================================================
// CONSTANTS
// ============================================================
export const TOTAL_HIZB = 60;
export const EIGHTHS_PER_HIZB = 8;
export const TOTAL_EIGHTHS = TOTAL_HIZB * EIGHTHS_PER_HIZB; // 480

export const UNIT_OPTIONS = [
  { label: "ثمن", value: 1 },
  { label: "ربع", value: 2 },
  { label: "ثلاثة أثمان", value: 3 },
  { label: "نصف", value: 4 },
  { label: "خمسة أثمان", value: 5 },
  { label: "ثلاثة أرباع", value: 6 },
  { label: "سبعة أثمان", value: 7 },
  { label: "حزب", value: 8 },
  { label: "حزب وثمن", value: 9 },
  { label: "حزب وربع", value: 10 },
  { label: "حزب ونصف", value: 12 },
  { label: "حزبان", value: 16 },
];

// ============================================================
// PURE HELPERS
// ============================================================

/**
 * Maps a logical progress index (0 to 479) to the physical Quran absolute eighth index (0 to 479).
 * - Forward Mode: logical 0 is physical 0 (Hizb 1 Eighth 1)
 * - Reverse Mode: logical 0 is physical 472 (Hizb 60 Eighth 1)
 */
export function logicalToPhysical(logicalIdx: number, mode: 'forward' | 'reverse'): number {
  if (mode === 'forward') {
    return logicalIdx;
  } else {
    // Reverse mode: logicalIdx 0..7 -> Hizb 60 physicalIdx 472..479
    // hizbIdx moves backwards from 59 down to 0
    const logicalHizbOffset = Math.floor(logicalIdx / EIGHTHS_PER_HIZB);
    const physicalHizbIdx = 59 - logicalHizbOffset;
    const eighthIdx = logicalIdx % EIGHTHS_PER_HIZB;
    return physicalHizbIdx * EIGHTHS_PER_HIZB + eighthIdx;
  }
}

export function eighthsToLabel(eighths: number): string {
  if (eighths <= 0) return "—";
  const hizb = Math.floor(eighths / EIGHTHS_PER_HIZB);
  const rem  = eighths % EIGHTHS_PER_HIZB;
  
  const remNames = [
    "", 
    "ثمن", 
    "ربع", 
    "ثلاثة أثمان", 
    "نصف", 
    "خمسة أثمان", 
    "ثلاثة أرباع", 
    "سبعة أثمان"
  ];
  
  let hizbPart = "";
  if (hizb === 1) hizbPart = "حزب";
  else if (hizb === 2) hizbPart = "حزبان";
  else if (hizb >= 3 && hizb <= 10) hizbPart = `${hizb} أحزاب`;
  else if (hizb >= 11) hizbPart = `${hizb} حزباً`;

  const remPart = rem > 0 ? remNames[rem] : "";
  
  if (hizbPart && remPart) return `${hizbPart} و${remPart}`;
  return hizbPart || remPart;
}

export function eighthName(idx: number): string {
  return ["الأول","الثاني","الثالث","الرابع","الخامس","السادس","السابع","الثامن"][idx] ?? `${idx+1}`;
}

export function absEighthLabel(absIdx: number): string {
  const hizbNum  = Math.floor(absIdx / EIGHTHS_PER_HIZB) + 1;
  const eighthIdx = absIdx % EIGHTHS_PER_HIZB;
  return `الثمن ${eighthName(eighthIdx)} من الحزب ${hizbNum}`;
}

export function formatEighthsRange(logicalEighths: number[], mode: 'forward' | 'reverse' = 'forward'): string {
  if (!logicalEighths || logicalEighths.length === 0) return '—';
  
  // Map logical coordinates to actual physical absolute coordinates
  const physicalEighths = logicalEighths.map(e => logicalToPhysical(e, mode));
  
  if (physicalEighths.length === 1) return absEighthLabel(physicalEighths[0]);

  // Check if logically continuous
  let isContinuous = true;
  for (let i = 1; i < logicalEighths.length; i++) {
    if (logicalEighths[i] !== logicalEighths[i - 1] + 1) {
      isContinuous = false;
      break;
    }
  }

  if (isContinuous) {
    return `من ${absEighthLabel(physicalEighths[0])} إلى ${absEighthLabel(physicalEighths[physicalEighths.length - 1])}`;
  }

  return physicalEighths.map(e => absEighthLabel(e)).join(' · ');
}

export function calcDailyReview(totalEighths: number): number {
  if (totalEighths <= 0) return 0;
  return Math.max(1, Math.ceil(totalEighths / 7));
}
